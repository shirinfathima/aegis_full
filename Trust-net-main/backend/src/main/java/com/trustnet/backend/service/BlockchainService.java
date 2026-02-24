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
import org.web3j.tx.ReadonlyTransactionManager;
import org.web3j.tx.gas.ContractGasProvider;
import org.web3j.tuples.generated.Tuple2;

import java.io.IOException;
import java.math.BigInteger;
import java.util.List;

@Service
public class BlockchainService {

    private static final String DOCUMENT_CONTRACT_ADDRESS =
            "0xEE6bCE5BA477fCAe5699FE89b6fa8f75A94148eB";

    private static final BigInteger DEFAULT_GAS_LIMIT =
            new BigInteger("500000");

    private static final BigInteger MIN_GAS_PRICE =
            new BigInteger("30000000000"); // 30 Gwei minimum

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
            throw new Exception("AMOY_PRIVATE_KEY missing or invalid.");
        }

        String cleanedKey = privateKey.startsWith("0x")
                ? privateKey.substring(2)
                : privateKey;

        this.credentials = Credentials.create(cleanedKey);

        RawTransactionManager txManager =
                new RawTransactionManager(web3j, credentials, chainId);

        ContractGasProvider dynamicGasProvider = new ContractGasProvider() {

            @Override
            public BigInteger getGasPrice() {
                try {
                    BigInteger networkGasPrice =
                            web3j.ethGasPrice().send().getGasPrice();

                    return networkGasPrice.compareTo(MIN_GAS_PRICE) < 0
                            ? MIN_GAS_PRICE
                            : networkGasPrice;

                } catch (IOException e) {
                    return new BigInteger("35000000000"); // fallback
                }
            }

            @Override
            public BigInteger getGasLimit() {
                return DEFAULT_GAS_LIMIT;
            }

            @Override
            public BigInteger getGasLimit(org.web3j.protocol.core.methods.request.Transaction transaction) {
                return DEFAULT_GAS_LIMIT;
            }
        };

        // 🔗 Load Anchor Contract (State-changing)
        this.deployedContract = DocumentAnchor.load(
                DOCUMENT_CONTRACT_ADDRESS,
                web3j,
                txManager,
                dynamicGasProvider
        );

        // 🔐 Load Verifier Contract (Read-only)
        ReadonlyTransactionManager readOnlyTxManager =
                new ReadonlyTransactionManager(web3j, credentials.getAddress());

        this.zkVerifier = Groth16Verifier.load(
                verifierAddress,
                web3j,
                readOnlyTxManager,
                dynamicGasProvider
        );
    }

    // ===================================================
    // 📌 DOCUMENT ANCHORING
    // ===================================================

    public TransactionReceipt anchorDocumentCID(
            Long userId,
            String cidHash
    ) throws Exception {

        if (userId == null || cidHash == null) {
            throw new IllegalArgumentException("Invalid anchor inputs.");
        }

        BigInteger solUserId = BigInteger.valueOf(userId);
        BigInteger numericHash = new BigInteger(cidHash);

        return deployedContract
                .storeDocumentCID(solUserId, numericHash)
                .send();
    }

    public BigInteger getRawAnchoredCID(Long userId)
            throws Exception {

        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null.");
        }

        BigInteger solUserId = BigInteger.valueOf(userId);

        Tuple2<BigInteger, BigInteger> result =
                deployedContract.getDocumentCID(solUserId).send();

        return result.component1();
    }

    // ===================================================
    // 🔐 GROTH16 ZKP VERIFICATION (On-chain View Call)
    // ===================================================

    public boolean verifyZkProof(
            List<BigInteger> pA,
            List<List<BigInteger>> pB,
            List<BigInteger> pC,
            List<BigInteger> pubSignals
    ) throws Exception {

        if (pA == null || pB == null || pC == null || pubSignals == null) {
            throw new IllegalArgumentException("Proof inputs cannot be null.");
        }

        if (pA.size() != 2 || pB.size() != 2 || pC.size() != 2) {
            throw new IllegalArgumentException("Invalid Groth16 proof structure.");
        }

        System.out.println("🔐 Calling Verifier Contract...");
        System.out.println("🔐 Verifier Address : " + zkVerifier.getContractAddress());
        System.out.println("🔐 pA               : " + pA);
        System.out.println("🔐 pB               : " + pB);
        System.out.println("🔐 pC               : " + pC);
        System.out.println("🔐 pubSignals        : " + pubSignals);

        try {
            Boolean result = zkVerifier
                    .verifyProof(pA, pB, pC, pubSignals)
                    .send();

            System.out.println("✅ On-chain verification result: " + result);
            return result != null && result;

        } catch (Exception e) {
            System.out.println("💥 Verifier contract call FAILED");
            System.out.println("💥 Exception type   : " + e.getClass().getName());
            System.out.println("💥 Exception message: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}