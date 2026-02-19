package com.trustnet.backend.controller;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.service.IssuerService;
import com.trustnet.backend.service.CrossCheckService; // Added for Step 5
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/issuer")
@CrossOrigin(origins = "http://localhost:3000") // Added for frontend compatibility
public class IssuerController {

    @Autowired
    private IssuerService issuerService;

    @Autowired
    private CrossCheckService crossCheckService; // Added for Step 5

    // --- NEW ENDPOINT FOR STEP 5: MANUAL REGISTRY VERIFICATION ---
    @PostMapping("/verify-student")
    public ResponseEntity<?> verifyStudent(@RequestBody Map<String, String> request) {
        String admissionNo = request.get("admissionNo");
        String name = request.get("name");

        if (admissionNo == null || name == null) {
            return ResponseEntity.badRequest().body("Admission Number and Name are required.");
        }

        boolean isValid = crossCheckService.verifyStudent(admissionNo, name);

        if (isValid) {
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Student Verified in University Registry"
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "status", "error",
                "message", "Verification Failed: Registry mismatch for " + admissionNo
            ));
        }
    }

    // --- EXISTING ENDPOINTS ---

    // Endpoint for the university to get all documents pending verification
    @GetMapping("/documents/pending")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Document>> getPendingDocuments() {
        return ResponseEntity.ok(issuerService.getPendingDocuments());
    }

    // Endpoint to approve a document
    @PostMapping("/documents/{id}/approve")
    @Transactional
    public ResponseEntity<Document> approveDocument(@PathVariable Long id) {
        return ResponseEntity.ok(issuerService.approveDocument(id));
    }

    // Endpoint to reject a document
    @PostMapping("/documents/{id}/reject")
    @Transactional
    public ResponseEntity<Document> rejectDocument(@PathVariable Long id) {
        return ResponseEntity.ok(issuerService.rejectDocument(id));
    }
}