# Agreement of Joint Manuscript Stewardship
### Governed by the Federation of Seven Monastery Libraries

---

## 1. Preamble & Purpose

This Stewardship Agreement establishes a decentralized, long-term governance and preservation framework for the combined manuscript catalogues of seven historic monastery libraries:

1. **Monastery of St. Gall Library** (`st_gallen` — St. Gallen, Switzerland)
2. **Melk Abbey Library** (`melk` — Melk, Austria)
3. **Mont Saint-Michel Scriptorium** (`mont_saint_michel` — Normandy, France)
4. **Reichenau Abbey Library** (`reichenau` — Reichenau, Germany)
5. **Fulda Monastery Scriptorium** (`fulda` — Fulda, Germany)
6. **Lorch Abbey Library** (`lorch` — Lorch, Germany)
7. **Corbie Abbey Library** (`corbie` — Corbie, France)

The purpose of this agreement is to replace single-person operational dependencies (such as former steward Ngawang Dorje, who maintained the catalogue, publishing key, and storage for nine years) with a formal, multi-steward institutional arrangement. This ensures that the unified digital catalogue remains continuously readable, paid for, correctable, and transferable across generations, even if any individual steward stops participating.

---

## 2. Naming of Initial Steward & Designated Successor

- **Current Primary Steward / Active Publisher**:  
  **Monastery of St. Gall Library** (Identifier: `st_gallen`)  
  *Operational Identity*: `PUBLISHER_SIGNER` (configured via `PUBLISHER_SIGNER_PRIVATE_KEY`).  
  *Role*: Responsible for digitally signing and publishing catalogue updates across the federation.

- **Designated Primary Successor**:  
  **Melk Abbey Library** (Identifier: `melk`)  
  *Role*: Stands ready to inherit primary publishing authority automatically upon satisfaction of any triggering succession condition.

---

## 3. Allocation of Institutional Roles & Authority

To prevent single points of failure and eliminate unauthorized tampering, authority is strictly divided into three separate functional roles:

### A. Storage & Postage Funding Authority ("Storage Custodian / Bursar")
- **Responsibility**: Manages the financial endowment and continuous top-up of decentralized Swarm storage postage batches.
- **Operational Key**: `STORAGE_SIGNER` (configured via `STORAGE_SIGNER_PRIVATE_KEY`).
- **Restriction**: The Storage Custodian **cannot** sign or edit catalogue records, nor can they alter the governance reader pointer.

### B. Manuscript Catalogue Publishing Authority ("Active Publisher")
- **Responsibility**: Digitally signs and publishes updated manuscript records (folio descriptions, condition status, photography flags, damage notes).
- **Operational Key**: `PUBLISHER_SIGNER` (configured via `PUBLISHER_SIGNER_PRIVATE_KEY`).
- **Restriction**: The Active Publisher **cannot** unilaterally transfer publishing authority or redirect the public reader pointer without governance council concurrence.

### C. Governance & Succession Authority ("The Seven-Steward Council")
- **Responsibility**: Governs institutional succession, authorizes incoming steward identities, and maintains the stable public reader pointer.
- **Operational Keys**: `GOVERNANCE_STEWARD_1_KEY` through `GOVERNANCE_STEWARD_7_KEY`.
- **Quorum Rule**: Requires at least **five out of seven (5-of-7)** steward signatures to authorize publisher rotation.

---

## 4. Shared Bee Node Storage Custody Limitation

> [!IMPORTANT]
> **Operational Realities of Shared Infrastructure:**
> - The Bee node API normally binds to `127.0.0.1` on the local node machine.
> - When the seven institutions share a single local or remote Bee node instance, storage postage batch custody is concentrated within that node's storage identity (`STORAGE_SIGNER`).
> - Storage custody is therefore **not independently separated** at the node layer; postage batches belong to the host node's storage wallet identity.
> - **Network Security Warning**: Opening the Bee API to `0.0.0.0` exposes node endpoints to external networks, which can allow unauthorized external parties to consume postage stamps or spend node balances. Bee API access must remain bound to localhost or secured behind authenticated proxies.
>
> **Mitigation Strategy**:
> - Publishing authority (`PUBLISHER_SIGNER`) remains strictly decoupled from the node's storage wallet key.
> - Governance authority (`GOVERNANCE_STEWARDS`) is maintained off-node using 7 distinct steward private keys.
> - Even if a shared Bee node host is compromised, the node host **cannot** forge catalogue signatures or alter the 5-of-7 governance reader pointer.

---

## 5. Triggering Conditions for Succession

Succession and transfer of primary stewardship shall occur under any of the following explicit conditions:

1. **Steward Inactivity**: The current Primary Steward fails to issue a valid digital catalogue heartbeat or update for a period exceeding thirty (30) consecutive calendar days.
2. **Formal Resignation**: The current Primary Steward delivers a written notice of resignation to the Governance Council.
3. **Institutional Incapacity**: A physical or institutional disruption renders the Primary Steward unable to maintain digital operations.
4. **Council Vote of No Confidence**: Approval by at least five (5) of the seven monastery delegates to rotate stewardship due to breach of archival standard.

---

## 6. Seven-Steward Governance & Quorum Rules

- **Supermajority Quorum Requirement**: Any modification to the stable reader pointer or authorization of an incoming steward requires the concurrence of at least **five out of seven (5-of-7)** monastery steward signatures (a 71% supermajority).
- **Impossibility of Unilateral Alteration**: The current Active Publisher holds only one vote on the Governance Council. The publisher **cannot** unilaterally alter the governance pointer without securing at least four additional steward signatures.

---

## 7. Succession Procedure & Receiving Authority

1. **Initiation**: Any steward delegate may initiate a succession request upon occurrence of any triggering condition specified in Section 5.
2. **External Incoming Identity**: The incoming steward's cryptographic public identity (`INCOMING_STEWARD_PRIVATE_KEY` / address parameter) is submitted to the Governance Council from outside the codebase.
3. **Signature Collection**: A rotation proposal payload (`GovernanceRotationProposal`) is constructed. At least five (5) steward delegates review the proposal and attach their digital signatures.
4. **Payload Upload & Root Feed Update**: The signed rotation payload is uploaded to Swarm, and the stable Governance Root Feed is updated to point to the new governance reference.
5. **Authority Hand-Off**: Once published, reader queries automatically resolve to the incoming steward's signed feed. The incoming steward assumes full publishing rights.
6. **Verification Protocol**: Participating stewards and external auditors verify the transition by executing:
   ```bash
   npm run verify:handoff
   ```
   This script verifies signature validity against the 7-steward registry, proposal hash integrity, and identity separation.

---

## 8. Contingency & Subsequent Succession Rules

- **Failure or Unavailability of Designated Successor**: If the designated primary successor (**Melk Abbey Library**) is unable, incapacitated, or unwilling to assume stewardship when triggered, the Governance Council shall convene within seven (7) days to select an alternate steward from the remaining five member institutions by a 5-of-7 majority vote.
- **Subsequent Successor Designation**: Upon completion of any stewardship hand-off, the newly installed Primary Steward and the Governance Council shall designate a new secondary successor within thirty (30) days and update the tracked governance record.

---

## 9. Storage Funding Maintenance

- **Responsibility**: The Financial Bursar (`STORAGE_SIGNER`) continuously monitors postage batch capacity, TTL, and utilization.
- **Top-Up & Extension Procedure**: To extend the duration or storage capacity of an existing postage batch, the operator executes:
  ```bash
  npm run top-up-batch
  ```
  This calls `PostageBatchManager.topUpCatalogueBatch` (increasing BZZ balance) and `PostageBatchManager.extendCatalogueBatchDepth` (increasing chunk storage depth) on the existing batch ID without purchasing unnecessary redundant batches.

---

## 10. Reader Pointer Stability

Public scholars, researchers, and library systems access the catalogue via a **Static Reader Pointer**. Because public resolution queries the Governance Council's root pointer rather than individual publisher keys, readers never need to update their reference addresses, links, or bookmarks when stewardship is transferred.

---

## 11. Secrets & Confidentiality Policy

> [!CAUTION]
> **Strict Non-Disclosure of Cryptographic Secrets:**
> No private keys, mnemonics, seed phrases, gift codes, passwords, API tokens, or authenticated URLs may ever be stored in tracked repository files or public documentation. All secret material must strictly reside in isolated environment variables (`.env`) or local secret managers.

---

## 12. Ratification & Execution

This agreement is executed under the joint digital signatures of the authorized delegates of the Seven Monastery Libraries.

*Executed on behalf of the Seven Monastery Federation.*  
*Document Version: 1.2.0 (Decentralized Governance Standard with 5-of-7 Quorum & Shared Custody Disclosure)*
