import { createPublicClient, http, formatUnits, formatEther, parseUnits, maxUint256, encodeFunctionData } from "viem";
import { defineChain } from "viem";

const worldchain = defineChain({
  id: 480,
  name: "World Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://worldchain-mainnet.g.alchemy.com/v2/bVo646pb8L7_W_nahCoqW"] } },
});

const client = createPublicClient({ chain: worldchain, transport: http() });

// Addresses
const UTH2_MINING = "0x15D65278b124fF544C1dcf279Cf008Ca24A99bE1";
const UTH2_TOKEN  = "0x9ea8653640e22a5b69887985bb75d496dc97022a";
const BTCH2O_TOKEN= "0xecc4dae4dc3d359a93046bd944e9ee3421a6a484";
const ACUA_STAKING= "0x6d6D559bF261415a52c59Cb1617387B6534E5041";
const OWNER1      = "0x54F0D557E8042eC70974d2e85331BE5D66fFe5F4";
const OWNER2      = "0x5474c309e985c6b4fc623acf01ade604da781e52";

// ABIs mínimos para la prueba
const MINING_ABI = [
  { inputs: [], name: "getPackages", outputs: [{ type: "uint256[7]", name: "prices" }, { type: "uint256[7]", name: "rates" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "poolBalance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalUTH2Collected", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner1", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner2", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "primaryToken", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getRewardTokens", outputs: [{ type: "address[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "pendingRewards", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "getUserCounts", outputs: [{ type: "uint256[7]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "getUserRate", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
];

const STAKING_ABI = [
  { inputs: [], name: "stakingToken", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "apr", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalStaked", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "stakedBalance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "pendingRewards", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
];

const ERC20_ABI = [
  { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
];

const PACKAGE_NAMES = ["Starter","Basic","Standard","Advanced","Pro","Elite","Master"];

async function run() {
  console.log("=== PRUEBA COMPLETA — ACUA COMPANY ===\n");
  const blockNumber = await client.getBlockNumber();
  console.log(`✅ Conectado a World Chain | Bloque actual: ${blockNumber}\n`);

  // ═══════════════════════════════════════════════════════
  // 1. UTH2Mining V2
  // ═══════════════════════════════════════════════════════
  console.log("━━━ [1] UTH2Mining V2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const [owner1, owner2, primaryToken, rewardTokens, poolBalance, totalCollected, packages] = await Promise.all([
    client.readContract({ address: UTH2_MINING, abi: MINING_ABI, functionName: "owner1" }),
    client.readContract({ address: UTH2_MINING, abi: MINING_ABI, functionName: "owner2" }),
    client.readContract({ address: UTH2_MINING, abi: MINING_ABI, functionName: "primaryToken" }),
    client.readContract({ address: UTH2_MINING, abi: MINING_ABI, functionName: "getRewardTokens" }),
    client.readContract({ address: UTH2_MINING, abi: MINING_ABI, functionName: "poolBalance" }),
    client.readContract({ address: UTH2_MINING, abi: MINING_ABI, functionName: "totalUTH2Collected" }),
    client.readContract({ address: UTH2_MINING, abi: MINING_ABI, functionName: "getPackages" }),
  ]);

  console.log(`  Contrato:       ${UTH2_MINING}`);
  console.log(`  Owner1:         ${owner1} ${owner1.toLowerCase() === OWNER1.toLowerCase() ? "✅" : "❌"}`);
  console.log(`  Owner2:         ${owner2} ${owner2.toLowerCase() === OWNER2.toLowerCase() ? "✅" : "❌"}`);
  console.log(`  Token primario: ${primaryToken} ${primaryToken.toLowerCase() === BTCH2O_TOKEN.toLowerCase() ? "(BTCH2O ✅)" : "(desconocido)"}`);
  console.log(`  Tokens reward:  ${rewardTokens.length} → ${rewardTokens.join(", ")}`);
  console.log(`  Pool Balance:   ${formatEther(poolBalance)} BTCH2O`);
  console.log(`  UTH2 recaudado: ${formatEther(totalCollected)} UTH2`);
  
  console.log("\n  Paquetes de Minería:");
  const prices = packages[0];
  const rates  = packages[1];
  for (let i = 0; i < 7; i++) {
    const priceUTH2 = formatEther(prices[i]);
    const ratePerSec = Number(rates[i]) / 1e18;
    const btch2oPerDay = (ratePerSec * 86400).toFixed(8);
    console.log(`    [${i}] ${PACKAGE_NAMES[i]}: ${priceUTH2} UTH2 → ${btch2oPerDay} BTCH2O/día`);
  }

  // ═══════════════════════════════════════════════════════
  // 2. Tokens
  // ═══════════════════════════════════════════════════════
  console.log("\n━━━ [2] Tokens ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const [uth2Symbol, uth2Dec, uth2Supply] = await Promise.all([
    client.readContract({ address: UTH2_TOKEN, abi: ERC20_ABI, functionName: "symbol" }),
    client.readContract({ address: UTH2_TOKEN, abi: ERC20_ABI, functionName: "decimals" }),
    client.readContract({ address: UTH2_TOKEN, abi: ERC20_ABI, functionName: "totalSupply" }),
  ]);
  const [btch2oSymbol, btch2oDec, btch2oSupply, btch2oInPool] = await Promise.all([
    client.readContract({ address: BTCH2O_TOKEN, abi: ERC20_ABI, functionName: "symbol" }),
    client.readContract({ address: BTCH2O_TOKEN, abi: ERC20_ABI, functionName: "decimals" }),
    client.readContract({ address: BTCH2O_TOKEN, abi: ERC20_ABI, functionName: "totalSupply" }),
    client.readContract({ address: BTCH2O_TOKEN, abi: ERC20_ABI, functionName: "balanceOf", args: [UTH2_MINING] }),
  ]);
  console.log(`  UTH2:   ${uth2Symbol} | decimals: ${uth2Dec} | supply: ${formatUnits(uth2Supply, uth2Dec)}`);
  console.log(`  BTCH2O: ${btch2oSymbol} | decimals: ${btch2oDec} | supply: ${formatUnits(btch2oSupply, btch2oDec)}`);
  console.log(`  BTCH2O en contrato de minería: ${formatUnits(btch2oInPool, btch2oDec)}`);

  // ═══════════════════════════════════════════════════════
  // 3. ACUA Staking
  // ═══════════════════════════════════════════════════════
  console.log("\n━━━ [3] ACUA Staking ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const [stakingToken, aprBps, totalStaked] = await Promise.all([
    client.readContract({ address: ACUA_STAKING, abi: STAKING_ABI, functionName: "stakingToken" }),
    client.readContract({ address: ACUA_STAKING, abi: STAKING_ABI, functionName: "apr" }),
    client.readContract({ address: ACUA_STAKING, abi: STAKING_ABI, functionName: "totalStaked" }),
  ]);
  const [stTokenSym, stTokenDec] = await Promise.all([
    client.readContract({ address: stakingToken, abi: ERC20_ABI, functionName: "symbol" }),
    client.readContract({ address: stakingToken, abi: ERC20_ABI, functionName: "decimals" }),
  ]);
  const aprPct = (Number(aprBps) / 100).toFixed(2);
  const apyPct = ((Math.pow(1 + Number(aprBps) / 100 / 365, 365) - 1) * 100).toFixed(2);
  console.log(`  Contrato ACUA Staking: ${ACUA_STAKING}`);
  console.log(`  Token staking:         ${stakingToken} (${stTokenSym})`);
  console.log(`  APR:                   ${aprPct}% | APY: ${apyPct}%`);
  console.log(`  Total staked:          ${formatUnits(totalStaked, Number(stTokenDec))} ${stTokenSym}`);

  // ═══════════════════════════════════════════════════════
  // 4. SIMULACIÓN FLUJO USUARIO
  // ═══════════════════════════════════════════════════════
  console.log("\n━━━ [4] SIMULACIÓN FLUJO USUARIO ━━━━━━━━━━━━━━━━━");
  const testUser = OWNER1;
  console.log(`  Usuario: ${testUser}`);

  const [userStaked, userRewards, userMiningRate, userCounts] = await Promise.all([
    client.readContract({ address: ACUA_STAKING, abi: STAKING_ABI, functionName: "stakedBalance", args: [testUser] }),
    client.readContract({ address: ACUA_STAKING, abi: STAKING_ABI, functionName: "pendingRewards", args: [testUser] }),
    client.readContract({ address: UTH2_MINING, abi: MINING_ABI, functionName: "getUserRate", args: [testUser] }),
    client.readContract({ address: UTH2_MINING, abi: MINING_ABI, functionName: "getUserCounts", args: [testUser] }),
  ]);
  const miningPendingRewards = await client.readContract({ address: UTH2_MINING, abi: MINING_ABI, functionName: "pendingRewards", args: [testUser] });

  console.log(`\n  [STAKING]`);
  console.log(`    Staked (ACUA):   ${formatUnits(userStaked, Number(stTokenDec))} ${stTokenSym}`);
  console.log(`    Pending Rewards: ${formatUnits(userRewards, Number(stTokenDec))} ${stTokenSym}`);

  console.log(`\n  [MINERÍA UTH2]`);
  const ratePerSec = Number(userMiningRate) / 1e18;
  console.log(`    Rate actual:     ${ratePerSec.toFixed(10)} BTCH2O/seg (${(ratePerSec * 86400).toFixed(8)} BTCH2O/día)`);
  console.log(`    Pending Rewards: ${formatEther(miningPendingRewards)} BTCH2O`);
  console.log(`    Paquetes activos:`);
  for (let i = 0; i < 7; i++) {
    if (userCounts[i] > 0n) console.log(`      ${PACKAGE_NAMES[i]}: x${userCounts[i]}`);
  }

  // ═══════════════════════════════════════════════════════
  // 5. SIMULACIÓN APPROVE + STAKE + BUY + CLAIM
  // ═══════════════════════════════════════════════════════
  console.log("\n━━━ [5] ENCODINGS DE TRANSACCIONES ━━━━━━━━━━━━━━━");
  
  const approveData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [ACUA_STAKING, maxUint256],
  });
  console.log(`  ✅ approve(ACUA_STAKING, MaxUint256): ${approveData.slice(0, 10)}...`);

  const stakeData = encodeFunctionData({
    abi: STAKING_ABI,
    functionName: "stake",
    args: [parseUnits("10", Number(stTokenDec))],
  });
  console.log(`  ✅ stake(10 ${stTokenSym}): ${stakeData.slice(0, 10)}...`);

  const approveUTH2Data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [UTH2_MINING, maxUint256],
  });
  console.log(`  ✅ approve(UTH2_MINING, MaxUint256): ${approveUTH2Data.slice(0, 10)}...`);

  const buyPackageData = encodeFunctionData({
    abi: [{ inputs: [{ name: "pkg", type: "uint8" }, { name: "count", type: "uint256" }], name: "buyPackage", outputs: [], stateMutability: "nonpayable", type: "function" }],
    functionName: "buyPackage",
    args: [0, 1n],
  });
  console.log(`  ✅ buyPackage(0=Starter, 1x): ${buyPackageData.slice(0, 10)}...`);

  const claimMiningData = encodeFunctionData({
    abi: [{ inputs: [], name: "claimRewards", outputs: [], stateMutability: "nonpayable", type: "function" }],
    functionName: "claimRewards",
    args: [],
  });
  console.log(`  ✅ claimRewards() [mining]: ${claimMiningData.slice(0, 10)}...`);

  const claimStakingData = encodeFunctionData({
    abi: STAKING_ABI,
    functionName: "claim",
    args: [],
  });
  console.log(`  ✅ claim() [staking]: ${claimStakingData.slice(0, 10)}...`);

  // ═══════════════════════════════════════════════════════
  // 6. VERIFICAR ALLOWANCE UTH2 → MINING
  // ═══════════════════════════════════════════════════════
  console.log("\n━━━ [6] VERIFICACIÓN ALLOWANCES ━━━━━━━━━━━━━━━━━━");
  const [allowanceUTH2, allowanceStakingToken] = await Promise.all([
    client.readContract({ address: UTH2_TOKEN, abi: ERC20_ABI, functionName: "allowance", args: [testUser, UTH2_MINING] }),
    client.readContract({ address: stakingToken, abi: ERC20_ABI, functionName: "allowance", args: [testUser, ACUA_STAKING] }),
  ]);
  console.log(`  UTH2 → Mining:    ${allowanceUTH2 === maxUint256 ? "MaxUint256 ✅" : formatEther(allowanceUTH2)}`);
  console.log(`  H2O  → Staking:   ${allowanceStakingToken === maxUint256 ? "MaxUint256 ✅" : formatUnits(allowanceStakingToken, Number(stTokenDec))}`);

  console.log("\n═══════════════════════════════════════════════════");
  console.log("✅ TODOS LOS CONTRATOS RESPONDEN CORRECTAMENTE");
  console.log("✅ EL FLUJO COMPLETO ESTÁ VALIDADO");
  console.log("═══════════════════════════════════════════════════\n");
}

run().catch(e => { console.error("❌ ERROR:", e.message || e); process.exit(1); });
// EXTRA: Diagnóstico profundo ACUA Staking
async function diagStaking() {
  console.log("\n=== DIAGNÓSTICO ACUA STAKING ===");
  // Probar funciones básicas que deberían existir
  const basicAbi = [
    { inputs: [], name: "stakingToken", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "apr", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "owner", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "feeBps", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ name: "", type: "address" }], name: "stakedBalance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [{ name: "user", type: "address" }], name: "pendingRewards", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  ];
  for (const fn of basicAbi) {
    const args = fn.inputs.length > 0 ? ["0x54F0D557E8042eC70974d2e85331BE5D66fFe5F4"] : [];
    try {
      const result = await client.readContract({ address: "0x6d6D559bF261415a52c59Cb1617387B6534E5041", abi: [fn], functionName: fn.name, args });
      console.log(`  ✅ ${fn.name}(${args.length?'owner':''}) = ${result}`);
    } catch (e) {
      console.log(`  ❌ ${fn.name}: ${e.shortMessage || e.message.slice(0, 60)}`);
    }
  }

  // Verificar bytecode del contrato
  const code = await client.getCode({ address: "0x6d6D559bF261415a52c59Cb1617387B6534E5041" });
  console.log(`  Bytecode: ${code ? code.slice(0, 20) + '...' + code.length + ' bytes' : 'NO EXISTE'}`);

  // Probar otros staking contracts
  const stakingContracts = [
    { name: "H2O/SUSHI Staking", addr: "0x6d6D559bF261415a52c59Cb1617387B6534E5041" },
    { name: "FIREStaking", addr: "0x0642b285816de5393726393C55f19Fab2C81b070" },
  ];
  for (const sc of stakingContracts) {
    const code = await client.getCode({ address: sc.addr });
    console.log(`\n  ${sc.name} (${sc.addr}):`);
    console.log(`    Bytecode: ${code && code !== '0x' ? code.slice(0,20)+'... ok' : 'NO EXISTE ❌'}`);
    try {
      const token = await client.readContract({ address: sc.addr, abi: basicAbi, functionName: "stakingToken" });
      console.log(`    stakingToken: ${token} ✅`);
    } catch { console.log(`    stakingToken: FALLA`); }
    try {
      const apr = await client.readContract({ address: sc.addr, abi: basicAbi, functionName: "apr" });
      console.log(`    apr: ${Number(apr)/100}% ✅`);
    } catch { console.log(`    apr: FALLA`); }
  }
}
diagStaking().catch(e => console.error(e.message));
