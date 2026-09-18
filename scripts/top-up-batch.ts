import { getAppConfig } from '../src/config/env.js';
import { loadIdentities } from '../src/config/identities.js';
import { SwarmBeeClient } from '../src/swarm/bee-client.js';
import { PostageBatchManager } from '../src/funding/batch-manager.js';

async function main() {
  console.log('=== SWARM POSTAGE BATCH FUNDING MANAGEMENT ===\n');

  const config = getAppConfig();
  const identities = loadIdentities(config);
  const beeClient = new SwarmBeeClient(config.BEE_API_URL, true); // Safe mock/live fallback

  const batchManager = new PostageBatchManager(beeClient, identities.storageSigner);
  const targetBatchId = config.BEE_POSTAGE_BATCH_ID;

  console.log(`Storage/Funding Signer: ${batchManager.getStorageSignerAddress()}`);
  console.log(`Target Postage Batch ID: ${targetBatchId}\n`);

  // 1. Inspect target batch
  const initialStatus = await batchManager.inspectCatalogueBatch(targetBatchId);
  console.log('Current Batch Status:');
  console.log(`- Label:       ${initialStatus.label}`);
  console.log(`- Usable:      ${initialStatus.usable}`);
  console.log(`- Balance:     ${initialStatus.amount} BZZ`);
  console.log(`- Depth:       ${initialStatus.depth}`);
  console.log(`- Utilization: ${(initialStatus.utilization * 100).toFixed(2)}%`);

  // 2. Perform Top-Up
  const topUpAmount = '5000000';
  console.log(`\nTopping up batch with ${topUpAmount} BZZ using Storage Signer...`);
  const toppedUpBatch = await batchManager.topUpCatalogueBatch(targetBatchId, topUpAmount);
  console.log(`New Balance: ${toppedUpBatch.amount} BZZ`);

  // 3. Extend Depth
  const newDepth = initialStatus.depth + 1;
  console.log(`\nExtending batch depth from ${initialStatus.depth} to ${newDepth}...`);
  const extendedBatch = await batchManager.extendCatalogueBatchDepth(targetBatchId, newDepth);
  console.log(`New Depth: ${extendedBatch.depth}`);

  console.log('\nBATCH MANAGEMENT COMPLETED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('Batch top-up failed:', err);
  process.exit(1);
});
