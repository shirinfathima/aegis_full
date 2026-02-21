package com.trustnet.backend.service;

import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import com.trustnet.backend.model.VerificationStatus;
import com.trustnet.backend.repository.DocumentRepository;
import com.trustnet.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import com.fasterxml.jackson.core.JsonProcessingException;
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

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Autowired
    private RestTemplate restTemplate;

    private final String NODE_ZKP_URL = "http://localhost:3001/generate-commitment";

    // SHA256 helper for anchoring VC hash
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
        return documentRepository.findByStatus(VerificationStatus.PENDING);
    }

    public Document approveDocument(Long documentId) {

        return documentRepository.findById(documentId).map(document -> {

            try {
                /* =====================================================
                   STEP 0️⃣ — REGISTRY CROSS-CHECK (DO NOT REMOVE)
                ===================================================== */
                JsonNode ocrJson = objectMapper.readTree(document.getOcrData());
                JsonNode frontNode = ocrJson.get("front");
                JsonNode backNode = ocrJson.get("back");

                String admissionNo = frontNode.get("Registration Number").asText();
                String studentName = frontNode.get("Name").asText();

                boolean isVerifiedInRegistry =
                        crossCheckService.verifyStudent(admissionNo, studentName);

                if (!isVerifiedInRegistry) {
                    throw new RuntimeException(
                            "Verification Failed: Student not found in university registry."
                    );
                }

                System.out.println("✅ Registry Cross-check Passed for: " + admissionNo);

                /* =====================================================
                   STEP 1️⃣ — FETCH USER & CONVERT DID TO BIGINTEGER
                ===================================================== */
                User user = userRepository.findById(document.getUserId())
                        .orElseThrow(() ->
                                new RuntimeException("User not found for Document ID: " + documentId));

                String did = user.getDid(); // did:trustnet:0xABC...
                String cleanAddress = did.replace("did:trustnet:", "");

                if (!cleanAddress.startsWith("0x")) {
                    throw new RuntimeException("Invalid DID format.");
                }

                String hexAddress = cleanAddress.substring(2);
                BigInteger studentDidNumeric = new BigInteger(hexAddress, 16);

                /* =====================================================
                   STEP 2️⃣ — EXTRACT EXPIRY YEAR FROM OCR
                ===================================================== */
                String validityStr = backNode.path("Validity").asText("2026");
                int expiryYear = Integer.parseInt(validityStr.replaceAll("[^0-9]", ""));

                /* =====================================================
                   STEP 3️⃣ — GENERATE SECURE RANDOM SECRET
                ===================================================== */
                String secret = new BigInteger(130, new SecureRandom()).toString();

                /* =====================================================
                   STEP 4️⃣ — CALL NODE.JS TO GENERATE POSEIDON COMMITMENT
                ===================================================== */
                ObjectNode payload = objectMapper.createObjectNode();
                payload.put("studentDidNumeric", studentDidNumeric.toString());
                payload.put("expiryYear", expiryYear);
                payload.put("secret", secret);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<String> request =
                        new HttpEntity<>(payload.toString(), headers);

                ResponseEntity<String> response =
                        restTemplate.postForEntity(NODE_ZKP_URL, request, String.class);

                String commitment =
                        objectMapper.readTree(response.getBody())
                                .get("commitment").asText();

                // Store ZK values in DB
                document.setZkSecret(secret);
                document.setZkCommitment(commitment);

                /* =====================================================
                   STEP 5️⃣ — PROCEED WITH VC GENERATION
                ===================================================== */
                document.setStatus(VerificationStatus.APPROVED);
                document.setFaceMatchConfidence(100.0);

                String verifiableCredential =
                        credentialService.generateVC(user, document);

                document.setVerifiableCredential(verifiableCredential);

                /* =====================================================
                   STEP 6️⃣ — ANCHOR VC HASH TO BLOCKCHAIN
                ===================================================== */
                String vcHash = sha256Hash(verifiableCredential);
                document.setVcHash(vcHash);

                TransactionReceipt receipt =
                        blockchainService.anchorDocumentCID(
                                document.getUserId(),
                                vcHash
                        );

                document.setBlockchainTransactionHash(receipt.getTransactionHash());
                document.setAnchoringTime(
                        String.valueOf(System.currentTimeMillis() / 1000)
                );

                System.out.println("✅ Blockchain Anchoring Successful. Tx Hash: "
                        + receipt.getTransactionHash());

                /* =====================================================
                   STEP 7️⃣ — DELETE TEMP IMAGES (PRIVACY CLEANUP)
                ===================================================== */
                document.setTempDocData(null);
                document.setTempDocBackData(null);
                document.setTempSelfieData(null);

                return documentRepository.save(document);

            } catch (Exception e) {
                System.err.println("❌ Approval Error: " + e.getMessage());
                throw new RuntimeException("Approval Failed: " + e.getMessage(), e);
            }

        }).orElseThrow(() ->
                new RuntimeException("Document not found with id " + documentId));
    }

    public Document rejectDocument(Long documentId) {
        return documentRepository.findById(documentId).map(document -> {
            document.setStatus(VerificationStatus.REJECTED);
            document.setTempDocData(null);
            document.setTempDocBackData(null);
            document.setTempSelfieData(null);
            return documentRepository.save(document);
        }).orElseThrow(() ->
                new RuntimeException("Document not found with id " + documentId));
    }
}