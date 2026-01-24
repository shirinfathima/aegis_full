package com.trustnet.backend.controller;

import com.trustnet.backend.entity.User;
import com.trustnet.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity; 
import org.springframework.web.bind.annotation.*;

// --- NEW IMPORTS (Required for Inbox Feature) ---
import com.trustnet.backend.DTO.RequestResponseDTO;
import com.trustnet.backend.entity.AccessRequest;
import com.trustnet.backend.repository.AccessRequestRepository;
import com.trustnet.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000") // Added this to allow Frontend connection
public class UserController {
    
    @Autowired
    private UserService userService;

    // --- NEW DEPENDENCIES (Added for Inbox Feature) ---
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccessRequestRepository accessRequestRepository;

    // --- EXISTING CODE (UNCHANGED) ---
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        Object result = userService.registerUser(user);
        if (result instanceof User) {
            // Success: return the new User object
            return ResponseEntity.ok(result);
        } else {
            // Failure: return an error message
            return ResponseEntity.status(400).body(result);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user){ 
        // Call the updated service method
        Object result = userService.loginUser(user);
        
        if (result instanceof User) {
            // Success: return the User object
            return ResponseEntity.ok(result);
        } else {
            // Failure: return an Unauthorized/Bad Request response with the error message
            return ResponseEntity.status(401).body(result); 
        }
    }

    // --- NEW METHODS (Added for User Inbox) ---

    // 1. GET PENDING REQUESTS
    @GetMapping("/requests")
    public ResponseEntity<?> getMyRequests(@RequestParam String email) {
        // Fetch all requests sent to this user
        // Note: Ensure AccessRequestRepository has findByUserEmail defined
        List<AccessRequest> requests = accessRequestRepository.findByUserEmail(email);
        return ResponseEntity.ok(requests);
    }

    // 2. APPROVE/REJECT REQUEST
    @PostMapping("/respond-request")
    public ResponseEntity<?> respondToRequest(@RequestBody RequestResponseDTO responseDto) {
        Optional<AccessRequest> reqOpt = accessRequestRepository.findById(responseDto.getRequestId());
        
        if (reqOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Request not found");
        }

        AccessRequest request = reqOpt.get();

        if ("APPROVED".equalsIgnoreCase(responseDto.getStatus())) {
            request.setStatus(AccessRequest.RequestStatus.APPROVED);
            
            // Calculate Expiry Date based on User's Choice
            if (responseDto.getDurationInMinutes() != null && responseDto.getDurationInMinutes() > 0) {
                request.setExpiryDate(LocalDateTime.now().plusMinutes(responseDto.getDurationInMinutes()));
            } else {
                request.setExpiryDate(LocalDateTime.now().plusHours(24)); // Default 24h
            }
        } else {
            request.setStatus(AccessRequest.RequestStatus.REJECTED);
        }

        accessRequestRepository.save(request);
        return ResponseEntity.ok("Request updated successfully");
    }
}