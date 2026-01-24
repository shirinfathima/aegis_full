package com.trustnet.backend.DTO;

public class AccessRequestDTO {
    private String verifierEmail;
    private String userEmail;
    private Long documentId;
    private String accessType;    // "FULL" or "REDACTED"
    private String allowedFields; // e.g., "DOB,NAME"

    public AccessRequestDTO() {}

    // Getters and Setters
    public String getVerifierEmail() { return verifierEmail; }
    public void setVerifierEmail(String verifierEmail) { this.verifierEmail = verifierEmail; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }

    public String getAccessType() { return accessType; }
    public void setAccessType(String accessType) { this.accessType = accessType; }

    public String getAllowedFields() { return allowedFields; }
    public void setAllowedFields(String allowedFields) { this.allowedFields = allowedFields; }
}