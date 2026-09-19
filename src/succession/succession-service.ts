import { GovernanceService, StewardSignature, SignerLike } from '../governance/governance-service.js';
import { SwarmBeeClient } from '../swarm/bee-client.js';
import { AppConfig } from '../config/env.js';

export interface HandoffEvidence {
  outgoingPublisherAddress: string;
  incomingPublisherAddress: string;
  date: string;
  authorityTransferred: string;
  proposalHash: string;
  governanceFeedReference: string;
  signaturesCount: number;
  signerAddresses: string[];
}

export class SuccessionService {
  constructor(
    private governanceService: GovernanceService,
    private beeClient: SwarmBeeClient,
    private config: AppConfig
  ) {}

  /**
   * Executes succession hand-off to transfer publishing authority to an externally supplied incoming steward.
   */
  public async transferStewardship(
    outgoingPublisherWallet: SignerLike,
    incomingPublisherAddress: string,
    stewardWalletsForQuorum: SignerLike[],
    postageBatchId?: string
  ): Promise<HandoffEvidence> {
    const batchId = postageBatchId || this.config.BEE_POSTAGE_BATCH_ID;
    const outgoingAddr = outgoingPublisherWallet.address.toLowerCase();
    const incomingAddr = incomingPublisherAddress.toLowerCase();

    if (outgoingAddr === incomingAddr) {
      throw new Error('SUCCESSION_ERROR: Incoming publisher must be a different identity than the outgoing publisher.');
    }

    // 1. Create governance proposal for publisher rotation
    const proposal = this.governanceService.createProposal(
      outgoingAddr,
      incomingAddr,
      'monastery-catalogue-content'
    );
    const proposalHash = this.governanceService.computeProposalHash(proposal);

    // 2. Collect signatures from the quorum of stewards
    const signatures: StewardSignature[] = [];
    for (const stewardWallet of stewardWalletsForQuorum) {
      const sig = await this.governanceService.signProposal(proposal, stewardWallet);
      signatures.push(sig);
    }

    // 3. Verify governance quorum (must be >= 5-of-7 stewards)
    const governancePayload = {
      proposal,
      proposalHash,
      signatures,
      currentPublisherAddress: incomingAddr,
      catalogueTopic: 'monastery-catalogue-content',
      updatedAt: new Date().toISOString(),
    };

    this.governanceService.verifyRotationPayload(governancePayload);

    // 4. Upload updated governance payload to Swarm
    const payloadBytes = new TextEncoder().encode(JSON.stringify(governancePayload, null, 2));
    const governanceFeedRef = await this.beeClient.uploadCatalogueData(batchId, payloadBytes);

    // 5. Update stable governance root feed signed by governance authority
    const governanceRootTopic = this.config.GOVERNANCE_FEED_TOPIC;
    await this.beeClient.publishFeedUpdate(
      governanceRootTopic,
      stewardWalletsForQuorum[0],
      governanceFeedRef
    );

    // 6. Return verifiable hand-off evidence
    return {
      outgoingPublisherAddress: outgoingAddr,
      incomingPublisherAddress: incomingAddr,
      date: new Date().toISOString(),
      authorityTransferred: 'Manuscript Catalogue Publishing Authority for the Seven Monastery Federation',
      proposalHash,
      governanceFeedReference: governanceFeedRef,
      signaturesCount: signatures.length,
      signerAddresses: signatures.map((s) => s.stewardAddress),
    };
  }
}
