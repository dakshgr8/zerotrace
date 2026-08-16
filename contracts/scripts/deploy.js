const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("⚡ DEPLOYING ZEROTRACE SMART CONTRACTS");
  console.log("==================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  // Oracle Signer Address (can be specified via env or defaults to deployer / verifier account #1)
  const signers = await hre.ethers.getSigners();
  const oracleSigner = process.env.ORACLE_SIGNER_ADDRESS || (signers.length > 1 ? signers[1].address : deployer.address);
  console.log("Oracle Signer Address:", oracleSigner);

  // 1. Deploy CarbonCreditToken
  const CarbonCreditTokenFactory = await hre.ethers.getContractFactory("CarbonCreditToken");
  const carbonToken = await CarbonCreditTokenFactory.deploy(oracleSigner, deployer.address);
  await carbonToken.waitForDeployment();
  const carbonTokenAddress = await carbonToken.getAddress();
  console.log("✅ CarbonCreditToken (ZTC) deployed at:", carbonTokenAddress);

  // 2. Deploy CarbonMarketplace
  const CarbonMarketplaceFactory = await hre.ethers.getContractFactory("CarbonMarketplace");
  const marketplace = await CarbonMarketplaceFactory.deploy(carbonTokenAddress, deployer.address);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ CarbonMarketplace deployed at:", marketplaceAddress);

  // 3. Register Seed Projects
  console.log("Registering baseline green energy projects...");
  const prj1 = await carbonToken.registerProject(
    "PRJ-SOLAR-RAJASTHAN-01",
    2026,
    "Bhadla Solar Park, Rajasthan, India (27.5396° N, 71.9152° E)",
    "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
  );
  await prj1.wait();

  const prj2 = await carbonToken.registerProject(
    "PRJ-WIND-GUJARAT-02",
    2026,
    "Kutch Wind Farm, Gujarat, India (23.2420° N, 69.6669° E)",
    "0x9c34a2e56b829c3a6bc891f165a882a1728bb84128f117c37b30a5da4c643b2f"
  );
  await prj2.wait();
  console.log("✅ Seed projects registered on-chain.");

  // Save deployment artifact info
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  const deploymentData = {
    network: hre.network.name,
    chainId: chainId,
    oracleSigner: oracleSigner,
    deployer: deployer.address,
    contracts: {
      CarbonCreditToken: {
        address: carbonTokenAddress,
        abi: JSON.parse(fs.readFileSync(path.join(__dirname, "../artifacts/contracts/CarbonCreditToken.sol/CarbonCreditToken.json"), "utf8")).abi,
      },
      CarbonMarketplace: {
        address: marketplaceAddress,
        abi: JSON.parse(fs.readFileSync(path.join(__dirname, "../artifacts/contracts/CarbonMarketplace.sol/CarbonMarketplace.json"), "utf8")).abi,
      },
    },
    timestamp: new Date().toISOString(),
  };

  // Write deployments to contracts directory
  const contractsDeployPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(contractsDeployPath, JSON.stringify(deploymentData, null, 2));
  console.log(`Saved deployment info to ${contractsDeployPath}`);

  // Write directly to frontend and backend directories
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(frontendContractsDir, "deployedAddresses.json"), JSON.stringify(deploymentData, null, 2));
  console.log(`Exported deployment info to Frontend at ${frontendContractsDir}/deployedAddresses.json`);

  const backendConfigDir = path.join(__dirname, "../../backend/app");
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }
  fs.writeFileSync(path.join(backendConfigDir, "contract_addresses.json"), JSON.stringify({
    chainId: chainId,
    carbonTokenAddress: carbonTokenAddress,
    marketplaceAddress: marketplaceAddress,
    oracleSigner: oracleSigner,
  }, null, 2));
  console.log(`Exported contract addresses to Backend at ${backendConfigDir}/contract_addresses.json`);

  console.log("==================================================");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
