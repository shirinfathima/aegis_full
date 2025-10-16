package com.trustnet.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/issuer")
public class IssuerController {

    /**
     * Endpoint for the Issuer Dashboard data.
     * Accessible only by users with the 'ISSUER' role.
     */
    @GetMapping("/dashboard-data")
    public ResponseEntity<String> getIssuerDashboardData() {
        return ResponseEntity.ok("Successfully retrieved Issuer Dashboard data (Authorized)");
    }
}