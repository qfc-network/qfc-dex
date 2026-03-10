import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy WQFC
  const WQFC = await ethers.getContractFactory("WQFC");
  const wqfc = await WQFC.deploy();
  await wqfc.waitForDeployment();
  const wqfcAddr = await wqfc.getAddress();
  console.log("WQFC deployed to:", wqfcAddr);

  // 2. Deploy Factory
  const Factory = await ethers.getContractFactory("DEXFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("DEXFactory deployed to:", factoryAddr);

  // 3. Deploy Router
  const Router = await ethers.getContractFactory("DEXRouter");
  const router = await Router.deploy(factoryAddr, wqfcAddr);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log("DEXRouter deployed to:", routerAddr);

  console.log("\n--- Deployment Summary ---");
  console.log(`WQFC:       ${wqfcAddr}`);
  console.log(`Factory:    ${factoryAddr}`);
  console.log(`Router:     ${routerAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
