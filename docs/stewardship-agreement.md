# Agreement of Joint Manuscript Stewardship
### Governed by the Federation of Seven Monastery Libraries

---

## 1. Preamble & Purpose

This Stewardship Agreement establishes a decentralized, long-term governance and preservation framework for the combined manuscript catalogues of seven historic monastery libraries:

1. **Monastery of St. Gall Library** (St. Gallen, Switzerland)
2. **Melk Abbey Library** (Melk, Austria)
3. **Mont Saint-Michel Scriptorium** (Normandy, France)
4. **Reichenau Abbey Library** (Reichenau, Germany)
5. **Fulda Monastery Scriptorium** (Fulda, Germany)
6. **Lorch Abbey Library** (Lorch, Germany)
7. **Corbie Abbey Library** (Corbie, France)

The purpose of this agreement is to ensure that the unified digital catalogue remains continuously readable, immutably archived, and correctable across generations, even if individual stewards, servers, or institutions cease active participation.

---

## 2. Naming of Initial Steward and Designated Successor

- **Current Primary Steward**: **Monastery of St. Gall Library**  
  Responsible for publishing digital catalogue entries and organizing manuscript records across the federation.
- **Designated Primary Successor**: **Melk Abbey Library**  
  Stands ready to inherit primary publishing authority automatically upon satisfaction of any triggering succession condition.

---

## 3. Allocation of Institutional Roles & Authority

To prevent single points of failure and eliminate unauthorized tampering, authority is strictly divided into three separate functional roles:

### A. Storage & Postage Funding Authority ("Storage Custodian / Bursar")
- **Responsibility**: Manages the financial endowment and continuous top-up of decentralized Swarm storage postage batches.
- **Control**: Operated by the shared Federation Financial Bursar.
- **Restriction**: The Storage Custodian **cannot** sign or edit catalogue records, nor can they alter the governance reader pointer.

### B. Manuscript Catalogue Publishing Authority ("Active Publisher")
- **Responsibility**: Digitally signs and publishes updated manuscript records (folio descriptions, condition status, photography flags, damage notes).
- **Control**: Exercised solely by the designated active Primary Steward (initially Monastery of St. Gall).
- **Restriction**: The Active Publisher **cannot** unilaterally transfer publishing authority or redirect the public reader pointer without governance council concurrence.

### C. Governance & Succession Authority ("The Seven-Steward Council")
- **Responsibility**: Governs institutional succession, authorizes incoming steward identities, and maintains the stable public reader pointer.
- **Control**: Consists of seven distinct signing delegates representing each of the seven monastery institutions.

---

## 4. Shared Bee Node Storage Custody Limitation

> [!IMPORTANT]
> **Operational Realities of Shared Infrastructure:**
> When the federation utilizes a single shared Bee node for hosting, the node's local wallet concentrates storage postage batch custody within that node's storage identity (`STORAGE_SIGNER`). 
> 
> To mitigate centralized control risks:
> - **Publishing Authority (`PUBLISHER_SIGNER`)** remains strictly separate from the node's storage wallet key.
> - **Governance Authority (`GOVERNANCE_STEWARDS`)** is maintained off-node using 7 distinct steward private keys.
> - Even if a shared Bee node host is compromised, the node host **cannot** forge catalogue signatures or alter the 4-of-7 governance reader pointer.

---

## 5. Triggering Conditions for Succession

Succession and transfer of primary stewardship shall occur under any of the following explicit conditions:

1. **Steward Inactivity**: The current Primary Steward fails to issue a valid digital catalogue heartbeat or update for a period exceeding thirty (30) consecutive calendar days.
2. **Formal Resignation**: The current Primary Steward delivers a written notice of resignation to the Governance Council.
3. **Institutional Incapacity**: A physical or institutional disruption renders the Primary Steward unable to maintain digital operations.
4. **Council Vote of No Confidence**: Approval by at least five (5) of the seven monastery delegates to rotate stewardship due to breach of archival standard.

---

## 6. Seven-Steward Governance & Quorum Rules

- **Quorum Requirement**: Any modification to the stable reader pointer or authorization of an incoming steward requires the concurrence of at least **four out of seven (4-of-7)** monastery steward signatures (a 57% majority).
- **Impossibility of Unilateral Alteration**: The current Active Publisher holds only one vote on the Governance Council. The publisher **cannot** unilaterally alter the governance pointer without securing at least three additional steward signatures.

---

## 7. Succession Procedure & Receiving Authority

1. **Initiation**: Any steward delegate may initiate a succession request upon occurrence of a triggering condition.
2. **Verification & Signature Collection**: The incoming steward's cryptographic public identity is submitted to the Governance Council. At least four (4) steward delegates review the proposal and attach their digital signatures to the rotation payload.
3. **Execution**: The multi-signature authorization is published to the stable Governance Root Feed on the Swarm network.
4. **Authority Hand-Off**: Once published, reader queries automatically resolve to the incoming steward's signed feed. The incoming steward assumes full publishing rights.

---

## 8. Contingency & Subsequent Succession Rules

- **Failure of Designated Successor**: If the designated primary successor (Melk Abbey Library) is unable or unwilling to assume stewardship when triggered, the Governance Council shall convene within seven (7) days to select an alternate steward from the remaining five member institutions by 4-of-7 majority vote.
- **Subsequent Successor Selection**: Upon completion of any stewardship hand-off, the newly installed Primary Steward and the Governance Council shall designate a new secondary successor within thirty (30) days.

---

## 9. Reader Pointer Stability

Public scholars, researchers, and library systems access the catalogue via a **Static Reader Pointer**. Because public resolution queries the Governance Council's root pointer rather than individual publisher keys, readers never need to update their reference addresses, links, or bookmarks when stewardship is transferred.

---

## 10. Secrets & Confidentiality Policy

> [!CAUTION]
> **Strict Non-Disclosure of Cryptographic Secrets:**
> No private keys, mnemonics, seed phrases, gift codes, passwords, API tokens, or authenticated URLs may ever be stored in tracked repository files or public documentation. All secret material must strictly reside in isolated environment variables (`.env`) or local secret managers.

---

## 11. Ratification & Execution

This agreement is executed under the joint digital signatures of the authorized delegates of the Seven Monastery Libraries.

*Executed on behalf of the Seven Monastery Federation.*  
*Document Version: 1.1.0 (Decentralized Governance Standard with Shared Custody Disclosure)*
