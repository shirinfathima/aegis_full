package com.trustnet.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.JsonProcessingException;

import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class CredentialService {

    // --- Mock Issuer Key Pair (In production, load this key securely) ---
    private final PrivateKey issuerPrivateKey;
    private final PublicKey issuerPublicKey;
    private static final String ISSUER_DID = "did:trustnet:issuer-aegis-core";

    private final ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder; // Injected for consistency, though only needed for real key encryption/decryption

    /**
     * Initializes the VC service, generating a mock EC key pair for the issuer.
     */
    public CredentialService() throws NoSuchAlgorithmException, InvalidAlgorithmParameterException {
        this.objectMapper = new ObjectMapper();
        
        // Generate a mock EC Key Pair for the Issuer (TrustNet System)
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("EC");
        keyGen.initialize(new ECGenParameterSpec("secp256r1"), new SecureRandom());
        KeyPair pair = keyGen.generateKeyPair();
        this.issuerPrivateKey = pair.getPrivate();
        this.issuerPublicKey = pair.getPublic();
    }
    
    /**
     * Generates a Verifiable Credential (VC) in W3C JSON-LD format and cryptographically signs it.
     *
     * @param user The user who owns the credential.
     * @param document The verified document containing claims (ocrData).
     * @return The signed VC as a pretty-printed JSON string.
     * @throws JsonProcessingException if document ocrData is malformed.
     */
    public String generateVC(User user, Document document) throws JsonProcessingException {
        
        // 1. Format ocrData into the W3C VC JSON-LD Credential Subject
        ObjectNode credentialSubject = objectMapper.createObjectNode();
        
        // Set the subject ID to the user's Decentralized Identifier (DID)
        credentialSubject.put("id", user.getDid());
        
        // Parse the document's raw OCR data (claims) and embed them in the subject
        try {
            ObjectNode ocrDataNode = (ObjectNode) objectMapper.readTree(document.getOcrData());
            credentialSubject.set("claims", ocrDataNode);
        } catch (JsonProcessingException e) {
            throw new JsonProcessingException("Invalid JSON in Document ocrData: " + e.getMessage()){};
        }
        
        // 2. Construct the core VC object (W3C VC JSON-LD Format)
        ObjectNode verifiableCredential = objectMapper.createObjectNode();
        
        verifiableCredential.putArray("@context")
            .add("https://www.w3.org/2018/credentials/v1")
            .add("https://trustnet.com/credentials/schemas/v1"); // Custom schema link
            
        verifiableCredential.putArray("type")
            .add("VerifiableCredential")
            .add("DocumentVerificationCredential"); // Specific credential type

        verifiableCredential.put("id", "urn:uuid:" + UUID.randomUUID().toString());
        verifiableCredential.put("issuer", ISSUER_DID);
        verifiableCredential.put("issuanceDate", Instant.now().toString());
        verifiableCredential.set("credentialSubject", credentialSubject);
        
        // 3. Sign the VC to make it tamper-proof (Mock signing)
        String vcToSign = verifiableCredential.toString();
        
        ObjectNode proof = objectMapper.createObjectNode();
        proof.put("type", "JsonWebSignature2020"); // Standard VC proof type
        proof.put("verificationMethod", ISSUER_DID + "#key-1");
        proof.put("created", Instant.now().toString());
        
        // Generate the signature value
        String signatureValue = generateMockSignature(vcToSign, issuerPrivateKey);
        proof.put("jws", signatureValue);

        // Attach the proof to the VC
        verifiableCredential.set("proof", proof);

        // Return the final, signed VC
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(verifiableCredential);
    }

    /**
     * Helper to simulate the cryptographic signing process using the Issuer's EC private key.
     */
    private String generateMockSignature(String data, PrivateKey privateKey) {
        try {
            // Use SHA256withECDSA for signing, matching the generated EC key pair
            Signature signature = Signature.getInstance("SHA256withECDSA");
            signature.initSign(privateKey);
            signature.update(data.getBytes("UTF-8"));
            byte[] signedData = signature.sign();
            
            // Base64 encode the signature for inclusion in the VC proof
            return Base64.getEncoder().encodeToString(signedData);
        } catch (Exception e) {
            throw new RuntimeException("VC Signing Failed: Could not generate cryptographic signature.", e);
        }
    }
}