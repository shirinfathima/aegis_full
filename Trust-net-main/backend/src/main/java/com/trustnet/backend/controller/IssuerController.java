package com.trustnet.backend.controller;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.service.IssuerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issuer")
public class IssuerController {

    @Autowired
    private IssuerService issuerService;

    // Endpoint for the university to get all documents pending verification
    @GetMapping("/documents/pending")
    public ResponseEntity<List<Document>> getPendingDocuments() {
        return ResponseEntity.ok(issuerService.getPendingDocuments());
    }

    // Endpoint to approve a document
    @PostMapping("/documents/{id}/approve")
    public ResponseEntity<Document> approveDocument(@PathVariable Long id) {
        return ResponseEntity.ok(issuerService.approveDocument(id));
    }

    // Endpoint to reject a document
    @PostMapping("/documents/{id}/reject")
    public ResponseEntity<Document> rejectDocument(@PathVariable Long id) {
        return ResponseEntity.ok(issuerService.rejectDocument(id));
    }
}