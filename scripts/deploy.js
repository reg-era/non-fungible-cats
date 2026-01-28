const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {

    const [deployer] = await ethers.getSigners();

    const NappingCats = await ethers.getContractFactory("NappingCats");
    const nappingCats = await NappingCats.deploy(10);

    await nappingCats.waitForDeployment();
    const contractAddress = await nappingCats.getAddress();

    console.log("NappingCats deployed to:", contractAddress);

    // Get the contract ABI
    const artifact = await ethers.getContractFactory("NappingCats");
    const abi = artifact.interface.formatJson();

    // Create the contract data object
    const contractData = {
        address: contractAddress,
        abi: JSON.parse(abi),
        network: (await ethers.provider.getNetwork()).name,
        chainId: (await ethers.provider.getNetwork()).chainId.toString(),
        deployedBy: deployer.address,
        deployedAt: new Date().toISOString(),
        totalSupply: 3
    };

    // Save to JSON file in the frontend directory
    const outputPath = path.join(__dirname, "napping_cats_contract.json");
    fs.writeFileSync(outputPath, JSON.stringify(contractData, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });