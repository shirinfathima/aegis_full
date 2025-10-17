package com.trustnet.backend.service;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.model.VerificationStatus;
import com.trustnet.backend.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IssuerService {

    @Autowired
    private DocumentRepository documentRepository;

    public List<Document> getPendingDocuments() {
        return documentRepository.findByStatus(VerificationStatus.PENDING);
    }

    public Document approveDocument(Long documentId) {
        return documentRepository.findById(documentId).map(document -> {
            document.setStatus(VerificationStatus.APPROVED);
            // As per your project logic, set confidence to 100 on manual approval
            document.setFaceMatchConfidence(100.0);
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