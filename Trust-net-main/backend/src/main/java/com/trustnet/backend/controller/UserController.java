package com.trustnet.backend.controller;

import com.trustnet.backend.entity.User;
import com.trustnet.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import java.net.URL;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;

import com.trustnet.backend.DTO.RequestResponseDTO;
import com.trustnet.backend.entity.AccessRequest;
import com.trustnet.backend.repository.AccessRequestRepository;
import com.trustnet.backend.repository.UserRepository;
import com.trustnet.backend.model.Role;

import com.trustnet.backend.service.ZkProofService;
import com.trustnet.backend.repository.DocumentRepository;
import com.trustnet.backend.entity.Document;

@RestController
@RequestMapping("/api/user")
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

    // =====================================================
    // REGISTER / LOGIN
    // =====================================================

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        Object result = userService.registerUser(user);
        return (result instanceof User)
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        Object result = userService.loginUser(user);
        return (result instanceof User)
                ? ResponseEntity.ok(result)
                : ResponseEntity.status(401).body(result);
    }

    @GetMapping("/issuers")
    public ResponseEntity<List<User>> getIssuers() {
        return ResponseEntity.ok(userService.getAllIssuers());
    }

    @GetMapping("/verifiers")
    public ResponseEntity<List<User>> getVerifiers() {
        return ResponseEntity.ok(userRepository.findByRole(Role.VERIFIER));
    }

    // =====================================================
    // GET USER REQUESTS
    // =====================================================

    @GetMapping("/requests")
    public ResponseEntity<?> getMyRequests(@RequestParam String email) {

        List<AccessRequest> requests =
                accessRequestRepository.findByUserEmail(email);

        for (AccessRequest req : requests) {
            Document doc = req.getDocument();

            if (doc != null && doc.getFileData() == null) {

                if (doc.getIpfsCid() != null && !doc.getIpfsCid().isEmpty()) {
                    byte[] fileBytes = fetchFileFromIPFS(doc.getIpfsCid());
                    doc.setFileData(fileBytes);
                }
                else if (doc.getTempDocData() != null) {
                    doc.setFileData(doc.getTempDocData());
                }
            }
        }

        return ResponseEntity.ok(requests);
    }

    // =====================================================
    // APPROVE / REJECT ACCESS REQUEST
    // =====================================================

    @PostMapping("/respond-request")
    public ResponseEntity<?> respondToRequest(
            @RequestBody RequestResponseDTO responseDto) {

        Optional<AccessRequest> reqOpt =
                accessRequestRepository.findById(responseDto.getRequestId());

        if (reqOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Request not found");
        }

        AccessRequest request = reqOpt.get();

        if ("APPROVED".equalsIgnoreCase(responseDto.getStatus())) {

            request.setStatus(AccessRequest.RequestStatus.APPROVED);

            long minutes =
                    responseDto.getDurationInMinutes() > 0
                            ? responseDto.getDurationInMinutes()
                            : 1440;

            request.setExpiryDate(LocalDateTime.now().plusMinutes(minutes));

            if (responseDto.getGeneratedProof() != null) {
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

    // =====================================================
    // 🎓 GENERATE ENROLLMENT ZKP (NEW)
    // =====================================================

    @PostMapping("/generate-student-proof")
    public ResponseEntity<?> generateStudentProof(
            @RequestParam Long documentId) {

        try {

            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() ->
                            new RuntimeException("Document not found"));

            String vpJson =
                    zkProofService.generateStudentProof(document);

            return ResponseEntity.ok(vpJson);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Proof Generation Failed: " + e.getMessage());
        }
    }

    // =====================================================
    // IPFS FETCH
    // =====================================================

    private byte[] fetchFileFromIPFS(String ipfsHash) {

        String[] gateways = {
                "https://gateway.pinata.cloud/ipfs/",
                "https://cloudflare-ipfs.com/ipfs/",
                "https://ipfs.io/ipfs/",
                "https://dweb.link/ipfs/"
        };

        for (String gateway : gateways) {
            try {
                URL url = new URL(gateway + ipfsHash);
                java.net.HttpURLConnection connection =
                        (java.net.HttpURLConnection) url.openConnection();

                connection.setRequestProperty(
                        "User-Agent",
                        "Mozilla/5.0");

                connection.setConnectTimeout(3000);
                connection.setReadTimeout(5000);

                if (connection.getResponseCode() == 200) {

                    try (InputStream in = connection.getInputStream();
                         ByteArrayOutputStream out =
                                 new ByteArrayOutputStream()) {

                        byte[] buffer = new byte[4096];
                        int n;

                        while ((n = in.read(buffer)) != -1) {
                            out.write(buffer, 0, n);
                        }

                        return out.toByteArray();
                    }
                }

            } catch (Exception ignored) {}
        }

        // Fallback demo image
        String dummyImage =
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

        return java.util.Base64.getDecoder().decode(dummyImage);
    }
}