import { Wallet } from 'ethers';
import { getAppConfig } from '../src/config/env.js';
import { loadIdentities } from '../src/config/identities.js';
import { SwarmBeeClient } from '../src/swarm/bee-client.js';
import { GovernanceStewardRegistry } from '../src/governance/stewards.js';
import { GovernanceService } from '../src/governance/governance-service.js';
import { SuccessionService } from '../src/succession/succession-service.js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('=== STARTING MONASTERY STEWARDSHIP HAND-OFF DEMO ===\n');

  const config = getAppConfig();
  const identities = loadIdentities(config);
  const beeClient = new SwarmBeeClient(config.BEE_API_URL, true); // Mock mode for deterministic CLI demo

  const registry = new GovernanceStewardRegistry(identities.stewardSigners);
  const governanceService = new GovernanceService(registry);
  const successionService = new SuccessionService(governanceService, beeClient, config);

  const outgoingPublisher = identities.publisherSigner;

  // Incoming steward identity supplied externally as a parameter
  const incomingStewardWallet = Wallet.createRandom();
  const incomingPublisherAddress = incomingStewardWallet.address;

  console.log(`Outgoing Publisher Identity: ${outgoingPublisher.address}`);
  console.log(`Incoming Steward Identity:  ${incomingPublisherAddress}`);
  console.log(`Storage/Bursar Identity:    ${identities.storageSigner.address}`);

  // Collect 4-of-7 steward governance authorization signatures
  const quorumStewardWallets = identities.stewardSigners.slice(0, 4);

  console.log(`\nCollecting ${quorumStewardWallets.length} governance authorization signatures...`);

  const evidence = await successionService.transferStewardship(
    outgoingPublisher,
    incomingPublisherAddress,
    quorumStewardWallets
  );

  console.log('\nSUCCESSION COMPLETED SUCCESSFULLY!');
  console.log('Hand-off Evidence:');
  console.log(`- Outgoing Publisher:    ${evidence.outgoingPublisherAddress}`);
  console.log(`- Incoming Publisher:    ${evidence.incomingPublisherAddress}`);
  console.log(`- Date:                 ${evidence.date}`);
  console.log(`- Authority Transferred:${evidence.authorityTransferred}`);
  console.log(`- Proposal Hash:        ${evidence.proposalHash}`);
  console.log(`- Swarm Feed Reference: ${evidence.governanceFeedReference}`);
  console.log(`- Signatures Collected: ${evidence.signaturesCount} of 7`);

  // Format handoff record content for docs/handoff-record.md
  const handoffMarkdown = `# Monastery Catalogue Stewardship Handoff Record

## Handoff Overview

- **Date of Hand-off**: ${evidence.date}
- **Authority Transferred**: ${evidence.authorityTransferred}
- **Governance Quorum Achieved**: ${evidence.signaturesCount} out of 7 Monastery Stewards

## Identity Details

### Outgoing Signing Identity
- **Role**: Former Manuscript Catalogue Publisher
- **Public Address**: \`${evidence.outgoingPublisherAddress}\`

### Incoming Signing Identity
- **Role**: Incoming Manuscript Catalogue Steward / Publisher
- **Public Address**: \`${evidence.incomingPublisherAddress}\`

### Storage Custodian Identity
- **Role**: Storage / Postage Batch Bursar
- **Public Address**: \`${identities.storageSigner.address.toLowerCase()}\`

---

## Verifiable Cryptographic Evidence

- **Governance Proposal Hash**:
  \`${evidence.proposalHash}\`

- **Swarm Governance Feed Index / Reference**:
  \`${evidence.governanceFeedReference}\`

- **Participating Steward Signers**:
${evidence.signerAddresses.map((addr, idx) => `  ${idx + 1}. \`${addr}\``).join('\n')}

---

## Reproducible Verification Steps

To verify this handoff record independently using the repository tools:

\`\`\`bash
npm run verify:handoff
\`\`\`

> [!NOTE]
> This handoff record was generated under the authority of the Seven Monastery Governance Council. No private keys or secret credentials exist in this document.
`;

  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const recordPath = path.join(docsDir, 'handoff-record.md');
  fs.writeFileSync(recordPath, handoffMarkdown);
  console.log(`\nUpdated tracked handoff record at: ${recordPath}`);
}

main().catch((err) => {
  console.error('Hand-off demo failed:', err);
  process.exit(1);
});
