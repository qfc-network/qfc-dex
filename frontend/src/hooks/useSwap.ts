import { useState, useCallback } from "react";
import { Contract, parseEther, formatEther, JsonRpcSigner } from "ethers";
import { ADDRESSES, ROUTER_ABI, ERC20_ABI, Token } from "@/lib/contracts";

export function useSwap(signer: JsonRpcSigner | null) {
  const [loading, setLoading] = useState(false);
  const [amountOut, setAmountOut] = useState("");

  const getQuote = useCallback(async (amountIn: string, tokenIn: Token, tokenOut: Token) => {
    if (!signer || !amountIn || parseFloat(amountIn) === 0) {
      setAmountOut("");
      return;
    }
    try {
      const router = new Contract(ADDRESSES.router, ROUTER_ABI, signer);
      const amounts = await router.getAmountsOut(
        parseEther(amountIn),
        [tokenIn.address, tokenOut.address]
      );
      setAmountOut(formatEther(amounts[1]));
    } catch {
      setAmountOut("");
    }
  }, [signer]);

  const executeSwap = useCallback(async (
    amountIn: string,
    minOut: string,
    tokenIn: Token,
    tokenOut: Token,
    userAddress: string
  ) => {
    if (!signer) return;
    setLoading(true);
    try {
      const router = new Contract(ADDRESSES.router, ROUTER_ABI, signer);
      const token = new Contract(tokenIn.address, ERC20_ABI, signer);

      // Approve
      const allowance = await token.allowance(userAddress, ADDRESSES.router);
      const amountInWei = parseEther(amountIn);
      if (allowance < amountInWei) {
        const tx = await token.approve(ADDRESSES.router, amountInWei);
        await tx.wait();
      }

      const deadline = Math.floor(Date.now() / 1000) + 600;
      const tx = await router.swapExactTokensForTokens(
        amountInWei,
        parseEther(minOut || "0"),
        [tokenIn.address, tokenOut.address],
        userAddress,
        deadline
      );
      await tx.wait();
    } finally {
      setLoading(false);
    }
  }, [signer]);

  return { amountOut, loading, getQuote, executeSwap };
}
