import { useWallet } from "@/hooks/useWallet";

export default function WalletConnect() {
  const { address, isConnected, isCorrectChain, connect, switchChain } = useWallet();

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="bg-qfc-primary hover:bg-qfc-accent text-white font-semibold px-5 py-2.5 rounded-xl transition"
      >
        Connect Wallet
      </button>
    );
  }

  if (!isCorrectChain) {
    return (
      <button
        onClick={switchChain}
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-5 py-2.5 rounded-xl transition"
      >
        Switch to QFC
      </button>
    );
  }

  return (
    <div className="bg-qfc-card border border-qfc-border px-4 py-2 rounded-xl text-sm text-white font-mono">
      {address!.slice(0, 6)}...{address!.slice(-4)}
    </div>
  );
}
