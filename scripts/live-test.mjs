// Live smoke test against the DEPLOYED Veyr contract on Studionet.
//
// Submits real posts through real validator LLM consensus, then reads the
// board back from chain state and asserts the recorded verdicts.
//
// Usage (from the project root):
//   npm run live-test
//
// Requires GENLAYER_PRIVATE_KEY and VITE_GENLAYER_CONTRACT_ADDRESS (env / .env).
// Exits non-zero when any assertion fails.

import { fail, loadDotEnv, makeClient, read, sleep, waitForConsensus } from './lib.mjs';

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
  const address = process.env.VITE_GENLAYER_CONTRACT_ADDRESS;
  if (!address) fail('VITE_GENLAYER_CONTRACT_ADDRESS is not set (environment or .env).');

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

  for (const sample of SAMPLES) {
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
