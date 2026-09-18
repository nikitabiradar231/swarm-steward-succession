export type MonasteryId =
  | 'st_gallen'
  | 'melk'
  | 'mont_saint_michel'
  | 'reichenau'
  | 'fulda'
  | 'lorch'
  | 'corbie';

export interface ManuscriptEntry {
  monasteryId: MonasteryId;
  manuscriptId: string;
  title: string;
  century: string;
  language: string;
  folioInfo: string;
  condition: 'Good' | 'Fair' | 'Fragile' | 'Restoration Needed';
  isDamaged: boolean;
  isMissing: boolean;
  isPhotographed: boolean;
  notes?: string;
  lastUpdated: string;
}

export interface ManuscriptCatalogue {
  version: string;
  stewardId: string;
  publisherAddress: string;
  updatedAt: string;
  entries: ManuscriptEntry[];
}
