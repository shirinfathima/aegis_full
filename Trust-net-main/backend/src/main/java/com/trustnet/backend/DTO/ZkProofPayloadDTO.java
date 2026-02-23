package com.trustnet.backend.DTO;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Data Transfer Object representing the W3C Verifiable Presentation (VP)
 * containing the Zero-Knowledge Proof for Enrollment Verification.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ZkProofPayloadDTO {

    // =========================
    // W3C Standard Fields
    // =========================

    @JsonProperty("@context")
    private List<String> context;

    private List<String> type;

    // =========================
    // Core Payload Fields
    // =========================

    private Long documentId;
    private String holder;
    private Proof proof;

    // =========================
    // Nested Proof Structure
    // =========================

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Proof {

        private String type;
        private String created;
        private ProofValue proofValue;
        private List<String> publicSignals;
        private DisclosedAttributes disclosedAttributes;
    }

    // =========================
    // Groth16 Proof Values
    // =========================

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ProofValue {

        @JsonProperty("pi_a")
        private List<String> a;

        @JsonProperty("pi_b")
        private List<List<String>> b;

        @JsonProperty("pi_c")
        private List<String> c;
    }

    // =========================
    // Selective Disclosure Attributes
    // =========================

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DisclosedAttributes {

        @JsonProperty("is_active_enrollment")
        private Boolean isActiveEnrollment;
    }
}