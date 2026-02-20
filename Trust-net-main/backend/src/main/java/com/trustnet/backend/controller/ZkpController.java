package com.trustnet.backend.controller;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.repository.DocumentRepository;
import com.trustnet.backend.service.ZkProofService; // Make sure this is imported!

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/zkp")
@CrossOrigin
public class ZkpController {

    @Autowired
    private DocumentRepository documentRepository;

    // 🔥 Injecting your secure service!
    @Autowired
    private ZkProofService zkProofService;

    @PostMapping("/generate-age-proof")
    public ResponseEntity<?> generateAgeProof(@RequestParam Long documentId) {
        try {
            Optional<Document> optionalDoc = documentRepository.findById(documentId);

            if (optionalDoc.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Document not found");
            }

            // 🔥 Let the Service handle all the Node, Blockchain, and W3C logic!
            String response = zkProofService.generateAgeProof(optionalDoc.get());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("ZKP generation failed: " + e.getMessage());
        }
    }
}