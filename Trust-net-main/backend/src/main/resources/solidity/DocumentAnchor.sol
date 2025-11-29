// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DocumentAnchor {
    // Mapping: User ID (uint256) -> IPFS CID (string)
    mapping(uint256 => string) public userDocumentCID;

    // Event to make it easy for off-chain services to track updates
    event DocumentCIDUpdated(uint256 indexed userId, string newCid);

    // Function to anchor a new document CID for a user
    function storeDocumentCID(uint256 _userId, string memory _cid) public {
        // NOTE: In the future, you will add logic here to restrict who can call this
        userDocumentCID[_userId] = _cid;
        emit DocumentCIDUpdated(_userId, _cid);
    }

    // Function to retrieve the latest CID for a user
    function getDocumentCID(uint256 _userId) public view returns (string memory) {
        return userDocumentCID[_userId];
    }
}