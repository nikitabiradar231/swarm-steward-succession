import { Wallet } from 'ethers';
import { SwarmBeeClient, BatchInfo } from '../swarm/bee-client.js';

export interface BatchStatusSummary {
  batchId: string;
  usable: boolean;
  amount: string;
  depth: number;
  utilization: number;
  label: string;
  isFundingSufficient: boolean;
}

export class PostageBatchManager {
  constructor(
    private beeClient: SwarmBeeClient,
    private storageSignerWallet: Wallet
  ) {}

  public getStorageSignerAddress(): string {
    return this.storageSignerWallet.address.toLowerCase();
  }

  /**
   * Inspect all postage batches available on the Bee node.
   */
  public async inspectAllBatches(): Promise<BatchInfo[]> {
    return this.beeClient.getAllBatches();
  }

  /**
   * Inspect status of specific catalogue postage batch.
   */
  public async inspectCatalogueBatch(batchId: string): Promise<BatchStatusSummary> {
    const batch = await this.beeClient.getBatch(batchId);
    const amountBigInt = BigInt(batch.amount);
    const isFundingSufficient = batch.usable && amountBigInt > 1000n;

    return {
      batchId: batch.batchID,
      usable: batch.usable,
      amount: batch.amount,
      depth: batch.depth,
      utilization: batch.utilization,
      label: batch.label,
      isFundingSufficient,
    };
  }

  /**
   * Tops up the balance of an existing postage batch.
   * Executed using STORAGE_SIGNER.
   */
  public async topUpCatalogueBatch(batchId: string, topUpAmountBzz: string): Promise<BatchInfo> {
    if (BigInt(topUpAmountBzz) <= 0n) {
      throw new Error('INVALID_TOPUP_AMOUNT: Top-up amount must be greater than zero.');
    }
    return this.beeClient.topUpBatch(batchId, topUpAmountBzz);
  }

  /**
   * Extends the depth (storage capacity) of an existing postage batch.
   * Executed using STORAGE_SIGNER.
   */
  public async extendCatalogueBatchDepth(batchId: string, newDepth: number): Promise<BatchInfo> {
    const current = await this.beeClient.getBatch(batchId);
    if (newDepth <= current.depth) {
      throw new Error(`INVALID_DEPTH: New depth (${newDepth}) must be greater than current depth (${current.depth}).`);
    }
    return this.beeClient.extendBatchDepth(batchId, newDepth);
  }

  /**
   * Creates a new postage batch if no usable batch exists.
   * Executed using STORAGE_SIGNER.
   */
  public async createNewCatalogueBatch(
    amountBzz: string,
    depth: number,
    label: string = 'Monastery Catalogue Batch'
  ): Promise<BatchInfo> {
    return this.beeClient.createBatch(amountBzz, depth, label);
  }
}
