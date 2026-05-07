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

    // ===================================================
    // 🔗 CONTRACT ADDRESSES (Amoy)
    // ===================================================

    private static final String DOCUMENT_CONTRACT_ADDRESS =
            "0xEE6bCE5BA477fCAe5699FE89b6fa8f75A94148eB";

    private static final String VERIFIER_CONTRACT_ADDRESS =
            "0x542ecf0fB59184beA71483CCB36517fc7c95323d";

    private static final BigInteger DEFAULT_GAS_LIMIT =
            new BigInteger("2000000");

    private static final BigInteger MIN_GAS_PRICE =
            new BigInteger("30000000000");

    private final Web3j web3j;
    private final Credentials credentials;
    private final DocumentAnchor deployedContract;
    private final Groth16Verifier zkVerifier;

    public BlockchainService(
            @Autowired Web3j web3j,
            @Value("${amoy.private.key:${AMOY_PRIVATE_KEY:}}") String privateKey,
            @Value("${blockchain.chain-id:80002}") long chainId
    ) throws Exception {

        this.web3j = web3j;

        System.out.println("🔗 Connected chain ID: " +
                web3j.ethChainId().send().getChainId());

        if (privateKey == null || privateKey.isEmpty() || privateKey.length() < 64) {
            throw new Exception("AMOY_PRIVATE_KEY missing or invalid.");
        }

        String cleanedKey = privateKey.startsWith("0x")
                ? privateKey.substring(2)
                : privateKey;

        this.credentials = Credentials.create(cleanedKey);
        System.out.println("Backend wallet: " + credentials.getAddress());
        
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
                    return new BigInteger("35000000000");
                }
            }

            @Override
            public BigInteger getGasLimit() {
                return DEFAULT_GAS_LIMIT;
            }

            @Override
            public BigInteger getGasLimit(
                    org.web3j.protocol.core.methods.request.Transaction transaction) {
                return DEFAULT_GAS_LIMIT;
            }
        };

        // Load DocumentAnchor (state-changing)
        this.deployedContract = DocumentAnchor.load(
                DOCUMENT_CONTRACT_ADDRESS,
                web3j,
                txManager,
                dynamicGasProvider
        );

        // Load Verifier (read-only)
        ReadonlyTransactionManager readOnlyTxManager =
                new ReadonlyTransactionManager(web3j, credentials.getAddress());

        this.zkVerifier = Groth16Verifier.load(
                VERIFIER_CONTRACT_ADDRESS,
                web3j,
                readOnlyTxManager,
                dynamicGasProvider
        );

        System.out.println("✅ BlockchainService initialized");
        System.out.println("📄 DocumentAnchor: " + DOCUMENT_CONTRACT_ADDRESS);
        System.out.println("🔐 Groth16Verifier: " + VERIFIER_CONTRACT_ADDRESS);
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
    // 🔐 GROTH16 ZKP VERIFICATION (Manual ABI Encoding - FINAL FIX)
    // ===================================================

    public boolean verifyZkProof(
            List<BigInteger> pA,
            List<List<BigInteger>> pB,
            List<BigInteger> pC,
            List<BigInteger> pubSignals
    ) throws Exception {

        System.out.println("🚀 Bypassing Web3j Wrapper to avoid 2D array encoding bug...");

        // Function selector for:
        // verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[3])
        StringBuilder payload = new StringBuilder("0x11479fea");

        // 1️⃣ Encode pA (2 values)
        payload.append(org.web3j.abi.TypeEncoder.encode(
                new org.web3j.abi.datatypes.generated.Uint256(pA.get(0))
        ));
        payload.append(org.web3j.abi.TypeEncoder.encode(
                new org.web3j.abi.datatypes.generated.Uint256(pA.get(1))
        ));

        // 2️⃣ Encode pB (FLAT — 4 values, NOT nested!)
        payload.append(org.web3j.abi.TypeEncoder.encode(
                new org.web3j.abi.datatypes.generated.Uint256(pB.get(0).get(0))
        ));
        payload.append(org.web3j.abi.TypeEncoder.encode(
                new org.web3j.abi.datatypes.generated.Uint256(pB.get(0).get(1))
        ));
        payload.append(org.web3j.abi.TypeEncoder.encode(
                new org.web3j.abi.datatypes.generated.Uint256(pB.get(1).get(0))
        ));
        payload.append(org.web3j.abi.TypeEncoder.encode(
                new org.web3j.abi.datatypes.generated.Uint256(pB.get(1).get(1))
        ));

        // 3️⃣ Encode pC (2 values)
        payload.append(org.web3j.abi.TypeEncoder.encode(
                new org.web3j.abi.datatypes.generated.Uint256(pC.get(0))
        ));
        payload.append(org.web3j.abi.TypeEncoder.encode(
                new org.web3j.abi.datatypes.generated.Uint256(pC.get(1))
        ));

        // 4️⃣ Encode pubSignals (3 values)
        for (BigInteger signal : pubSignals) {
            payload.append(org.web3j.abi.TypeEncoder.encode(
                    new org.web3j.abi.datatypes.generated.Uint256(signal)
            ));
        }

        // 5️⃣ Create raw eth_call
        org.web3j.protocol.core.methods.request.Transaction transaction =
                org.web3j.protocol.core.methods.request.Transaction.createEthCallTransaction(
                        credentials.getAddress(),
                        VERIFIER_CONTRACT_ADDRESS,
                        payload.toString()
                );

        org.web3j.protocol.core.methods.response.EthCall response =
                web3j.ethCall(transaction,
                        org.web3j.protocol.core.DefaultBlockParameterName.LATEST)
                        .send();

        // 6️⃣ Handle revert
        if (response.hasError()) {
            throw new RuntimeException("EVM Revert: " + response.getError().getMessage());
        }

        String result = response.getValue();
        System.out.println("✅ Raw EVM response: " + result);

        // Boolean true = ...0001
        return result != null && result.endsWith("1");
    }
}