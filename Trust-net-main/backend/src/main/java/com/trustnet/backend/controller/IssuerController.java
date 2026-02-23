package com.trustnet.backend.controller;

import com.trustnet.backend.DTO.StudentVerificationDTO;
import com.trustnet.backend.entity.Document;
import com.trustnet.backend.service.IssuerService;
import com.trustnet.backend.service.CrossCheckService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/issuer")
@CrossOrigin(origins = "http://localhost:3000")
public class IssuerController {

    @Autowired
    private IssuerService issuerService;

    @Autowired
    private CrossCheckService crossCheckService;

    // =====================================================
    // 1️⃣ MANUAL REGISTRY VERIFICATION
    // =====================================================
    @PostMapping("/verify-student")
    public ResponseEntity<?> verifyStudent(
            @RequestBody StudentVerificationDTO dto) {

        if (dto.getAdmissionNo() == null || dto.getName() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Admission Number and Name are required"
            ));
        }

        boolean isValid =
                crossCheckService.verifyStudent(
                        dto.getAdmissionNo(),
                        dto.getName()
                );

        if (isValid) {
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Student verified in University Registry"
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "status", "error",
                    "message", "Verification failed: Registry mismatch"
            ));
        }
    }

    // =====================================================
    // 2️⃣ GET PENDING DOCUMENTS
    // =====================================================
    @GetMapping("/documents/pending")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Document>> getPendingDocuments() {

        return ResponseEntity.ok(
                issuerService.getPendingDocuments()
        );
    }

    // =====================================================
    // 3️⃣ APPROVE DOCUMENT (ZKP COMMITMENT GENERATED HERE)
    // =====================================================
    @PostMapping("/documents/{id}/approve")
    @Transactional
    public ResponseEntity<?> approveDocument(
            @PathVariable Long id) {

        Document approvedDoc =
                issuerService.approveDocument(id);

        return ResponseEntity.ok(Map.of(
                "status", "approved",
                "documentId", approvedDoc.getId(),
                "message", "Document approved and ZKP commitment generated"
        ));
    }

    // =====================================================
    // 4️⃣ REJECT DOCUMENT
    // =====================================================
    @PostMapping("/documents/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectDocument(
            @PathVariable Long id) {

        Document rejectedDoc =
                issuerService.rejectDocument(id);

        return ResponseEntity.ok(Map.of(
                "status", "rejected",
                "documentId", rejectedDoc.getId(),
                "message", "Document rejected"
        ));
    }
}