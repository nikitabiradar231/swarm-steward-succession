import { Wallet } from 'ethers';
import { AppConfig, getAppConfig } from './env.js';

export interface SystemIdentities {
  storageSigner: Wallet;
  publisherSigner: Wallet;
  stewardSigners: Wallet[];
}

export function loadIdentities(config: AppConfig = getAppConfig()): SystemIdentities {
  const storageSigner = new Wallet(config.STORAGE_SIGNER_PRIVATE_KEY);
  const publisherSigner = new Wallet(config.PUBLISHER_SIGNER_PRIVATE_KEY);

  // Assert storage signer and publisher signer are distinct
  if (storageSigner.address.toLowerCase() === publisherSigner.address.toLowerCase()) {
    throw new Error('SECURITY VIOLATION: Storage identity and Publishing identity MUST be separate.');
  }

  const stewardKeys = [
    config.GOVERNANCE_STEWARD_1_KEY,
    config.GOVERNANCE_STEWARD_2_KEY,
    config.GOVERNANCE_STEWARD_3_KEY,
    config.GOVERNANCE_STEWARD_4_KEY,
    config.GOVERNANCE_STEWARD_5_KEY,
    config.GOVERNANCE_STEWARD_6_KEY,
    config.GOVERNANCE_STEWARD_7_KEY,
  ];

  const stewardSigners = stewardKeys.map((key) => new Wallet(key));

  // Verify all 7 steward addresses are unique
  const addresses = new Set(stewardSigners.map((s) => s.address.toLowerCase()));
  if (addresses.size !== 7) {
    throw new Error('CONFIG ERROR: All 7 monastery stewards must have distinct signing identities.');
  }

  return {
    storageSigner,
    publisherSigner,
    stewardSigners,
  };
}
