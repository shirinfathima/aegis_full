package com.trustnet.backend.service;

import com.trustnet.backend.blockchain.DocumentAnchor;
import org.springframework.beans.factory.annotation.Value;
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

    public BlockchainService(
        @Autowired Web3j web3j,
        @Value("${amoy.private.key:${AMOY_PRIVATE_KEY:}}") String privateKey
    ) throws Exception {
        this.web3j = web3j;
        
        if (privateKey == null || privateKey.isEmpty() || privateKey.length() < 64) {
            throw new Exception("AMOY_PRIVATE_KEY property value is missing or invalid. Check the -Damoy.private.key argument.");
        }
        
        String cleanedKey = privateKey.startsWith("0x") ? privateKey.substring(2) : privateKey;
        this.credentials = Credentials.create(cleanedKey);
        
        // Load the contract using the regenerated wrapper
        this.deployedContract = DocumentAnchor.load(
            CONTRACT_ADDRESS, 
            web3j, 
            credentials, 
            new DefaultGasProvider() 
        );
    }
    
    /**
     * Anchors a document's IPFS CID Hash to a user ID on the blockchain (Transaction).
     * Now accepts a numeric hash string and converts it to BigInteger for ZKP compatibility.
     */
    public TransactionReceipt anchorDocumentCID(Long userId, String cidHash) throws Exception {
        BigInteger solUserId = BigInteger.valueOf(userId);
        
        // Convert the Poseidon hash string from the database back to a BigInteger for the smart contract
        BigInteger numericHash = new BigInteger(cidHash);
        
        // The storeDocumentCID method now requires a BigInteger in the regenerated wrapper
        return deployedContract.storeDocumentCID(solUserId, numericHash).send();
    }

    /**
     * Retrieves the latest anchored IPFS CID Hash for a user (View Call).
     * Returns the numeric hash as a string for use in the backend/frontend.
     */
    public String getAnchoredCID(Long userId) throws Exception {
        BigInteger solUserId = BigInteger.valueOf(userId);
        
        // The contract call now returns a BigInteger (uint256)
        BigInteger result = deployedContract.getDocumentCID(solUserId).send();
        
        return result.toString();
    }
}