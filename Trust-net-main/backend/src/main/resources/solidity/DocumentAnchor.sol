// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DocumentAnchor {
    address public issuer; // The authorized backend address

    mapping(uint256 => uint256) public userDocumentCID;
    mapping(uint256 => uint256) public anchoringTimestamp;

    event DocumentCIDUpdated(uint256 indexed userId, uint256 newCid, uint256 timestamp);

    constructor() {
        issuer = msg.sender; // The person who deploys becomes the authorized issuer
    }

    modifier onlyIssuer() {
        require(msg.sender == issuer, "Not authorized: Only the backend can anchor data");
        _;
    }

    function storeDocumentCID(uint256 _userId, uint256 _cid) public onlyIssuer {
        userDocumentCID[_userId] = _cid;
        anchoringTimestamp[_userId] = block.timestamp;
        emit DocumentCIDUpdated(_userId, _cid, block.timestamp);
    }

    function getDocumentCID(uint256 _userId) public view returns (uint256, uint256) {
        return (userDocumentCID[_userId], anchoringTimestamp[_userId]);
    }
}