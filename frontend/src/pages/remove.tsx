import Link from "next/link";

export default function RemoveLiquidityRoute() {
  return (
    <div className="flex flex-col items-center pt-12">
      <h1 className="text-3xl font-bold text-white mb-2">Remove Liquidity</h1>
      <p className="text-gray-400 mb-8 text-center max-w-xl">
        This route is now active. Removal flow is managed from your LP positions.
      </p>
      <Link
        href="/positions"
        className="bg-qfc-primary hover:bg-qfc-accent text-white font-semibold px-6 py-3 rounded-xl transition"
      >
        Go to My Positions
      </Link>
    </div>
  );
}
