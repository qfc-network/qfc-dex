import { useState, useEffect } from "react";
import { Token, TOKENS } from "@/lib/contracts";
import { useSwap } from "@/hooks/useSwap";
import { useWallet } from "@/hooks/useWallet";
import TokenSelector from "./TokenSelector";

export default function SwapCard() {
  const { address, signer, isConnected, connect } = useWallet();
  const [tokenIn, setTokenIn] = useState<Token>(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[1]);
  const [amountIn, setAmountIn] = useState("");
  const { amountOut, loading, getQuote, executeSwap } = useSwap(signer);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (amountIn) getQuote(amountIn, tokenIn, tokenOut);
    }, 300);
    return () => clearTimeout(timer);
  }, [amountIn, tokenIn, tokenOut, getQuote]);

  const handleSwap = async () => {
    if (!address) return;
    await executeSwap(amountIn, "0", tokenIn, tokenOut, address);
    setAmountIn("");
  };

  const flipTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn("");
  };

  return (
    <div className="bg-qfc-card border border-qfc-border rounded-2xl p-6 w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">Swap</h2>

      {/* Input */}
      <div className="bg-qfc-dark rounded-xl p-4 mb-2">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400 text-sm">You pay</span>
          <TokenSelector selected={tokenIn} onSelect={setTokenIn} exclude={tokenOut.address} />
        </div>
        <input
          type="number"
          placeholder="0.0"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          className="bg-transparent text-white text-2xl w-full outline-none"
        />
      </div>

      {/* Flip button */}
      <div className="flex justify-center -my-3 relative z-10">
        <button
          onClick={flipTokens}
          className="bg-qfc-border hover:bg-qfc-primary rounded-lg p-2 transition"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Output */}
      <div className="bg-qfc-dark rounded-xl p-4 mt-2 mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400 text-sm">You receive</span>
          <TokenSelector selected={tokenOut} onSelect={setTokenOut} exclude={tokenIn.address} />
        </div>
        <div className="text-white text-2xl">
          {amountOut || "0.0"}
        </div>
      </div>

      {/* Swap button */}
      {!isConnected ? (
        <button
          onClick={connect}
          className="w-full bg-qfc-primary hover:bg-qfc-accent text-white font-semibold py-3 rounded-xl transition"
        >
          Connect Wallet
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={loading || !amountIn || !amountOut}
          className="w-full bg-qfc-primary hover:bg-qfc-accent disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
        >
          {loading ? "Swapping..." : "Swap"}
        </button>
      )}
    </div>
  );
}
