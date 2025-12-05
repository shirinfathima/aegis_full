package com.trustnet.backend.service;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import com.trustnet.backend.model.VerificationStatus;
import com.trustnet.backend.repository.DocumentRepository;
import com.trustnet.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.web3j.protocol.core.methods.response.TransactionReceipt;

import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;

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

    private String sha256Hash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes("UTF-8"));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate SHA-256 hash.", e);
        }
    }

    public List<Document> getPendingDocuments() {
        return documentRepository.findByStatus(VerificationStatus.PENDING);
    }

    public Document approveDocument(Long documentId) {
        return documentRepository.findById(documentId).map(document -> {
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

            // 3. Calculate VC Hash for Anchoring (Step 5, Requirement 2)
            String vcHash = sha256Hash(verifiableCredential);
            document.setVcHash(vcHash);
            
            // 4. ANCHOR THE PROOF TO THE BLOCKCHAIN (Step 5, Requirement 3 & 4)
            try {
                // Anchoring the VC Hash to the blockchain 
                // (Using DID as the identifier in the smart contract)
                TransactionReceipt receipt = blockchainService.anchorDocumentCID(document.getUserId(), vcHash);
                
                // Update Document entity with the Transaction Hash (Step 5, Requirement 4)
                document.setBlockchainTransactionHash(receipt.getTransactionHash());
                
                System.out.println("✅ Blockchain Anchoring Successful. Tx Hash: " + receipt.getTransactionHash());
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
            return documentRepository.save(document);
        }).orElseThrow(() -> new RuntimeException("Document not found with id " + documentId));
    }
}