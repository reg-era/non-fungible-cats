import { ethers } from 'hardhat'

async function main() {
    const contract = await ethers.getContractFactory("NappingCats");
    const signService = await contract.deploy();
    await signService.waitForDeployment();
    const data = { address: signService.target };
    fs.writeFileSync("deployed.json", JSON.stringify(data));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
