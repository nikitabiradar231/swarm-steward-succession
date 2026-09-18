import { describe, it, expect } from 'vitest';
import { Wallet } from 'ethers';
import { getAppConfig } from '../src/config/env.js';
import { loadIdentities } from '../src/config/identities.js';
import { GovernanceStewardRegistry } from '../src/governance/stewards.js';
import { GovernanceService } from '../src/governance/governance-service.js';

describe('GovernanceService Unit Tests', () => {
  const config = getAppConfig();
  const identities = loadIdentities(config);
  const registry = new GovernanceStewardRegistry(identities.stewardSigners);
  const governance = new GovernanceService(registry);

  it('computes deterministic proposal hashes', () => {
    const proposal = governance.createProposal(
      identities.publisherSigner.address,
      Wallet.createRandom().address
    );
    const hash1 = governance.computeProposalHash(proposal);
    const hash2 = governance.computeProposalHash(proposal);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('rejects signatures from non-steward wallets', async () => {
    const proposal = governance.createProposal(
      identities.publisherSigner.address,
      Wallet.createRandom().address
    );
    const randomRogueWallet = Wallet.createRandom();

    await expect(
      governance.signProposal(proposal, randomRogueWallet)
    ).rejects.toThrow(/UNAUTHORIZED/);
  });
});
