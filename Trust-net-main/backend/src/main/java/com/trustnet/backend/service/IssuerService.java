package com.trustnet.backend.service;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import com.trustnet.backend.model.VerificationStatus;
import com.trustnet.backend.repository.DocumentRepository;
import com.trustnet.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.web3j.protocol.core.methods.response.TransactionReceipt;

import java.security.MessageDigest;
import java.util.List;
import java.math.BigInteger;

@Service
public class IssuerService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CredentialService credentialService;

    @Autowired
    private BlockchainService blockchainService;

    @Autowired
    private CrossCheckService crossCheckService; // INJECTED: For registry verification

    private final ObjectMapper objectMapper = new ObjectMapper();

    // UPDATED: Now returns a numeric string for uint256 compatibility
    private String sha256Hash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes("UTF-8"));
            // Convert to a positive BigInteger and then to a String
            return new BigInteger(1, hash).toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate SHA-256 hash.", e);
        }
    }

    public List<Document> getPendingDocuments() {
        return documentRepository.findByStatus(VerificationStatus.PENDING);
    }

    public Document approveDocument(Long documentId) {
        return documentRepository.findById(documentId).map(document -> {
            
            // --- STEP 0: CROSS-CHECK AGAINST MOCK DATABASE (UNIVERSITY REGISTRY) ---
            try {
                // Parse the OCR data stored in the document (assumes it's a JSON string)
                JsonNode ocrJson = objectMapper.readTree(document.getOcrData());
                
                // Extracting Admission No and Name from the JSON
                // FIX: Get the "front" node first, then access the exact keys
                JsonNode frontNode = ocrJson.get("front");
                String admissionNo = frontNode.get("Registration Number").asText();
                String studentName = frontNode.get("Name").asText();
                
                boolean isVerifiedInRegistry = crossCheckService.verifyStudent(admissionNo, studentName);

                if (!isVerifiedInRegistry) {
                    throw new RuntimeException("Verification Failed: Admission No '" + admissionNo + "' or Name does not match University records.");
                }
                
                System.out.println("✅ Registry Cross-check Passed for: " + admissionNo);

            } catch (Exception e) {
                System.err.println("❌ Cross-check Error: " + e.getMessage());
                throw new RuntimeException("Registry verification error: " + e.getMessage());
            }

            // --- PROCEED WITH APPROVAL AFTER SUCCESSFUL CROSS-CHECK ---
            document.setStatus(VerificationStatus.APPROVED);
            document.setFaceMatchConfidence(100.0);

            // 1. Fetch the associated user (required for the VC's DID)
            User user = userRepository.findById(document.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found for Document ID: " + documentId));

            // 2. Generate the Verifiable Credential (VC) and store it
            String verifiableCredential;
            try {
                verifiableCredential = credentialService.generateVC(user, document);
                document.setVerifiableCredential(verifiableCredential);
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to generate VC due to invalid document OCR data.", e);
            }

            // 3. Calculate VC Hash for Anchoring
            String vcHash = sha256Hash(verifiableCredential);
            document.setVcHash(vcHash);
            
            // 4. ANCHOR THE PROOF TO THE BLOCKCHAIN
            try {
                // Anchoring the VC Hash to the blockchain 
                TransactionReceipt receipt = blockchainService.anchorDocumentCID(document.getUserId(), vcHash);
                
                // Update Document entity with the Transaction Hash
                document.setBlockchainTransactionHash(receipt.getTransactionHash());
                document.setAnchoringTime(String.valueOf(System.currentTimeMillis() / 1000));

                System.out.println("✅ Blockchain Anchoring Successful. Tx Hash: " + receipt.getTransactionHash());

                // --- HARD DELETE TEMPORARY IMAGES ---
                document.setTempDocData(null);     // Delete Front ID
                document.setTempDocBackData(null); // Delete Back ID
                document.setTempSelfieData(null);  // Delete Selfie
                
            } catch (Exception e) {
                System.err.println("❌ Blockchain Anchoring Failed: " + e.getMessage());
                throw new RuntimeException("Blockchain anchoring failed. Please ensure the private key is valid and the network is reachable.", e);
            }

            return documentRepository.save(document);
        }).orElseThrow(() -> new RuntimeException("Document not found with id " + documentId));
    }

    public Document rejectDocument(Long documentId) {
        return documentRepository.findById(documentId).map(document -> {
            document.setStatus(VerificationStatus.REJECTED);
            document.setTempDocData(null);
            document.setTempDocBackData(null);
            document.setTempSelfieData(null);
            return documentRepository.save(document);
        }).orElseThrow(() -> new RuntimeException("Document not found with id " + documentId));
    }
}