import { ethers } from "hardhat";

// Existing tokens on QFC testnet
const TTK_ADDRESS = "0xff9427b41587206cea2b156a9967fb4d4dbf99d0";
const QDOGE_ADDRESS = "0xb7938ce567a164a216fa2d0aa885e32608b2e621";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Seeding with account:", deployer.address);

  // Read deployed addresses from env or CLI — update these after deploy
  const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS!;
  const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS!;
  const WQFC_ADDRESS = process.env.WQFC_ADDRESS!;

  if (!FACTORY_ADDRESS || !ROUTER_ADDRESS || !WQFC_ADDRESS) {
    throw new Error("Set FACTORY_ADDRESS, ROUTER_ADDRESS, and WQFC_ADDRESS env vars");
  }

  const factory = await ethers.getContractAt("DEXFactory", FACTORY_ADDRESS);
  const router = await ethers.getContractAt("DEXRouter", ROUTER_ADDRESS);
  const wqfc = await ethers.getContractAt("WQFC", WQFC_ADDRESS);

  const ttk = await ethers.getContractAt("MockQRC20", TTK_ADDRESS);
  const qdoge = await ethers.getContractAt("MockQRC20", QDOGE_ADDRESS);

  const deadline = Math.floor(Date.now() / 1000) + 600; // 10 min
  const LIQUIDITY_AMOUNT = ethers.parseEther("1000");

  // 1. Create pairs
  console.log("\nCreating pairs...");

  let tx = await factory.createPair(WQFC_ADDRESS, TTK_ADDRESS);
  await tx.wait();
  console.log("Created WQFC/TTK pair");

  tx = await factory.createPair(WQFC_ADDRESS, QDOGE_ADDRESS);
  await tx.wait();
  console.log("Created WQFC/QDOGE pair");

  tx = await factory.createPair(TTK_ADDRESS, QDOGE_ADDRESS);
  await tx.wait();
  console.log("Created TTK/QDOGE pair");

  // 2. Wrap QFC for liquidity
  console.log("\nWrapping QFC...");
  tx = await wqfc.deposit({ value: ethers.parseEther("3000") });
  await tx.wait();

  // 3. Approve tokens to router
  console.log("Approving tokens...");
  const MAX = ethers.MaxUint256;
  await (await wqfc.approve(ROUTER_ADDRESS, MAX)).wait();
  await (await ttk.approve(ROUTER_ADDRESS, MAX)).wait();
  await (await qdoge.approve(ROUTER_ADDRESS, MAX)).wait();

  // 4. Add liquidity to each pair
  console.log("\nAdding liquidity...");

  tx = await router.addLiquidity(
    WQFC_ADDRESS, TTK_ADDRESS,
    LIQUIDITY_AMOUNT, LIQUIDITY_AMOUNT,
    0, 0,
    deployer.address, deadline
  );
  await tx.wait();
  console.log("Added liquidity: WQFC/TTK");

  tx = await router.addLiquidity(
    WQFC_ADDRESS, QDOGE_ADDRESS,
    LIQUIDITY_AMOUNT, LIQUIDITY_AMOUNT,
    0, 0,
    deployer.address, deadline
  );
  await tx.wait();
  console.log("Added liquidity: WQFC/QDOGE");

  tx = await router.addLiquidity(
    TTK_ADDRESS, QDOGE_ADDRESS,
    LIQUIDITY_AMOUNT, LIQUIDITY_AMOUNT,
    0, 0,
    deployer.address, deadline
  );
  await tx.wait();
  console.log("Added liquidity: TTK/QDOGE");

  // 5. Summary
  const pairCount = await factory.allPairsLength();
  console.log(`\nSeed complete! Total pairs: ${pairCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
