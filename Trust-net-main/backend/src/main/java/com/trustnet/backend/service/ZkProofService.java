package com.trustnet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.trustnet.backend.entity.Document;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.math.BigInteger;
import java.time.Instant;
import java.time.Year;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ZkProofService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();
    private final String NODE_ZKP_URL = "http://localhost:3001/generate-proof";

    @Autowired
    private BlockchainService blockchainService;

    public String generateAgeProof(Document document) throws Exception {

        // 1️⃣ Extract birth year from OCR Data
        String ocrJson = document.getOcrData();
        if (ocrJson == null || ocrJson.isEmpty()) {
            throw new RuntimeException("No OCR data found.");
        }

        JsonNode root = objectMapper.readTree(ocrJson);
        String dobString = root.path("front").path("dob").asText("01/01/2000");
        int birthYear = extractYear(dobString);

        // 2️⃣ Call Node.js Service
        ObjectNode requestPayload = objectMapper.createObjectNode();
        requestPayload.put("birthYear", birthYear);
        requestPayload.put("currentYear", Year.now().getValue());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(requestPayload.toString(), headers);

        ResponseEntity<String> apiResponse = restTemplate.postForEntity(NODE_ZKP_URL, request, String.class);

        if (!apiResponse.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Node ZKP Service failed.");
        }

        // 3️⃣ Parse the ZKP math from Node.js
        JsonNode nodeResponse = objectMapper.readTree(apiResponse.getBody());
        JsonNode proofJson = nodeResponse.get("proof");
        JsonNode publicJson = nodeResponse.get("publicSignals");

        // 4️⃣ Extract proof components for Blockchain Verification
        List<BigInteger> pA = new ArrayList<>();
        List<List<BigInteger>> pB = new ArrayList<>();
        List<BigInteger> pC = new ArrayList<>();
        List<BigInteger> pubSignals = new ArrayList<>();

        for (int i = 0; i < 2; i++) pA.add(new BigInteger(proofJson.get("pi_a").get(i).asText()));
        for (int i = 0; i < 2; i++) {
            List<BigInteger> inner = new ArrayList<>();
            inner.add(new BigInteger(proofJson.get("pi_b").get(i).get(0).asText()));
            inner.add(new BigInteger(proofJson.get("pi_b").get(i).get(1).asText()));
            pB.add(inner);
        }

        for (int i = 0; i < 2; i++) pC.add(new BigInteger(proofJson.get("pi_c").get(i).asText()));
        for (int i = 0; i < publicJson.size(); i++) {pubSignals.add(new BigInteger(publicJson.get(i).asText()));}
        System.out.println("Public Signals Size: " + pubSignals.size());
        System.out.println("Public Signals: " + pubSignals);

        // 5️⃣ Verify ON-CHAIN & Apply Security Check 🔥
        boolean verifiedOnChain = blockchainService.verifyZkProof(pA, pB, pC, pubSignals);
        System.out.println("Verified On Chain: " + verifiedOnChain);
        
        // SECURITY FIX: Must be verified on the blockchain AND output a true (1) signal
        boolean isAdult = verifiedOnChain && publicJson.get(0).asText().equals("1"); 

        // 6️⃣ Build Full W3C-Compatible Verifiable Presentation JSON
        ObjectNode vp = objectMapper.createObjectNode();
        vp.putArray("@context").add("https://www.w3.org/2018/credentials/v1");
        vp.putArray("type").add("VerifiablePresentation").add("AgeVerificationProof");
        vp.put("holder", "did:example:holder"); 
        vp.put("documentId", document.getId());

        ObjectNode proofWrapper = objectMapper.createObjectNode();
        proofWrapper.put("type", "ZeroKnowledgeProof");
        proofWrapper.put("created", Instant.now().toString());
        proofWrapper.set("proofValue", proofJson);
        proofWrapper.set("publicSignals", publicJson);
        proofWrapper.put("verifiedOnChain", verifiedOnChain);

        ObjectNode attributes = objectMapper.createObjectNode();
        attributes.put("age_over_18", isAdult);
        attributes.put("age_over_21", isAdult); 
        proofWrapper.set("disclosedAttributes", attributes);

        vp.set("proof", proofWrapper);

        ObjectNode maskedCred = objectMapper.createObjectNode();
        maskedCred.put("id", "urn:uuid:masked-credential");
        maskedCred.put("proofType", "ZKP");
        vp.putArray("verifiableCredential").add(maskedCred);

        // 7️⃣ Return wrapper containing the easy boolean flag AND the full VP
        ObjectNode outerResponse = objectMapper.createObjectNode();
        outerResponse.put("isAdult", isAdult);
        outerResponse.set("presentation", vp);

        return objectMapper.writeValueAsString(outerResponse);
    }

    private int extractYear(String dob) {
        Pattern pattern = Pattern.compile("\\b(19|20)\\d{2}\\b");
        Matcher matcher = pattern.matcher(dob);
        return matcher.find() ? Integer.parseInt(matcher.group(0)) : 2000;
    }
}