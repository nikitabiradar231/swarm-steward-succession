# Manuscript Catalogue Stewardship Hand-off Record

> [!IMPORTANT]
> **RECORD STATUS: DEMONSTRATION / TEST RUN**
> This hand-off record was generated during automated demonstration testing. To perform a live production hand-off against a running Swarm Bee node with real steward keys, see the instructions below.

---

## 1. Hand-off Overview

- **Execution Mode**: `DEMO_SIMULATION`
- **Date of Hand-off**: `2026-09-18T19:42:35.011Z`
- **Authority Transferred**: Manuscript Catalogue Publishing Authority for the Seven Monastery Federation
- **Governance Quorum Achieved**: 4 out of 7 Monastery Stewards

---

## 2. Identity Details

### Outgoing Signing Identity
- **Role**: Former Manuscript Catalogue Publisher
- **Public Address**: `0x1563915e194d8cfba1943570603f7606a3115508`

### Incoming Signing Identity
- **Role**: Incoming Manuscript Catalogue Steward / Publisher
- **Public Address**: `0xdfc23e98e4aa09c49ba18f6f8efc8a5fc95c2a85`

### Storage Custodian Identity
- **Role**: Storage / Postage Batch Bursar
- **Public Address**: `0x19e7e376e7c213b7e7e7e46cc70a5dd086daff2a`

---

## 3. Verifiable Cryptographic Evidence

- **Governance Proposal Hash**:
  `0x5a635dbaa89599b683e77e5be006386aefe9504853d9708dc6adfd046b36e7cd`

- **Swarm Governance Feed Index / Reference**:
  `eeb5e345d1d13675fbc8610efc8d815942fd3856205743e24716a3d4b18789a8`

- **Participating Steward Signers**:
  1. `0x5cbdd86a2fa8dc4bddd8a8f69dba48572eec07fb`
  2. `0x7564105e977516c53be337314c7e53838967bdac`
  3. `0xe1fae9b4fab2f5726677ecfa912d96b0b683e6a9`
  4. `0xdb2430b4e9ac14be6554d3942822be74811a1af9`

---

## 4. Reproducible Verification & Live Execution

### How to Verify This Record

To verify this hand-off record cryptographically using repository tools:

```bash
npm run verify:handoff
```

### How to Perform a Live Production Hand-off

To execute a live hand-off against a real Swarm Bee node using environment variables:

1. Configure your `.env` file with real Bee node credentials and steward private keys:
   ```ini
   BEE_API_URL=http://your-bee-node:1633
   BEE_POSTAGE_BATCH_ID=<your-funded-batch-id>
   INCOMING_STEWARD_PRIVATE_KEY=<incoming-steward-private-key>
   ```

2. Run the live hand-off command:
   ```bash
   npm run perform:handoff
   ```

3. The script will write the live Swarm feed references, proposal hashes, and signatures directly to this document.
