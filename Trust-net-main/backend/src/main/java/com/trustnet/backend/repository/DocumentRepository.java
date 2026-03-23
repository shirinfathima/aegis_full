package com.trustnet.backend.repository;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.model.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    // Used by User Dashboard (Show all their docs)
    List<Document> findByUserId(Long userId);

    // Used by Verifier (Strict Mode: Show ONLY Approved)
    List<Document> findByUserIdAndStatus(Long userId, VerificationStatus status);

    // 👇 CHANGED: Replaced global status search with Issuer-specific search
    List<Document> findByIssuerIdAndStatus(Long issuerId, VerificationStatus status);

    // 👇 MUST KEEP THIS: Used by other parts of the system as a global fallback
    List<Document> findByStatus(VerificationStatus status);

    // =====================================================
    // STATS QUERIES
    // =====================================================
    // Count total approved documents for a specific issuer
    long countByIssuerIdAndStatus(Long issuerId, VerificationStatus status);

    // Count documents with low face match confidence (fraud alerts)
    long countByFaceMatchConfidenceLessThan(double threshold);

}