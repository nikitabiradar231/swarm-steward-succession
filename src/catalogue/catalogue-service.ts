import { ManuscriptCatalogue, ManuscriptEntry } from './types.js';

export class CatalogueService {
  public createCatalogue(
    stewardId: string,
    publisherAddress: string,
    entries: ManuscriptEntry[]
  ): ManuscriptCatalogue {
    return {
      version: '1.0.0',
      stewardId,
      publisherAddress: publisherAddress.toLowerCase(),
      updatedAt: new Date().toISOString(),
      entries,
    };
  }

  public serializeCatalogue(catalogue: ManuscriptCatalogue): Uint8Array {
    const jsonString = JSON.stringify(catalogue, null, 2);
    return new TextEncoder().encode(jsonString);
  }

  public deserializeCatalogue(data: Uint8Array): ManuscriptCatalogue {
    const jsonString = new TextDecoder().decode(data);
    const parsed = JSON.parse(jsonString) as ManuscriptCatalogue;
    if (!parsed.version || !parsed.entries || !Array.isArray(parsed.entries)) {
      throw new Error('INVALID_CATALOGUE_FORMAT: Data payload is not a valid ManuscriptCatalogue.');
    }
    return parsed;
  }

  public validateEntry(entry: ManuscriptEntry): boolean {
    if (!entry.monasteryId || !entry.manuscriptId || !entry.folioInfo) {
      return false;
    }
    return true;
  }
}
