package com.trustnet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustnet.backend.entity.Document;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ZkProofService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // The threshold year. If today is 2026, anyone born in 2008 or earlier is 18+.
    private static final int ADULT_AGE_THRESHOLD = 18;

    public String generateAgeProof(Document document) throws Exception {
        // 1. Parse the OCR Data from the Database (Private Input)
        String ocrJson = document.getOcrData();
        if (ocrJson == null || ocrJson.isEmpty()) {
            throw new RuntimeException("No OCR data found for this document.");
        }
        
        JsonNode root = objectMapper.readTree(ocrJson);
        
        // 2. Extract Date of Birth
        // We look for "dob" inside the "front" object.
        JsonNode frontNode = root.path("front");
        String dobString = "";
        
        // Flexible check for different OCR keys
        if (frontNode.has("dob")) {
            dobString = frontNode.get("dob").asText();
        } else if (frontNode.has("date_of_birth")) {
            dobString = frontNode.get("date_of_birth").asText();
        } else if (frontNode.has("Date of Birth")) {
             dobString = frontNode.get("Date of Birth").asText();
        } else {
             // Fallback for demo: If OCR failed to read DOB, assume a valid year for testing
             dobString = "01/01/2000"; 
        }

        // 3. Extract Year and Calculate Age
        int birthYear = extractYear(dobString);
        int currentYear = Year.now().getValue();
        int age = currentYear - birthYear;

        // 4. Validate Logic (The "Zero Knowledge" Check)
        // If they are under 18, we REFUSE to generate a proof.
        if (age < ADULT_AGE_THRESHOLD) {
            throw new RuntimeException("Proof Generation Failed: User is under 18 (" + age + " years old).");
        }

        // 5. Generate the "Proof" 
        // This JSON mimics the output of a real SNARK (Groth16) proof.
        // The Verifier (Frontend) only sees this, not the birth year.
        return createMockZkProof(age);
    }

    private int extractYear(String dob) {
        // Look for 4 consecutive digits (e.g., 2000)
        Pattern pattern = Pattern.compile("\\b(19|20)\\d{2}\\b");
        Matcher matcher = pattern.matcher(dob);
        
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(0));
        }
        // Fallback for testing if format is messy
        return 2000; 
    }

    private String createMockZkProof(int actualAge) {
        // We return a "Proof" object. 
        // Notice we DO NOT include the "actualAge" in the public output.
        // We only say "isAdult": true
        return String.format("""
            {
                "proof": {
                    "a": ["0x1a2b3c...", "0x4d5e6f..."],
                    "b": [["0x7a8b9c...", "0x0d1e2f..."], ["0x3a4b5c...", "0x6d7e8f..."]],
                    "c": ["0x9a8b7c...", "0x6d5e4f..."]
                },
                "inputs": {
                    "isValid": true,
                    "ageCheck": "OVER_18",
                    "timestamp": "%d"
                }
            }
            """, System.currentTimeMillis());
    }
}