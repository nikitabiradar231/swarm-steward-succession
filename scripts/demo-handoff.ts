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
  const isLive = process.argv.includes('--live') || process.env.LIVE_HANDOFF === 'true';

  console.log(`=== MONASTERY STEWARDSHIP HAND-OFF (${isLive ? 'LIVE PRODUCTION RUN' : 'DEMONSTRATION RUN'}) ===\n`);

  const config = getAppConfig();
  const identities = loadIdentities(config);
  
  // Use live Bee node if --live or LIVE_HANDOFF=true is specified, otherwise fallback mock mode
  const beeClient = new SwarmBeeClient(config.BEE_API_URL, !isLive);

  const registry = new GovernanceStewardRegistry(identities.stewardSigners);
  const governanceService = new GovernanceService(registry);
  const successionService = new SuccessionService(governanceService, beeClient, config);

  const outgoingPublisher = identities.publisherSigner;

  // Incoming steward identity supplied externally as a parameter
  const incomingStewardWallet = process.env.INCOMING_STEWARD_PRIVATE_KEY
    ? new Wallet(process.env.INCOMING_STEWARD_PRIVATE_KEY)
    : Wallet.createRandom();
  
  const incomingPublisherAddress = incomingStewardWallet.address;

  console.log(`Execution Mode:            ${isLive ? 'LIVE SWARM NODE' : 'SIMULATED DEMO'}`);
  console.log(`Outgoing Publisher Identity: ${outgoingPublisher.address}`);
  console.log(`Incoming Steward Identity:  ${incomingPublisherAddress}`);
  console.log(`Storage/Bursar Identity:    ${identities.storageSigner.address}`);

  // Collect 5-of-7 steward governance authorization signatures
  const quorumStewardWallets = identities.stewardSigners.slice(0, 5);

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
  const handoffMarkdown = `# Manuscript Catalogue Stewardship Hand-off Record

> [!IMPORTANT]
> **RECORD STATUS: ${isLive ? 'LIVE PRODUCTION EXECUTION' : 'DEMONSTRATION / TEST RUN'}**
> ${
    isLive
      ? 'This hand-off was executed live against the configured Swarm Bee node.'
      : 'This hand-off record was generated during automated demonstration testing. To perform a live production hand-off against a running Swarm Bee node with real steward keys, see the instructions below.'
  }

---

## 1. Hand-off Overview

- **Execution Mode**: \`${isLive ? 'LIVE_SWARM_NETWORK' : 'DEMO_SIMULATION'}\`
- **Date of Hand-off**: \`${evidence.date}\`
- **Authority Transferred**: ${evidence.authorityTransferred}
- **Governance Quorum Achieved**: ${evidence.signaturesCount} out of 7 Monastery Stewards

---

## 2. Identity Details

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

## 3. Verifiable Cryptographic Evidence

- **Governance Proposal Hash**:
  \`${evidence.proposalHash}\`

- **Swarm Governance Feed Index / Reference**:
  \`${evidence.governanceFeedReference}\`

- **Participating Steward Signers**:
${evidence.signerAddresses.map((addr, idx) => `  ${idx + 1}. \`${addr}\``).join('\n')}

---

## 4. Reproducible Verification & Live Execution

### How to Verify This Record

To verify this hand-off record cryptographically using repository tools:

\`\`\`bash
npm run verify:handoff
\`\`\`

### How to Perform a Live Production Hand-off

To execute a live hand-off against a real Swarm Bee node using environment variables:

1. Configure your \`.env\` file with real Bee node credentials and steward private keys:
   \`\`\`ini
   BEE_API_URL=http://your-bee-node:1633
   BEE_POSTAGE_BATCH_ID=<your-funded-batch-id>
   INCOMING_STEWARD_PRIVATE_KEY=<incoming-steward-private-key>
   \`\`\`

2. Run the live hand-off command:
   \`\`\`bash
   npm run perform:handoff
   \`\`\`

3. The script will write the live Swarm feed references, proposal hashes, and signatures directly to this document.
`;

  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const recordPath = path.join(docsDir, 'handoff-record.md');
  fs.writeFileSync(recordPath, handoffMarkdown);
  console.log(`\nUpdated hand-off record at: ${recordPath}`);
}

main().catch((err) => {
  console.error('Hand-off execution failed:', err);
  process.exit(1);
});
