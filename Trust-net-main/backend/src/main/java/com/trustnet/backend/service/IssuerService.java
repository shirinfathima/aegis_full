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

    // NOTE: Removed sha256Hash helper method as it is no longer needed for ZKP anchoring.

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

            // 3. Retrieve the ZK-Friendly Hash (Commitment) stored during Upload
            // This 'vcHash' field was populated in UploadService with the Poseidon Hash of the IPFS CID.
            String zkCommitment = document.getVcHash();

            if (zkCommitment == null || zkCommitment.isEmpty()) {
                throw new RuntimeException("Cannot anchor document: ZK Commitment (vcHash) is missing.");
            }
            
            // 4. ANCHOR THE PROOF TO THE BLOCKCHAIN
            try {
                // Pass the numeric Poseidon hash string directly to the blockchain service
                // The service will convert this String -> BigInteger -> uint256
                TransactionReceipt receipt = blockchainService.anchorDocumentCID(document.getUserId(), zkCommitment);
                
                // Update Document entity with the Transaction Hash
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