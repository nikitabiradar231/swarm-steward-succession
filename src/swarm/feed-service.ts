import { SwarmBeeClient } from './bee-client.js';
import { CatalogueService } from '../catalogue/catalogue-service.js';
import { ManuscriptCatalogue } from '../catalogue/types.js';

export interface StableReaderAddress {
  governanceOwnerAddress: string;
  governanceTopic: string;
}

export class FeedService {
  constructor(
    private beeClient: SwarmBeeClient,
    private catalogueService: CatalogueService = new CatalogueService()
  ) {}

  /**
   * Resolves catalogue content starting from a STABLE reader address/pointer.
   * Flow: stable reader pointer -> current publisher reference -> manuscript catalogue JSON
   */
  public async resolveCatalogueFromStablePointer(
    stablePointer: StableReaderAddress
  ): Promise<ManuscriptCatalogue> {
    // 1. Read stable governance pointer to get current publisher record
    const governanceReference = await this.beeClient.readFeedUpdate(
      stablePointer.governanceOwnerAddress,
      stablePointer.governanceTopic
    );

    // 2. Fetch governance pointer payload
    const governancePayloadBytes = await this.beeClient.downloadCatalogueData(governanceReference);
    const governancePayloadJson = new TextDecoder().decode(governancePayloadBytes);
    const governanceRecord = JSON.parse(governancePayloadJson);

    const currentPublisherAddress: string = governanceRecord.currentPublisherAddress;
    const catalogueTopic: string = governanceRecord.catalogueTopic || 'monastery-catalogue-content';

    // 3. Read active publisher feed update
    const catalogueReference = await this.beeClient.readFeedUpdate(
      currentPublisherAddress,
      catalogueTopic
    );

    // 4. Download catalogue manuscript content from Swarm
    const catalogueDataBytes = await this.beeClient.downloadCatalogueData(catalogueReference);
    return this.catalogueService.deserializeCatalogue(catalogueDataBytes);
  }
}
