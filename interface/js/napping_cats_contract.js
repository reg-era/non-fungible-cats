// Contract data - replace this with your actual contract address and ABI
window.contractData = {
    "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "abi": [
        "function tokenURI(uint256 tokenId) view returns (string)",
        "function ownerOf(uint256 tokenId) view returns (address)",
        "function listedPrice(uint256 tokenId) view returns (uint256)",
        "function initialPrice() view returns (uint256)",
        "function listToken(uint256 tokenId, uint256 price)",
        "function buyToken(uint256 tokenId) payable",
        "function transfer(uint256 tokenId, address to)",
        "event TokenListed(uint256 indexed tokenId, uint256 price)",
        "event TokenPurchased(uint256 indexed tokenId, address buyer, uint256 price)",
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    ]
};