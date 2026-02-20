package com.trustnet.backend.DTO;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ZkProofPayloadDTO {

    private Boolean isAdult;
    private Presentation presentation;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Presentation {
        private Proof proof;
        private Long documentId;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Proof {
        private ProofValue proofValue;
        private List<String> publicSignals;
        private Boolean verifiedOnChain;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ProofValue {

        // Maps the "pi_a" from JSON to the "a" list in Java
        @JsonProperty("pi_a")
        private List<String> a;

        // Maps the "pi_b" from JSON to the "b" nested list in Java
        @JsonProperty("pi_b")
        private List<List<String>> b;

        // Maps the "pi_c" from JSON to the "c" list in Java
        @JsonProperty("pi_c")
        private List<String> c;
    }
}