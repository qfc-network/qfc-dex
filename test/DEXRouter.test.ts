import { expect } from "chai";
import { ethers } from "hardhat";
import { DEXFactory, DEXRouter, MockQRC20, WQFC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DEXRouter", function () {
  let factory: DEXFactory;
  let router: DEXRouter;
  let wqfc: WQFC;
  let tokenA: MockQRC20;
  let tokenB: MockQRC20;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const LIQUIDITY = ethers.parseEther("10000");
  const DEADLINE = Math.floor(Date.now() / 1000) + 3600;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MockQRC20Factory = await ethers.getContractFactory("MockQRC20");
    tokenA = await MockQRC20Factory.deploy("Token A", "TKA", INITIAL_SUPPLY);
    tokenB = await MockQRC20Factory.deploy("Token B", "TKB", INITIAL_SUPPLY);

    const WQFCFactory = await ethers.getContractFactory("WQFC");
    wqfc = await WQFCFactory.deploy();

    const DEXFactoryFactory = await ethers.getContractFactory("DEXFactory");
    factory = await DEXFactoryFactory.deploy();

    const factoryAddr = await factory.getAddress();
    const wqfcAddr = await wqfc.getAddress();

    const DEXRouterFactory = await ethers.getContractFactory("DEXRouter");
    router = await DEXRouterFactory.deploy(factoryAddr, wqfcAddr);

    // Create pair
    const addrA = await tokenA.getAddress();
    const addrB = await tokenB.getAddress();
    await factory.createPair(addrA, addrB);

    // Approve router
    const routerAddr = await router.getAddress();
    await tokenA.approve(routerAddr, ethers.MaxUint256);
    await tokenB.approve(routerAddr, ethers.MaxUint256);
  });

  describe("addLiquidity", function () {
    it("should add initial liquidity", async function () {
      const addrA = await tokenA.getAddress();
      const addrB = await tokenB.getAddress();

      await router.addLiquidity(
        addrA, addrB,
        LIQUIDITY, LIQUIDITY,
        0, 0,
        owner.address, DEADLINE
      );

      const pairAddr = await factory.getPair(addrA, addrB);
      const pair = await ethers.getContractAt("DEXPair", pairAddr);
      const lpBalance = await pair.balanceOf(owner.address);
      expect(lpBalance).to.be.gt(0);
    });

    it("should add proportional liquidity to existing pool", async function () {
      const addrA = await tokenA.getAddress();
      const addrB = await tokenB.getAddress();

      await router.addLiquidity(
        addrA, addrB,
        LIQUIDITY, LIQUIDITY,
        0, 0,
        owner.address, DEADLINE
      );

      const halfLiq = LIQUIDITY / 2n;
      await router.addLiquidity(
        addrA, addrB,
        halfLiq, halfLiq,
        0, 0,
        owner.address, DEADLINE
      );

      const pairAddr = await factory.getPair(addrA, addrB);
      const pair = await ethers.getContractAt("DEXPair", pairAddr);
      const totalLP = await pair.balanceOf(owner.address);
      // Total LP should be roughly 1.5x initial
      expect(totalLP).to.be.gt(LIQUIDITY);
    });

    it("should revert with expired deadline", async function () {
      const addrA = await tokenA.getAddress();
      const addrB = await tokenB.getAddress();
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600;

      await expect(
        router.addLiquidity(addrA, addrB, LIQUIDITY, LIQUIDITY, 0, 0, owner.address, pastDeadline)
      ).to.be.revertedWith("DEXRouter: EXPIRED");
    });
  });

  describe("removeLiquidity", function () {
    it("should remove liquidity and return tokens", async function () {
      const addrA = await tokenA.getAddress();
      const addrB = await tokenB.getAddress();

      await router.addLiquidity(
        addrA, addrB,
        LIQUIDITY, LIQUIDITY,
        0, 0,
        owner.address, DEADLINE
      );

      const pairAddr = await factory.getPair(addrA, addrB);
      const pair = await ethers.getContractAt("DEXPair", pairAddr);
      const lpBalance = await pair.balanceOf(owner.address);

      // Approve router to spend LP tokens
      const routerAddr = await router.getAddress();
      await pair.approve(routerAddr, lpBalance);

      const balABefore = await tokenA.balanceOf(owner.address);
      const balBBefore = await tokenB.balanceOf(owner.address);

      await router.removeLiquidity(
        addrA, addrB,
        lpBalance,
        0, 0,
        owner.address, DEADLINE
      );

      const balAAfter = await tokenA.balanceOf(owner.address);
      const balBAfter = await tokenB.balanceOf(owner.address);

      expect(balAAfter).to.be.gt(balABefore);
      expect(balBAfter).to.be.gt(balBBefore);
    });

    it("should revert if below minimum amounts", async function () {
      const addrA = await tokenA.getAddress();
      const addrB = await tokenB.getAddress();

      await router.addLiquidity(
        addrA, addrB,
        LIQUIDITY, LIQUIDITY,
        0, 0,
        owner.address, DEADLINE
      );

      const pairAddr = await factory.getPair(addrA, addrB);
      const pair = await ethers.getContractAt("DEXPair", pairAddr);
      const lpBalance = await pair.balanceOf(owner.address);

      const routerAddr = await router.getAddress();
      await pair.approve(routerAddr, lpBalance);

      // Set absurdly high minimum
      await expect(
        router.removeLiquidity(
          addrA, addrB,
          lpBalance,
          LIQUIDITY * 2n, LIQUIDITY * 2n,
          owner.address, DEADLINE
        )
      ).to.be.revertedWith("DEXRouter: INSUFFICIENT_A_AMOUNT");
    });
  });

  describe("swapExactTokensForTokens", function () {
    beforeEach(async function () {
      const addrA = await tokenA.getAddress();
      const addrB = await tokenB.getAddress();
      await router.addLiquidity(
        addrA, addrB,
        LIQUIDITY, LIQUIDITY,
        0, 0,
        owner.address, DEADLINE
      );
    });

    it("should swap exact tokens for tokens", async function () {
      const addrA = await tokenA.getAddress();
      const addrB = await tokenB.getAddress();
      const swapAmount = ethers.parseEther("100");

      const amounts = await router.getAmountsOut(swapAmount, [addrA, addrB]);
      const expectedOut = amounts[1];

      const balBBefore = await tokenB.balanceOf(owner.address);
      await router.swapExactTokensForTokens(
        swapAmount, 0, [addrA, addrB], owner.address, DEADLINE
      );
      const balBAfter = await tokenB.balanceOf(owner.address);

      expect(balBAfter - balBBefore).to.equal(expectedOut);
    });

    it("should revert if output less than minimum", async function () {
      const addrA = await tokenA.getAddress();
      const addrB = await tokenB.getAddress();
      const swapAmount = ethers.parseEther("100");

      await expect(
        router.swapExactTokensForTokens(
          swapAmount, ethers.parseEther("200"), [addrA, addrB], owner.address, DEADLINE
        )
      ).to.be.revertedWith("DEXRouter: INSUFFICIENT_OUTPUT_AMOUNT");
    });
  });

  describe("swapTokensForExactTokens", function () {
    beforeEach(async function () {
      const addrA = await tokenA.getAddress();
      const addrB = await tokenB.getAddress();
      await router.addLiquidity(
        addrA, addrB,
        LIQUIDITY, LIQUIDITY,
        0, 0,
        owner.address, DEADLINE
      );
    });

    it("should swap tokens for exact output", async function () {
      const addrA = await tokenA.getAddress();
      const addrB = await tokenB.getAddress();
      const exactOut = ethers.parseEther("50");

      const amounts = await router.getAmountsIn(exactOut, [addrA, addrB]);

      const balBBefore = await tokenB.balanceOf(owner.address);
      await router.swapTokensForExactTokens(
        exactOut, amounts[0], [addrA, addrB], owner.address, DEADLINE
      );
      const balBAfter = await tokenB.balanceOf(owner.address);

      expect(balBAfter - balBBefore).to.equal(exactOut);
    });
  });

  describe("getAmountOut / getAmountIn", function () {
    it("should calculate correct output with 0.3% fee", async function () {
      const reserveIn = ethers.parseEther("1000");
      const reserveOut = ethers.parseEther("1000");
      const amountIn = ethers.parseEther("10");

      const amountOut = await router.getAmountOut(amountIn, reserveIn, reserveOut);

      // Manual: (10 * 997 * 1000) / (1000 * 1000 + 10 * 997)
      const expected = (amountIn * 997n * reserveOut) / (reserveIn * 1000n + amountIn * 997n);
      expect(amountOut).to.equal(expected);
    });

    it("should calculate correct input for desired output", async function () {
      const reserveIn = ethers.parseEther("1000");
      const reserveOut = ethers.parseEther("1000");
      const amountOut = ethers.parseEther("10");

      const amountIn = await router.getAmountIn(amountOut, reserveIn, reserveOut);

      // Manual: (1000 * 10 * 1000) / ((1000 - 10) * 997) + 1
      const expected = (reserveIn * amountOut * 1000n) / ((reserveOut - amountOut) * 997n) + 1n;
      expect(amountIn).to.equal(expected);
    });
  });

  describe("multi-hop swap", function () {
    let tokenC: MockQRC20;

    beforeEach(async function () {
      const MockQRC20Factory = await ethers.getContractFactory("MockQRC20");
      tokenC = await MockQRC20Factory.deploy("Token C", "TKC", INITIAL_SUPPLY);

      const addrA = await tokenA.getAddress();
      const addrB = await tokenB.getAddress();
      const addrC = await tokenC.getAddress();
      const routerAddr = await router.getAddress();

      await tokenC.approve(routerAddr, ethers.MaxUint256);
      await factory.createPair(addrB, addrC);

      // Add liquidity A/B and B/C
      await router.addLiquidity(addrA, addrB, LIQUIDITY, LIQUIDITY, 0, 0, owner.address, DEADLINE);
      await router.addLiquidity(addrB, addrC, LIQUIDITY, LIQUIDITY, 0, 0, owner.address, DEADLINE);
    });

    it("should execute multi-hop swap A -> B -> C", async function () {
      const addrA = await tokenA.getAddress();
      const addrB = await tokenB.getAddress();
      const addrC = await tokenC.getAddress();
      const swapAmount = ethers.parseEther("100");

      const amounts = await router.getAmountsOut(swapAmount, [addrA, addrB, addrC]);

      const balCBefore = await tokenC.balanceOf(owner.address);
      await router.swapExactTokensForTokens(
        swapAmount, 0, [addrA, addrB, addrC], owner.address, DEADLINE
      );
      const balCAfter = await tokenC.balanceOf(owner.address);

      expect(balCAfter - balCBefore).to.equal(amounts[2]);
    });
  });
});
