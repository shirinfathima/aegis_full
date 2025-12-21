// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DocumentAnchor
 * @dev This contract anchors document commitments to the blockchain for ZKP verification.
 */
contract DocumentAnchor {
    
    // Mapping: User ID (uint256) -> IPFS CID Hash / Commitment (uint256)
    // Updated from 'string' to 'uint256' to accommodate ZK-friendly field elements (e.g., Poseidon hashes)
    mapping(uint256 => uint256) public userDocumentCID;

    // Event to make it easy for off-chain services to track updates
    // The newCid is now indexed as a uint256 for easier filtering in ZK applications
    event DocumentCIDUpdated(uint256 indexed userId, uint256 newCid);

    /**
     * @dev Anchors a new document CID hash for a user.
     * @param _userId The unique identifier of the user.
     * @param _cid The Poseidon hash (commitment) of the IPFS CID.
     */
    function storeDocumentCID(uint256 _userId, uint256 _cid) public {
        // NOTE: In production, access control (e.g., onlyIssuer) should be added here
        userDocumentCID[_userId] = _cid;
        emit DocumentCIDUpdated(_userId, _cid);
    }

    /**
     * @dev Retrieves the anchored CID hash for a user.
     * @param _userId The unique identifier of the user.
     * @return The numeric commitment stored on-chain.
     */
    function getDocumentCID(uint256 _userId) public view returns (uint256) {
        return userDocumentCID[_userId];
    }
}