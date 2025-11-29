package com.trustnet.backend.service;

import com.trustnet.backend.blockchain.DocumentAnchor;
import org.springframework.beans.factory.annotation.Value; // Import for property injection
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigInteger;

@Service
public class BlockchainService {
    
    // 🔑 Deployed Contract Address (Checksummed EIP-55 format)
    private static final String CONTRACT_ADDRESS = "0xbEb7f5b17D22FaB7FA704934d4190aeb938FE2AC"; 

    private final Web3j web3j;
    private final Credentials credentials;
    private final DocumentAnchor deployedContract;

    // FIX: Inject privateKey using a fallback to the AMOY_PRIVATE_KEY environment variable.
    public BlockchainService(
        @Autowired Web3j web3j,
        // The property value now checks 1. amoy.private.key system prop, 
        // then 2. AMOY_PRIVATE_KEY environment variable, then 3. empty string.
        @Value("${amoy.private.key:${AMOY_PRIVATE_KEY:}}") String privateKey
    ) throws Exception {
        this.web3j = web3j;
        
        // 1. Safely Check and Clean the Injected Key
        // The exception now ensures the key value was successfully loaded
        if (privateKey == null || privateKey.isEmpty() || privateKey.length() < 64) {
            throw new Exception("AMOY_PRIVATE_KEY property value is missing or invalid. Check the -Damoy.private.key argument.");
        }
        
        // Remove optional "0x" prefix and load credentials
        String cleanedKey = privateKey.startsWith("0x") ? privateKey.substring(2) : privateKey;
        this.credentials = Credentials.create(cleanedKey);
        
        // 2. Load the contract using the generated wrapper
        this.deployedContract = DocumentAnchor.load(
            CONTRACT_ADDRESS, 
            web3j, 
            credentials, 
            new DefaultGasProvider() 
        );
    }
    
    /**
     * Anchors a document's IPFS CID to a user ID on the blockchain (Transaction).
     */
    public TransactionReceipt anchorDocumentCID(Long userId, String ipfsCid) throws Exception {
        BigInteger solUserId = BigInteger.valueOf(userId);
        return deployedContract.storeDocumentCID(solUserId, ipfsCid).send();
    }

    /**
     * Retrieves the latest anchored IPFS CID for a user (View Call).
     */
    public String getAnchoredCID(Long userId) throws Exception {
        BigInteger solUserId = BigInteger.valueOf(userId);
        return deployedContract.getDocumentCID(solUserId).send();
    }
}