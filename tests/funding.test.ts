import { describe, it, expect } from 'vitest';
import { getAppConfig } from '../src/config/env.js';
import { loadIdentities } from '../src/config/identities.js';
import { SwarmBeeClient } from '../src/swarm/bee-client.js';
import { PostageBatchManager } from '../src/funding/batch-manager.js';

describe('PostageBatchManager Unit Tests', () => {
  const config = getAppConfig();
  const identities = loadIdentities(config);
  const beeClient = new SwarmBeeClient(config.BEE_API_URL, true);
  const batchManager = new PostageBatchManager(beeClient, identities.storageSigner);

  it('inspects catalogue batch status correctly', async () => {
    const summary = await batchManager.inspectCatalogueBatch(config.BEE_POSTAGE_BATCH_ID);
    expect(summary.usable).toBe(true);
    expect(summary.batchId).toBe(config.BEE_POSTAGE_BATCH_ID);
    expect(summary.isFundingSufficient).toBe(true);
  });

  it('fails top-up if amount is zero or negative', async () => {
    await expect(
      batchManager.topUpCatalogueBatch(config.BEE_POSTAGE_BATCH_ID, '0')
    ).rejects.toThrow(/INVALID_TOPUP_AMOUNT/);
  });

  it('fails extending depth if new depth is not strictly greater', async () => {
    const status = await batchManager.inspectCatalogueBatch(config.BEE_POSTAGE_BATCH_ID);
    await expect(
      batchManager.extendCatalogueBatchDepth(config.BEE_POSTAGE_BATCH_ID, status.depth)
    ).rejects.toThrow(/INVALID_DEPTH/);
  });
});
