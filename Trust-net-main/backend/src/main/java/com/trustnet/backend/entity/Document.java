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
    
    private String txHash; 

    @Enumerated(EnumType.STRING)
    private VerificationStatus status;

    // --- TEMPORARY STORAGE ---
    @Column(name = "temp_doc_data", length = 10000000)
    private byte[] tempDocData; 

    @Column(name = "temp_doc_back_data", length = 10000000)
    private byte[] tempDocBackData; 

    @Column(name = "temp_selfie_data", length = 10000000)
    private byte[] tempSelfieData; 
    // -------------------------

    @Column(columnDefinition = "TEXT")
    private String ocrData;

    private Double faceMatchConfidence;
    private String ipfsCid; 
    private String encryptedDocumentKey;

    @Column(columnDefinition = "TEXT") 
    private String verifiableCredential;
    
    private String vcHash; 
    private String blockchainTransactionHash;
    private String anchoringTime;
    private Long issuerId; 

    // 🔥 NEW ZKP PRODUCTION FIELDS 🔥
    @Column(name = "zk_secret")
    private String zkSecret; // The random secret generated during issuance

    @Column(name = "zk_commitment", length = 500)
    private String zkCommitment; // The Poseidon hash stored on-chain/in-DB
    // ---------------------------------

    @Transient
    private byte[] fileData;

    // --- HELPER METHODS ---
    public String getTxHash() { return blockchainTransactionHash; }
    public String getFileName() { return documentName; }

    // Note: Lombok's @Data handles getFileData/setFileData, 
    // but keeping your manual ones is safe.
    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }

    @PrePersist
    protected void onCreate() {
        if (uploadTime == null) { uploadTime = LocalDateTime.now(); }
    }
}