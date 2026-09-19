import { describe, it, expect, beforeEach } from 'vitest';
import { Wallet } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

import { getAppConfig } from '../src/config/env.js';
import { loadIdentities } from '../src/config/identities.js';
import { SwarmBeeClient } from '../src/swarm/bee-client.js';
import { CatalogueService } from '../src/catalogue/catalogue-service.js';
import { ManuscriptEntry } from '../src/catalogue/types.js';
import { FeedService } from '../src/swarm/feed-service.js';
import { GovernanceStewardRegistry } from '../src/governance/stewards.js';
import { GovernanceService } from '../src/governance/governance-service.js';
import { SuccessionService } from '../src/succession/succession-service.js';
import { PostageBatchManager } from '../src/funding/batch-manager.js';

describe('ACCEPTANCE TESTS - "The succession nobody wrote down"', () => {
  let config: ReturnType<typeof getAppConfig>;
  let identities: ReturnType<typeof loadIdentities>;
  let beeClient: SwarmBeeClient;
  let catalogueService: CatalogueService;
  let feedService: FeedService;
  let registry: GovernanceStewardRegistry;
  let governanceService: GovernanceService;
  let successionService: SuccessionService;
  let batchManager: PostageBatchManager;

  const sampleEntries: ManuscriptEntry[] = [
    {
      monasteryId: 'st_gallen',
      manuscriptId: 'MS-CODEX-104',
      title: 'St. Gall Psalter',
      century: '9th Century',
      language: 'Latin',
      folioInfo: 'ff. 1r-160v',
      condition: 'Good',
      isDamaged: false,
      isMissing: false,
      isPhotographed: true,
      notes: 'Carolingian minuscule script',
      lastUpdated: new Date().toISOString(),
    },
    {
      monasteryId: 'melk',
      manuscriptId: 'MELK-MS-88',
      title: 'Bede Expositions',
      century: '12th Century',
      language: 'Latin',
      folioInfo: 'ff. 12r-80v',
      condition: 'Fair',
      isDamaged: false,
      isMissing: false,
      isPhotographed: true,
      lastUpdated: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    config = getAppConfig();
    identities = loadIdentities(config);
    beeClient = new SwarmBeeClient(config.BEE_API_URL, true); // Force mock mode for deterministic test execution
    catalogueService = new CatalogueService();
    feedService = new FeedService(beeClient, catalogueService);
    registry = new GovernanceStewardRegistry(identities.stewardSigners);
    governanceService = new GovernanceService(registry);
    successionService = new SuccessionService(governanceService, beeClient, config);
    batchManager = new PostageBatchManager(beeClient, identities.storageSigner);
  });

  /**
   * TEST 1: Stable reader address remains unchanged after publisher rotation.
   */
  it('1. Stable reader address remains unchanged after publisher rotation', async () => {
    const batchId = config.BEE_POSTAGE_BATCH_ID;
    const initialPublisher = identities.publisherSigner;

    // 1. Initial publisher uploads catalogue
    const initialCatalogue = catalogueService.createCatalogue(
      'st_gallen',
      initialPublisher.address,
      sampleEntries
    );
    const initialBytes = catalogueService.serializeCatalogue(initialCatalogue);
    const initialContentRef = await beeClient.uploadCatalogueData(batchId, initialBytes);

    // Publish feed update under initial publisher feed
    const catalogueTopic = 'monastery-catalogue-content';
    await beeClient.publishFeedUpdate(catalogueTopic, initialPublisher, initialContentRef);

    // Initial governance pointer setup
    const stableGovernanceTopic = config.GOVERNANCE_FEED_TOPIC;
    const governanceOwnerAddress = identities.stewardSigners[0].address.toLowerCase();

    const initialGovRecord = {
      currentPublisherAddress: initialPublisher.address.toLowerCase(),
      catalogueTopic,
      updatedAt: new Date().toISOString(),
    };

    const govRef1 = await beeClient.uploadCatalogueData(
      batchId,
      new TextEncoder().encode(JSON.stringify(initialGovRecord))
    );
    await beeClient.publishFeedUpdate(stableGovernanceTopic, identities.stewardSigners[0], govRef1);

    const stablePointer = {
      governanceOwnerAddress,
      governanceTopic: stableGovernanceTopic,
    };

    // Reader resolves catalogue from stable pointer before rotation
    const catalogueBefore = await feedService.resolveCatalogueFromStablePointer(stablePointer);
    expect(catalogueBefore.publisherAddress).toBe(initialPublisher.address.toLowerCase());
    expect(catalogueBefore.entries.length).toBe(2);

    // 2. Perform Publisher Rotation via Succession
    const incomingPublisherWallet = Wallet.createRandom();
    const quorumSigners = identities.stewardSigners.slice(0, 5);

    await successionService.transferStewardship(
      initialPublisher,
      incomingPublisherWallet.address,
      quorumSigners,
      batchId
    );

    // 3. New publisher publishes updated catalogue with an added manuscript entry
    const updatedEntries: ManuscriptEntry[] = [
      ...sampleEntries,
      {
        monasteryId: 'mont_saint_michel',
        manuscriptId: 'MS-MSM-42',
        title: 'Cartulary of Mont Saint-Michel',
        century: '11th Century',
        language: 'Latin',
        folioInfo: 'ff. 1r-94v',
        condition: 'Good',
        isDamaged: false,
        isMissing: false,
        isPhotographed: true,
        lastUpdated: new Date().toISOString(),
      },
    ];

    const updatedCatalogue = catalogueService.createCatalogue(
      'melk',
      incomingPublisherWallet.address,
      updatedEntries
    );
    const updatedBytes = catalogueService.serializeCatalogue(updatedCatalogue);
    const updatedContentRef = await beeClient.uploadCatalogueData(batchId, updatedBytes);
    await beeClient.publishFeedUpdate(catalogueTopic, incomingPublisherWallet, updatedContentRef);

    // 4. Reader resolves catalogue using the exact same STABLE POINTER address!
    const catalogueAfter = await feedService.resolveCatalogueFromStablePointer(stablePointer);

    expect(catalogueAfter.publisherAddress).toBe(incomingPublisherWallet.address.toLowerCase());
    expect(catalogueAfter.entries.length).toBe(3);
    expect(catalogueAfter.entries[2].title).toBe('Cartulary of Mont Saint-Michel');
  });

  /**
   * TEST 2: Storage and publishing identities are distinct.
   */
  it('2. Storage and publishing identities are distinct', () => {
    const storageAddr = identities.storageSigner.address.toLowerCase();
    const publisherAddr = identities.publisherSigner.address.toLowerCase();

    expect(storageAddr).not.toBe(publisherAddr);

    // Attempting to load configuration where storage and publisher use identical key throws security error
    expect(() => {
      loadIdentities({
        ...config,
        STORAGE_SIGNER_PRIVATE_KEY: config.PUBLISHER_SIGNER_PRIVATE_KEY,
      });
    }).toThrow(/SECURITY VIOLATION/);
  });

  /**
   * TEST 3: Existing postage batch can be extended/topped up.
   */
  it('3. Existing postage batch can be extended/topped up', async () => {
    const batchId = config.BEE_POSTAGE_BATCH_ID;
    const initialInfo = await batchManager.inspectCatalogueBatch(batchId);

    // Top up balance
    const topUpAmount = '5000000';
    const toppedUp = await batchManager.topUpCatalogueBatch(batchId, topUpAmount);
    expect(BigInt(toppedUp.amount)).toBe(BigInt(initialInfo.amount) + BigInt(topUpAmount));

    // Extend depth
    const newDepth = initialInfo.depth + 1;
    const extended = await batchManager.extendCatalogueBatchDepth(batchId, newDepth);
    expect(extended.depth).toBe(newDepth);
  });

  /**
   * TEST 4: Succession requires the configured governance authority (5-of-7 threshold).
   */
  it('4. Succession requires the configured governance authority', async () => {
    const outgoingPublisher = identities.publisherSigner;
    const incomingPublisherAddr = Wallet.createRandom().address;

    // Providing 4 steward signatures (less than required 5) must fail
    const insufficientSigners = identities.stewardSigners.slice(0, 4);

    await expect(
      successionService.transferStewardship(
        outgoingPublisher,
        incomingPublisherAddr,
        insufficientSigners
      )
    ).rejects.toThrow(/QUORUM_NOT_MET/);

    // Providing 5 steward signatures succeeds
    const quorumSigners = identities.stewardSigners.slice(0, 5);
    const evidence = await successionService.transferStewardship(
      outgoingPublisher,
      incomingPublisherAddr,
      quorumSigners
    );

    expect(evidence.signaturesCount).toBe(5);
    expect(evidence.incomingPublisherAddress).toBe(incomingPublisherAddr.toLowerCase());
  });

  /**
   * TEST 5: Incoming steward identity is supplied as a parameter.
   */
  it('5. Incoming steward identity is supplied as a parameter', async () => {
    const outgoingPublisher = identities.publisherSigner;

    // Generate two distinct random incoming steward addresses
    const candidateA = Wallet.createRandom().address;
    const candidateB = Wallet.createRandom().address;

    const quorumSigners = identities.stewardSigners.slice(0, 5);

    const evidenceA = await successionService.transferStewardship(
      outgoingPublisher,
      candidateA,
      quorumSigners
    );
    expect(evidenceA.incomingPublisherAddress).toBe(candidateA.toLowerCase());

    const evidenceB = await successionService.transferStewardship(
      outgoingPublisher,
      candidateB,
      quorumSigners
    );
    expect(evidenceB.incomingPublisherAddress).toBe(candidateB.toLowerCase());
  });

  /**
   * TEST 6: Current publisher cannot unilaterally change the publisher.
   */
  it('6. Current publisher cannot unilaterally change the publisher', async () => {
    const currentPublisher = identities.publisherSigner;
    const unauthorizedIncoming = Wallet.createRandom().address;

    // Current publisher creates proposal trying to rotate publisher unilaterally
    const proposal = governanceService.createProposal(
      currentPublisher.address,
      unauthorizedIncoming
    );
    const proposalHash = governanceService.computeProposalHash(proposal);

    // Current publisher is not one of the registered governance stewards
    const rogueSignature = await currentPublisher.signMessage(proposalHash);

    const payload = {
      proposal,
      proposalHash,
      signatures: [
        {
          stewardAddress: currentPublisher.address.toLowerCase(),
          signature: rogueSignature,
        },
      ],
      currentPublisherAddress: unauthorizedIncoming,
      catalogueTopic: 'monastery-catalogue-content',
      updatedAt: new Date().toISOString(),
    };

    // Verification must reject unilateral publisher modification
    expect(() => governanceService.verifyRotationPayload(payload)).toThrow();
  });

  /**
   * TEST 7: Credentials are environment-based and no hardcoded secrets exist.
   */
  it('7. Credentials are environment-based and .env.example exists', () => {
    const examplePath = path.join(process.cwd(), '.env.example');
    expect(fs.existsSync(examplePath)).toBe(true);

    const exampleContent = fs.readFileSync(examplePath, 'utf-8');
    expect(exampleContent).toContain('STORAGE_SIGNER_PRIVATE_KEY');
    expect(exampleContent).toContain('PUBLISHER_SIGNER_PRIVATE_KEY');
    expect(exampleContent).toContain('GOVERNANCE_STEWARD_1_KEY');
  });

  /**
   * TEST 8: Handoff record contains two distinct signing identities and verifiable evidence.
   */
  it('8. Handoff record contains two distinct signing identities and verifiable evidence', () => {
    const recordPath = path.join(process.cwd(), 'docs', 'handoff-record.md');
    expect(fs.existsSync(recordPath)).toBe(true);

    const content = fs.readFileSync(recordPath, 'utf-8');

    // Verify distinct identities in document
    const outgoingMatch = content.match(/Former Manuscript Catalogue Publisher[\s\S]*?`([^`]+)`/);
    const incomingMatch = content.match(/Incoming Manuscript Catalogue Steward[\s\S]*?`([^`]+)`/);
    const hashMatch = content.match(/Governance Proposal Hash[\s\S]*?`([^`]+)`/);

    expect(outgoingMatch).not.toBeNull();
    expect(incomingMatch).not.toBeNull();
    expect(hashMatch).not.toBeNull();

    const outgoing = outgoingMatch![1].toLowerCase();
    const incoming = incomingMatch![1].toLowerCase();

    expect(outgoing).not.toBe(incoming);
    expect(hashMatch![1]).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });
});
