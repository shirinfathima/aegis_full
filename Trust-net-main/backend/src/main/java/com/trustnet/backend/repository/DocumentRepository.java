package com.trustnet.backend.repository;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.model.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    // Used by User Dashboard (Show all their docs)
    List<Document> findByUserId(Long userId);

    // ✅ Used by Verifier (Strict Mode: Show ONLY Approved)
    List<Document> findByUserIdAndStatus(Long userId, VerificationStatus status);

    // Used by Issuer Dashboard (Show Pending Queue)
    List<Document> findByStatus(VerificationStatus status);
}