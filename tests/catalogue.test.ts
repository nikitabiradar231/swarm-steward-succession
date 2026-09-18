import { describe, it, expect } from 'vitest';
import { CatalogueService } from '../src/catalogue/catalogue-service.js';
import { ManuscriptEntry } from '../src/catalogue/types.js';

describe('CatalogueService Unit Tests', () => {
  const service = new CatalogueService();

  const entry: ManuscriptEntry = {
    monasteryId: 'st_gallen',
    manuscriptId: 'CODEX-9',
    title: 'Psalterium Aureum',
    century: '9th Century',
    language: 'Latin',
    folioInfo: 'ff. 1r-150v',
    condition: 'Good',
    isDamaged: false,
    isMissing: false,
    isPhotographed: true,
    lastUpdated: new Date().toISOString(),
  };

  it('serializes and deserializes catalogue accurately', () => {
    const catalogue = service.createCatalogue('st_gallen', '0x1111111111111111111111111111111111111111', [entry]);
    const bytes = service.serializeCatalogue(catalogue);
    const restored = service.deserializeCatalogue(bytes);

    expect(restored.version).toBe('1.0.0');
    expect(restored.stewardId).toBe('st_gallen');
    expect(restored.entries.length).toBe(1);
    expect(restored.entries[0].title).toBe('Psalterium Aureum');
  });

  it('validates manuscript entry correctness', () => {
    expect(service.validateEntry(entry)).toBe(true);
    expect(service.validateEntry({ ...entry, manuscriptId: '' })).toBe(false);
  });
});
