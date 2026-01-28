const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting deployment...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    const initialPrice = ethers.parseEther("0.5");
    console.log("💎 Initial token price:", ethers.formatEther(initialPrice), "ETH\n");

    console.log("⏳ Deploying NappingCats contract...");
    const NappingCats = await ethers.getContractFactory("NappingCats");
    const nappingCats = await NappingCats.deploy(initialPrice);

    await nappingCats.waitForDeployment();
    const contractAddress = await nappingCats.getAddress();

    console.log("✅ NappingCats deployed to:", contractAddress);
    console.log("🐱 3 cats automatically minted with URIs: 0.json, 1.json, 2.json");
    console.log("👤 Initial owner: address(0) - available for purchase\n");

    // Verify the minted tokens
    console.log("🔍 Verifying initial state...");
    for (let i = 0; i < 3; i++) {
        const uri = await nappingCats.tokenURI(i);
        const owner = await nappingCats.ownerOf(i);
        console.log(`   Token #${i}: URI=${uri}, Owner=${owner}`);
    }
    console.log();

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
        initialPrice: ethers.formatEther(initialPrice),
        totalSupply: 3
    };

    // Save to JSON file in the frontend directory
    const outputPath = path.join(__dirname, "napping_cats_contract.json");
    fs.writeFileSync(outputPath, JSON.stringify(contractData, null, 2));

    console.log("📄 Contract data saved to:", outputPath);
    console.log("\n✨ Deployment complete!");
    console.log("\n📋 Summary:");
    console.log("   Contract Address:", contractAddress);
    console.log("   Network:", contractData.network);
    console.log("   Chain ID:", contractData.chainId);
    console.log("   Initial Price:", contractData.initialPrice, "ETH");
    console.log("   Tokens Minted:", contractData.totalSupply);
    console.log("\n💡 Next steps:");
    console.log("   1. Copy napping_cats_contract.json to your frontend src/ directory");
    console.log("   2. Update your frontend to import this file");
    console.log("   3. Connect your wallet and start trading cats! 🐱\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });