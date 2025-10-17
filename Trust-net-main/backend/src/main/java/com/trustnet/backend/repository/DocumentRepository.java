package com.trustnet.backend.repository;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.model.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    
    // Custom query to find all documents with a specific status
    List<Document> findByStatus(VerificationStatus status);

    // Custom query to find all documents belonging to a specific user
    List<Document> findByUserId(Long userId);
}