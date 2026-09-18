import { Wallet } from 'ethers';
import { MonasteryId } from '../catalogue/types.js';

export interface StewardMetadata {
  id: MonasteryId;
  name: string;
  location: string;
  address: string;
}

export const MONASTERY_STEWARDS: Omit<StewardMetadata, 'address'>[] = [
  { id: 'st_gallen', name: 'Monastery of St. Gall Library', location: 'St. Gallen, Switzerland' },
  { id: 'melk', name: 'Melk Abbey Library', location: 'Melk, Austria' },
  { id: 'mont_saint_michel', name: 'Mont Saint-Michel Scriptorium', location: 'Normandy, France' },
  { id: 'reichenau', name: 'Reichenau Abbey Library', location: 'Reichenau, Germany' },
  { id: 'fulda', name: 'Fulda Monastery Scriptorium', location: 'Fulda, Germany' },
  { id: 'lorch', name: 'Lorch Abbey Library', location: 'Lorch, Germany' },
  { id: 'corbie', name: 'Corbie Abbey Library', location: 'Corbie, France' },
];

export class GovernanceStewardRegistry {
  public static readonly REQUIRED_QUORUM = 4; // 4 out of 7 stewards
  public static readonly TOTAL_STEWARDS = 7;

  private stewardMap: Map<string, StewardMetadata> = new Map();

  constructor(stewardWallets: Wallet[]) {
    if (stewardWallets.length !== 7) {
      throw new Error(`Governance requires exactly 7 steward wallets. Got ${stewardWallets.length}`);
    }

    stewardWallets.forEach((wallet, index) => {
      const meta = MONASTERY_STEWARDS[index];
      const fullMeta: StewardMetadata = {
        ...meta,
        address: wallet.address.toLowerCase(),
      };
      this.stewardMap.set(wallet.address.toLowerCase(), fullMeta);
    });
  }

  public isAuthorizedSteward(address: string): boolean {
    return this.stewardMap.has(address.toLowerCase());
  }

  public getStewardByAddress(address: string): StewardMetadata | undefined {
    return this.stewardMap.get(address.toLowerCase());
  }

  public getAllStewards(): StewardMetadata[] {
    return Array.from(this.stewardMap.values());
  }
}
