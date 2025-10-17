package com.trustnet.backend.controller;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import com.trustnet.backend.service.UploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Autowired
    private UploadService uploadService;

    // This is the new endpoint for the two-sided ID card upload
    @PostMapping("/id-card")
    public ResponseEntity<Document> uploadIdCard(
            @RequestParam("frontImage") MultipartFile frontImage,
            @RequestParam("backImage") MultipartFile backImage,
            @AuthenticationPrincipal User user) {

        Document savedDocument = uploadService.processIdCard(frontImage, backImage, user.getId());
        
        if (savedDocument != null) {
            return ResponseEntity.ok(savedDocument);
        } else {
            return ResponseEntity.status(500).build();
        }
    }
}