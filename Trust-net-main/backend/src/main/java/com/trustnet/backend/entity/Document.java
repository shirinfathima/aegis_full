package com.trustnet.backend.entity;

import java.time.LocalDateTime;
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

    // --- USER LINK ---
    private Long userId; 
    // -----------------

    private String documentName;
    private String selfieName;
    private String documentType; 
    private LocalDateTime uploadTime;
    
    // Note: You had both 'txHash' and 'blockchainTransactionHash'. 
    // keeping both to avoid breaking your existing logic.
    private String txHash; 

    @Enumerated(EnumType.STRING)
    private VerificationStatus status;

    // --- TEMPORARY STORAGE (Added for Issuer Review) ---
    // These hold the raw images until the Issuer approves them.
    // After approval/rejection, these are set to NULL to save space/privacy.
    
    @Column(name = "temp_doc_data", length = 10000000) // Increase size for large images
    private byte[] tempDocData; // FRONT Side Image

    @Column(name = "temp_doc_back_data", length = 10000000)
    private byte[] tempDocBackData; // BACK Side Image

    @Column(name = "temp_selfie_data", length = 10000000)
    private byte[] tempSelfieData; // Live Selfie Image
    // ---------------------------------------------------------

    @Column(columnDefinition = "TEXT")
    private String ocrData;

    private Double faceMatchConfidence;
    private String ipfsCid; 
    private String encryptedDocumentKey;

    @Column(columnDefinition = "TEXT") 
    private String verifiableCredential;
    
    private String vcHash; 
    private String blockchainTransactionHash;// To store the blockchain transaction hash for proof of anchoring
    private String anchoringTime;// NEW FIELD: To store the timestamp of when the document was anchored on-chain
    private Long issuerId; // Field to store the ID of the selected issuer

    @Transient // Tells Database: "Do not save this!"
    private byte[] fileData;

    // --- HELPER METHODS ---
    // These allow the Verifier Controller to read data safely
    public String getTxHash() { return blockchainTransactionHash; }
    public String getFileName() { return documentName; }

    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }
    @PrePersist
    protected void onCreate() {
        if (uploadTime == null) { uploadTime = LocalDateTime.now(); }
    }
}