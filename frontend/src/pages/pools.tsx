import { useEffect } from "react";
import { usePools } from "@/hooks/usePools";

export default function PoolsPage() {
  const { pools, loading, fetchPools } = usePools();

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return (
    <div className="pt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Pools</h1>
        <button
          onClick={() => fetchPools()}
          className="text-qfc-accent hover:text-white text-sm transition"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading pools...</div>
      ) : pools.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          No pools found. Deploy contracts and seed liquidity first.
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-5 gap-4 px-6 text-gray-400 text-sm font-medium">
            <span>Pair</span>
            <span className="text-right">Reserve 0</span>
            <span className="text-right">Reserve 1</span>
            <span className="text-right">Total LP Supply</span>
            <span className="text-right">Address</span>
          </div>
          {pools.map((pool) => (
            <div
              key={pool.pairAddress}
              className="bg-qfc-card border border-qfc-border rounded-xl p-6 grid grid-cols-5 gap-4 items-center"
            >
              <div className="font-semibold text-white">
                {pool.token0.symbol} / {pool.token1.symbol}
              </div>
              <div className="text-right text-gray-300">
                {parseFloat(pool.reserve0).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </div>
              <div className="text-right text-gray-300">
                {parseFloat(pool.reserve1).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </div>
              <div className="text-right text-gray-300">
                {parseFloat(pool.totalSupply).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </div>
              <div className="text-right text-gray-500 text-xs font-mono">
                {pool.pairAddress.slice(0, 8)}...{pool.pairAddress.slice(-6)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
