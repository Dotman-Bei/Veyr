// Deploy the Veyr Intelligent Contract to GenLayer Studionet.
//
// Usage (from the project root):
//   npm run deploy                      # deploy, or resume a pending deployment
//   npm run deploy -- --resume 0x<hash> # resume tracking a known tx hash
//   npm run deploy -- --fresh           # ignore any pending deployment state
//   npm run deploy -- --record deployments/studionet-smoke.json
//                                       # write the record elsewhere (e.g. a throwaway test contract)
//
// Reads GENLAYER_PRIVATE_KEY and MODERATION_TOPIC from the environment / .env.
// On success writes deployments/<network>.json (address + tx hash, no secrets),
// or the path given with --record.
//
// Interrupted runs are NOT blindly redeployed: the tx hash is saved to
// .deploy-state.json before waiting, and the next run resumes tracking it.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  ROOT,
  fail,
  loadDotEnv,
  makeClient,
  read,
  toJson,
  waitForConsensus,
  withRetry,
} from './lib.mjs';

const CONTRACT_PATH = join(ROOT, 'contract', 'veyr.py');
const STATE_PATH = join(ROOT, '.deploy-state.json');
const MIN_BALANCE_WEI = 10n ** 18n; // 1 GEN is plenty for Studionet writes

function parseArgs(argv) {
  const args = { resume: null, fresh: false, record: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--resume') args.resume = argv[++i];
    else if (argv[i] === '--fresh') args.fresh = true;
    else if (argv[i] === '--record') args.record = argv[++i];
    else fail(`Unknown argument: ${argv[i]}`);
  }
  if (args.resume && !/^0x[0-9a-fA-F]{64}$/.test(args.resume)) fail('--resume expects a 32-byte tx hash.');
  if (args.record !== null && !/^[\w./-]+\.json$/.test(args.record ?? '')) fail('--record expects a .json path.');
  return args;
}

function readState() {
  if (!existsSync(STATE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

async function ensureFunded(client, chain, address) {
  const balance = await withRetry(() => client.getBalance({ address }));
  console.log(`  balance:   ${Number(balance) / 1e18} GEN`);
  if (balance >= MIN_BALANCE_WEI) return;

  if (!chain.isStudio) fail(`Account ${address} has insufficient GEN on ${chain.name}. Fund it and retry.`);

  // Studio-based networks (Studionet / localnet) mint test GEN on request.
  // The amount is in wei; 1e20 (100 GEN) is exactly representable as a JSON number.
  console.log('  balance low, requesting 100 test GEN from Studionet (sim_fundAccount)…');
  await withRetry(() => client.request({ method: 'sim_fundAccount', params: [address, 100e18] }));
  const funded = await withRetry(() => client.getBalance({ address }));
  if (funded < MIN_BALANCE_WEI) fail('Funding request did not increase the balance.');
  console.log(`  balance:   ${Number(funded) / 1e18} GEN`);
}

function contractAddressOf(tx) {
  const candidates = [
    tx?.data?.contract_address,
    tx?.recipient,
    tx?.to_address,
    tx?.txDataDecoded?.contractAddress,
  ];
  return candidates.find((v) => typeof v === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v)) ?? null;
}

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));
  const { client, account, chain, network, rpcUrl } = makeClient();
  const topic = (process.env.MODERATION_TOPIC || 'GenLayer and blockchain development').trim();

  console.log('── Veyr deployment ─────────────────────────────────────────');
  console.log(`  network:   ${network} (${chain.name}, chain id ${chain.id})`);
  console.log(`  rpc:       ${rpcUrl}`);
  console.log(`  deployer:  ${account.address}`);
  console.log(`  topic:     "${topic}"`);

  if (network !== 'studionet') console.warn(`  ⚠ deploying to ${network}, not studionet`);

  const remoteChainId = Number(await withRetry(() => client.request({ method: 'eth_chainId' })));
  if (remoteChainId !== chain.id) fail(`RPC reports chain id ${remoteChainId}, expected ${chain.id}.`);

  const pending = args.fresh ? null : readState();
  let hash = args.resume ?? (pending?.network === network ? pending.txHash : null);

  if (hash) {
    console.log(`\n  resuming tracking of known deployment tx ${hash}`);
  } else {
    await ensureFunded(client, chain, account.address);

    const code = readFileSync(CONTRACT_PATH, 'utf-8');
    // Pre-flight: let the network's GenVM parse the contract before spending a tx.
    const schema = await withRetry(() => client.getContractSchemaForCode(code));
    const methods = Object.keys(schema?.methods ?? {});
    console.log(`  schema:    ok (${methods.length} methods: ${methods.join(', ')})`);

    hash = await client.deployContract({ code, args: [topic] });
    writeFileSync(STATE_PATH, toJson({ network, txHash: hash, topic, startedAt: new Date().toISOString() }));
    console.log(`\n  tx hash:   ${hash}`);
  }

  console.log('  waiting for consensus…');
  let tx;
  try {
    tx = await waitForConsensus(client, hash, { onStatus: (s) => console.log(`    …${s}`) });
  } catch (err) {
    if (err.tx) {
      rmSync(STATE_PATH, { force: true });
      fail(`Deployment failed: ${err.message}\n${toJson(err.tx?.consensus_data?.leader_receipt?.[0] ?? err.tx)}`);
    }
    fail(`${err.message}\nRe-run \`npm run deploy\` to resume tracking ${hash}.`);
  }

  const address = contractAddressOf(tx);
  if (!address) fail(`Deployment accepted but no contract address found:\n${toJson(tx)}`);

  // Verify the deployed state actually answers before declaring success.
  const deployedTopic = await read(client, address, 'get_topic');
  if (deployedTopic !== topic) fail(`Deployed topic mismatch: "${deployedTopic}"`);

  const record = {
    network,
    chainId: chain.id,
    contractAddress: address,
    deploymentTxHash: hash,
    status: tx.statusName,
    deployer: account.address,
    topic,
    deployedAt: new Date().toISOString(),
  };
  const recordPath = args.record ?? join('deployments', `${network}.json`);
  mkdirSync(dirname(join(ROOT, recordPath)), { recursive: true });
  writeFileSync(join(ROOT, recordPath), toJson(record) + '\n');
  rmSync(STATE_PATH, { force: true });

  console.log('\n✔ Deployment accepted and verified.');
  console.log(`  contract:  ${address}`);
  console.log(`  tx hash:   ${hash}`);
  console.log(`  saved:     ${recordPath}`);
  if (!args.record) {
    console.log('\nSet this in your .env:');
    console.log(`  VITE_GENLAYER_CONTRACT_ADDRESS=${address}`);
  }
}

main().catch((err) => fail(`Deployment failed: ${err?.message ?? err}`));
