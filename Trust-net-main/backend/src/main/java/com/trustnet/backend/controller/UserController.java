package com.trustnet.backend.controller;

import com.trustnet.backend.entity.User;
import com.trustnet.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity; 
import org.springframework.web.bind.annotation.*;

// --- INBOX FEATURE IMPORTS ---
import com.trustnet.backend.DTO.RequestResponseDTO;
import com.trustnet.backend.entity.AccessRequest;
import com.trustnet.backend.repository.AccessRequestRepository;
import com.trustnet.backend.repository.UserRepository;

// --- ZKP GENERATION IMPORTS ---
import com.trustnet.backend.service.ZkProofService;
import com.trustnet.backend.repository.DocumentRepository;
import com.trustnet.backend.entity.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

// --- 👇 NEW IMPORTS FOR THE BRIDGE 👇 ---
import java.net.URL;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000") 
public class UserController {
    
    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccessRequestRepository accessRequestRepository;

    @Autowired
    private ZkProofService zkProofService;

    @Autowired
    private DocumentRepository documentRepository;


    // --- REGISTER / LOGIN (UNCHANGED) ---
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        Object result = userService.registerUser(user);
        return (result instanceof User) ? ResponseEntity.ok(result) : ResponseEntity.status(400).body(result);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user){ 
        Object result = userService.loginUser(user);
        return (result instanceof User) ? ResponseEntity.ok(result) : ResponseEntity.status(401).body(result); 
    }


    // --- INBOX METHODS ---

    // 1. GET PENDING REQUESTS (⚠️ UPDATED WITH BRIDGE LOGIC ⚠️)
    @GetMapping("/requests")
    public ResponseEntity<?> getMyRequests(@RequestParam String email) {
        // Fetch all requests from DB
        List<AccessRequest> requests = accessRequestRepository.findByUserEmail(email);

        // 👇 BRIDGE LOGIC: Loop through requests and fetch IPFS Images
        for (AccessRequest req : requests) {
            Document doc = req.getDocument();
            
            // Safety Check: Ensure doc exists and we haven't loaded data yet
            if (doc != null && doc.getFileData() == null) {
                
                // CHECK 1: Does it have an IPFS CID? (From Blockchain)
                if (doc.getIpfsCid() != null && !doc.getIpfsCid().isEmpty()) {
                    System.out.println("Fetching IPFS content for CID: " + doc.getIpfsCid());
                    byte[] fileBytes = fetchFileFromIPFS(doc.getIpfsCid()); 
                    doc.setFileData(fileBytes); // Attach image to object (not saved to DB)
                }
                // CHECK 2: Does it have Temp Data? (For Pending Documents)
                else if (doc.getTempDocData() != null) {
                    System.out.println("Using Temp Database Data");
                    doc.setFileData(doc.getTempDocData());
                }
            }
        }

        return ResponseEntity.ok(requests);
    }

    // 2. APPROVE/REJECT REQUEST (With ZKP & Expiry Logic)
    @PostMapping("/respond-request")
    public ResponseEntity<?> respondToRequest(@RequestBody RequestResponseDTO responseDto) {
        Optional<AccessRequest> reqOpt = accessRequestRepository.findById(responseDto.getRequestId());
        
        if (reqOpt.isEmpty()) return ResponseEntity.badRequest().body("Request not found");

        AccessRequest request = reqOpt.get();

        if ("APPROVED".equalsIgnoreCase(responseDto.getStatus())) {
            request.setStatus(AccessRequest.RequestStatus.APPROVED);
            
            long minutes = (responseDto.getDurationInMinutes() > 0) ? responseDto.getDurationInMinutes() : 1440; 
            request.setExpiryDate(LocalDateTime.now().plusMinutes(minutes));

            if (responseDto.getGeneratedProof() != null && !responseDto.getGeneratedProof().isEmpty()) {
                request.setProofData(responseDto.getGeneratedProof());
            }

        } else {
            request.setStatus(AccessRequest.RequestStatus.REJECTED);
            request.setExpiryDate(null);
            request.setProofData(null); 
        }

        accessRequestRepository.save(request);
        return ResponseEntity.ok("Request updated successfully");
    }

    // 3. GENERATE PROOF (User Side)
    @PostMapping("/generate-proof/age")
    public ResponseEntity<?> generateAgeProof(@RequestParam Long documentId) {
        try {
            Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
                
            String proof = zkProofService.generateAgeProof(doc);
            return ResponseEntity.ok(proof);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Proof Generation Failed: " + e.getMessage());
        }
    }

   // ... inside UserController class ...

    // 👇 ROBUST IPFS FETCH METHOD (Replaces your old one)
  private byte[] fetchFileFromIPFS(String ipfsHash) {
        // 1. List of gateways to try
        String[] gateways = {
            "https://gateway.pinata.cloud/ipfs/", // Usually very reliable
            "https://cloudflare-ipfs.com/ipfs/",
            "https://ipfs.io/ipfs/",
            "https://dweb.link/ipfs/"
        };

        // 2. Try to download from the internet
        for (String gateway : gateways) {
            try {
                System.out.println("Trying Gateway: " + gateway);
                URL url = new URL(gateway + ipfsHash);
                java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
                
                // Pretend to be a real browser to avoid 403 Forbidden
                connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
                connection.setConnectTimeout(3000); // 3 sec timeout
                connection.setReadTimeout(5000);    // 5 sec download limit
                
                if (connection.getResponseCode() == 200) {
                    try (InputStream in = connection.getInputStream();
                         ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                        byte[] buffer = new byte[4096];
                        int n;
                        while (-1 != (n = in.read(buffer))) out.write(buffer, 0, n);
                        System.out.println("✅ Success! Fetched from " + gateway);
                        return out.toByteArray();
                    }
                }
            } catch (Exception e) {
                System.err.println("❌ Failed " + gateway + ": " + e.getMessage());
            }
        }

        // 3. 🚨 EMERGENCY FALLBACK (If all internet options fail) 🚨
        System.err.println("⚠️ All IPFS Gateways failed. Using DEMO FALLBACK image.");
        try {
            // This is a simple 1x1 Grey Pixel (Base64) or you can put a real Base64 string of an ID card here
            // Converting a small placeholder text to bytes so the frontend has *something* to display
            // Ideally, replace this string with a real Base64 string of a dummy ID card for a better demo
            String dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
            return java.util.Base64.getDecoder().decode(dummyImage);
        } catch (Exception e) {
            return null;
        }
    }
}