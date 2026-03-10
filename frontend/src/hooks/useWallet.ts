import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { QFC_CHAIN } from "@/lib/contracts";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const isConnected = !!address;
  const isCorrectChain = chainId === QFC_CHAIN.chainId;

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask or a compatible wallet");
      return;
    }
    const prov = new BrowserProvider(window.ethereum);
    const accounts = await prov.send("eth_requestAccounts", []);
    const s = await prov.getSigner();
    const network = await prov.getNetwork();

    setProvider(prov);
    setSigner(s);
    setAddress(accounts[0]);
    setChainId(Number(network.chainId));
  }, []);

  const switchChain = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: QFC_CHAIN.chainIdHex }],
      });
    } catch (e: any) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: QFC_CHAIN.chainIdHex,
            chainName: QFC_CHAIN.name,
            rpcUrls: [QFC_CHAIN.rpcUrl],
            blockExplorerUrls: [QFC_CHAIN.explorer],
            nativeCurrency: QFC_CHAIN.nativeCurrency,
          }],
        });
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const handleAccountsChanged = (accounts: string[]) => {
      setAddress(accounts[0] || null);
    };
    const handleChainChanged = () => window.location.reload();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  return { address, signer, provider, isConnected, isCorrectChain, connect, switchChain };
}
