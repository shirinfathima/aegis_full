package com.trustnet.backend.service;

import com.trustnet.backend.blockchain.DocumentAnchor;
import com.trustnet.backend.blockchain.Groth16Verifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.gas.ContractGasProvider;
import org.web3j.tuples.generated.Tuple2;
import org.web3j.protocol.core.methods.request.Transaction;

import java.io.IOException;
import java.math.BigInteger;
import java.util.List;

@Service
public class BlockchainService {

    // Existing DocumentAnchor contract
    private static final String DOCUMENT_CONTRACT_ADDRESS =
            "0xEE6bCE5BA477fCAe5699FE89b6fa8f75A94148eB";

    private final Web3j web3j;
    private final Credentials credentials;
    private final DocumentAnchor deployedContract;
    private final Groth16Verifier zkVerifier;

    public BlockchainService(
            @Autowired Web3j web3j,
            @Value("${amoy.private.key:${AMOY_PRIVATE_KEY:}}") String privateKey,
            @Value("${blockchain.chain-id:80002}") long chainId,
            @Value("${blockchain.verifier.contract.address}") String verifierAddress
    ) throws Exception {

        this.web3j = web3j;

        if (privateKey == null || privateKey.isEmpty() || privateKey.length() < 64) {
            throw new Exception("AMOY_PRIVATE_KEY property value is missing or invalid.");
        }

        String cleanedKey = privateKey.startsWith("0x")
                ? privateKey.substring(2)
                : privateKey;

        this.credentials = Credentials.create(cleanedKey);

        RawTransactionManager txManager =
                new RawTransactionManager(web3j, credentials, chainId);

        // Gas Provider
        ContractGasProvider dynamicGasProvider = new ContractGasProvider() {

            public BigInteger getGasPrice(String contractFunc) {
                return getDynamicGasPrice();
            }

            public BigInteger getGasPrice() {
                return getDynamicGasPrice();
            }

            public BigInteger getGasLimit(String contractFunc) {
                return new BigInteger("500000");
            }

            public BigInteger getGasLimit() {
                return new BigInteger("500000");
            }

            public BigInteger getGasLimit(Transaction transaction) {
                return new BigInteger("500000");
            }

            private BigInteger getDynamicGasPrice() {
                try {
                    BigInteger networkGasPrice =
                            web3j.ethGasPrice().send().getGasPrice();

                    BigInteger minGasPrice =
                            new BigInteger("30000000000");

                    return networkGasPrice.compareTo(minGasPrice) < 0
                            ? minGasPrice
                            : networkGasPrice;

                } catch (IOException e) {
                    return new BigInteger("35000000000");
                }
            }
        };

        // Load DocumentAnchor contract
        this.deployedContract = DocumentAnchor.load(
                DOCUMENT_CONTRACT_ADDRESS,
                web3j,
                txManager,
                dynamicGasProvider
        );

        // 🔥 Load ZK Verifier Contract
        this.zkVerifier = Groth16Verifier.load(
                verifierAddress,
                web3j,
                txManager,
                dynamicGasProvider
        );
    }

    // ==========================
    // EXISTING CID FUNCTIONS
    // ==========================

    public TransactionReceipt anchorDocumentCID(Long userId, String cidHash)
            throws Exception {

        BigInteger solUserId = BigInteger.valueOf(userId);
        BigInteger numericHash = new BigInteger(cidHash);

        return deployedContract
                .storeDocumentCID(solUserId, numericHash)
                .send();
    }

    public String getAnchoredCID(Long userId) throws Exception {

        BigInteger solUserId = BigInteger.valueOf(userId);

        Tuple2<BigInteger, BigInteger> result =
                deployedContract.getDocumentCID(solUserId).send();

        BigInteger cid = result.component1();
        BigInteger timestamp = result.component2();

        return "CID: " + cid.toString()
                + " | Anchored at: " + timestamp.toString();
    }

    public BigInteger getRawAnchoredCID(Long userId) throws Exception {

        BigInteger solUserId = BigInteger.valueOf(userId);

        Tuple2<BigInteger, BigInteger> result =
                deployedContract.getDocumentCID(solUserId).send();

        return result.component1();
    }

    // ==========================
    // 🔐 NEW ZK VERIFICATION METHOD
    // ==========================

    public boolean verifyZkProof(
            List<BigInteger> pA,
            List<List<BigInteger>> pB,
            List<BigInteger> pC,
            List<BigInteger> pubSignals
    ) throws Exception {

        System.out.println("Calling verifier contract...");
        System.out.println("Verifier Address: " + zkVerifier.getContractAddress());
        System.out.println("Public Signals sent to contract: " + pubSignals);
            
        boolean result = zkVerifier
            .verifyProof(pA, pB, pC, pubSignals)
            .send();

        System.out.println("On-chain verification result: " + result);

        return result;

    }
}
