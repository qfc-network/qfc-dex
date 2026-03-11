# CLAUDE.md — QFC DEX

## Project Overview

QFC DEX is a Uniswap V2-style AMM decentralized exchange on QFC Network. It supports token swaps (0.3% fee) and liquidity provision via an x*y=k constant-product formula. This repo contains both the Solidity smart contracts and a Next.js frontend.

Part of the `qfc-blockchain` ecosystem alongside the QFC explorer and testnet infrastructure.

## Tech Stack

**Contracts:** Solidity 0.8.28, Hardhat, ethers.js, TypeChain
**Frontend:** Next.js 14 (Pages Router), React 18, TypeScript, Tailwind CSS 3, ethers.js v6
**Ports:** Frontend runs on **3250** (dev and production)
**Chain:** QFC Testnet (chainId 9000), RPC `https://rpc.testnet.qfc.network`

## Key Commands

### Root (contracts)
```bash
npm install              # Install contract dependencies
npx hardhat compile      # Compile Solidity contracts
npx hardhat test         # Run contract tests
npx hardhat run scripts/deploy.ts --network qfc_testnet  # Deploy
npx hardhat run scripts/seed.ts --network qfc_testnet    # Seed liquidity
npx hardhat node         # Local dev node (chainId 9000)
```

### Frontend
```bash
cd frontend
npm install
npm run dev              # Dev server on :3250
npm run build            # Production build
npm run start            # Production server on :3250
```

No linter is configured. No frontend tests exist yet.

## Project Structure

```
├── contracts/               # Solidity source files
│   ├── DEXFactory.sol       # Creates and manages trading pairs
│   ├── DEXPair.sol          # x*y=k AMM pool with LP token (QRC20)
│   ├── DEXRouter.sol        # User-facing: swap, addLiquidity, removeLiquidity
│   ├── WQFC.sol             # Wrapped native QFC token
│   ├── interfaces/          # IDEXFactory, IDEXPair, IQRC20
│   └── test/MockQRC20.sol   # Mock token for tests
├── test/                    # Hardhat tests (TypeScript)
│   ├── DEXRouter.test.ts
│   └── DEXPair.test.ts
├── scripts/
│   ├── deploy.ts            # Deploy WQFC → Factory → Router
│   └── seed.ts              # Create pairs + seed initial liquidity
├── artifacts/               # Compiled contract ABIs (generated)
├── typechain-types/         # TypeChain generated types (generated)
├── frontend/
│   ├── src/
│   │   ├── pages/           # Next.js pages (index=Swap, liquidity, pools, positions)
│   │   ├── components/      # SwapCard, Layout, WalletConnect, TokenSelector
│   │   ├── hooks/           # useWallet, useSwap, usePools
│   │   ├── lib/contracts.ts # Contract addresses, ABIs, token list, chain config
│   │   ├── styles/          # globals.css (Tailwind)
│   │   └── types/           # global.d.ts (window.ethereum typing)
│   ├── tailwind.config.js   # Custom qfc-* color palette
│   ├── next.config.js
│   └── package.json
├── hardhat.config.ts        # Solidity compiler, network configs
├── Dockerfile               # Multi-stage standalone Next.js build
└── .github/workflows/docker.yml  # GHA: build + push to GHCR
```

## Key Files

| File | What it does |
|------|-------------|
| `frontend/src/lib/contracts.ts` | **Central config** — chain params, deployed addresses, token list, all ABIs (human-readable format) |
| `frontend/src/hooks/useWallet.ts` | MetaMask connection, chain switching, account tracking |
| `frontend/src/hooks/useSwap.ts` | Quote via `router.getAmountsOut`, execute swap with approval flow |
| `frontend/src/hooks/usePools.ts` | Fetch all pairs from factory, read reserves + LP balances |
| `frontend/src/components/Layout.tsx` | App shell with nav bar (Swap, Liquidity, Pools, My Positions) |
| `hardhat.config.ts` | Solidity 0.8.28, cancun EVM, network definitions |
| `scripts/deploy.ts` | Deploys WQFC → DEXFactory → DEXRouter (in order) |
| `scripts/seed.ts` | Creates 3 pairs (WQFC/TTK, WQFC/QDOGE, TTK/QDOGE) and seeds 1000 tokens each |

## Environment Variables

Defined in `.env` (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `PRIVATE_KEY` | Deployer wallet private key (for Hardhat deploy/seed) |
| `QFC_TESTNET_RPC` | RPC URL override (default: `https://rpc.testnet.qfc.network`) |
| `EXPLORER_API_KEY` | For contract verification via Hardhat verify |
| `REPORT_GAS` | Set `true` to enable gas reporting in tests |
| `FACTORY_ADDRESS` | Used by seed script (set after deploy) |
| `ROUTER_ADDRESS` | Used by seed script (set after deploy) |
| `WQFC_ADDRESS` | Used by seed script (set after deploy) |

The frontend has **no env vars** — chain config and contract addresses are hardcoded in `frontend/src/lib/contracts.ts`.

## Adding New Pages / Components

**Pages:** Create a file in `frontend/src/pages/`. Next.js Pages Router auto-routes by filename. Add nav entry in `frontend/src/components/Layout.tsx` → `NAV_ITEMS` array.

**Components:** Add to `frontend/src/components/`. Use Tailwind with the `qfc-*` custom colors (primary, dark, card, border, accent) defined in `tailwind.config.js`.

**Hooks:** Add to `frontend/src/hooks/`. Pattern: custom React hook that creates ethers.js `Contract` instances using ABIs/addresses from `contracts.ts`.

**Styling:** Dark theme only. Colors: `bg-qfc-dark` (page bg), `bg-qfc-card` (card bg), `border-qfc-border`, `bg-qfc-primary`/`text-qfc-accent` (interactive). No CSS modules — Tailwind utility classes only.

## Contract Integration

All contract interaction flows through `frontend/src/lib/contracts.ts`:

- **`QFC_CHAIN`** — chain ID (9000), RPC URL, explorer URL, native currency
- **`ADDRESSES`** — deployed contract addresses (factory, router, wqfc). Currently zeroed out — must be updated after deployment
- **`TOKENS`** — token list with symbol/name/address/decimals
- **ABIs** — `FACTORY_ABI`, `ROUTER_ABI`, `PAIR_ABI`, `ERC20_ABI` in ethers.js human-readable format

**Wallet connection:** `useWallet` hook → `window.ethereum` (MetaMask) → ethers.js `BrowserProvider` + `JsonRpcSigner`

**Read-only calls (pools):** `usePools` creates its own `JsonRpcProvider` using `QFC_CHAIN.rpcUrl` — no wallet needed.

**Write calls (swap, liquidity):** Hooks receive `signer` from `useWallet`. Pattern: check allowance → approve if needed → call router method → `tx.wait()`.

Architecture: `DEXRouter` → `DEXFactory` → `DEXPair` (x*y=k, 0.3% fee, LP token)

## Deployment

### Docker
The `Dockerfile` is a 3-stage build (deps → builder → runner) that produces a standalone Next.js server. It runs from the `frontend/` context but the Dockerfile is at root. The image exposes port 3250.

**Note:** The Dockerfile copies from root but `npm run build` runs the frontend build. The `output: "standalone"` config must be set in `next.config.js` for the Docker build to work (currently missing — needs adding for Docker to succeed).

### GitHub Actions
`.github/workflows/docker.yml` triggers on:
- Push to `staging` branch
- Version tags (`v*`)

It builds multi-arch images (amd64 + arm64), pushes to GHCR (`ghcr.io`), and dispatches an update event to `qfc-network/qfc-testnet` repo with the image tag.

## Gotchas

1. **Contract addresses are zeroed out** in `contracts.ts`. After deploying, manually update `ADDRESSES` with real values.
2. **No `output: "standalone"` in next.config.js** — the Dockerfile expects standalone output but the config doesn't set it. Add `output: "standalone"` for Docker builds to work.
3. **All amounts assume 18 decimals** — `parseEther`/`formatEther` used everywhere. Will break for tokens with different decimals.
4. **No slippage protection** — swap passes `minOut = 0` (hardcoded in SwapCard). Users can get frontrun.
5. **Token list is static** — `TOKENS` array in `contracts.ts` is hardcoded. No dynamic token import.
6. **No error toasts** — swap errors are silently caught, liquidity page shows inline status text.
7. **The Dockerfile `COPY . .`** copies the entire monorepo root, not just `frontend/`. The build context should be considered.
