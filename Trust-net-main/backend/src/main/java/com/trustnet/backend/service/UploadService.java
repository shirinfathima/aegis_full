package com.trustnet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustnet.backend.entity.Document;
import com.trustnet.backend.entity.User;
import com.trustnet.backend.model.VerificationStatus;
import com.trustnet.backend.repository.DocumentRepository;
import com.trustnet.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

// Added imports for ZK Hashing and Base58 support
import org.bitcoinj.core.Base58; 
import com.trustnet.backend.service.ZkHashUtils;
import java.math.BigInteger;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;

@Service
public class UploadService {

    private static final String AES_ALGORITHM = "AES";
    private static final int AES_KEY_SIZE = 256;
    private static final String IPFS_UPLOAD_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"; 

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository; 

    @Value("${pinata.api-key}")
    private String pinataApiKey;
    @Value("${pinata.secret-api-key}")
    private String pinataSecretApiKey;

    /**
     * Delegates the generation of a ZK-friendly hash to the ZkHashUtils.
     */
    private String generateZkFriendlyCidHash(String ipfsCid) {
        // Calls the centralized utility to handle Base58 decoding and field-element hashing
        BigInteger hash = ZkHashUtils.hashIpfsCid(ipfsCid);
        return hash.toString();
    }

    // --- Cryptographic Utility Methods ---

    private SecretKey generateAesKey() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance(AES_ALGORITHM);
        keyGen.init(AES_KEY_SIZE, new SecureRandom());
        return keyGen.generateKey();
    }

    private byte[] encryptBytes(byte[] rawBytes, SecretKey secretKey) throws Exception {
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        return cipher.doFinal(rawBytes);
    }

    private String encryptDocumentKeyWithDidPrivateKey(SecretKey documentKey, String didPrivateKeyPlaceholder) {
        // In a real implementation, use the user's DID private key for asymmetric encryption
        return Base64.getEncoder().encodeToString(documentKey.getEncoded());
    }

    private String ipfsUpload(byte[] encryptedBytes, String fileName) throws Exception {
        ByteArrayResource resource = new ByteArrayResource(encryptedBytes) {
            @Override
            public String getFilename() { return fileName; }
        };
        
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", resource);

        String responseBody = webClientBuilder.build()
            .post()
            .uri(IPFS_UPLOAD_URL)
            .header("pinata_api_key", pinataApiKey) 
            .header("pinata_secret_api_key", pinataSecretApiKey)
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(body))
            .retrieve()
            .bodyToMono(String.class)
            .block();
        
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(responseBody);
        String cid = root.path("IpfsHash").asText();
        
        if (cid == null || cid.isEmpty()) {
             throw new Exception("IPFS Upload failed: CID not found in Pinata response.");
        }
        return cid;
    }

    public Document processIdCard(MultipartFile frontImage, MultipartFile backImage, Long userId) throws Exception {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) throw new Exception("User not found: " + userId);
        User user = userOptional.get();

        byte[] frontImageBytes = frontImage.getBytes();
        byte[] backImageBytes = backImage.getBytes();
        
        String frontImageName = Path.of(frontImage.getOriginalFilename()).getFileName().toString();
        Path frontPath = Paths.get("uploads/docs/" + frontImageName);
        Files.createDirectories(frontPath.getParent());
        Files.write(frontPath, frontImageBytes, StandardOpenOption.CREATE);

        String backImageName = Path.of(backImage.getOriginalFilename()).getFileName().toString();
        Path backPath = Paths.get("uploads/docs/" + backImageName);
        Files.write(backPath, backImageBytes, StandardOpenOption.CREATE);
        
        try {
            JsonNode faceMatchResult = triggerLivenessAndFaceMatch(frontPath);
            double confidence = faceMatchResult.path("confidence").asDouble(0.0);

            String ocrFront = extractTextFromDocument(frontPath, "front");
            String ocrBack = extractTextFromDocument(backPath, "back");
            String combinedOcr = "{\"front\":" + ocrFront + ", \"back\":" + ocrBack + "}";
            
            SecretKey documentAesKey = generateAesKey();
            byte[] encryptedFrontBytes = encryptBytes(frontImageBytes, documentAesKey);
            byte[] encryptedBackBytes = encryptBytes(backImageBytes, documentAesKey);

            byte[] combinedEncryptedBytes = new byte[encryptedFrontBytes.length + encryptedBackBytes.length];
            System.arraycopy(encryptedFrontBytes, 0, combinedEncryptedBytes, 0, encryptedFrontBytes.length);
            System.arraycopy(encryptedBackBytes, 0, combinedEncryptedBytes, encryptedFrontBytes.length, encryptedBackBytes.length);

            // 1. Upload to IPFS via Pinata
            String ipfsCid = ipfsUpload(combinedEncryptedBytes, frontImageName + "_encrypted.zip");
            
            // 2. Generate the ZK Commitment (Numeric Hash of the CID)
            String cidHash = generateZkFriendlyCidHash(ipfsCid);
            
            String encryptedDocumentKey = encryptDocumentKeyWithDidPrivateKey(documentAesKey, user.getDidPrivateKey());
            
            Files.deleteIfExists(frontPath);
            Files.deleteIfExists(backPath);

            // 3. Build the Document entity, storing both the raw CID and the Hash
            Document document = Document.builder()
                .userId(userId)
                .documentName(frontImageName)
                .selfieName("live_capture.jpg")
                .ocrData(combinedOcr)
                .faceMatchConfidence(confidence)
                .status(VerificationStatus.PENDING)
                .ipfsCid(ipfsCid) 
                .vcHash(cidHash) // Using vcHash field for the ZKP commitment
                .encryptedDocumentKey(encryptedDocumentKey)
                .build();

            return documentRepository.save(document);

        } catch (Exception e) {
            Files.deleteIfExists(frontPath);
            Files.deleteIfExists(backPath);
            throw new RuntimeException("Processing failed: " + e.getMessage(), e);
        }
    }

    private String extractTextFromDocument(Path docPath, String imageSide) throws IOException {
        byte[] fileBytes = Files.readAllBytes(docPath);
        return webClientBuilder.build()
                .post()
                .uri("http://192.168.38.137:5000/ocr")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData("file", new ByteArrayResource(fileBytes) {
                    @Override public String getFilename() { return imageSide + ".jpg"; }
                }))
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    private JsonNode triggerLivenessAndFaceMatch(Path docPath) throws IOException {
        byte[] fileBytes = Files.readAllBytes(docPath);
        String response = webClientBuilder.build()
                .post()
                .uri("http://localhost:5002/liveness-check")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData("document", new ByteArrayResource(fileBytes) {
                    @Override public String getFilename() { return docPath.getFileName().toString(); }
                }))
                .retrieve()
                .bodyToMono(String.class)
                .block();
        return new ObjectMapper().readTree(response);
    }
}