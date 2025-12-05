package com.trustnet.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustnet.backend.entity.Document;
import com.trustnet.backend.model.VerificationStatus;
import com.trustnet.backend.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;

import java.io.IOException;
import java.nio.file.*;

@Service
public class UploadService {

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Autowired
    private DocumentRepository documentRepository;

    public Document processIdCard(MultipartFile frontImage, MultipartFile backImage, Long userId) {
        try {
            // Save both files locally
            String frontImageName = Path.of(frontImage.getOriginalFilename()).getFileName().toString();
            Path frontPath = Paths.get("uploads/docs/" + frontImageName);
            Files.createDirectories(frontPath.getParent());
            Files.write(frontPath, frontImage.getBytes(), StandardOpenOption.CREATE);

            String backImageName = Path.of(backImage.getOriginalFilename()).getFileName().toString();
            Path backPath = Paths.get("uploads/docs/" + backImageName);
            Files.write(backPath, backImage.getBytes(), StandardOpenOption.CREATE);

            // --- AI WORKFLOW (NEW ORDER) ---

            // 1. Trigger Liveness Check and Face Match FIRST
            // We pass the front image because it contains the user's photo
            JsonNode faceMatchResult = triggerLivenessAndFaceMatch(frontPath);
            double confidence = faceMatchResult.path("confidence").asDouble(0.0);
            boolean isMatch = faceMatchResult.path("match").asBoolean(false);

            // If faces don't match, you might want to stop the process early
            if (!isMatch) {
                 // For now, we will still save the document but you could throw an exception
                 System.out.println("Face match failed with confidence: " + confidence);
            }

            // 2. Perform OCR on both sides and merge results
            String ocrFront = extractTextFromDocument(frontPath, "front");
            String ocrBack = extractTextFromDocument(backPath, "back");
            String combinedOcr = "{\"front\":" + ocrFront + ", \"back\":" + ocrBack + "}";
            
            // 3. Create and save the Document entity to the database
            Document document = Document.builder()
                .userId(userId)
                .documentName(frontImageName)
                .selfieName("live_capture.jpg") // The selfie is captured live
                .ocrData(combinedOcr)
                .faceMatchConfidence(confidence)
                .status(VerificationStatus.PENDING)
                .build();

            return documentRepository.save(document);

        } catch (IOException | WebClientRequestException e) { // Catch web client exceptions too
            e.printStackTrace();
            // You can add more specific error handling here
            return null;
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