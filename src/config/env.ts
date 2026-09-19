import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  BEE_API_URL: z.string().url().default('http://localhost:1633'),
  BEE_POSTAGE_BATCH_ID: z.string().default('fc0d88fabd3ca06e3b8992e07aadaf1b5c00ebd632acf86aa19bb0cf19206a7e'),
  STORAGE_SIGNER_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Must be a 32-byte hex private key'),
  PUBLISHER_SIGNER_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Must be a 32-byte hex private key'),
  GOVERNANCE_STEWARD_1_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  GOVERNANCE_STEWARD_2_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  GOVERNANCE_STEWARD_3_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  GOVERNANCE_STEWARD_4_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  GOVERNANCE_STEWARD_5_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  GOVERNANCE_STEWARD_6_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  GOVERNANCE_STEWARD_7_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  GOVERNANCE_FEED_TOPIC: z.string().default('monastery-catalogue-root'),
});

// Deterministic default test keys when env vars are missing
const DEFAULT_KEYS = [
  '0x1111111111111111111111111111111111111111111111111111111111111111', // Storage
  '0x2222222222222222222222222222222222222222222222222222222222222222', // Publisher
  '0x3333333333333333333333333333333333333333333333333333333333333333', // Steward 1
  '0x4444444444444444444444444444444444444444444444444444444444444444', // Steward 2
  '0x5555555555555555555555555555555555555555555555555555555555555555', // Steward 3
  '0x6666666666666666666666666666666666666666666666666666666666666666', // Steward 4
  '0x7777777777777777777777777777777777777777777777777777777777777777', // Steward 5
  '0x8888888888888888888888888888888888888888888888888888888888888888', // Steward 6
  '0x9999999999999999999999999999999999999999999999999999999999999999', // Steward 7
];

export function getAppConfig(overrides: Record<string, string> = {}) {
  const envInput = {
    BEE_API_URL: process.env.BEE_API_URL || 'http://localhost:1633',
    BEE_POSTAGE_BATCH_ID: process.env.BEE_POSTAGE_BATCH_ID || 'fc0d88fabd3ca06e3b8992e07aadaf1b5c00ebd632acf86aa19bb0cf19206a7e',
    STORAGE_SIGNER_PRIVATE_KEY: process.env.STORAGE_SIGNER_PRIVATE_KEY || DEFAULT_KEYS[0],
    PUBLISHER_SIGNER_PRIVATE_KEY: process.env.PUBLISHER_SIGNER_PRIVATE_KEY || DEFAULT_KEYS[1],
    GOVERNANCE_STEWARD_1_KEY: process.env.GOVERNANCE_STEWARD_1_KEY || DEFAULT_KEYS[2],
    GOVERNANCE_STEWARD_2_KEY: process.env.GOVERNANCE_STEWARD_2_KEY || DEFAULT_KEYS[3],
    GOVERNANCE_STEWARD_3_KEY: process.env.GOVERNANCE_STEWARD_3_KEY || DEFAULT_KEYS[4],
    GOVERNANCE_STEWARD_4_KEY: process.env.GOVERNANCE_STEWARD_4_KEY || DEFAULT_KEYS[5],
    GOVERNANCE_STEWARD_5_KEY: process.env.GOVERNANCE_STEWARD_5_KEY || DEFAULT_KEYS[6],
    GOVERNANCE_STEWARD_6_KEY: process.env.GOVERNANCE_STEWARD_6_KEY || DEFAULT_KEYS[7],
    GOVERNANCE_STEWARD_7_KEY: process.env.GOVERNANCE_STEWARD_7_KEY || DEFAULT_KEYS[8],
    GOVERNANCE_FEED_TOPIC: process.env.GOVERNANCE_FEED_TOPIC || 'monastery-catalogue-root',
    ...overrides,
  };

  return envSchema.parse(envInput);
}

export type AppConfig = ReturnType<typeof getAppConfig>;
