// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BasicNFT {
    string public name;

    // tokenId => owner
    mapping(uint256 => address) internal _owners;

    // tokenId => metadata URI
    mapping(uint256 => string) internal _tokenURIs;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor(string memory _name) {
        name = _name;
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        return _owners[tokenId];
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function transfer(uint256 tokenId, address to) public {
        require(_owners[tokenId] == msg.sender, "Not token owner");
        require(to != address(0), "Invalid address");

        _owners[tokenId] = to;
        emit Transfer(msg.sender, to, tokenId);
    }
}
