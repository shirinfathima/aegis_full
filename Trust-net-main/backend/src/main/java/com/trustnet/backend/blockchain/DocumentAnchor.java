package com.trustnet.backend.blockchain;

import io.reactivex.Flowable;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.web3j.abi.EventEncoder;
import org.web3j.abi.TypeReference;
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
    public static final String BINARY = "6080604052348015600e575f5ffd5b5061015d8061001c5f395ff3fe608060405234801561000f575f5ffd5b506004361061003f575f3560e01c806369e354a714610043578063bae9b8b914610074578063d335082714610093575b5f5ffd5b6100626100513660046100f0565b5f9081526020819052604090205490565b60405190815260200160405180910390f35b6100626100823660046100f0565b5f6020819052908152604090205481565b6100a66100a1366004610107565b6100a8565b005b5f8281526020818152604091829020839055905182815283917fefc35308cd6f593c1525d1578df19d9519bf174ec155c3563a08781b7a381e47910160405180910390a25050565b5f60208284031215610100575f5ffd5b5035919050565b5f5f60408385031215610118575f5ffd5b5050803592602090910135915056fea264697066735822122076a4452fa2d16a4bc04ea8f9887c923c9435d8eee284962b4249428ea12edb3964736f6c634300081d0033";

    private static String librariesLinkedBinary;

    public static final String FUNC_GETDOCUMENTCID = "getDocumentCID";

    public static final String FUNC_STOREDOCUMENTCID = "storeDocumentCID";

    public static final String FUNC_USERDOCUMENTCID = "userDocumentCID";

    public static final Event DOCUMENTCIDUPDATED_EVENT = new Event("DocumentCIDUpdated", 
            Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>(true) {}, new TypeReference<Uint256>() {}));
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

    public RemoteFunctionCall<BigInteger> getDocumentCID(BigInteger _userId) {
        final Function function = new Function(FUNC_GETDOCUMENTCID, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(_userId)), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}));
        return executeRemoteCallSingleValueReturn(function, BigInteger.class);
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

    @Deprecated
    public static RemoteCall<DocumentAnchor> deploy(Web3j web3j, Credentials credentials,
            BigInteger gasPrice, BigInteger gasLimit) {
        return deployRemoteCall(DocumentAnchor.class, web3j, credentials, gasPrice, gasLimit, getDeploymentBinary(), "");
    }

    public static RemoteCall<DocumentAnchor> deploy(Web3j web3j,
            TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        return deployRemoteCall(DocumentAnchor.class, web3j, transactionManager, contractGasProvider, getDeploymentBinary(), "");
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
    }
}
