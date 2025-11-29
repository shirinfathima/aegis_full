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
import org.web3j.abi.datatypes.Utf8String;
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
    public static final String BINARY = "6080604052348015600e575f5ffd5b506104b08061001c5f395ff3fe608060405234801561000f575f5ffd5b506004361061003f575f3560e01c806328e52cfb1461004357806369e354a714610058578063bae9b8b914610081575b5f5ffd5b610056610051366004610232565b610094565b005b61006b6100663660046102ef565b6100e8565b6040516100789190610306565b60405180910390f35b61006b61008f3660046102ef565b610187565b5f8281526020819052604090206100ab82826103bf565b50817f92b1273f5dcdbb3e372d2706eb89652f4a11cc40a3b91d5487138a8c919c7235826040516100dc9190610306565b60405180910390a25050565b5f8181526020819052604090208054606091906101049061033b565b80601f01602080910402602001604051908101604052809291908181526020018280546101309061033b565b801561017b5780601f106101525761010080835404028352916020019161017b565b820191905f5260205f20905b81548152906001019060200180831161015e57829003601f168201915b50505050509050919050565b5f602081905290815260409020805461019f9061033b565b80601f01602080910402602001604051908101604052809291908181526020018280546101cb9061033b565b80156102165780601f106101ed57610100808354040283529160200191610216565b820191905f5260205f20905b8154815290600101906020018083116101f957829003601f168201915b505050505081565b634e487b7160e01b5f52604160045260245ffd5b5f5f60408385031215610243575f5ffd5b82359150602083013567ffffffffffffffff811115610260575f5ffd5b8301601f81018513610270575f5ffd5b803567ffffffffffffffff81111561028a5761028a61021e565b604051601f8201601f19908116603f0116810167ffffffffffffffff811182821017156102b9576102b961021e565b6040528181528282016020018710156102d0575f5ffd5b816020840160208301375f602083830101528093505050509250929050565b5f602082840312156102ff575f5ffd5b5035919050565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b600181811c9082168061034f57607f821691505b60208210810361036d57634e487b7160e01b5f52602260045260245ffd5b50919050565b601f8211156103ba57805f5260205f20601f840160051c810160208510156103985750805b601f840160051c820191505b818110156103b7575f81556001016103a4565b50505b505050565b815167ffffffffffffffff8111156103d9576103d961021e565b6103ed816103e7845461033b565b84610373565b6020601f82116001811461041f575f83156104085750848201515b5f19600385901b1c1916600184901b1784556103b7565b5f84815260208120601f198516915b8281101561044e578785015182556020948501946001909201910161042e565b508482101561046b57868401515f19600387901b60f8161c191681555b50505050600190811b0190555056fea2646970667358221220cc5883b3cfe37c88d707fb479f15e8cb08263532e99e3d899f7339318c78854a64736f6c634300081d0033";

    private static String librariesLinkedBinary;

    public static final String FUNC_GETDOCUMENTCID = "getDocumentCID";

    public static final String FUNC_STOREDOCUMENTCID = "storeDocumentCID";

    public static final String FUNC_USERDOCUMENTCID = "userDocumentCID";

    public static final Event DOCUMENTCIDUPDATED_EVENT = new Event("DocumentCIDUpdated", 
            Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>(true) {}, new TypeReference<Utf8String>() {}));
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
            typedResponse.newCid = (String) eventValues.getNonIndexedValues().get(0).getValue();
            responses.add(typedResponse);
        }
        return responses;
    }

    public static DocumentCIDUpdatedEventResponse getDocumentCIDUpdatedEventFromLog(Log log) {
        Contract.EventValuesWithLog eventValues = staticExtractEventParametersWithLog(DOCUMENTCIDUPDATED_EVENT, log);
        DocumentCIDUpdatedEventResponse typedResponse = new DocumentCIDUpdatedEventResponse();
        typedResponse.log = log;
        typedResponse.userId = (BigInteger) eventValues.getIndexedValues().get(0).getValue();
        typedResponse.newCid = (String) eventValues.getNonIndexedValues().get(0).getValue();
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

    public RemoteFunctionCall<String> getDocumentCID(BigInteger _userId) {
        final Function function = new Function(FUNC_GETDOCUMENTCID, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(_userId)), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Utf8String>() {}));
        return executeRemoteCallSingleValueReturn(function, String.class);
    }

    public RemoteFunctionCall<TransactionReceipt> storeDocumentCID(BigInteger _userId,
            String _cid) {
        final Function function = new Function(
                FUNC_STOREDOCUMENTCID, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(_userId), 
                new org.web3j.abi.datatypes.Utf8String(_cid)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<String> userDocumentCID(BigInteger param0) {
        final Function function = new Function(FUNC_USERDOCUMENTCID, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(param0)), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Utf8String>() {}));
        return executeRemoteCallSingleValueReturn(function, String.class);
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

        public String newCid;
    }
}
