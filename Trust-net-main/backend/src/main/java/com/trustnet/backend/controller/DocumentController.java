package com.trustnet.backend.controller;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import com.trustnet.backend.repository.DocumentRepository;
import com.trustnet.backend.service.UploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:3000")
public class DocumentController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UploadService uploadService;

    // --- 1. Get User's own documents (Existing Logic) ---
    @GetMapping("/my-documents")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Document>> getUserDocuments(@AuthenticationPrincipal User user) {
        // Spring Security provides the logged-in user context
        List<Document> documents = documentRepository.findByUserId(user.getId());
        return ResponseEntity.ok(documents);
    }

    // --- 2. Decrypt and View Document (New Logic for Verifiers) ---
    @GetMapping("/view/{id}")
    public ResponseEntity<byte[]> viewDocument(@PathVariable Long id) {
        try {
            Document doc = documentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            // Uses the dedicated gateway from your application.properties to bypass timeouts
            byte[] encryptedBytes = uploadService.downloadFromIpfs(doc.getIpfsCid());

            // Decrypt the ID using the AES key stored during upload
            byte[] decryptedBytes = uploadService.decryptDocument(encryptedBytes, doc.getEncryptedDocumentKey());

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(decryptedBytes);
        } catch (Exception e) {
            System.err.println("Error decrypting document: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}