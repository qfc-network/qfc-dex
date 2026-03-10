import { useEffect } from "react";
import { usePools } from "@/hooks/usePools";
import { useWallet } from "@/hooks/useWallet";

export default function PositionsPage() {
  const { address, isConnected, connect } = useWallet();
  const { pools, loading, fetchPools } = usePools();

  useEffect(() => {
    if (address) fetchPools(address);
  }, [address, fetchPools]);

  const myPools = pools.filter((p) => parseFloat(p.lpBalance) > 0);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center pt-20">
        <h1 className="text-3xl font-bold text-white mb-4">My Positions</h1>
        <p className="text-gray-400 mb-6">Connect your wallet to view your LP positions</p>
        <button
          onClick={connect}
          className="bg-qfc-primary hover:bg-qfc-accent text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="pt-8">
      <h1 className="text-3xl font-bold text-white mb-6">My Positions</h1>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading positions...</div>
      ) : myPools.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          You have no LP positions. Add liquidity to start earning fees.
        </div>
      ) : (
        <div className="grid gap-4">
          {myPools.map((pool) => {
            const share = parseFloat(pool.totalSupply) > 0
              ? (parseFloat(pool.lpBalance) / parseFloat(pool.totalSupply)) * 100
              : 0;

            return (
              <div
                key={pool.pairAddress}
                className="bg-qfc-card border border-qfc-border rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-white">
                    {pool.token0.symbol} / {pool.token1.symbol}
                  </span>
                  <span className="text-qfc-accent text-sm">
                    {share.toFixed(2)}% pool share
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">LP Tokens</p>
                    <p className="text-white font-medium">
                      {parseFloat(pool.lpBalance).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">{pool.token0.symbol} pooled</p>
                    <p className="text-white font-medium">
                      {(parseFloat(pool.reserve0) * share / 100).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">{pool.token1.symbol} pooled</p>
                    <p className="text-white font-medium">
                      {(parseFloat(pool.reserve1) * share / 100).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
