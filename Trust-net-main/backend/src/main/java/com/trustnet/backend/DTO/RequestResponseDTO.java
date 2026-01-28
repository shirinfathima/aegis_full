package com.trustnet.backend.DTO;

import lombok.Data;

@Data
public class RequestResponseDTO {
    private Long requestId;
    private String status; // "APPROVED" or "REJECTED"
    private Long durationInMinutes; // e.g., 60
    private String generatedProof;
}