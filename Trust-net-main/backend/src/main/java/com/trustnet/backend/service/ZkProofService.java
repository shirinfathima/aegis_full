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
import java.util.*;

@Service
public class ZkProofService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private BlockchainService blockchainService;

    @Autowired
    private UserRepository userRepository;

    private final String NODE_ZKP_URL = "http://localhost:3001/generate-proof";

    /**
     * MAIN METHOD — Generates Student ZKP and verifies on-chain
     */
    public String generateStudentProof(Document document) throws Exception {

        // 1️⃣ Validate OCR
        if (document.getOcrData() == null || document.getOcrData().isEmpty()) {
            throw new RuntimeException("No OCR data found.");
        }

        JsonNode root = objectMapper.readTree(document.getOcrData());

        // 2️⃣ Fetch User & Convert DID to BigInteger
        User user = userRepository.findById(document.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found."));

        String did = user.getDid();
        String address = did.substring(did.lastIndexOf(":") + 1);

        if (!address.startsWith("0x")) {
            throw new RuntimeException("Invalid DID format.");
        }

        BigInteger studentDidNumeric =
                new BigInteger(address.substring(2), 16);

        // 3️⃣ Extract Expiry Year
        String validity =
                root.path("back").path("Validity").asText("2026");

        int expiryYear =
                Integer.parseInt(validity.replaceAll("[^0-9]", ""));

        // 4️⃣ Fetch stored ZK data
        String secret = document.getZkSecret();
        String commitment = document.getZkCommitment();

        if (secret == null || commitment == null) {
            throw new RuntimeException("Missing ZK issuance data.");
        }

        // 5️⃣ Call Node.js Prover (In-Memory)
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("studentDidNumeric", studentDidNumeric.toString());
        payload.put("expiryYear", expiryYear);
        payload.put("universitySecret", secret);
        payload.put("universityCommitment", commitment);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request =
                new HttpEntity<>(payload.toString(), headers);

        ResponseEntity<String> response =
                restTemplate.postForEntity(
                        NODE_ZKP_URL,
                        request,
                        String.class
                );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Node ZKP service failed.");
        }

        JsonNode responseJson =
                objectMapper.readTree(response.getBody());

        JsonNode proofJson = responseJson.get("proof");
        JsonNode publicJson = responseJson.get("publicSignals");

        // 6️⃣ Delegate On-Chain Verification
        boolean verifiedOnChain =
                verifyZkProofOnChain(proofJson, publicJson);

        // Circuit outputs isValid = 1 if checks pass
        boolean isActiveStudent =
                verifiedOnChain &&
                publicJson.get(0).asText().equals("1");

        // 7️⃣ Build Verifiable Presentation
        ObjectNode vp = objectMapper.createObjectNode();

        vp.putArray("@context")
                .add("https://www.w3.org/2018/credentials/v1");

        vp.putArray("type")
                .add("VerifiablePresentation")
                .add("StudentVerificationProof");

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

        // G2 - pi_b (MANDATORY SWAP 🔥)
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

        // Public Signals
        List<BigInteger> pubSignals = new ArrayList<>();
        publicSignalsJson.forEach(signal ->
                pubSignals.add(new BigInteger(signal.asText()))
        );

        // Delegate to blockchain layer
        return blockchainService.verifyZkProof(
                pA, pB, pC, pubSignals
        );
    }
}