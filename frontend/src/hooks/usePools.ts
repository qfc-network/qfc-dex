import { useState, useCallback } from "react";
import { Contract, formatEther, JsonRpcProvider } from "ethers";
import { ADDRESSES, FACTORY_ABI, PAIR_ABI, ERC20_ABI, QFC_CHAIN, TOKENS } from "@/lib/contracts";

export interface Pool {
  pairAddress: string;
  token0: { symbol: string; address: string };
  token1: { symbol: string; address: string };
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  lpBalance: string;
}

function findTokenSymbol(addr: string): string {
  const t = TOKENS.find((t) => t.address.toLowerCase() === addr.toLowerCase());
  return t?.symbol || addr.slice(0, 8);
}

export function usePools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPools = useCallback(async (userAddress?: string) => {
    setLoading(true);
    try {
      const provider = new JsonRpcProvider(QFC_CHAIN.rpcUrl);
      const factory = new Contract(ADDRESSES.factory, FACTORY_ABI, provider);
      const count = await factory.allPairsLength();
      const result: Pool[] = [];

      for (let i = 0; i < Number(count); i++) {
        const pairAddress = await factory.allPairs(i);
        const pair = new Contract(pairAddress, PAIR_ABI, provider);

        const [token0Addr, token1Addr, reserves, totalSupply] = await Promise.all([
          pair.token0(),
          pair.token1(),
          pair.getReserves(),
          pair.totalSupply(),
        ]);

        let lpBalance = "0";
        if (userAddress) {
          lpBalance = formatEther(await pair.balanceOf(userAddress));
        }

        result.push({
          pairAddress,
          token0: { symbol: findTokenSymbol(token0Addr), address: token0Addr },
          token1: { symbol: findTokenSymbol(token1Addr), address: token1Addr },
          reserve0: formatEther(reserves[0]),
          reserve1: formatEther(reserves[1]),
          totalSupply: formatEther(totalSupply),
          lpBalance,
        });
      }
      setPools(result);
    } catch (e) {
      console.error("Failed to fetch pools:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { pools, loading, fetchPools };
}
