// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BasicNFT.sol";

contract NappingCats is BasicNFT {
    uint256 public initialPrice;
    uint256 public nextTokenId;

    // tokenId => sale price (0 means not listed)
    mapping(uint256 => uint256) public listedPrice;

    event TokenListed(uint256 indexed tokenId, uint256 price);
    event TokenPurchased(uint256 indexed tokenId, address buyer, uint256 price);

    constructor(uint256 _initialPrice)
        BasicNFT("Napping Cats")
    {
        initialPrice = _initialPrice;

        // Mint first 3 cats without owners
        _createCat("0.json");
        _createCat("1.json");
        _createCat("2.json");
    }

    function _createCat(string memory uri) internal {
        _tokenURIs[nextTokenId] = uri;
        _owners[nextTokenId] = address(0);
        nextTokenId++;
    }

    // --------------------
    // Trading
    // --------------------

    function listToken(uint256 tokenId, uint256 price) external {
        require(_owners[tokenId] == msg.sender, "Not owner");
        require(price > 0, "Price must be positive");

        listedPrice[tokenId] = price;
        emit TokenListed(tokenId, price);
    }

    function buyToken(uint256 tokenId) external payable {
        address owner = _owners[tokenId];
        uint256 price;

        if (owner == address(0)) {
            // Initial sale
            price = initialPrice;
        } else {
            // Resale
            price = listedPrice[tokenId];
            require(price > 0, "Token not for sale");
        }

        require(msg.value >= price, "Insufficient payment");

        // Pay previous owner if exists
        if (owner != address(0)) {
            payable(owner).transfer(price);
            listedPrice[tokenId] = 0;
        }

        _owners[tokenId] = msg.sender;

        emit TokenPurchased(tokenId, msg.sender, price);
    }
}
