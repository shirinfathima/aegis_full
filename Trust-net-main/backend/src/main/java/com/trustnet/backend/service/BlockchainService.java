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
import org.web3j.protocol.core.methods.request.Transaction;

import java.io.IOException;
import java.math.BigInteger;
import java.util.List;

@Service
public class BlockchainService {

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
            throw new Exception("AMOY_PRIVATE_KEY missing or invalid.");
        }

        String cleanedKey = privateKey.startsWith("0x")
                ? privateKey.substring(2)
                : privateKey;

        this.credentials = Credentials.create(cleanedKey);

        RawTransactionManager txManager =
                new RawTransactionManager(web3j, credentials, chainId);

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

        // Anchor contract (needs signing)
        this.deployedContract = DocumentAnchor.load(
                DOCUMENT_CONTRACT_ADDRESS,
                web3j,
                txManager,
                dynamicGasProvider
        );

        // 🔐 Verifier contract (READ ONLY — no gas, no signing)
        ReadonlyTransactionManager readOnlyTxManager =
                new ReadonlyTransactionManager(web3j, credentials.getAddress());

        this.zkVerifier = Groth16Verifier.load(
                verifierAddress,
                web3j,
                readOnlyTxManager,
                dynamicGasProvider
        );
    }

    // ==========================
    // DOCUMENT ANCHORING
    // ==========================

    public TransactionReceipt anchorDocumentCID(Long userId, String cidHash)
            throws Exception {

        BigInteger solUserId = BigInteger.valueOf(userId);
        BigInteger numericHash = new BigInteger(cidHash);

        return deployedContract
                .storeDocumentCID(solUserId, numericHash)
                .send();
    }

    public BigInteger getRawAnchoredCID(Long userId) throws Exception {

        BigInteger solUserId = BigInteger.valueOf(userId);

        Tuple2<BigInteger, BigInteger> result =
                deployedContract.getDocumentCID(solUserId).send();

        return result.component1();
    }

    // ==========================
    // 🔐 ZK VERIFICATION (VIEW CALL)
    // ==========================

    public boolean verifyZkProof(
            List<BigInteger> pA,
            List<List<BigInteger>> pB,
            List<BigInteger> pC,
            List<BigInteger> pubSignals
    ) throws Exception {

        System.out.println("Calling verifier contract...");
        System.out.println("Verifier Address: " + zkVerifier.getContractAddress());

        // Convert Lists → Arrays
        BigInteger[] aArray = pA.toArray(new BigInteger[0]);

        BigInteger[][] bArray = new BigInteger[2][2];
        bArray[0] = pB.get(0).toArray(new BigInteger[0]);
        bArray[1] = pB.get(1).toArray(new BigInteger[0]);

        BigInteger[] cArray = pC.toArray(new BigInteger[0]);

        BigInteger[] pubArray = pubSignals.toArray(new BigInteger[0]);

        Boolean result = zkVerifier
                .verifyProof(aArray, bArray, cArray, pubArray)
                .send();

        System.out.println("On-chain verification result: " + result);

        return result;
    }
}