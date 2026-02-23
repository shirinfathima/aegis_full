package com.trustnet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import com.trustnet.backend.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.math.BigInteger;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.security.SecureRandom;
import java.util.List;
import java.util.Arrays;
import java.util.ArrayList;

@Service
public class ZkProofService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Base URL for Node.js snarkjs microservice
    private final String NODE_ZKP_URL = "http://localhost:3001";

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BlockchainService blockchainService;

    /**
     * Helper Method: Ensures DID is converted to numeric format consistently 
     * across BOTH services. This prevents pairing failure/reversion on Polygon.
     */
    public BigInteger convertDidToNumeric(String did) {
        try {
            String address = did.substring(did.lastIndexOf(":") + 1);
            if (!address.startsWith("0x")) {
                throw new RuntimeException("Invalid DID format: Address part must start with 0x");
            }
            return new BigInteger(address.substring(2), 16);
        } catch (Exception e) {
            throw new RuntimeException("DID Conversion failed: " + e.getMessage());
        }
    }

    /*
     * ===============================================================
     * 1️⃣ ISSUER STEP
     * Generates commitment during document approval
     * ===============================================================
     */
    public Map<String, String> generateIssuerCommitment(
            String studentDid,
            int expiryYear
    ) {
        try {
            // Convert DID to numeric format using unified helper
            BigInteger studentDidNumeric = convertDidToNumeric(studentDid);

            // 🔐 Secure random secret
            SecureRandom secureRandom = new SecureRandom();
            String secret = new BigInteger(130, secureRandom).toString();

            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("studentDidNumeric", studentDidNumeric.toString());
            payload.put("expiryYear", expiryYear);
            payload.put("secret", secret);

            ResponseEntity<JsonNode> response = restTemplate.postForEntity(
                            NODE_ZKP_URL + "/generate-commitment",
                            payload,
                            JsonNode.class
                    );

            if (!response.getStatusCode().is2xxSuccessful()
                    || response.getBody() == null
                    || response.getBody().get("commitment") == null) {
                throw new RuntimeException("Invalid response from Node commitment service.");
            }

            Map<String, String> result = new HashMap<>();
            result.put("commitment", response.getBody().get("commitment").asText());
            result.put("secret", secret);

            return result;

        } catch (Exception e) {
            throw new RuntimeException("Commitment generation failed: " + e.getMessage());
        }
    }

    /*
     * ===============================================================
     * 2️⃣ STUDENT STEP
     * Generates W3C Verifiable Presentation with Groth16 Proof
     * ===============================================================
     */
    public String generateStudentProof(Document document) throws Exception {

        // 1. Validate OCR data
        if (document.getOcrData() == null || document.getOcrData().isEmpty()) {
            throw new RuntimeException("No OCR data found.");
        }

        JsonNode root = objectMapper.readTree(document.getOcrData());

        // 2. Fetch user and convert DID consistently
        User user = userRepository.findById(document.getUserId())
                        .orElseThrow(() -> new RuntimeException("User not found."));

        BigInteger studentDidNumeric = convertDidToNumeric(user.getDid());

        // 3. Extract Expiry Year and apply standard validity logic
        String validity = root.path("back").path("Validity").asText();
        if (validity == null || validity.isEmpty()) {
            throw new RuntimeException("Validity year not found in OCR.");
        }

        String yearDigits = validity.replaceAll("[^0-9]", "");
        if (yearDigits.length() < 4) {
            throw new RuntimeException("Invalid expiry year format.");
        }
        int expiryYear = Integer.parseInt(yearDigits.substring(0, 4));

        // Professional Logic: expiryYear >= currentYear is valid (handled by circuit LessEqThan)
        int currentYear = java.time.Year.now().getValue();
        if (expiryYear < currentYear) {
            throw new RuntimeException("Enrollment expired. Expiry: " + expiryYear + ", Current: " + currentYear);
        }

        // 4. Fetch stored ZK issuance data
        String secret = document.getZkSecret();
        String commitment = document.getZkCommitment();

        if (secret == null || commitment == null) {
            throw new RuntimeException("Missing ZK issuance data.");
        }

        // 5. Call Node.js Prover
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("studentDidNumeric", studentDidNumeric.toString());
        payload.put("expiryYear", expiryYear);
        payload.put("universitySecret", secret);
        payload.put("universityCommitment", commitment);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(payload.toString(), headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                        NODE_ZKP_URL + "/generate-proof",
                        request,
                        String.class
                );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Node ZKP service failed.");
        }

        JsonNode responseJson = objectMapper.readTree(response.getBody());
        JsonNode proofJson = responseJson.get("proof");
        JsonNode publicJson = responseJson.get("publicSignals");

        if (proofJson == null || publicJson == null) {
            throw new RuntimeException("Invalid response from Node ZKP service.");
        }

        // 6. Delegate On-Chain Verification
        boolean verifiedOnChain = verifyZkProofOnChain(proofJson, publicJson);

        // Circuit outputs isValid = 1 if checks pass
        boolean isActiveStudent = verifiedOnChain && publicJson.get(0).asText().equals("1");

        // 7. Build W3C Verifiable Presentation
        ObjectNode vp = objectMapper.createObjectNode();
        vp.putArray("@context").add("https://www.w3.org/2018/credentials/v1");
        vp.putArray("type").add("VerifiablePresentation").add("StudentVerificationProof");
        vp.put("holder", user.getDid());
        vp.put("documentId", document.getId());

        ObjectNode proofWrapper = objectMapper.createObjectNode();
        proofWrapper.put("type", "ZeroKnowledgeProof");
        proofWrapper.put("created", Instant.now().toString());
        proofWrapper.set("proofValue", proofJson);
        proofWrapper.set("publicSignals", publicJson);
        proofWrapper.put("verifiedOnChain", verifiedOnChain);

        ObjectNode attributes = objectMapper.createObjectNode();
        attributes.put("is_active_enrollment", isActiveStudent);
        attributes.put("university_affiliation_verified", isActiveStudent);
        proofWrapper.set("disclosedAttributes", attributes);

        vp.set("proof", proofWrapper);

        ObjectNode outer = objectMapper.createObjectNode();
        outer.put("success", isActiveStudent);
        outer.set("presentation", vp);

        return objectMapper.writeValueAsString(outer);
    }

    /**
     * 🔥 CLEAN ARCHITECTURE: Extract proof → Delegate to BlockchainService
     */
    private boolean verifyZkProofOnChain(
            JsonNode proofJson,
            JsonNode publicSignalsJson
    ) throws Exception {

        // G1 - pi_a
        List<BigInteger> pA = Arrays.asList(
                new BigInteger(proofJson.get("pi_a").get(0).asText()),
                new BigInteger(proofJson.get("pi_a").get(1).asText())
        );

        // G2 - pi_b: MANDATORY SWAP 🔥 [imaginary, real] transposed order for EVM
        List<List<BigInteger>> pB = Arrays.asList(
                Arrays.asList(
                        new BigInteger(proofJson.get("pi_b").get(0).get(1).asText()),
                        new BigInteger(proofJson.get("pi_b").get(0).get(0).asText())
                ),
                Arrays.asList(
                        new BigInteger(proofJson.get("pi_b").get(1).get(1).asText()),
                        new BigInteger(proofJson.get("pi_b").get(1).get(0).asText())
                )
        );

        // G1 - pi_c
        List<BigInteger> pC = Arrays.asList(
                new BigInteger(proofJson.get("pi_c").get(0).asText()),
                new BigInteger(proofJson.get("pi_c").get(1).asText())
        );

        // Public Signals: STRICT LIMIT TO 3 AS PER Groth16Verifier.sol
        List<BigInteger> pubSignals = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            if (publicSignalsJson.has(i)) {
                pubSignals.add(new BigInteger(publicSignalsJson.get(i).asText()));
            }
        }

        return blockchainService.verifyZkProof(pA, pB, pC, pubSignals);
    }
}