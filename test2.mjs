import { createPublicClient, http, formatUnits, formatEther } from "viem";
import { defineChain } from "viem";

const worldchain = defineChain({
  id: 480, name: "World Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://worldchain-mainnet.g.alchemy.com/v2/bVo646pb8L7_W_nahCoqW"] } },
});
const client = createPublicClient({ chain: worldchain, transport: http() });

const OWNER1 = "0x54F0D557E8042eC70974d2e85331BE5D66fFe5F4";

// Contratos de staking a verificar
const stakingContracts = [
  { name: "ACUA/H2O", addr: "0x6d6D559bF261415a52c59Cb1617387B6534E5041" },
  { name: "FIRE",     addr: "0x0642b285816de5393726393C55f19Fab2C81b070" },
];

const ERC20_ABI = [
  { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" },
];

async function tryRead(addr, fn, args = []) {
  const abi = [{ inputs: args.map((_, i) => ({ name: `a${i}`, type: "address" })), name: fn, outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }];
  try { return await client.readContract({ address: addr, abi, functionName: fn, args }); } catch { return null; }
}
async function tryReadAddr(addr, fn) {
  const abi = [{ inputs: [], name: fn, outputs: [{ type: "address" }], stateMutability: "view", type: "function" }];
  try { return await client.readContract({ address: addr, abi, functionName: fn }); } catch { return null; }
}

console.log("=== DIAGNÓSTICO COMPLETO STAKING CONTRACTS ===\n");

// Probar qué funciones existen realmente
const funcsToTest = [
  "stakingToken", "apr", "totalStaked", "owner", "feeBps",
  "totalDeposited", "totalSupply", "rewardRate", "REWARD_RATE"
];

for (const sc of stakingContracts) {
  const code = await client.getCode({ address: sc.addr });
  console.log(`\n[${sc.name}] ${sc.addr}`);
  console.log(`  Deployed: ${code && code !== '0x' ? '✅' : '❌ NO EXISTE'}`);
  
  // Probar funciones que retornan uint256
  for (const fn of funcsToTest) {
    const abi = [{ inputs: [], name: fn, outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }];
    try {
      const r = await client.readContract({ address: sc.addr, abi, functionName: fn });
      console.log(`  ✅ ${fn}() = ${r}`);
    } catch {
      console.log(`  ❌ ${fn}() - no existe`);
    }
  }
  
  // Probar funciones que retornan address
  for (const fn of ["stakingToken", "owner", "rewardToken"]) {
    const r = await tryReadAddr(sc.addr, fn);
    if (r) {
      let sym = "";
      try {
        sym = await client.readContract({ address: r, abi: ERC20_ABI, functionName: "symbol" });
      } catch {}
      console.log(`  ✅ ${fn}() = ${r} (${sym})`);
    }
  }
  
  // Probar con user arg
  for (const fn of ["stakedBalance", "pendingRewards", "balanceOf"]) {
    const abi = [{ inputs: [{ name: "user", type: "address" }], name: fn, outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }];
    try {
      const r = await client.readContract({ address: sc.addr, abi, functionName: fn, args: [OWNER1] });
      console.log(`  ✅ ${fn}(owner1) = ${formatEther(r)}`);
    } catch {
      console.log(`  ❌ ${fn}(owner1) - no existe`);
    }
  }
}

// Ahora verifica todos los contratos de staking del frontend
console.log("\n=== STAKING CONTRACTS DEL FRONTEND ===");

// Leer los configs
const configs = [
  { name: "USDC Staking", addr: "0xd60ceeA0f583704B29E010735EE1112F17E7d5Ac", decimals: 6 },
  { name: "WLD Staking",  addr: "0x1000DB166A7B118777dc6DCC126c444E284bDE5f", decimals: 18 },
  { name: "WARS Staking", addr: "0xE6A16d1D4b0680059E0Db9666FA63789a006cafF", decimals: 18 },
];

for (const c of configs) {
  const code = await client.getCode({ address: c.addr });
  console.log(`\n[${c.name}] ${c.addr}`);
  console.log(`  Deployed: ${code && code !== '0x' ? '✅' : '❌ NO EXISTE'}`);
  const stToken = await tryReadAddr(c.addr, "stakingToken");
  if (stToken) {
    let sym = "";
    try { sym = await client.readContract({ address: stToken, abi: ERC20_ABI, functionName: "symbol" }); } catch {}
    console.log(`  stakingToken: ${stToken} (${sym}) ✅`);
  }
  const apr = await tryRead(c.addr, "apr");
  if (apr !== null) console.log(`  apr: ${Number(apr)/100}% ✅`);
}

// Mining status del owner
console.log("\n=== OWNER MINING STATUS ===");
const MINING = "0x15D65278b124fF544C1dcf279Cf008Ca24A99bE1";
const MINING_ABI = [
  { inputs: [{ name: "user", type: "address" }], name: "pendingRewards", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "getUserCounts", outputs: [{ type: "uint256[7]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "getUserRate", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getPackages", outputs: [{ type: "uint256[7]", name: "prices" }, { type: "uint256[7]", name: "rates" }], stateMutability: "view", type: "function" },
];
const NAMES = ["Starter","Basic","Standard","Advanced","Pro","Elite","Master"];
const [pending, counts, rate, pkgs] = await Promise.all([
  client.readContract({ address: MINING, abi: MINING_ABI, functionName: "pendingRewards", args: [OWNER1] }),
  client.readContract({ address: MINING, abi: MINING_ABI, functionName: "getUserCounts", args: [OWNER1] }),
  client.readContract({ address: MINING, abi: MINING_ABI, functionName: "getUserRate", args: [OWNER1] }),
  client.readContract({ address: MINING, abi: MINING_ABI, functionName: "getPackages" }),
]);
console.log(`Pending BTCH2O rewards: ${formatEther(pending)}`);
console.log(`Rate: ${formatEther(rate)} BTCH2O/seg`);
console.log("Paquetes (precios reales del contrato):");
for (let i = 0; i < 7; i++) {
  const price = formatEther(pkgs[0][i]);
  const rateRaw = pkgs[1][i];
  const ratePerSec = formatEther(rateRaw);
  const perDay = (Number(ratePerSec) * 86400).toFixed(6);
  console.log(`  [${i}] ${NAMES[i]}: precio=${price} UTH2 | rate=${ratePerSec} BTCH2O/seg | ${perDay} BTCH2O/día`);
}
if (counts.some(c => c > 0n)) {
  console.log("Paquetes activos del owner:");
  for (let i = 0; i < 7; i++) {
    if (counts[i] > 0n) console.log(`  ${NAMES[i]}: x${counts[i]}`);
  }
}

console.log("\n✅ DIAGNÓSTICO COMPLETADO");
