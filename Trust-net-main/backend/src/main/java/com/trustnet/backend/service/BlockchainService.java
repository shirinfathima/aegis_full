package com.trustnet.backend.service;

import com.trustnet.backend.blockchain.DocumentAnchor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.gas.ContractGasProvider; // Use the Interface
import org.web3j.tuples.generated.Tuple2;
import org.web3j.protocol.core.methods.request.Transaction; 

import java.io.IOException;
import java.math.BigInteger;

@Service
public class BlockchainService {
    
    // 🔑 IMPORTANT: Ensure this matches your latest Remix deployment
    private static final String CONTRACT_ADDRESS = "0xEE6bCE5BA477fCAe5699FE89b6fa8f75A94148eB"; 

    private final Web3j web3j;
    private final Credentials credentials;
    private final DocumentAnchor deployedContract;

    public BlockchainService(
        @Autowired Web3j web3j,
        @Value("${amoy.private.key:${AMOY_PRIVATE_KEY:}}") String privateKey,
        @Value("${blockchain.chain-id:80002}") long chainId
    ) throws Exception {
        this.web3j = web3j;
        
        if (privateKey == null || privateKey.isEmpty() || privateKey.length() < 64) {
            throw new Exception("AMOY_PRIVATE_KEY property value is missing or invalid.");
        }
        
        String cleanedKey = privateKey.startsWith("0x") ? privateKey.substring(2) : privateKey;
        this.credentials = Credentials.create(cleanedKey);
        
        RawTransactionManager txManager = new RawTransactionManager(web3j, credentials, chainId);
        
        // 🛠️ FIX: Direct Interface Implementation with NO @Override annotations
        // This avoids "method does not override" errors while satisfying "missing method" errors.
        ContractGasProvider dynamicGasProvider = new ContractGasProvider() {
            
            // Method 1: Gas Price with function name
            public BigInteger getGasPrice(String contractFunc) {
                return getDynamicGasPrice();
            }

            // Method 2: Gas Price without arguments
            public BigInteger getGasPrice() {
                return getDynamicGasPrice();
            }

            // Method 3: Gas Limit with function name
            public BigInteger getGasLimit(String contractFunc) {
                return new BigInteger("400000"); // Safe limit
            }

            // Method 4: Gas Limit without arguments
            public BigInteger getGasLimit() {
                return new BigInteger("400000"); // Safe limit
            }
            
            // Method 5: Gas Limit with Transaction object (Required by Web3j 5.0+)
            public BigInteger getGasLimit(Transaction transaction) {
                return new BigInteger("400000"); // Safe limit
            }
            
            // Helper logic for Amoy Network
            private BigInteger getDynamicGasPrice() {
                try {
                    BigInteger networkGasPrice = web3j.ethGasPrice().send().getGasPrice();
                    BigInteger minGasPrice = new BigInteger("30000000000"); // 30 Gwei
                    return networkGasPrice.compareTo(minGasPrice) < 0 ? minGasPrice : networkGasPrice;
                } catch (IOException e) {
                    return new BigInteger("35000000000"); // Fallback
                }
            }
        };

        this.deployedContract = DocumentAnchor.load(
            CONTRACT_ADDRESS, 
            web3j, 
            txManager, 
            dynamicGasProvider 
        );
    }
    
    public TransactionReceipt anchorDocumentCID(Long userId, String cidHash) throws Exception {
        BigInteger solUserId = BigInteger.valueOf(userId);
        BigInteger numericHash = new BigInteger(cidHash);
        return deployedContract.storeDocumentCID(solUserId, numericHash).send();
    }

    public String getAnchoredCID(Long userId) throws Exception {
        BigInteger solUserId = BigInteger.valueOf(userId);
        Tuple2<BigInteger, BigInteger> result = deployedContract.getDocumentCID(solUserId).send();
        BigInteger cid = result.component1();
        BigInteger timestamp = result.component2();
        return "CID: " + cid.toString() + " | Anchored at: " + timestamp.toString();
    }
}