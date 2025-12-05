package com.trustnet.backend.entity;

import com.trustnet.backend.model.VerificationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // To link the document to a user

    private String documentName;
    private String selfieName;

    @Enumerated(EnumType.STRING)
    private VerificationStatus status;

    @Column(columnDefinition = "TEXT") // To store larger JSON data from OCR
    private String ocrData;

    private Double faceMatchConfidence;

    private String ipfsCid; // This will be used later for IPFS integration
    
    // Stores the symmetric key, encrypted with the user's DID private key
    private String encryptedDocumentKey;

    // To store the generated Verifiable Credential (VC) JSON-LD
    @Column(columnDefinition = "TEXT") 
    private String verifiableCredential;
    
    // NEW FIELD: To store the hash of the final signed VC for blockchain anchoring
    private String vcHash;

    // NEW FIELD: To store the blockchain transaction hash for proof of anchoring
    private String blockchainTransactionHash;
}