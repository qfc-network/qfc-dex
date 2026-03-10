import SwapCard from "@/components/SwapCard";

export default function SwapPage() {
  return (
    <div className="flex flex-col items-center pt-12">
      <h1 className="text-3xl font-bold text-white mb-2">Trade tokens instantly</h1>
      <p className="text-gray-400 mb-8">Swap tokens with 0.3% fee on QFC Network</p>
      <SwapCard />
    </div>
  );
}
