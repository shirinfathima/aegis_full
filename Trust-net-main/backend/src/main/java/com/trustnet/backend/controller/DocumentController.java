package com.trustnet.backend.controller;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import com.trustnet.backend.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentRepository documentRepository;

    @GetMapping("/my-documents")
    public ResponseEntity<List<Document>> getUserDocuments(@AuthenticationPrincipal User user) {
        // Spring Security provides the logged-in user.
        // We use the user's ID to find their specific documents.
        List<Document> documents = documentRepository.findByUserId(user.getId());
        return ResponseEntity.ok(documents);
    }
}