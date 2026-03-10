# QFC DEX

AMM decentralized exchange (Uniswap V2 style) on QFC Network. Supports token swaps with 0.3% fee and liquidity provision.

## Contracts

| Contract | Description |
|----------|-------------|
| `DEXFactory` | Creates and manages trading pairs |
| `DEXPair` | x*y=k AMM with LP token (QRC20) |
| `DEXRouter` | User-facing: swap, addLiquidity, removeLiquidity |
| `WQFC` | Wrapped native QFC token |

## Setup

```bash
npm install
cp .env.example .env  # Add your PRIVATE_KEY
```

## Compile & Test

```bash
npx hardhat compile
npx hardhat test
```

## Deploy to QFC Testnet

```bash
npx hardhat run scripts/deploy.ts --network qfc_testnet
```

## Seed Liquidity

After deploying, set the addresses and run:

```bash
export FACTORY_ADDRESS=0x...
export ROUTER_ADDRESS=0x...
export WQFC_ADDRESS=0x...
npx hardhat run scripts/seed.ts --network qfc_testnet
```

## Contract Addresses (Testnet)

| Contract | Address |
|----------|---------|
| WQFC | `TBD` |
| DEXFactory | `TBD` |
| DEXRouter | `TBD` |

### Existing Tokens

| Token | Address |
|-------|---------|
| TTK | `0xff9427b41587206cea2b156a9967fb4d4dbf99d0` |
| QDOGE | `0xb7938ce567a164a216fa2d0aa885e32608b2e621` |

## Frontend

```bash
cd frontend
npm install
npm run dev  # Runs on port 3250
```

Pages: Swap, Liquidity, Pools, My Positions

## Architecture

```
DEXRouter
  └── DEXFactory
        └── DEXPair (x * y = k, 0.3% fee, LP Token)
```

## License

MIT
