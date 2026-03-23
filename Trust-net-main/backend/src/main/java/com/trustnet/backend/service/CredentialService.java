package com.trustnet.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.web3j.crypto.ECKeyPair;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.utils.Numeric;

import java.time.Instant;
import java.util.UUID;

@Service
public class CredentialService {

    private final ECKeyPair issuerKeyPair;
    private final String issuerAddress;
    private final String issuerDid;
    private final ObjectMapper objectMapper;

    public CredentialService() throws Exception {
        this.objectMapper = new ObjectMapper();

        // Generate real Ethereum-compatible secp256k1 key pair
        this.issuerKeyPair = Keys.createEcKeyPair();
        this.issuerAddress = "0x" + Keys.getAddress(issuerKeyPair);
        this.issuerDid = "did:ethr:" + this.issuerAddress;

        System.out.println("✅ Issuer DID: " + this.issuerDid);
        System.out.println("✅ Issuer Address: " + this.issuerAddress);
    }

    public String generateVC(User user, Document document) throws JsonProcessingException {

        // 1. Build credentialSubject
        ObjectNode credentialSubject = objectMapper.createObjectNode();
        credentialSubject.put("id", user.getDid());
        try {
            ObjectNode ocrDataNode = (ObjectNode) objectMapper.readTree(document.getOcrData());
            credentialSubject.set("claims", ocrDataNode);
        } catch (JsonProcessingException e) {
            throw new JsonProcessingException("Invalid OCR data: " + e.getMessage()) {};
        }

        // 2. Build the VC (without proof yet)
        ObjectNode vc = objectMapper.createObjectNode();
        vc.putArray("@context").add("https://www.w3.org/2018/credentials/v1");
        vc.putArray("type")
            .add("VerifiableCredential")
            .add("DocumentVerificationCredential");
        vc.put("id", "urn:uuid:" + UUID.randomUUID());
        vc.put("issuer", this.issuerDid);
        vc.put("issuanceDate", Instant.now().toString());
        vc.set("credentialSubject", credentialSubject);

        // 3. Sign the VC (without proof attached)
        String vcToSign = vc.toString();
        String signature = generateEthSignature(vcToSign);

        // 4. Attach proof block
        ObjectNode proof = objectMapper.createObjectNode();
        proof.put("type", "EcdsaSecp256k1RecoverySignature2020");
        proof.put("verificationMethod", this.issuerDid + "#controller");
        proof.put("created", Instant.now().toString());
        proof.put("proofValue", signature);
        vc.set("proof", proof);

        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(vc);
    }

    // Signs with Ethereum prefix so ethers.js verifyMessage() works
    private String generateEthSignature(String data) {
        byte[] messageBytes = data.getBytes();
        Sign.SignatureData sig = Sign.signPrefixedMessage(messageBytes, issuerKeyPair);

        // Combine R + S + V into 65-byte hex string
        byte[] result = new byte[65];
        System.arraycopy(sig.getR(), 0, result, 0, 32);
        System.arraycopy(sig.getS(), 0, result, 32, 32);
        System.arraycopy(sig.getV(), 0, result, 64, 1);

        return Numeric.toHexString(result);
    }
}