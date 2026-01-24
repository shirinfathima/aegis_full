package com.trustnet.backend.blockchain;

import io.reactivex.Flowable;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import org.web3j.abi.EventEncoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Event;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameter;
import org.web3j.protocol.core.RemoteCall;
import org.web3j.protocol.core.RemoteFunctionCall;
import org.web3j.protocol.core.methods.request.EthFilter;
import org.web3j.protocol.core.methods.response.BaseEventResponse;
import org.web3j.protocol.core.methods.response.Log;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tuples.generated.Tuple2;
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
public class DocumentAnchor extends Contract {
    public static final String BINARY = "6080604052348015600e575f5ffd5b505f80546001600160a01b031916331790556102678061002d5f395ff3fe608060405234801561000f575f5ffd5b5060043610610055575f3560e01c806303c5f7d2146100595780631d1438481461008b57806369e354a7146100b5578063bae9b8b9146100f6578063d335082714610115575b5f5ffd5b6100786100673660046101fa565b60026020525f908152604090205481565b6040519081526020015b60405180910390f35b5f5461009d906001600160a01b031681565b6040516001600160a01b039091168152602001610082565b6100e16100c33660046101fa565b5f908152600160209081526040808320546002909252909120549091565b60408051928352602083019190915201610082565b6100786101043660046101fa565b60016020525f908152604090205481565b610128610123366004610211565b61012a565b005b5f546001600160a01b031633146101a05760405162461bcd60e51b815260206004820152603060248201527f4e6f7420617574686f72697a65643a204f6e6c7920746865206261636b656e6460448201526f2063616e20616e63686f72206461746160801b606482015260840160405180910390fd5b5f8281526001602090815260408083208490556002825291829020429081905582518481529182015283917f0e8ed0c29c8f7d624a880df8fa1db2d5b49eca56f9a38b3d60011805bcb102eb910160405180910390a25050565b5f6020828403121561020a575f5ffd5b5035919050565b5f5f60408385031215610222575f5ffd5b5050803592602090910135915056fea2646970667358221220b1101abae99046780ed1d0ef4e4db6b02ba4fc76048ab959e3d1bc3d74ccb84c64736f6c634300081e0033";

    private static String librariesLinkedBinary;

    public static final String FUNC_ANCHORINGTIMESTAMP = "anchoringTimestamp";

    public static final String FUNC_GETDOCUMENTCID = "getDocumentCID";

    public static final String FUNC_ISSUER = "issuer";

    public static final String FUNC_STOREDOCUMENTCID = "storeDocumentCID";

    public static final String FUNC_USERDOCUMENTCID = "userDocumentCID";

    public static final Event DOCUMENTCIDUPDATED_EVENT = new Event("DocumentCIDUpdated", 
            Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>(true) {}, new TypeReference<Uint256>() {}, new TypeReference<Uint256>() {}));
    ;

    @Deprecated
    protected DocumentAnchor(String contractAddress, Web3j web3j, Credentials credentials,
            BigInteger gasPrice, BigInteger gasLimit) {
        super(BINARY, contractAddress, web3j, credentials, gasPrice, gasLimit);
    }

    protected DocumentAnchor(String contractAddress, Web3j web3j, Credentials credentials,
            ContractGasProvider contractGasProvider) {
        super(BINARY, contractAddress, web3j, credentials, contractGasProvider);
    }

    @Deprecated
    protected DocumentAnchor(String contractAddress, Web3j web3j,
            TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        super(BINARY, contractAddress, web3j, transactionManager, gasPrice, gasLimit);
    }

    protected DocumentAnchor(String contractAddress, Web3j web3j,
            TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        super(BINARY, contractAddress, web3j, transactionManager, contractGasProvider);
    }

    public static List<DocumentCIDUpdatedEventResponse> getDocumentCIDUpdatedEvents(
            TransactionReceipt transactionReceipt) {
        List<Contract.EventValuesWithLog> valueList = staticExtractEventParametersWithLog(DOCUMENTCIDUPDATED_EVENT, transactionReceipt);
        ArrayList<DocumentCIDUpdatedEventResponse> responses = new ArrayList<DocumentCIDUpdatedEventResponse>(valueList.size());
        for (Contract.EventValuesWithLog eventValues : valueList) {
            DocumentCIDUpdatedEventResponse typedResponse = new DocumentCIDUpdatedEventResponse();
            typedResponse.log = eventValues.getLog();
            typedResponse.userId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
            typedResponse.newCid = (BigInteger) eventValues.getNonIndexedValues().get(0).getValue();
            typedResponse.timestamp = (BigInteger) eventValues.getNonIndexedValues().get(1).getValue();
            responses.add(typedResponse);
        }
        return responses;
    }

    public static DocumentCIDUpdatedEventResponse getDocumentCIDUpdatedEventFromLog(Log log) {
        Contract.EventValuesWithLog eventValues = staticExtractEventParametersWithLog(DOCUMENTCIDUPDATED_EVENT, log);
        DocumentCIDUpdatedEventResponse typedResponse = new DocumentCIDUpdatedEventResponse();
        typedResponse.log = log;
        typedResponse.userId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
        typedResponse.newCid = (BigInteger) eventValues.getNonIndexedValues().get(0).getValue();
        typedResponse.timestamp = (BigInteger) eventValues.getNonIndexedValues().get(1).getValue();
        return typedResponse;
    }

    public Flowable<DocumentCIDUpdatedEventResponse> documentCIDUpdatedEventFlowable(
            EthFilter filter) {
        return web3j.ethLogFlowable(filter).map(log -> getDocumentCIDUpdatedEventFromLog(log));
    }

    public Flowable<DocumentCIDUpdatedEventResponse> documentCIDUpdatedEventFlowable(
            DefaultBlockParameter startBlock, DefaultBlockParameter endBlock) {
        EthFilter filter = new EthFilter(startBlock, endBlock, getContractAddress());
        filter.addSingleTopic(EventEncoder.encode(DOCUMENTCIDUPDATED_EVENT));
        return documentCIDUpdatedEventFlowable(filter);
    }

    public RemoteFunctionCall<BigInteger> anchoringTimestamp(BigInteger param0) {
        final Function function = new Function(FUNC_ANCHORINGTIMESTAMP, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(param0)), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}));
        return executeRemoteCallSingleValueReturn(function, BigInteger.class);
    }

    public RemoteFunctionCall<Tuple2<BigInteger, BigInteger>> getDocumentCID(BigInteger _userId) {
        final Function function = new Function(FUNC_GETDOCUMENTCID, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(_userId)), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}, new TypeReference<Uint256>() {}));
        return new RemoteFunctionCall<Tuple2<BigInteger, BigInteger>>(function,
                new Callable<Tuple2<BigInteger, BigInteger>>() {
                    @Override
                    public Tuple2<BigInteger, BigInteger> call() throws Exception {
                        List<Type> results = executeCallMultipleValueReturn(function);
                        return new Tuple2<BigInteger, BigInteger>(
                                (BigInteger) results.get(0).getValue(), 
                                (BigInteger) results.get(1).getValue());
                    }
                });
    }

    public RemoteFunctionCall<String> issuer() {
        final Function function = new Function(FUNC_ISSUER, 
                Arrays.<Type>asList(), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Address>() {}));
        return executeRemoteCallSingleValueReturn(function, String.class);
    }

    public RemoteFunctionCall<TransactionReceipt> storeDocumentCID(BigInteger _userId,
            BigInteger _cid) {
        final Function function = new Function(
                FUNC_STOREDOCUMENTCID, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(_userId), 
                new org.web3j.abi.datatypes.generated.Uint256(_cid)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<BigInteger> userDocumentCID(BigInteger param0) {
        final Function function = new Function(FUNC_USERDOCUMENTCID, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(param0)), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}));
        return executeRemoteCallSingleValueReturn(function, BigInteger.class);
    }

    @Deprecated
    public static DocumentAnchor load(String contractAddress, Web3j web3j, Credentials credentials,
            BigInteger gasPrice, BigInteger gasLimit) {
        return new DocumentAnchor(contractAddress, web3j, credentials, gasPrice, gasLimit);
    }

    @Deprecated
    public static DocumentAnchor load(String contractAddress, Web3j web3j,
            TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        return new DocumentAnchor(contractAddress, web3j, transactionManager, gasPrice, gasLimit);
    }

    public static DocumentAnchor load(String contractAddress, Web3j web3j, Credentials credentials,
            ContractGasProvider contractGasProvider) {
        return new DocumentAnchor(contractAddress, web3j, credentials, contractGasProvider);
    }

    public static DocumentAnchor load(String contractAddress, Web3j web3j,
            TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        return new DocumentAnchor(contractAddress, web3j, transactionManager, contractGasProvider);
    }

    public static RemoteCall<DocumentAnchor> deploy(Web3j web3j, Credentials credentials,
            ContractGasProvider contractGasProvider) {
        return deployRemoteCall(DocumentAnchor.class, web3j, credentials, contractGasProvider, getDeploymentBinary(), "");
    }

    public static RemoteCall<DocumentAnchor> deploy(Web3j web3j,
            TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        return deployRemoteCall(DocumentAnchor.class, web3j, transactionManager, contractGasProvider, getDeploymentBinary(), "");
    }

    @Deprecated
    public static RemoteCall<DocumentAnchor> deploy(Web3j web3j, Credentials credentials,
            BigInteger gasPrice, BigInteger gasLimit) {
        return deployRemoteCall(DocumentAnchor.class, web3j, credentials, gasPrice, gasLimit, getDeploymentBinary(), "");
    }

    @Deprecated
    public static RemoteCall<DocumentAnchor> deploy(Web3j web3j,
            TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        return deployRemoteCall(DocumentAnchor.class, web3j, transactionManager, gasPrice, gasLimit, getDeploymentBinary(), "");
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

    public static class DocumentCIDUpdatedEventResponse extends BaseEventResponse {
        public BigInteger userId;

        public BigInteger newCid;

        public BigInteger timestamp;
    }
}
