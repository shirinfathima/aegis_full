package com.trustnet.backend.blockchain;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.List;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Bool;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.RemoteCall;
import org.web3j.protocol.core.RemoteFunctionCall;
import org.web3j.tx.Contract;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.ContractGasProvider;

/**
 * <p>Auto generated code.
 * <p><strong>Do not modify!</strong>
 * <p>Please use the <a href="https://docs.web3j.io/command_line.html">web3j command line tools</a>,
 * or the org.web3j.codegen.SolidityFunctionWrapperGenerator in the 
 * <a href="https://github.com/LFDT-web3j/web3j/tree/main/codegen">codegen module</a> to update.
 *
 * <p>Generated with web3j version 4.14.0.
 */
@SuppressWarnings("rawtypes")
public class Groth16Verifier extends Contract {
    public static final String BINARY = "6080604052348015600e575f5ffd5b506106028061001c5f395ff3fe608060405234801561000f575f5ffd5b5060043610610029575f3560e01c806311479fea1461002d575b5f5ffd5b61004061003b36600461056a565b610054565b604051901515815260200160405180910390f35b5f61050c565b7f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f00000018110610089575f5f5260205ff35b50565b5f60405183815284602082015285604082015260408160608360076107d05a03fa9150816100bc575f5f5260205ff35b825160408201526020830151606082015260408360808360066107d05a03fa915050806100eb575f5f5260205ff35b5050505050565b7f0dc4a29ef736ac5f3e24e4b70f0f8ddadbc047acc6739afa097eade6f6a5b5cd85527f0d6942d352b1909180149e4bde51e8181abb0b7f064a71cec69bc951c273691460208601525f608086018661018e87357f0b7231729647bfe7bf3f3b8689962e5cfc29faf777ff7b600f2eaaab43e88ecc7f0cc56de07135a4355a3302e823186127cf23022982ce9caf40bd56fbed517b548461008c565b6101de60208801357f09c7d006043ea43128ba2744638a46a5f6936cff06ac7c811344339056e2d5bd7f05845660f7577d80a4a444dc155bd3b4b95fb7fd8d43fb4381db7279101defcb8461008c565b61022e60408801357f0397425a715b9b5fc452198e669f3ca518db8e8cf29bbdb1158c7655fe6538db7f03f7ec339bb902b00d80a5f2965e5bce4de2b671e0c57dd1c48aa458635350758461008c565b50823581527f30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd4760208401357f30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd4703066020820152833560408201526020840135606082015260408401356080820152606084013560a08201527f2d4d9aa7e302d9df41749d5507949d05dbea33fbb16c643b22f599a2be6df2e260c08201527f14bedd503c37ceb061d8ec60209fe345ce89830a19230301f076caff004d192660e08201527f0967032fcbf776d1afc985f88877f182d38480a653f2decaa9794cbc3bf3060c6101008201527f0e187847ad4c798374d0d6732bf501847dd68bc0e071241e0213bc7fc13db7ab6101208201527f304cfbd1e08a704a99f5e847d93f8c3caafddec46b7a0d379da69a4d112346a76101408201527f1739c1b1a457a8c7313123d24d2f9192f896b7c63eea05a9d57f06547ad0cec86101608201525f87015161018082015260205f018701516101a08201527f198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c26101c08201527f1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed6101e08201527f090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b6102008201527f12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa610220820152843561024082015260208501356102608201527f1c19a9a3ec973ff308fc3a9224f2f3e3e1ab55f8a7ffdb2475355c8e8dc0df9d6102808201527f204265ae4ab3ebf08d6f5628af65216bd8932439da5800ebbdd13e224adbeadf6102a08201527f2621790e91f6736e4289fd8201ce4861d93aeaee1dcaa25e62f79b113ff211016102c08201527f2247c8c01b05ebc23cbfb2e08234e0839289e932ccf5385222fcff95e6adb9736102e08201526020816103008360086107d05a03fa9051169695505050505050565b60405161038081016040526105235f84013561005a565b610530602084013561005a565b61053d604084013561005a565b61054a818486888a6100f2565b9050805f5260205ff35b8060408101831015610564575f5ffd5b92915050565b5f5f5f5f610160858703121561057e575f5ffd5b6105888686610554565b935060c085018681111561059a575f5ffd5b6040860193506105aa8782610554565b92505085610160860111156105bd575f5ffd5b5091949093509091610100019056fea26469706673582212202164fd655fa6725fed777e46ef33658571bc4124f23294201d47ae7cdd37185064736f6c634300081e0033";

    private static String librariesLinkedBinary;

    public static final String FUNC_VERIFYPROOF = "verifyProof";

    @Deprecated
    protected Groth16Verifier(String contractAddress, Web3j web3j, Credentials credentials,
            BigInteger gasPrice, BigInteger gasLimit) {
        super(BINARY, contractAddress, web3j, credentials, gasPrice, gasLimit);
    }

    protected Groth16Verifier(String contractAddress, Web3j web3j, Credentials credentials,
            ContractGasProvider contractGasProvider) {
        super(BINARY, contractAddress, web3j, credentials, contractGasProvider);
    }

    @Deprecated
    protected Groth16Verifier(String contractAddress, Web3j web3j,
            TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        super(BINARY, contractAddress, web3j, transactionManager, gasPrice, gasLimit);
    }

    protected Groth16Verifier(String contractAddress, Web3j web3j,
            TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        super(BINARY, contractAddress, web3j, transactionManager, contractGasProvider);
    }

    public RemoteFunctionCall<Boolean> verifyProof(List<BigInteger> _pA, List<List<BigInteger>> _pB,
            List<BigInteger> _pC, List<BigInteger> _pubSignals) {
        final Function function = new Function(FUNC_VERIFYPROOF, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.StaticArray2<org.web3j.abi.datatypes.generated.Uint256>(
                        org.web3j.abi.datatypes.generated.Uint256.class,
                        org.web3j.abi.Utils.typeMap(_pA, org.web3j.abi.datatypes.generated.Uint256.class)), 
                new org.web3j.abi.datatypes.generated.StaticArray2<org.web3j.abi.datatypes.generated.StaticArray2>(
                        org.web3j.abi.datatypes.generated.StaticArray2.class,
                        org.web3j.abi.Utils.typeMap(_pB, org.web3j.abi.datatypes.generated.StaticArray2.class,
                org.web3j.abi.datatypes.generated.Uint256.class)), 
                new org.web3j.abi.datatypes.generated.StaticArray2<org.web3j.abi.datatypes.generated.Uint256>(
                        org.web3j.abi.datatypes.generated.Uint256.class,
                        org.web3j.abi.Utils.typeMap(_pC, org.web3j.abi.datatypes.generated.Uint256.class)), 
                new org.web3j.abi.datatypes.generated.StaticArray3<org.web3j.abi.datatypes.generated.Uint256>(
                        org.web3j.abi.datatypes.generated.Uint256.class,
                        org.web3j.abi.Utils.typeMap(_pubSignals, org.web3j.abi.datatypes.generated.Uint256.class))), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Bool>() {}));
        return executeRemoteCallSingleValueReturn(function, Boolean.class);
    }

    @Deprecated
    public static Groth16Verifier load(String contractAddress, Web3j web3j, Credentials credentials,
            BigInteger gasPrice, BigInteger gasLimit) {
        return new Groth16Verifier(contractAddress, web3j, credentials, gasPrice, gasLimit);
    }

    @Deprecated
    public static Groth16Verifier load(String contractAddress, Web3j web3j,
            TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        return new Groth16Verifier(contractAddress, web3j, transactionManager, gasPrice, gasLimit);
    }

    public static Groth16Verifier load(String contractAddress, Web3j web3j, Credentials credentials,
            ContractGasProvider contractGasProvider) {
        return new Groth16Verifier(contractAddress, web3j, credentials, contractGasProvider);
    }

    public static Groth16Verifier load(String contractAddress, Web3j web3j,
            TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        return new Groth16Verifier(contractAddress, web3j, transactionManager, contractGasProvider);
    }

    public static RemoteCall<Groth16Verifier> deploy(Web3j web3j, Credentials credentials,
            ContractGasProvider contractGasProvider) {
        return deployRemoteCall(Groth16Verifier.class, web3j, credentials, contractGasProvider, getDeploymentBinary(), "");
    }

    @Deprecated
    public static RemoteCall<Groth16Verifier> deploy(Web3j web3j, Credentials credentials,
            BigInteger gasPrice, BigInteger gasLimit) {
        return deployRemoteCall(Groth16Verifier.class, web3j, credentials, gasPrice, gasLimit, getDeploymentBinary(), "");
    }

    public static RemoteCall<Groth16Verifier> deploy(Web3j web3j,
            TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        return deployRemoteCall(Groth16Verifier.class, web3j, transactionManager, contractGasProvider, getDeploymentBinary(), "");
    }

    @Deprecated
    public static RemoteCall<Groth16Verifier> deploy(Web3j web3j,
            TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        return deployRemoteCall(Groth16Verifier.class, web3j, transactionManager, gasPrice, gasLimit, getDeploymentBinary(), "");
    }

    public static void linkLibraries(List<Contract.LinkReference> references) {
        librariesLinkedBinary = linkBinaryWithReferences(BINARY, references);
    }

    private static String getDeploymentBinary() {
        if (librariesLinkedBinary != null) {
            return librariesLinkedBinary;
        } else {
            return BINARY;
        }
    }
}
