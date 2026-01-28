package com.trustnet.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "access_requests")
public class AccessRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String verifierEmail;
    private String userEmail;

    @ManyToOne
    @JoinColumn(name = "document_id")
    private Document document;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    private String accessType;    // "FULL", "REDACTED", or "ZKP_AGE"
    private String allowedFields; // e.g. "Name,DOB"

    private LocalDateTime requestDate;
    private LocalDateTime expiryDate;

    // 👇 NEW FIELD FOR ZKP PROOF 👇
    @Column(columnDefinition = "TEXT") // Use TEXT type for large JSON strings
    private String proofData; 

    // --- CONSTRUCTORS ---
    public AccessRequest() {}

    // --- ENUM DEFINITION ---
    public enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED,
        EXPIRED
    }

    // --- GETTERS ---
    public Long getId() { return id; }
    public String getVerifierEmail() { return verifierEmail; }
    public String getUserEmail() { return userEmail; }
    public Document getDocument() { return document; }
    public RequestStatus getStatus() { return status; }
    public String getAccessType() { return accessType; }
    public String getAllowedFields() { return allowedFields; }
    public LocalDateTime getRequestDate() { return requestDate; }
    public LocalDateTime getExpiryDate() { return expiryDate; }
    
    // 👇 NEW GETTER 👇
    public String getProofData() { return proofData; }

    // --- SETTERS ---
    public void setVerifierEmail(String verifierEmail) { this.verifierEmail = verifierEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public void setDocument(Document document) { this.document = document; }
    public void setStatus(RequestStatus status) { this.status = status; }
    public void setAccessType(String accessType) { this.accessType = accessType; }
    public void setAllowedFields(String allowedFields) { this.allowedFields = allowedFields; }
    public void setRequestDate(LocalDateTime requestDate) { this.requestDate = requestDate; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }
    
    // 👇 NEW SETTER 👇
    public void setProofData(String proofData) { this.proofData = proofData; }
}