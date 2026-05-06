package com.trustnet.backend.service;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import com.trustnet.backend.model.VerificationStatus;
import com.trustnet.backend.repository.DocumentRepository;
import com.trustnet.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.beans.factory.annotation.Value;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.web3j.protocol.core.methods.response.TransactionReceipt;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.List;
import java.math.BigInteger;

@Service
public class IssuerService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CredentialService credentialService;

    @Autowired
    private BlockchainService blockchainService;

    @Autowired
    private CrossCheckService crossCheckService;

    @Autowired
    private ZkProofService zkProofService; // Added to access unified converter

    @Autowired
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${zkp.service.url}")
    private String zkpServiceUrl;
    /**
     * SHA256 helper for anchoring VC hash
     */
    private String sha256Hash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes("UTF-8"));
            return new BigInteger(1, hash).toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate SHA-256 hash.", e);
        }
    }

    public List<Document> getPendingDocuments() {
        String issuerEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentIssuer = userRepository.findByEmail(issuerEmail);
        
        if (currentIssuer == null) {
            throw new RuntimeException("Issuer session invalid.");
        }
        
        return documentRepository.findByIssuerIdAndStatus(currentIssuer.getId(), VerificationStatus.PENDING);
    }

    public Document approveDocument(Long documentId) {

        return documentRepository.findById(documentId).map(document -> {

            try {
                // 0️⃣ — REGISTRY CROSS-CHECK
                JsonNode ocrJson = objectMapper.readTree(document.getOcrData());
                JsonNode frontNode = ocrJson.get("front");
                JsonNode backNode = ocrJson.get("back");

                String admissionNo = frontNode.get("Registration Number").asText();
                String studentName = frontNode.get("Name").asText();

                if (!crossCheckService.verifyStudent(admissionNo, studentName)) {
                    throw new RuntimeException("Verification Failed: Student not found in registry.");
                }

                // 1️⃣ — CONVERT DID TO NUMERIC (Strictly Sync with ZkProofService)
                User user = userRepository.findById(document.getUserId())
                        .orElseThrow(() -> new RuntimeException("User not found for ID: " + document.getUserId()));

                BigInteger studentDidNumeric = zkProofService.convertDidToNumeric(user.getDid());

                // 2️⃣ — EXTRACT EXPIRY YEAR (Real-world logic, no more +4 hack)
                String validityStr = backNode.path("Validity").asText("2026");
                int expiryYear = Integer.parseInt(validityStr.replaceAll("[^0-9]", ""));

                // 3️⃣ — GENERATE SECURE RANDOM SECRET
                String secret = new BigInteger(130, new SecureRandom()).toString();

                // 4️⃣ — CALL NODE.JS TO GENERATE POSEIDON COMMITMENT
                ObjectNode payload = objectMapper.createObjectNode();
                payload.put("studentDidNumeric", studentDidNumeric.toString());
                payload.put("expiryYear", expiryYear);
                payload.put("secret", secret);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<String> request = new HttpEntity<>(payload.toString(), headers);

                ResponseEntity<String> response = restTemplate.postForEntity(zkpServiceUrl + "/generate-commitment", request, String.class);

                if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                    throw new RuntimeException("Node.js Commitment Service failed.");
                }

                String commitment = objectMapper.readTree(response.getBody())
                                            .get("commitment").asText();

                // Store ZK values in DB for the holder to use later
                document.setZkSecret(secret);
                document.setZkCommitment(commitment);

                // 5️⃣ — PROCEED WITH VC GENERATION
                document.setStatus(VerificationStatus.APPROVED);
                document.setFaceMatchConfidence(100.0);

                String verifiableCredential = credentialService.generateVC(user, document);
                document.setVerifiableCredential(verifiableCredential);

                // 6️⃣ — ANCHOR VC HASH TO BLOCKCHAIN
                String vcHash = sha256Hash(verifiableCredential);
                document.setVcHash(vcHash);

                TransactionReceipt receipt = blockchainService.anchorDocumentCID(document.getUserId(), vcHash);
                document.setBlockchainTransactionHash(receipt.getTransactionHash());
                document.setAnchoringTime(String.valueOf(System.currentTimeMillis() / 1000));

                // 7️⃣ — PRIVACY CLEANUP
                document.setTempDocData(null);
                document.setTempDocBackData(null);
                document.setTempSelfieData(null);

                return documentRepository.save(document);

            } catch (Exception e) {
                System.err.println("❌ Approval Error: " + e.getMessage());
                throw new RuntimeException("Approval Failed: " + e.getMessage(), e);
            }

        }).orElseThrow(() -> new RuntimeException("Document not found with id " + documentId));
    }

    public Document rejectDocument(Long documentId) {
        return documentRepository.findById(documentId).map(document -> {
            document.setStatus(VerificationStatus.REJECTED);
            document.setTempDocData(null);
            document.setTempDocBackData(null);
            document.setTempSelfieData(null);
            return documentRepository.save(document);
        }).orElseThrow(() -> new RuntimeException("Document not found with id " + documentId));
    }
}