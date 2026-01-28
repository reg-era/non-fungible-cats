import { create } from "ipfs-http-client";
import fs from "fs";

// public gateway or pinning service endpoint
const client = create({
    url: "https://ipfs.infura.io:5001/api/v0"
});

async function uploadImage(filePath) {
    const file = fs.readFileSync(filePath);
    const result = await client.add(file);
    console.log("IPFS CID:", result.path);
    return result.path;
}

uploadImage("NFTs/cat_0_NFT.png");
uploadImage("NFTs/cat_1_NFT.png");
uploadImage("NFTs/cat_2_NFT.png");
