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
    private BlockchainService blockchainService; // Added

    @Autowired
    private UploadService uploadService; // Added

    // --- 1. SEARCH USER DOCUMENTS ---
    @GetMapping("/search-user")
    public ResponseEntity<?> searchUserDocs(@RequestParam String email) {
        User user = userRepository.findByEmail(email);

        if (user == null) {
            return ResponseEntity.badRequest().body("User not found with email: " + email);
        }

        // We use the user's ID to find documents
        List<Document> docs = documentRepository.findByUserId(user.getId());

        // --- NULL-SAFE CONVERSION FIX ---
        List<DocumentMetadataDTO> safeList = docs.stream()
                .map(doc -> {
                    // 1. Handle missing Document Type
                    String safeType = (doc.getDocumentType() != null) ? doc.getDocumentType() : "Document";
                    
                    // 2. Handle missing Upload Time (THIS WAS CAUSING YOUR CRASH)
                    String safeDate = (doc.getUploadTime() != null) ? doc.getUploadTime().toString() : "Unknown Date";

                    // 3. Handle missing Transaction Hash
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
        
        // Use the Enum from inside AccessRequest
        newRequest.setStatus(AccessRequest.RequestStatus.PENDING);
        newRequest.setRequestDate(LocalDateTime.now());

        accessRequestRepository.save(newRequest);

        return ResponseEntity.ok("Access request sent successfully!");
    }
    
    // --- 3. VIEW REQUESTS ---
    @GetMapping("/my-requests")
    public ResponseEntity<List<AccessRequest>> getMyRequests(@RequestParam String verifierEmail) {
        return ResponseEntity.ok(accessRequestRepository.findByVerifierEmail(verifierEmail));
    }
    
    @GetMapping("/dashboard-data")
    public ResponseEntity<String> getVerifierDashboardData() {
        return ResponseEntity.ok("Successfully retrieved Verifier Dashboard data");
    }

    // --- 4. NEW: SECURE DOCUMENT RETRIEVAL (IPFS + BLOCKCHAIN) ---
    @GetMapping("/fetch-document-content")
    public ResponseEntity<?> fetchDocumentContent(@RequestParam Long requestId) {
        try {
            // A. Validate Request
            AccessRequest request = accessRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

            if (request.getStatus() != AccessRequest.RequestStatus.APPROVED) {
                return ResponseEntity.badRequest().body("Access not approved by user.");
            }

            Document doc = request.getDocument();
            
            // B. BLOCKCHAIN INTEGRITY CHECK
            // --- DELETE THIS LINE ---
            // BigInteger calculatedHash = ZkHashUtils.hashIpfsCid(doc.getIpfsCid());

            // --- ADD THIS LINE ---
            // We must verify the VC Hash because that is what IssuerService anchored
            BigInteger calculatedHash = new BigInteger(doc.getVcHash());

            // Fetch the authoritative hash stored on the Blockchain
            BigInteger blockchainHash = blockchainService.getRawAnchoredCID(doc.getUserId());

            // Compare
            if (!calculatedHash.equals(blockchainHash)) {
                return ResponseEntity.status(409).body("BLOCKCHAIN ALERT: Document integrity check failed! The IPFS CID does not match the blockchain anchor.");
            }

            // C. FETCH FROM IPFS
            byte[] encryptedBytes = uploadService.downloadFromIpfs(doc.getIpfsCid());

            // D. DECRYPT
            byte[] decryptedBytes = uploadService.decryptDocument(encryptedBytes, doc.getEncryptedDocumentKey());

            // E. PREPARE RESPONSE (Base64 for Frontend)
            String base64Image = Base64.getEncoder().encodeToString(decryptedBytes);
            
            Map<String, String> response = new HashMap<>();
            response.put("fileName", doc.getDocumentName());
            response.put("fileData", base64Image);
            response.put("blockchainStatus", "VERIFIED");
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching document: " + e.getMessage());
        }
    }
    // --- NEW ZKP ENDPOINT ---
        @PostMapping("/generate-proof/age")
        public ResponseEntity<?> generateAgeProof(@RequestParam Long documentId) {
            try {
                // 1. Fetch the private document (Backend access only)
                Document doc = documentRepository.findById(documentId)
                    .orElseThrow(() -> new RuntimeException("Document not found"));
                    
                // 2. Run the ZK Logic
                String proof = zkProofService.generateAgeProof(doc);
                
                // 3. Return ONLY the proof (No personal data)
                return ResponseEntity.ok(proof);
                
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Proof Generation Failed: " + e.getMessage());
            }
        }
}