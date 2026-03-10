import { expect } from "chai";
import { ethers } from "hardhat";
import { DEXFactory, DEXPair, MockQRC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DEXPair", function () {
  let factory: DEXFactory;
  let pair: DEXPair;
  let tokenA: MockQRC20;
  let tokenB: MockQRC20;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let token0Addr: string;
  let token1Addr: string;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const LIQUIDITY = ethers.parseEther("1000");

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MockQRC20Factory = await ethers.getContractFactory("MockQRC20");
    tokenA = await MockQRC20Factory.deploy("Token A", "TKA", INITIAL_SUPPLY);
    tokenB = await MockQRC20Factory.deploy("Token B", "TKB", INITIAL_SUPPLY);

    const DEXFactoryFactory = await ethers.getContractFactory("DEXFactory");
    factory = await DEXFactoryFactory.deploy();

    const addrA = await tokenA.getAddress();
    const addrB = await tokenB.getAddress();

    await factory.createPair(addrA, addrB);
    const pairAddr = await factory.getPair(addrA, addrB);
    pair = await ethers.getContractAt("DEXPair", pairAddr);

    token0Addr = await pair.token0();
    token1Addr = await pair.token1();
  });

  async function addLiquidity(amount0: bigint, amount1: bigint) {
    const pairAddr = await pair.getAddress();
    const [tok0, tok1] = token0Addr === (await tokenA.getAddress())
      ? [tokenA, tokenB]
      : [tokenB, tokenA];
    await tok0.transfer(pairAddr, amount0);
    await tok1.transfer(pairAddr, amount1);
    await pair.mint(owner.address);
  }

  describe("mint", function () {
    it("should mint LP tokens on first liquidity deposit", async function () {
      await addLiquidity(LIQUIDITY, LIQUIDITY);
      const lpBalance = await pair.balanceOf(owner.address);
      expect(lpBalance).to.be.gt(0);
      // sqrt(1000e18 * 1000e18) - 1000 = 1000e18 - 1000
      const expected = LIQUIDITY - 1000n;
      expect(lpBalance).to.equal(expected);
    });

    it("should mint proportional LP tokens on subsequent deposits", async function () {
      await addLiquidity(LIQUIDITY, LIQUIDITY);
      const lp1 = await pair.balanceOf(owner.address);

      await addLiquidity(LIQUIDITY, LIQUIDITY);
      const lp2 = await pair.balanceOf(owner.address);
      // Should get roughly same LP amount again
      expect(lp2 - lp1).to.be.closeTo(LIQUIDITY, ethers.parseEther("1"));
    });

    it("should revert with zero liquidity", async function () {
      const pairAddr = await pair.getAddress();
      // transfer 0 tokens — reverts due to arithmetic underflow (sqrt(0) - 1000)
      await tokenA.transfer(pairAddr, 0);
      await tokenB.transfer(pairAddr, 0);
      await expect(pair.mint(owner.address)).to.be.reverted;
    });
  });

  describe("burn", function () {
    it("should burn LP tokens and return underlying tokens", async function () {
      await addLiquidity(LIQUIDITY, LIQUIDITY);
      const lpBalance = await pair.balanceOf(owner.address);
      const pairAddr = await pair.getAddress();

      // Transfer LP to pair for burning
      await pair.transfer(pairAddr, lpBalance);
      await pair.burn(owner.address);

      const remaining = await pair.balanceOf(owner.address);
      expect(remaining).to.equal(0);

      // Check we got tokens back (minus MINIMUM_LIQUIDITY locked)
      const tok0 = await ethers.getContractAt("MockQRC20", token0Addr);
      const tok1 = await ethers.getContractAt("MockQRC20", token1Addr);
      const bal0 = await tok0.balanceOf(owner.address);
      const bal1 = await tok1.balanceOf(owner.address);
      // Should have nearly all tokens back (minus 1000 wei locked)
      expect(bal0).to.be.closeTo(INITIAL_SUPPLY, ethers.parseEther("0.001"));
      expect(bal1).to.be.closeTo(INITIAL_SUPPLY, ethers.parseEther("0.001"));
    });
  });

  describe("swap", function () {
    it("should swap token0 for token1", async function () {
      await addLiquidity(LIQUIDITY, LIQUIDITY);

      const swapAmount = ethers.parseEther("10");
      const tok0 = await ethers.getContractAt("MockQRC20", token0Addr);
      const tok1 = await ethers.getContractAt("MockQRC20", token1Addr);
      const pairAddr = await pair.getAddress();

      // Send token0 to pair
      await tok0.transfer(pairAddr, swapAmount);

      // Calculate expected output (with 0.3% fee)
      const amountInWithFee = swapAmount * 997n;
      const numerator = amountInWithFee * LIQUIDITY;
      const denominator = LIQUIDITY * 1000n + amountInWithFee;
      const expectedOut = numerator / denominator;

      const bal1Before = await tok1.balanceOf(user.address);
      await pair.swap(0, expectedOut, user.address);
      const bal1After = await tok1.balanceOf(user.address);

      expect(bal1After - bal1Before).to.equal(expectedOut);
    });

    it("should revert swap with insufficient output", async function () {
      await addLiquidity(LIQUIDITY, LIQUIDITY);
      await expect(pair.swap(0, 0, user.address)).to.be.revertedWith(
        "DEXPair: INSUFFICIENT_OUTPUT_AMOUNT"
      );
    });

    it("should maintain x*y=k invariant (with fee)", async function () {
      await addLiquidity(LIQUIDITY, LIQUIDITY);
      const [r0Before, r1Before] = await pair.getReserves();
      const kBefore = r0Before * r1Before;

      const swapAmount = ethers.parseEther("10");
      const tok0 = await ethers.getContractAt("MockQRC20", token0Addr);
      const pairAddr = await pair.getAddress();
      await tok0.transfer(pairAddr, swapAmount);

      const amountInWithFee = swapAmount * 997n;
      const numerator = amountInWithFee * LIQUIDITY;
      const denominator = LIQUIDITY * 1000n + amountInWithFee;
      const expectedOut = numerator / denominator;
      await pair.swap(0, expectedOut, user.address);

      const [r0After, r1After] = await pair.getReserves();
      const kAfter = r0After * r1After;
      // k should increase (due to fees)
      expect(kAfter).to.be.gte(kBefore);
    });

    it("should reject swap that violates k", async function () {
      await addLiquidity(LIQUIDITY, LIQUIDITY);

      const swapAmount = ethers.parseEther("10");
      const tok0 = await ethers.getContractAt("MockQRC20", token0Addr);
      const pairAddr = await pair.getAddress();
      await tok0.transfer(pairAddr, swapAmount);

      // Try to get more than allowed (ignoring fee)
      const tooMuch = ethers.parseEther("11");
      await expect(pair.swap(0, tooMuch, user.address)).to.be.revertedWith("DEXPair: K");
    });
  });

  describe("fee calculation", function () {
    it("should charge exactly 0.3% fee on swaps", async function () {
      await addLiquidity(ethers.parseEther("10000"), ethers.parseEther("10000"));

      const swapAmount = ethers.parseEther("100");
      const tok0 = await ethers.getContractAt("MockQRC20", token0Addr);
      const tok1 = await ethers.getContractAt("MockQRC20", token1Addr);
      const pairAddr = await pair.getAddress();

      await tok0.transfer(pairAddr, swapAmount);

      // 0.3% fee means effective input is 99.7
      const effectiveIn = swapAmount * 997n / 1000n;
      const reserveIn = ethers.parseEther("10000");
      const reserveOut = ethers.parseEther("10000");
      const expectedOut = (effectiveIn * reserveOut) / (reserveIn + effectiveIn);

      // The actual AMM formula result
      const amountInWithFee = swapAmount * 997n;
      const num = amountInWithFee * reserveOut;
      const den = reserveIn * 1000n + amountInWithFee;
      const actualExpected = num / den;

      const bal1Before = await tok1.balanceOf(user.address);
      await pair.swap(0, actualExpected, user.address);
      const bal1After = await tok1.balanceOf(user.address);

      expect(bal1After - bal1Before).to.equal(actualExpected);
      // Output should be less than no-fee output
      const noFeeOut = (swapAmount * reserveOut) / (reserveIn + swapAmount);
      expect(actualExpected).to.be.lt(noFeeOut);
    });
  });
});
