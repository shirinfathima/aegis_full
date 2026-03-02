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

    private final String NODE_ZKP_URL = "http://localhost:3001";

    // 🔥 BN254 field prime (VERY IMPORTANT)
    private static final BigInteger FIELD_PRIME = new BigInteger(
        "21888242871839275222246405745257275088548364400416034343698204186575808495617"
    );

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BlockchainService blockchainService;

    /**
     * ✅ FIXED: Convert DID to numeric AND reduce into BN254 field
     */
    public BigInteger convertDidToNumeric(String did) {
        try {
            String address = did.substring(did.lastIndexOf(":") + 1);
            if (!address.startsWith("0x")) {
                throw new RuntimeException("Invalid DID format: Address part must start with 0x");
            }

            BigInteger raw = new BigInteger(address.substring(2), 16);

            // 🔥 Reduce into field
            return raw.mod(FIELD_PRIME);

        } catch (Exception e) {
            throw new RuntimeException("DID Conversion failed: " + e.getMessage());
        }
    }

    /*
     * ===============================================================
     * 1️⃣ ISSUER STEP
     * ===============================================================
     */
    public Map<String, String> generateIssuerCommitment(String studentDid, int expiryYear) {
        try {
            BigInteger studentDidNumeric = convertDidToNumeric(studentDid);

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
     * ===============================================================
     */
    public String generateStudentProof(Document document) throws Exception {

        if (document.getOcrData() == null || document.getOcrData().isEmpty()) {
            throw new RuntimeException("No OCR data found.");
        }

        JsonNode root = objectMapper.readTree(document.getOcrData());

        User user = userRepository.findById(document.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found."));

        BigInteger studentDidNumeric = convertDidToNumeric(user.getDid());

        String validity = root.path("back").path("Validity").asText();
        if (validity == null || validity.isEmpty()) {
            throw new RuntimeException("Validity year not found in OCR.");
        }

        String yearDigits = validity.replaceAll("[^0-9]", "");
        if (yearDigits.length() < 4) {
            throw new RuntimeException("Invalid expiry year format.");
        }

        int expiryYear = Integer.parseInt(yearDigits.substring(0, 4));

        int currentYear = java.time.Year.now().getValue();

        String secret = document.getZkSecret();
        String commitment = document.getZkCommitment();

        if (secret == null || commitment == null) {
            throw new RuntimeException("Missing ZK issuance data.");
        }

        // 🔍 DEBUG
        System.out.println("=== ZK PROOF GENERATION DEBUG ===");
        System.out.println("studentDidNumeric : " + studentDidNumeric);
        System.out.println("expiryYear        : " + expiryYear);
        System.out.println("currentYear       : " + currentYear);
        System.out.println("secret (from DB)  : " + secret);
        System.out.println("commitment (from DB): " + commitment);
        System.out.println("=================================");

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("studentDidNumeric", studentDidNumeric.toString());
        payload.put("expiryYear", expiryYear);
        payload.put("universitySecret", secret);
        payload.put("universityCommitment", commitment);
        payload.put("currentYear", currentYear);

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

        boolean verifiedOnChain = verifyZkProofOnChain(proofJson, publicJson, commitment);

        boolean isActiveStudent = verifiedOnChain && publicJson.get(0).asText().equals("1");

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

    private boolean verifyZkProofOnChain(
            JsonNode proofJson,
            JsonNode publicSignalsJson,
            String storedCommitment
    ) throws Exception {

        List<BigInteger> pA = Arrays.asList(
                new BigInteger(proofJson.get("pi_a").get(0).asText()),
                new BigInteger(proofJson.get("pi_a").get(1).asText())
        );

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

        List<BigInteger> pC = Arrays.asList(
                new BigInteger(proofJson.get("pi_c").get(0).asText()),
                new BigInteger(proofJson.get("pi_c").get(1).asText())
        );

        List<BigInteger> pubSignals = new ArrayList<>();
        for (int i = 0; i < publicSignalsJson.size(); i++) {
            pubSignals.add(new BigInteger(publicSignalsJson.get(i).asText()));
        }

        System.out.println("=== ON-CHAIN VERIFICATION DEBUG ===");
        System.out.println("Signals : " + pubSignals);
        System.out.println("Commitment match : " +
                storedCommitment.equals(pubSignals.get(2).toString()));
        System.out.println("====================================");

        return blockchainService.verifyZkProof(pA, pB, pC, pubSignals);
    }
    
}