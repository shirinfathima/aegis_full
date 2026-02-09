package com.trustnet.backend.controller;

import com.trustnet.backend.DTO.AccessRequestDTO;
import com.trustnet.backend.DTO.DocumentMetadataDTO;
import com.trustnet.backend.entity.AccessRequest;
import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import com.trustnet.backend.repository.AccessRequestRepository;
import com.trustnet.backend.repository.DocumentRepository;
import com.trustnet.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.trustnet.backend.service.BlockchainService;
import com.trustnet.backend.service.UploadService;
import com.trustnet.backend.service.ZkHashUtils;
import com.trustnet.backend.service.ZkProofService;

import java.math.BigInteger;
import java.util.Base64;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/verifier")
@CrossOrigin(origins = "http://localhost:3000")
public class VerifierController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private AccessRequestRepository accessRequestRepository;

    @Autowired
    private ZkProofService zkProofService;

    @Autowired
    private BlockchainService blockchainService;

    @Autowired
    private UploadService uploadService;

    // --- 1. SEARCH USER DOCUMENTS ---
    @GetMapping("/search-user")
    public ResponseEntity<?> searchUserDocs(@RequestParam String email) {
        User user = userRepository.findByEmail(email);

        if (user == null) {
            return ResponseEntity.badRequest().body("User not found with email: " + email);
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

    // --- 2. REQUEST ACCESS ---
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
    
    // --- 3. VIEW OUTGOING REQUESTS (Verifier Initiated) ---
    @GetMapping("/my-requests")
    public ResponseEntity<List<AccessRequest>> getMyRequests(@RequestParam String verifierEmail) {
        return ResponseEntity.ok(accessRequestRepository.findByVerifierEmail(verifierEmail));
    }

    // --- INBOX ENDPOINT (User Sent Proofs) ---
    @GetMapping("/inbox")
    public ResponseEntity<List<AccessRequest>> getInbox(@RequestParam String verifierEmail) {
        List<AccessRequest> allRequests = accessRequestRepository.findByVerifierEmail(verifierEmail);
        
        // Filter for requests that are APPROVED (User sent them) and have Proof Data
        List<AccessRequest> inbox = allRequests.stream()
            .filter(r -> r.getStatus() == AccessRequest.RequestStatus.APPROVED && r.getProofData() != null)
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(inbox);
    }
    
    @GetMapping("/dashboard-data")
    public ResponseEntity<String> getVerifierDashboardData() {
        return ResponseEntity.ok("Successfully retrieved Verifier Dashboard data");
    }

    // --- 4. SECURE DOCUMENT RETRIEVAL ---
    @GetMapping("/fetch-document-content")
    public ResponseEntity<?> fetchDocumentContent(@RequestParam Long requestId) {
        try {
            // A. Validate Request
            AccessRequest request = accessRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

            // Check if status allows viewing (APPROVED or VERIFIED if you kept the enum, but logic here is standard)
            if (request.getStatus() != AccessRequest.RequestStatus.APPROVED && 
                request.getStatus().toString() != "VERIFIED") { 
                return ResponseEntity.badRequest().body("Access not approved by user.");
            }

            Document doc = request.getDocument();
            
            // B. BLOCKCHAIN INTEGRITY CHECK
            if (doc.getVcHash() == null) {
                return ResponseEntity.status(409).body("Integrity Error: Document has not been approved/anchored yet.");
            }
            
            BigInteger calculatedHash = new BigInteger(doc.getVcHash());
            BigInteger blockchainHash = blockchainService.getRawAnchoredCID(doc.getUserId());

            if (!calculatedHash.equals(blockchainHash)) {
                return ResponseEntity.status(409).body("BLOCKCHAIN ALERT: Document integrity check failed!");
            }

            // C. FETCH & EXTRACT FROM ZIP
            byte[] zipBytes = uploadService.downloadFromIpfs(doc.getIpfsCid());
            
            // 1. EXTRACT FRONT IMAGE (Standard)
            byte[] frontEncrypted = uploadService.extractEncryptedImage(zipBytes, "front");
            byte[] frontDecrypted = uploadService.decryptDocument(frontEncrypted, doc.getEncryptedDocumentKey());
            String frontBase64 = Base64.getEncoder().encodeToString(frontDecrypted);

            // 2. EXTRACT BACK IMAGE (Optional)
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
            response.put("fileData", frontBase64);      // Key for Front Image
            response.put("fileDataBack", backBase64);   // Key for Back Image
            response.put("blockchainStatus", "VERIFIED");
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching document: " + e.getMessage());
        }
    }
    
    // --- 5. ZKP ENDPOINT ---
    @PostMapping("/generate-proof/age")
    public ResponseEntity<?> generateAgeProof(@RequestParam Long documentId) {
        try {
            Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
                
            String proof = zkProofService.generateAgeProof(doc);
            return ResponseEntity.ok(proof);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Proof Generation Failed: " + e.getMessage());
        }
    }

    // --- 6. SUBMIT PROOF ENDPOINT ---
    @PostMapping("/submit-proof")
    public ResponseEntity<?> submitProof(@RequestBody Map<String, Object> payload) {
        try {
            String verifierEmail = (String) payload.get("verifierEmail");
            String userEmail = (String) payload.get("userEmail"); 
            Long documentId = Long.valueOf(payload.get("documentId").toString());
            String accessType = (String) payload.get("accessType"); 
            String proofData = (String) payload.get("vpJson");
            
            // Extract allowedFields from payload (For Redacted View)
            String allowedFields = (String) payload.get("allowedFields");

            if(verifierEmail == null || documentId == null) {
                return ResponseEntity.badRequest().body("Missing required fields");
            }

            AccessRequest request = new AccessRequest();
            request.setVerifierEmail(verifierEmail);
            request.setUserEmail(userEmail);
            request.setDocument(documentRepository.findById(documentId).orElseThrow(() -> new RuntimeException("Doc not found")));
            request.setStatus(AccessRequest.RequestStatus.APPROVED);
            request.setAccessType(accessType);
            request.setProofData(proofData);
            
            // Set the allowed fields
            request.setAllowedFields(allowedFields);
            
            request.setRequestDate(LocalDateTime.now());
            request.setExpiryDate(LocalDateTime.now().plusHours(24));
            
            accessRequestRepository.save(request);
            
            return ResponseEntity.ok("Proof submitted successfully to " + verifierEmail);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error submitting proof: " + e.getMessage());
        }
    }
}