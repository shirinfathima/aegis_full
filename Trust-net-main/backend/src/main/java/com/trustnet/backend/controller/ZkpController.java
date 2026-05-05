package com.trustnet.backend.controller;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.repository.DocumentRepository;
import com.trustnet.backend.service.ZkProofService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/zkp")
public class ZkpController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private ZkProofService zkProofService;

    /**
     * 🎓 STUDENT ENDPOINT
     *
     * Called from:
     * - IssuedDocuments.js
     * - IncomingRequests.js (ZKP flow)
     *
     * Generates a W3C Verifiable Presentation
     * containing a Groth16 Zero-Knowledge Proof
     * proving active university enrollment
     * WITHOUT revealing expiry year.
     */
    @PostMapping("/generate-student-proof")
    public ResponseEntity<?> generateStudentProof(@RequestParam Long documentId) {

        try {

            Optional<Document> optionalDoc =
                    documentRepository.findById(documentId);

            if (optionalDoc.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "error",
                                "Document not found in database."
                        ));
            }

            Document document = optionalDoc.get();

            /*
             * 🔐 Delegates to ZkProofService:
             * - Extracts DID
             * - Extracts expiryYear
             * - Uses stored zkSecret + zkCommitment
             * - Calls Node.js
             * - Generates Groth16 proof
             * - Builds W3C VP
             */
            String vpJson =
                    zkProofService.generateStudentProof(document);

            // Return as proper JSON (not plain string)
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(vpJson);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error",
                            "ZKP generation failed: " + e.getMessage()
                    ));
        }
    }

}