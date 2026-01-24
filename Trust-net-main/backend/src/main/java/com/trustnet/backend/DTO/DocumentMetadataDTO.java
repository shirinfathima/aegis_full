package com.trustnet.backend.DTO;

public class DocumentMetadataDTO {
    private Long id;
    private String documentType;
    private String uploadDate;
    private boolean isVerified;

    public DocumentMetadataDTO(Long id, String documentType, String uploadDate, boolean isVerified) {
        this.id = id;
        this.documentType = documentType;
        this.uploadDate = uploadDate;
        this.isVerified = isVerified;
    }

    // Getters
    public Long getId() { return id; }
    public String getDocumentType() { return documentType; }
    public String getUploadDate() { return uploadDate; }
    public boolean isVerified() { return isVerified; }
}