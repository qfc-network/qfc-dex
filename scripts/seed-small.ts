import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const WQFC = "0xfEe43b287d9CB4985e4752986aa8d42674587DAb";
  const ROUTER = "0xB8A7491465194ff08cA94640ED4D68e9e5a9C494";
  const TTK = "0xff9427b41587206cea2b156a9967fb4d4dbf99d0";
  const QDOGE = "0xb7938ce567a164a216fa2d0aa885e32608b2e621";
  const MAX = ethers.MaxUint256;
  const AMT = ethers.parseEther("5");
  const deadline = Math.floor(Date.now() / 1000) + 600;

  const wqfc = await ethers.getContractAt("WQFC", WQFC);
  const router = await ethers.getContractAt("DEXRouter", ROUTER);
  const ttk = await ethers.getContractAt("MockQRC20", TTK);
  const qdoge = await ethers.getContractAt("MockQRC20", QDOGE);

  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "QFC");
  console.log("TTK balance:", ethers.formatEther(await ttk.balanceOf(deployer.address)));
  console.log("QDOGE balance:", ethers.formatEther(await qdoge.balanceOf(deployer.address)));

  console.log("\nWrapping 15 QFC...");
  await (await wqfc.deposit({ value: ethers.parseEther("15") })).wait();

  console.log("Approving...");
  await (await wqfc.approve(ROUTER, MAX)).wait();
  await (await ttk.approve(ROUTER, MAX)).wait();
  await (await qdoge.approve(ROUTER, MAX)).wait();

  console.log("\nAdding WQFC/TTK liquidity...");
  await (await router.addLiquidity(WQFC, TTK, AMT, AMT, 0, 0, deployer.address, deadline)).wait();

  console.log("Adding WQFC/QDOGE liquidity...");
  await (await router.addLiquidity(WQFC, QDOGE, AMT, AMT, 0, 0, deployer.address, deadline)).wait();

  console.log("Adding TTK/QDOGE liquidity...");
  await (await router.addLiquidity(TTK, QDOGE, AMT, AMT, 0, 0, deployer.address, deadline)).wait();

  console.log("\nDone! Pools seeded with 5 tokens each.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
