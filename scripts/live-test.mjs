// Live smoke test against the DEPLOYED Veyr contract on Studionet.
//
// Submits real posts through real validator LLM consensus, then reads the
// board back from chain state and asserts the recorded verdicts.
//
// Usage (from the project root):
//   npm run live-test                         # targets the smoke-test contract
//   LIVE_TEST_CONTRACT=0x… npm run live-test   # any other contract
//
// Target: LIVE_TEST_CONTRACT, else deployments/<network>-smoke-test.json, else
// VITE_GENLAYER_CONTRACT_ADDRESS. It refuses to post into the launch contract
// (deployments/<network>.json) unless run with --allow-launch-contract, because
// the smoke test leaves permanent example posts, one of them deliberately toxic.
//
// Requires GENLAYER_PRIVATE_KEY (env / .env).
// Exits non-zero when any assertion fails.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, fail, loadDotEnv, makeClient, read, resolveChain, sleep, waitForConsensus } from './lib.mjs';

function recordAddress(file) {
  const path = join(ROOT, 'deployments', file);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')).contractAddress ?? null;
  } catch {
    return null;
  }
}

/** Pick the contract to test, never silently the public launch contract. */
function resolveTarget() {
  const { name } = resolveChain();
  const target =
    process.env.LIVE_TEST_CONTRACT || recordAddress(`${name}-smoke-test.json`) || process.env.VITE_GENLAYER_CONTRACT_ADDRESS;
  if (!target) fail('No contract to test: set LIVE_TEST_CONTRACT or deploy one with --record deployments/<network>-smoke-test.json.');
  const launch = recordAddress(`${name}.json`);
  if (launch && target.toLowerCase() === launch.toLowerCase() && !process.argv.includes('--allow-launch-contract')) {
    fail(
      `Refusing to post test content into the launch contract ${launch}.\n` +
        'Use the smoke-test contract (default), set LIVE_TEST_CONTRACT, or pass --allow-launch-contract.',
    );
  }
  return target;
}

const SAMPLES = [
  {
    label: 'clean + on-topic',
    expect: 'APPROVE',
    text:
      'I love how GenLayer validators reach consensus on subjective decisions using ' +
      'the Equivalence Principle. Intelligent Contracts that can reason about natural ' +
      'language make on-chain community moderation possible without a central admin.',
  },
  {
    label: 'toxic',
    expect: 'REJECT',
    text: 'You are all complete idiots and I hate every single one of you losers.',
  },
];

const failures = [];

function check(condition, message) {
  console.log(`  ${condition ? '✔' : '✖'} ${message}`);
  if (!condition) failures.push(message);
}

async function stats(client, address, author) {
  return {
    posts: Number(await read(client, address, 'get_post_count')),
    approved: Number(await read(client, address, 'get_approved_count')),
    reputation: Number(await read(client, address, 'get_reputation', [author])),
  };
}

async function main() {
  loadDotEnv();
  const address = resolveTarget();

  const { client, account, network } = makeClient();

  console.log('── Veyr live moderation smoke test ─────────────────────────');
  console.log('network         :', network);
  console.log('contract address:', address);
  console.log('account address :', account.address);
  console.log('topic           :', await read(client, address, 'get_topic'));

  const initial = await stats(client, address, account.address);
  console.log('posts before    :', initial.posts);
  console.log('approved before :', initial.approved);
  console.log('reputation before:', initial.reputation, '\n');

  let lastAcceptedAt = 0;
  for (const sample of SAMPLES) {
    // The contract allows one post per author per cooldown; wait it out rather than be refused.
    const { cooldown_seconds: cooldown } = await read(client, address, 'get_limits').then((l) => Object.fromEntries(l instanceof Map ? l : Object.entries(l)));
    const waitMs = lastAcceptedAt + (Number(cooldown) + 5) * 1000 - Date.now();
    if (waitMs > 0) {
      console.log(`  (cooldown: waiting ${Math.ceil(waitMs / 1000)}s)`);
      await sleep(waitMs);
    }
    console.log(`▶ ${sample.label} (expect ${sample.expect})`);
    console.log(`  "${sample.text.slice(0, 72)}…"`);
    const before = await stats(client, address, account.address);

    const hash = await client.writeContract({
      address,
      functionName: 'submit_post',
      args: [sample.text],
      value: 0n,
    });
    console.log('  transaction hash  :', hash);

    let tx;
    try {
      tx = await waitForConsensus(client, hash, { onStatus: (s) => console.log(`    …${s}`) });
    } catch (err) {
      console.log('  transaction status:', err.tx?.statusName ?? 'unknown');
      failures.push(`${sample.label}: ${err.message}`);
      continue;
    }
    console.log('  transaction status:', tx.statusName);
    lastAcceptedAt = Date.now();

    await sleep(1000);
    const newest = (await read(client, address, 'get_posts'))[0];
    const after = await stats(client, address, account.address);
    const verdict = newest?.approved ? 'APPROVE' : 'REJECT';

    console.log('  actual verdict    :', verdict);
    console.log('  actual category   :', newest?.category);
    console.log('  actual reason     :', newest?.reason);

    const approved = sample.expect === 'APPROVE';
    check(newest?.text === sample.text, 'newest on-chain post is this submission');
    check(newest?.author?.toLowerCase() === account.address.toLowerCase(), 'author is the signing account');
    check(verdict === sample.expect, `verdict is ${sample.expect}`);
    check(approved ? newest?.category === 'approved' : newest?.category !== 'approved', 'category matches verdict');
    check(typeof newest?.reason === 'string' && newest.reason.length > 0, 'reason is recorded');
    check(after.posts === before.posts + 1, 'post count +1');
    check(after.approved === before.approved + (approved ? 1 : 0), `approved count ${approved ? '+1' : 'unchanged'}`);
    check(after.reputation === before.reputation + (approved ? 1 : -1), `reputation ${approved ? '+1' : '-1'}`);
    const feedTop = (await read(client, address, 'get_feed_page', [0, 1]))[0];
    check(approved ? feedTop?.text === sample.text : feedTop?.text !== sample.text, `public feed ${approved ? 'shows' : 'hides'} it`);
    console.log();
  }

  const final = await stats(client, address, account.address);
  console.log('── Results ─────────────────────────────────────────────────');
  console.log('posts after     :', final.posts, `(added ${final.posts - initial.posts})`);
  console.log('approved total  :', final.approved);
  console.log('final reputation:', final.reputation);

  if (failures.length > 0) {
    console.error(`\n✖ ${failures.length} assertion(s) failed:`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`\n✔ Veyr moderation works end-to-end on ${network}.`);
}

main().catch((err) => fail(`Live test failed: ${err?.message ?? err}`));
