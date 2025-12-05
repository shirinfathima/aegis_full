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
import org.springframework.web.reactive.function.client.WebClientRequestException;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;

@Service
public class UploadService {

    private static final String AES_ALGORITHM = "AES";
    private static final int AES_KEY_SIZE = 256;
    
    // UPDATED: Pinata API Endpoint
    private static final String IPFS_UPLOAD_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"; 

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository; 

    // NEW: Inject Pinata API Keys
    @Value("${pinata.api-key}")
    private String pinataApiKey;
    @Value("${pinata.secret-api-key}")
    private String pinataSecretApiKey;

    // --- Cryptographic Utility Methods (Unchanged) ---

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
        // PoC: Simulating asymmetric encryption by base64 encoding the key
        return Base64.getEncoder().encodeToString(documentKey.getEncoded());
    }

    // --- IPFS Archival: Real Pinata Implementation ---

    /**
     * Uploads encrypted bytes to the Pinata API using multipart/form-data.
     * @return The resulting IPFS CID.
     */
    private String ipfsUpload(byte[] encryptedBytes, String fileName) throws Exception {
        // 1. Prepare the file content as a resource
        ByteArrayResource resource = new ByteArrayResource(encryptedBytes) {
            @Override
            public String getFilename() {
                return fileName; 
            }
        };
        
        // 2. Prepare the multipart body
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", resource);

        // 3. Use WebClient to upload the file to Pinata
        String responseBody = webClientBuilder.build()
            .post()
            .uri(IPFS_UPLOAD_URL)
            // Pinata Authentication: API Key and Secret are sent in the headers
            .header("pinata_api_key", pinataApiKey) 
            .header("pinata_secret_api_key", pinataSecretApiKey)
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(body))
            .retrieve()
            .bodyToMono(String.class)
            .block();
        
        // 4. Parse the JSON response, which should contain {"IpfsHash":"..."}
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(responseBody);
        String cid = root.path("IpfsHash").asText();
        
        if (cid.isEmpty()) {
             throw new Exception("IPFS Upload failed: CID not found in Pinata response: " + responseBody);
        }

        System.out.println("✅ IPFS Upload Successful (Pinata). CID: " + cid);
        return cid;
    }

    // --- Main Logic Update ---

    public Document processIdCard(MultipartFile frontImage, MultipartFile backImage, Long userId) throws Exception {
        
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            throw new Exception("User not found for ID: " + userId);
        }
        User user = userOptional.get();

        // 1. Read raw bytes and perform temporary local save for AI processing
        byte[] frontImageBytes = frontImage.getBytes();
        byte[] backImageBytes = backImage.getBytes();
        
        // Temporary Local Save for AI processing (MUST be cleaned up)
        String frontImageName = Path.of(frontImage.getOriginalFilename()).getFileName().toString();
        Path frontPath = Paths.get("uploads/docs/" + frontImageName);
        Files.createDirectories(frontPath.getParent());
        Files.write(frontPath, frontImageBytes, StandardOpenOption.CREATE);

        String backImageName = Path.of(backImage.getOriginalFilename()).getFileName().toString();
        Path backPath = Paths.get("uploads/docs/" + backImageName);
        Files.write(backPath, backImageBytes, StandardOpenOption.CREATE);
        
        try {
            // 2. Trigger Liveness Check and Face Match FIRST
            JsonNode faceMatchResult = triggerLivenessAndFaceMatch(frontPath);
            double confidence = faceMatchResult.path("confidence").asDouble(0.0);

            // 3. Perform OCR on both sides and merge results
            String ocrFront = extractTextFromDocument(frontPath, "front");
            String ocrBack = extractTextFromDocument(backPath, "back");
            String combinedOcr = "{\"front\":" + ocrFront + ", \"back\":" + ocrBack + "}";
            
            // --- IPFS ARCHIVAL AND ENCRYPTION ---
            
            // 4. Generate document-specific AES key
            SecretKey documentAesKey = generateAesKey();
            
            // 5. Encrypt both image files with the AES key
            byte[] encryptedFrontBytes = encryptBytes(frontImageBytes, documentAesKey);
            byte[] encryptedBackBytes = encryptBytes(backImageBytes, documentAesKey);

            // 6. Combine encrypted files (simple concatenation for PoC)
            byte[] combinedEncryptedBytes = new byte[encryptedFrontBytes.length + encryptedBackBytes.length];
            System.arraycopy(encryptedFrontBytes, 0, combinedEncryptedBytes, 0, encryptedFrontBytes.length);
            System.arraycopy(encryptedBackBytes, 0, combinedEncryptedBytes, encryptedFrontBytes.length, encryptedBackBytes.length);

            // 7. Upload encrypted bytes to IPFS (REAL PINATA API CALL)
            String ipfsCid = ipfsUpload(combinedEncryptedBytes, frontImageName + "_and_" + backImageName + "_encrypted.zip");
            
            // 8. Encrypt the document key with the user's DID private key (Master Key)
            String encryptedDocumentKey = encryptDocumentKeyWithDidPrivateKey(documentAesKey, user.getDidPrivateKey());
            
            // 9. Cleanup temporary local files
            Files.deleteIfExists(frontPath);
            Files.deleteIfExists(backPath);
            // --- END IPFS ARCHIVAL ---

            // 10. Create and save the Document entity to the database
            Document document = Document.builder()
                .userId(userId)
                .documentName(frontImageName)
                .selfieName("live_capture.jpg")
                .ocrData(combinedOcr)
                .faceMatchConfidence(confidence)
                .status(VerificationStatus.PENDING)
                .ipfsCid(ipfsCid) // Store the IPFS CID of the encrypted archive
                .encryptedDocumentKey(encryptedDocumentKey) // Store the encrypted key
                .build();

            return documentRepository.save(document);

        } catch (IOException | WebClientRequestException e) {
            Files.deleteIfExists(frontPath);
            Files.deleteIfExists(backPath);
            e.printStackTrace();
            return null;
        } catch (Exception e) {
            Files.deleteIfExists(frontPath);
            Files.deleteIfExists(backPath);
            e.printStackTrace();
            throw new RuntimeException("Document processing failed: " + e.getMessage(), e);
        }
    }

    private String extractTextFromDocument(Path docPath, String imageSide) throws IOException {
        byte[] fileBytes = Files.readAllBytes(docPath);
        // Calls your OCR service (ensure it's running on port 5000)
        return webClientBuilder.build()
                .post()
                .uri("http://192.168.38.137:5000/ocr")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData("file", new ByteArrayResource(fileBytes) {
                    @Override
                    public String getFilename() {
                        return imageSide + ".jpg";
                    }
                }))
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    private JsonNode triggerLivenessAndFaceMatch(Path docPath) throws IOException {
        byte[] fileBytes = Files.readAllBytes(docPath);
        // Calls your Liveness Check service (ensure it's running on port 5002)
        String response = webClientBuilder.build()
                .post()
                .uri("http://localhost:5002/liveness-check")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData("document", new ByteArrayResource(fileBytes) {
                    @Override
                    public String getFilename() {
                        return docPath.getFileName().toString();
                    }
                }))
                .retrieve()
                .bodyToMono(String.class)
                .block();
        
        return new ObjectMapper().readTree(response);
    }
}