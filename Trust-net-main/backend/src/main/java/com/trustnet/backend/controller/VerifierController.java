package com.trustnet.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/verifier")
public class VerifierController {

    /**
     * Endpoint for the Verifier Dashboard data.
     * Accessible only by users with the 'VERIFIER' role.
     */
    @GetMapping("/dashboard-data")
    public ResponseEntity<String> getVerifierDashboardData() {
        return ResponseEntity.ok("Successfully retrieved Verifier Dashboard data (Authorized)");
    }
}