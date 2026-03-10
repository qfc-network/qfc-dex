export const QFC_CHAIN = {
  chainId: 9000,
  chainIdHex: "0x2328",
  name: "QFC Testnet",
  rpcUrl: "https://rpc.testnet.qfc.network",
  explorer: "https://explorer.testnet.qfc.network",
  nativeCurrency: { name: "QFC", symbol: "QFC", decimals: 18 },
};

// ── Deployed addresses (update after deploy) ──
export const ADDRESSES = {
  factory: "0x0000000000000000000000000000000000000000",
  router: "0x0000000000000000000000000000000000000000",
  wqfc: "0x0000000000000000000000000000000000000000",
};

export const TOKENS: Token[] = [
  { symbol: "WQFC", name: "Wrapped QFC", address: ADDRESSES.wqfc, decimals: 18 },
  { symbol: "TTK", name: "TTK Token", address: "0xff9427b41587206cea2b156a9967fb4d4dbf99d0", decimals: 18 },
  { symbol: "QDOGE", name: "QDOGE Token", address: "0xb7938ce567a164a216fa2d0aa885e32608b2e621", decimals: 18 },
];

export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

// ── ABIs (minimal) ──
export const FACTORY_ABI = [
  "function getPair(address,address) view returns (address)",
  "function allPairs(uint256) view returns (address)",
  "function allPairsLength() view returns (uint256)",
  "function createPair(address,address) returns (address)",
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint256)",
];

export const ROUTER_ABI = [
  "function addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256) returns (uint256,uint256,uint256)",
  "function removeLiquidity(address,address,uint256,uint256,uint256,address,uint256) returns (uint256,uint256)",
  "function swapExactTokensForTokens(uint256,uint256,address[],address,uint256) returns (uint256[])",
  "function swapTokensForExactTokens(uint256,uint256,address[],address,uint256) returns (uint256[])",
  "function getAmountsOut(uint256,address[]) view returns (uint256[])",
  "function getAmountsIn(uint256,address[]) view returns (uint256[])",
  "function quote(uint256,uint256,uint256) pure returns (uint256)",
  "function factory() view returns (address)",
  "function WQFC() view returns (address)",
];

export const PAIR_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
  "event Mint(address indexed sender, uint256 amount0, uint256 amount1)",
  "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)",
];

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
];
