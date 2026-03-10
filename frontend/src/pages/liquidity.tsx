import { useState } from "react";
import { Contract, parseEther, JsonRpcSigner } from "ethers";
import { Token, TOKENS, ADDRESSES, ROUTER_ABI, ERC20_ABI } from "@/lib/contracts";
import { useWallet } from "@/hooks/useWallet";
import TokenSelector from "@/components/TokenSelector";

export default function LiquidityPage() {
  const { address, signer, isConnected, connect } = useWallet();
  const [tokenA, setTokenA] = useState<Token>(TOKENS[0]);
  const [tokenB, setTokenB] = useState<Token>(TOKENS[1]);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleAdd = async () => {
    if (!signer || !address) return;
    setLoading(true);
    setStatus("");
    try {
      const router = new Contract(ADDRESSES.router, ROUTER_ABI, signer);
      const tA = new Contract(tokenA.address, ERC20_ABI, signer);
      const tB = new Contract(tokenB.address, ERC20_ABI, signer);

      const aA = parseEther(amountA);
      const aB = parseEther(amountB);

      // Approve
      await (await tA.approve(ADDRESSES.router, aA)).wait();
      await (await tB.approve(ADDRESSES.router, aB)).wait();

      const deadline = Math.floor(Date.now() / 1000) + 600;
      const tx = await router.addLiquidity(
        tokenA.address, tokenB.address,
        aA, aB, 0, 0,
        address, deadline
      );
      await tx.wait();
      setStatus("Liquidity added successfully!");
      setAmountA("");
      setAmountB("");
    } catch (e: any) {
      setStatus("Error: " + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center pt-12">
      <h1 className="text-3xl font-bold text-white mb-2">Add Liquidity</h1>
      <p className="text-gray-400 mb-8">Provide liquidity to earn 0.3% swap fees</p>

      <div className="bg-qfc-card border border-qfc-border rounded-2xl p-6 w-full max-w-md">
        {/* Token A */}
        <div className="bg-qfc-dark rounded-xl p-4 mb-3">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400 text-sm">Token A</span>
            <TokenSelector selected={tokenA} onSelect={setTokenA} exclude={tokenB.address} />
          </div>
          <input
            type="number"
            placeholder="0.0"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            className="bg-transparent text-white text-2xl w-full outline-none"
          />
        </div>

        {/* Token B */}
        <div className="bg-qfc-dark rounded-xl p-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400 text-sm">Token B</span>
            <TokenSelector selected={tokenB} onSelect={setTokenB} exclude={tokenA.address} />
          </div>
          <input
            type="number"
            placeholder="0.0"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            className="bg-transparent text-white text-2xl w-full outline-none"
          />
        </div>

        {status && (
          <p className={`text-sm mb-3 ${status.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
            {status}
          </p>
        )}

        {!isConnected ? (
          <button
            onClick={connect}
            className="w-full bg-qfc-primary hover:bg-qfc-accent text-white font-semibold py-3 rounded-xl transition"
          >
            Connect Wallet
          </button>
        ) : (
          <button
            onClick={handleAdd}
            disabled={loading || !amountA || !amountB}
            className="w-full bg-qfc-primary hover:bg-qfc-accent disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
          >
            {loading ? "Adding..." : "Add Liquidity"}
          </button>
        )}
      </div>
    </div>
  );
}
