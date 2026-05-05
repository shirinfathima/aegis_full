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
public class DocumentController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UploadService uploadService;

    // --- 1. Get User's own documents ---
    @GetMapping("/my-documents")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Document>> getUserDocuments(@AuthenticationPrincipal User user) {
        List<Document> documents = documentRepository.findByUserId(user.getId());
        return ResponseEntity.ok(documents);
    }

    // --- 2. Decrypt and View Document (SECURE & ZIP AWARE) ---
    @GetMapping("/view/{id}")
    public ResponseEntity<byte[]> viewDocument(
            @PathVariable Long id, 
            @RequestParam(defaultValue = "front") String side, // Support for 'front' or 'back'
            @AuthenticationPrincipal User user                 // Inject User for Security
    ) {
        try {
            Document doc = documentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            // SECURITY FIX: Ensure the requester OWNS this document
            if (!doc.getUserId().equals(user.getId())) {
                 return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // 1. Download ZIP from IPFS
            byte[] zipBytes = uploadService.downloadFromIpfs(doc.getIpfsCid());

            // 2. Extract specific side (front/back)
            byte[] encryptedImageBytes = uploadService.extractEncryptedImage(zipBytes, side);

            // 3. Decrypt
            byte[] decryptedBytes = uploadService.decryptDocument(encryptedImageBytes, doc.getEncryptedDocumentKey());

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(decryptedBytes);
        } catch (Exception e) {
            System.err.println("Error decrypting document: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}