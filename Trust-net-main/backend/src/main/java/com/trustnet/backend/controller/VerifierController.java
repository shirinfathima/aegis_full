package com.trustnet.backend.controller;

import com.trustnet.backend.DTO.AccessRequestDTO;
import com.trustnet.backend.DTO.DocumentMetadataDTO;
import com.trustnet.backend.DTO.ZkProofPayloadDTO;
import com.trustnet.backend.entity.AccessRequest;
import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import com.trustnet.backend.repository.AccessRequestRepository;
import com.trustnet.backend.repository.DocumentRepository;
import com.trustnet.backend.repository.UserRepository;
import com.trustnet.backend.service.BlockchainService;
import com.trustnet.backend.service.UploadService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/verifier")
public class VerifierController {

    @Autowired private UserRepository userRepository;
    @Autowired private DocumentRepository documentRepository;
    @Autowired private AccessRequestRepository accessRequestRepository;
    @Autowired private BlockchainService blockchainService;
    @Autowired private UploadService uploadService;

    // =====================================================
    // 1️⃣ SEARCH USER DOCUMENTS
    // =====================================================
    @GetMapping("/search-user")
    public ResponseEntity<?> searchUserDocs(@RequestParam String email) {

        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.badRequest()
                    .body("User not found with email: " + email);
        }

        List<Document> docs = documentRepository.findByUserId(user.getId());

        List<DocumentMetadataDTO> safeList = docs.stream()
                .map(doc -> {
                    String safeType = (doc.getDocumentType() != null) ? doc.getDocumentType() : "Document";
                    String safeDate = (doc.getUploadTime() != null) ? doc.getUploadTime().toString() : "Unknown Date";
                    boolean isAnchored = (doc.getTxHash() != null && !doc.getTxHash().isEmpty());

                    return new DocumentMetadataDTO(
                        doc.getId(),
                        safeType,
                        safeDate,
                        isAnchored
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(safeList);
    }

    // =====================================================
    // 2️⃣ REQUEST ACCESS
    // =====================================================
    @PostMapping("/request-access")
    public ResponseEntity<?> requestAccess(@RequestBody AccessRequestDTO requestDto) {

        Optional<Document> docOpt = documentRepository.findById(requestDto.getDocumentId());
        if (docOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Document not found");
        }

        AccessRequest newRequest = new AccessRequest();
        newRequest.setVerifierEmail(requestDto.getVerifierEmail());
        newRequest.setUserEmail(requestDto.getUserEmail());
        newRequest.setDocument(docOpt.get());
        newRequest.setAccessType(requestDto.getAccessType());
        newRequest.setAllowedFields(requestDto.getAllowedFields());
        
        newRequest.setStatus(AccessRequest.RequestStatus.PENDING);
        newRequest.setRequestDate(LocalDateTime.now());

        accessRequestRepository.save(newRequest);

        return ResponseEntity.ok("Access request sent successfully!");
    }

    // =====================================================
    // 3️⃣ VIEW MY REQUESTS
    // =====================================================
    @GetMapping("/my-requests")
    public ResponseEntity<List<AccessRequest>> getMyRequests(@RequestParam String verifierEmail) {
        return ResponseEntity.ok(accessRequestRepository.findByVerifierEmail(verifierEmail));
    }

    // =====================================================
    // 4️⃣ INBOX (APPROVED PROOFS)
    // =====================================================
    @GetMapping("/inbox")
    public ResponseEntity<List<AccessRequest>> getInbox(@RequestParam String verifierEmail) {
        List<AccessRequest> allRequests = accessRequestRepository.findByVerifierEmail(verifierEmail);
        
        List<AccessRequest> inbox = allRequests.stream()
            .filter(r -> r.getStatus() == AccessRequest.RequestStatus.APPROVED && r.getProofData() != null)
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(inbox);
    }

    // =====================================================
    // 5️⃣ VERIFY ENROLLMENT ZKP ON-CHAIN
    // =====================================================
    @PostMapping("/verify-zkp")
    public ResponseEntity<?> verifyZkpOnChain(
            @RequestBody ZkProofPayloadDTO payload) {

        try {
            if (payload == null ||
                payload.getProof() == null ||
                payload.getProof().getDisclosedAttributes() == null ||
                !Boolean.TRUE.equals(payload.getProof()
                        .getDisclosedAttributes()
                        .getIsActiveEnrollment()) ||
                payload.getProof().getPublicSignals() == null ||
                payload.getProof().getPublicSignals().isEmpty() ||
                !"1".equals(payload.getProof()
                        .getPublicSignals().get(0))) {

                return ResponseEntity.badRequest().body(Map.of(
                        "verifiedOnChain", false,
                        "error", "Enrollment check failed at circuit level"
                ));
            }

            ZkProofPayloadDTO.ProofValue pv = payload.getProof().getProofValue();

            if (pv == null || pv.getA() == null || pv.getB() == null || pv.getC() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "verifiedOnChain", false,
                        "error", "Invalid proof structure"
                ));
            }

            List<BigInteger> pA = List.of(
                    new BigInteger(pv.getA().get(0)),
                    new BigInteger(pv.getA().get(1))
            );

            List<List<BigInteger>> pB = List.of(
                    List.of(new BigInteger(pv.getB().get(0).get(1)), new BigInteger(pv.getB().get(0).get(0))),
                    List.of(new BigInteger(pv.getB().get(1).get(1)), new BigInteger(pv.getB().get(1).get(0)))
            );

            List<BigInteger> pC = List.of(
                    new BigInteger(pv.getC().get(0)),
                    new BigInteger(pv.getC().get(1))
            );

            List<BigInteger> pubSignals = new ArrayList<>();
            for (String sig : payload.getProof().getPublicSignals()) {
                pubSignals.add(new BigInteger(sig));
            }

            boolean verified = blockchainService.verifyZkProof(pA, pB, pC, pubSignals);

            if (verified) {
                return ResponseEntity.ok(Map.of("verifiedOnChain", true, "message", "Enrollment ZKP verified successfully"));
            } else {
                return ResponseEntity.ok(Map.of("verifiedOnChain", false, "error", "Cryptographic proof rejected"));
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("verifiedOnChain", false, "error", "Blockchain verification failed: " + e.getMessage()));
        }
    }

    // =====================================================
    // 6️⃣ DIRECT PROOF SUBMISSION (ONLINE SEND)
    // =====================================================
    @PostMapping("/submit-proof")
    public ResponseEntity<?> submitProofOnline(@RequestBody Map<String, Object> payload) {
        try {
            String verifierEmail = (String) payload.get("verifierEmail");
            String userEmail = (String) payload.get("userEmail");
            Long documentId = Long.valueOf(payload.get("documentId").toString());
            String accessType = (String) payload.get("accessType");
            String vpJson = (String) payload.get("vpJson");
            String allowedFields = (String) payload.get("allowedFields");

            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            AccessRequest request = new AccessRequest();
            request.setVerifierEmail(verifierEmail);
            request.setUserEmail(userEmail);
            request.setDocument(document);
            request.setAccessType(accessType);
            request.setAllowedFields(allowedFields);
            request.setStatus(AccessRequest.RequestStatus.APPROVED); 
            request.setProofData(vpJson);
            request.setRequestDate(LocalDateTime.now());

            accessRequestRepository.save(request);

            return ResponseEntity.ok(Map.of("status", "success", "message", "Proof submitted successfully to Verifier's Inbox"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to save proof: " + e.getMessage()));
        }
    }

    // =====================================================
    // 7️⃣ SECURE DOCUMENT RETRIEVAL (REVERTED TO WORKING DECRYPTION LOGIC)
    // =====================================================
    @GetMapping("/fetch-document-content")
    public ResponseEntity<?> fetchDocumentContent(@RequestParam Long requestId) {
        try {
            AccessRequest request = accessRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

            Document doc = request.getDocument();

            // A. If images are temporarily stored in DB (Pre-Approval or Just Uploaded)
            if (doc.getIpfsCid() == null || doc.getIpfsCid().isEmpty()) {
                Map<String, String> response = new HashMap<>();
                if (doc.getTempDocData() != null) {
                    response.put("fileData", Base64.getEncoder().encodeToString(doc.getTempDocData()));
                }
                if (doc.getTempDocBackData() != null) {
                    response.put("fileDataBack", Base64.getEncoder().encodeToString(doc.getTempDocBackData()));
                }
                response.put("fileName", doc.getDocumentName());
                return ResponseEntity.ok(response);
            }

            // B. FETCH & EXTRACT FROM ZIP (Working Old Branch Logic)
            byte[] zipBytes = uploadService.downloadFromIpfs(doc.getIpfsCid());
            
            // 1. EXTRACT FRONT IMAGE
            byte[] frontEncrypted = uploadService.extractEncryptedImage(zipBytes, "front");
            byte[] frontDecrypted = uploadService.decryptDocument(frontEncrypted, doc.getEncryptedDocumentKey());
            String frontBase64 = Base64.getEncoder().encodeToString(frontDecrypted);

            // 2. EXTRACT BACK IMAGE
            String backBase64 = null;
            try {
                byte[] backEncrypted = uploadService.extractEncryptedImage(zipBytes, "back");
                byte[] backDecrypted = uploadService.decryptDocument(backEncrypted, doc.getEncryptedDocumentKey());
                backBase64 = Base64.getEncoder().encodeToString(backDecrypted);
            } catch (Exception e) {
                System.out.println("Back image not found (legacy document?): " + e.getMessage());
            }

            // E. PREPARE RESPONSE
            Map<String, String> response = new HashMap<>();
            response.put("fileName", doc.getDocumentName());
            response.put("fileData", frontBase64);      
            response.put("fileDataBack", backBase64);   
            response.put("blockchainStatus", "VERIFIED");
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching document: " + e.getMessage());
        }
    }
}