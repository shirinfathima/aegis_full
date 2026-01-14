package com.trustnet.backend.service;

import org.bitcoinj.core.Base58; // Fixed Import
import java.math.BigInteger;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

public class ZkHashUtils {

    // A large prime used in ZK fields (BN128 / Alt_BN128 curve order)
    // This ensures your hash fits within the field for ZK proofs.
    private static final BigInteger BN128_GROUP_ORDER = new BigInteger("21888242871839275222246405745257275088548364400416034343698204186575808495617");

    /**
     * Hashes an IPFS CID to a ZK-friendly Field Element (BigInteger).
     * * NOTE: For production ZK circuits (Circom), you would ideally use a pure Poseidon implementation.
     * For this implementation, we decode the CID and map it into the Finite Field.
     */
    public static BigInteger hashIpfsCid(String ipfsCid) {
        try {
            // 1. Decode IPFS CID (Base58)
            byte[] decoded = Base58.decode(ipfsCid);
            
            // 2. Since we don't have a local Poseidon library, we use SHA-256 mapped to the field.
            // This is cryptographically secure and "anchors" the data, though strictly speaking
            // it's more expensive to prove in a ZK circuit than Poseidon. 
            // It is sufficient for the backend logic and compilation.
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(decoded);
            
            // 3. Convert to BigInteger and modulo the Group Order to fit in the field
            BigInteger numericHash = new BigInteger(1, hashBytes);
            return numericHash.mod(BN128_GROUP_ORDER);
            
        } catch (Exception e) {
            throw new RuntimeException("Error hashing CID: " + e.getMessage(), e);
        }
    }
}