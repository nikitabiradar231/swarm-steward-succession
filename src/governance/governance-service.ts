import { getBytes, keccak256, toUtf8Bytes, verifyMessage } from 'ethers';
import { GovernanceStewardRegistry } from './stewards.js';

export interface GovernanceRotationProposal {
  incomingPublisherAddress: string;
  outgoingPublisherAddress: string;
  catalogueTopic: string;
  timestamp: number;
  nonce: string;
}

export interface StewardSignature {
  stewardAddress: string;
  signature: string;
}

export interface GovernanceRotationPayload {
  proposal: GovernanceRotationProposal;
  proposalHash: string;
  signatures: StewardSignature[];
  currentPublisherAddress: string;
  catalogueTopic: string;
  updatedAt: string;
}

export interface SignerLike {
  address: string;
  signMessage(message: string | Uint8Array): Promise<string>;
}

export class GovernanceService {
  constructor(private registry: GovernanceStewardRegistry) {}

  public createProposal(
    outgoingPublisherAddress: string,
    incomingPublisherAddress: string,
    catalogueTopic: string = 'monastery-catalogue-content'
  ): GovernanceRotationProposal {
    return {
      incomingPublisherAddress: incomingPublisherAddress.toLowerCase(),
      outgoingPublisherAddress: outgoingPublisherAddress.toLowerCase(),
      catalogueTopic,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2, 15),
    };
  }

  public computeProposalHash(proposal: GovernanceRotationProposal): string {
    const canonicalString = JSON.stringify({
      incomingPublisherAddress: proposal.incomingPublisherAddress.toLowerCase(),
      outgoingPublisherAddress: proposal.outgoingPublisherAddress.toLowerCase(),
      catalogueTopic: proposal.catalogueTopic,
      timestamp: proposal.timestamp,
      nonce: proposal.nonce,
    });
    return keccak256(toUtf8Bytes(canonicalString));
  }

  public async signProposal(
    proposal: GovernanceRotationProposal,
    stewardWallet: SignerLike
  ): Promise<StewardSignature> {
    const stewardAddr = stewardWallet.address.toLowerCase();
    if (!this.registry.isAuthorizedSteward(stewardAddr)) {
      throw new Error(`UNAUTHORIZED: Address ${stewardAddr} is not one of the 7 monastery stewards.`);
    }

    const proposalHash = this.computeProposalHash(proposal);
    const signature = await stewardWallet.signMessage(getBytes(proposalHash));

    return {
      stewardAddress: stewardAddr,
      signature,
    };
  }

  public verifyRotationPayload(payload: GovernanceRotationPayload): boolean {
    const { proposal, proposalHash, signatures } = payload;
    const computedHash = this.computeProposalHash(proposal);

    if (computedHash !== proposalHash) {
      throw new Error('PROPOSAL_HASH_MISMATCH: Payload proposal hash does not match computed proposal hash.');
    }

    const validStewardAddresses = new Set<string>();

    for (const item of signatures) {
      const recoveredAddress = verifyMessage(getBytes(proposalHash), item.signature).toLowerCase();

      if (recoveredAddress !== item.stewardAddress.toLowerCase()) {
        throw new Error(`INVALID_SIGNATURE: Recovered signer ${recoveredAddress} does not match stated steward ${item.stewardAddress}`);
      }

      if (!this.registry.isAuthorizedSteward(recoveredAddress)) {
        throw new Error(`UNAUTHORIZED_SIGNER: Signer ${recoveredAddress} is not a recognized steward.`);
      }

      validStewardAddresses.add(recoveredAddress);
    }

    if (validStewardAddresses.size < GovernanceStewardRegistry.REQUIRED_QUORUM) {
      throw new Error(
        `QUORUM_NOT_MET: Required ${GovernanceStewardRegistry.REQUIRED_QUORUM} steward signatures, but only received ${validStewardAddresses.size} valid signatures.`
      );
    }

    return true;
  }
}
