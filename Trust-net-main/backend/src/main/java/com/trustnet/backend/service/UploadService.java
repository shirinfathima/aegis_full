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

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.math.BigInteger;
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
    @Value("${pinata.dedicated-gateway}")
    private String dedicatedGateway;

    // --- 1. DOWNLOAD FROM DEDICATED GATEWAY (Fixes Timeouts) ---
    public byte[] downloadFromIpfs(String cid) {
        try {
            return webClientBuilder.build()
                .get()
                .uri(dedicatedGateway + cid)
                .retrieve()
                .bodyToMono(byte[].class)
                .block();
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch from IPFS: " + e.getMessage());
        }
    }

    // --- 2. DECRYPT DOCUMENT ---
    public byte[] decryptDocument(byte[] encryptedData, String encryptedKeyBase64) throws Exception {
        byte[] decodedKey = Base64.getDecoder().decode(encryptedKeyBase64);
        SecretKey originalKey = new SecretKeySpec(decodedKey, 0, decodedKey.length, AES_ALGORITHM);
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, originalKey);
        return cipher.doFinal(encryptedData);
    }

    // --- 3. UPLOAD & PROCESS LOGIC ---
    public Document processIdCard(MultipartFile frontImage, MultipartFile backImage, MultipartFile selfieImage, Long userId) throws Exception {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) throw new Exception("User not found: " + userId);
        User user = userOptional.get();

        byte[] frontImageBytes = frontImage.getBytes();
        byte[] backImageBytes = backImage.getBytes();
        byte[] selfieImageBytes = selfieImage.getBytes();
        
        String frontImageName = Path.of(frontImage.getOriginalFilename()).getFileName().toString();
        Path frontPath = Paths.get("uploads/docs/" + frontImageName);
        Files.createDirectories(frontPath.getParent());
        Files.write(frontPath, frontImageBytes, StandardOpenOption.CREATE);

        String backImageName = Path.of(backImage.getOriginalFilename()).getFileName().toString();
        Path backPath = Paths.get("uploads/docs/" + backImageName);
        Files.write(backPath, backImageBytes, StandardOpenOption.CREATE);
        
        String selfieName = "selfie_" + userId + "_" + System.currentTimeMillis() + ".jpg";
        Path selfiePath = Paths.get("uploads/selfies/" + selfieName);
        Files.createDirectories(selfiePath.getParent());
        Files.write(selfiePath, selfieImageBytes, StandardOpenOption.CREATE);
        
        try {
            JsonNode result = triggerLivenessAndFaceMatch(frontPath, selfiePath);
            double confidence = result.path("verification").path("confidence").asDouble(0.0);

            String ocrFront = extractTextFromDocument(frontPath, "front");
            String ocrBack = extractTextFromDocument(backPath, "back");
            String combinedOcr = "{\"front\":" + ocrFront + ", \"back\":" + ocrBack + "}";
            
            SecretKey documentAesKey = generateAesKey();
            byte[] encryptedFrontBytes = encryptBytes(frontImageBytes, documentAesKey);
            byte[] encryptedBackBytes = encryptBytes(backImageBytes, documentAesKey);

            byte[] combinedEncryptedBytes = new byte[encryptedFrontBytes.length + encryptedBackBytes.length];
            System.arraycopy(encryptedFrontBytes, 0, combinedEncryptedBytes, 0, encryptedFrontBytes.length);
            System.arraycopy(encryptedBackBytes, 0, combinedEncryptedBytes, encryptedFrontBytes.length, encryptedBackBytes.length);

            String ipfsCid = ipfsUpload(combinedEncryptedBytes, frontImageName + "_encrypted.zip");
            String cidHash = generateZkFriendlyCidHash(ipfsCid);
            String encryptedDocumentKey = encryptDocumentKeyWithDidPrivateKey(documentAesKey, user.getDidPrivateKey());
            
            Document document = Document.builder()
                .userId(userId)
                .documentName(frontImageName)
                .selfieName(selfieName)
                .ocrData(combinedOcr)
                .faceMatchConfidence(confidence)
                .status(VerificationStatus.PENDING)
                .ipfsCid(ipfsCid) 
                .vcHash(cidHash)
                .encryptedDocumentKey(encryptedDocumentKey)
                .tempDocData(frontImageBytes)      
                .tempDocBackData(backImageBytes)   
                .tempSelfieData(selfieImageBytes)  
                .build();

            return documentRepository.save(document);

        } catch (Exception e) {
            throw new RuntimeException("Processing failed: " + e.getMessage(), e);
        } finally {
            cleanupFiles(frontPath, backPath, selfiePath);
        }
    }
    
    // --- HELPER METHODS ---
    private String generateZkFriendlyCidHash(String ipfsCid) {
        BigInteger hash = ZkHashUtils.hashIpfsCid(ipfsCid);
        return hash.toString();
    }

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
        return root.path("IpfsHash").asText();
    }

    private void cleanupFiles(Path... paths) {
        System.gc(); 
        for (Path path : paths) {
            try {
                if (path != null) Files.deleteIfExists(path);
            } catch (IOException e) {
                path.toFile().deleteOnExit();
            }
        }
    }

    private String extractTextFromDocument(Path docPath, String imageSide) throws IOException {
        byte[] fileBytes = Files.readAllBytes(docPath);
        return webClientBuilder.build()
                .post()
                .uri("http://localhost:5000/ocr")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData("file", new ByteArrayResource(fileBytes) {
                    @Override public String getFilename() { return imageSide + ".jpg"; }
                }))
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    private JsonNode triggerLivenessAndFaceMatch(Path docPath, Path selfiePath) throws IOException {
        byte[] docBytes = Files.readAllBytes(docPath);
        byte[] selfieBytes = Files.readAllBytes(selfiePath);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("frontImage", new ByteArrayResource(docBytes) {
            @Override public String getFilename() { return docPath.getFileName().toString(); }
        });
        body.add("selfieImage", new ByteArrayResource(selfieBytes) {
            @Override public String getFilename() { return selfiePath.getFileName().toString(); }
        });

        String response = webClientBuilder.build()
                .post()
                .uri("http://localhost:5002/liveness-check")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(body))
                .retrieve()
                .bodyToMono(String.class)
                .block();
        return new ObjectMapper().readTree(response);
    }
}