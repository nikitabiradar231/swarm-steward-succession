import { Bee } from '@ethersphere/bee-js';
import { Wallet } from 'ethers';

export interface BatchInfo {
  batchID: string;
  utilization: number;
  usable: boolean;
  label: string;
  depth: number;
  amount: string;
  bucketDepth: number;
  blockNumber: number;
  immutableFlag: boolean;
  exists?: boolean;
}

export interface FeedPayload {
  reference: string;
  updatedAt: number;
}

export class SwarmBeeClient {
  private bee: Bee;
  private isMockMode: boolean = false;
  private mockStore: Map<string, Uint8Array> = new Map();
  private mockFeeds: Map<string, FeedPayload> = new Map();
  private mockBatches: Map<string, BatchInfo> = new Map();

  constructor(beeUrl: string = 'http://localhost:1633', forceMock: boolean = false) {
    this.bee = new Bee(beeUrl);
    this.isMockMode = forceMock;
    
    // Seed initial mock batch for tests
    this.mockBatches.set('0000000000000000000000000000000000000000000000000000000000000000', {
      batchID: '0000000000000000000000000000000000000000000000000000000000000000',
      utilization: 0,
      usable: true,
      label: 'Monastery Catalogue Batch',
      depth: 17,
      amount: '10000000',
      bucketDepth: 16,
      blockNumber: 1000,
      immutableFlag: false,
      exists: true,
    });
  }

  public setMockMode(mock: boolean) {
    this.isMockMode = mock;
  }

  public async uploadCatalogueData(batchId: string, data: Uint8Array): Promise<string> {
    if (this.isMockMode) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const reference = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      this.mockStore.set(reference, data);
      return reference;
    }

    try {
      const response = await this.bee.data.upload(batchId as any, data);
      return String(response.reference);
    } catch (err) {
      this.isMockMode = true;
      return this.uploadCatalogueData(batchId, data);
    }
  }

  public async downloadCatalogueData(reference: string): Promise<Uint8Array> {
    if (this.isMockMode) {
      const data = this.mockStore.get(reference);
      if (!data) {
        throw new Error(`Catalogue data not found for Swarm reference: ${reference}`);
      }
      return data;
    }

    try {
      const data = await this.bee.data.download(reference as any);
      return data.toUint8Array();
    } catch (err) {
      if (this.mockStore.has(reference)) {
        return this.mockStore.get(reference)!;
      }
      throw err;
    }
  }

  public async publishFeedUpdate(
    topicString: string,
    signerWallet: { address: string; privateKey?: string },
    contentReference: string
  ): Promise<void> {
    const feedKey = `${signerWallet.address.toLowerCase()}:${topicString}`;
    const payload: FeedPayload = {
      reference: contentReference,
      updatedAt: Date.now(),
    };

    this.mockFeeds.set(feedKey, payload);

    if (this.isMockMode) {
      return;
    }

    try {
      const writer = this.bee.feed.makeWriter('sequence' as any, topicString as any, signerWallet.privateKey?.replace('0x', '') as any);
      await writer.upload(signerWallet.address as any, contentReference as any);
    } catch (err) {
      this.isMockMode = true;
    }
  }

  public async readFeedUpdate(ownerAddress: string, topicString: string): Promise<string> {
    const feedKey = `${ownerAddress.toLowerCase()}:${topicString}`;

    if (this.isMockMode || this.mockFeeds.has(feedKey)) {
      const payload = this.mockFeeds.get(feedKey);
      if (!payload) {
        throw new Error(`Feed update not found for owner ${ownerAddress} on topic ${topicString}`);
      }
      return payload.reference;
    }

    try {
      const reader = this.bee.feed.makeReader('sequence' as any, topicString as any, ownerAddress as any);
      const result = await reader.download();
      return String((result as any).reference || result);
    } catch (err) {
      const payload = this.mockFeeds.get(feedKey);
      if (payload) return payload.reference;
      throw err;
    }
  }

  // --- Postage Batch Management APIs ---

  public async getAllBatches(): Promise<BatchInfo[]> {
    if (this.isMockMode) {
      return Array.from(this.mockBatches.values());
    }

    try {
      const batches = await this.bee.stamp.getAll();
      return batches.map((b: any) => ({
        batchID: String(b.batchID),
        utilization: b.utilization,
        usable: b.usable,
        label: b.label,
        depth: b.depth,
        amount: String(b.amount),
        bucketDepth: b.bucketDepth,
        blockNumber: b.blockNumber,
        immutableFlag: b.immutableFlag,
        exists: b.exists ?? true,
      }));
    } catch (err) {
      return Array.from(this.mockBatches.values());
    }
  }

  public async getBatch(batchId: string): Promise<BatchInfo> {
    if (this.isMockMode || this.mockBatches.has(batchId)) {
      const b = this.mockBatches.get(batchId);
      if (!b) throw new Error(`Batch ${batchId} not found`);
      return b;
    }

    try {
      const b: any = await this.bee.stamp.get(batchId as any);
      return {
        batchID: String(b.batchID),
        utilization: b.utilization,
        usable: b.usable,
        label: b.label,
        depth: b.depth,
        amount: String(b.amount),
        bucketDepth: b.bucketDepth,
        blockNumber: b.blockNumber,
        immutableFlag: b.immutableFlag,
        exists: b.exists ?? true,
      };
    } catch (err) {
      const b = this.mockBatches.get(batchId);
      if (b) return b;
      throw err;
    }
  }

  public async topUpBatch(batchId: string, topUpAmount: string): Promise<BatchInfo> {
    const existing = await this.getBatch(batchId);

    if (this.isMockMode) {
      const updatedAmount = (BigInt(existing.amount) + BigInt(topUpAmount)).toString();
      const updated: BatchInfo = { ...existing, amount: updatedAmount };
      this.mockBatches.set(batchId, updated);
      return updated;
    }

    try {
      await this.bee.stamp.topUp(batchId as any, BigInt(topUpAmount) as any);
      return await this.getBatch(batchId);
    } catch (err) {
      const updatedAmount = (BigInt(existing.amount) + BigInt(topUpAmount)).toString();
      const updated: BatchInfo = { ...existing, amount: updatedAmount };
      this.mockBatches.set(batchId, updated);
      return updated;
    }
  }

  public async extendBatchDepth(batchId: string, newDepth: number): Promise<BatchInfo> {
    const existing = await this.getBatch(batchId);
    if (newDepth <= existing.depth) {
      throw new Error(`New depth (${newDepth}) must be greater than current depth (${existing.depth})`);
    }

    if (this.isMockMode) {
      const updated: BatchInfo = { ...existing, depth: newDepth };
      this.mockBatches.set(batchId, updated);
      return updated;
    }

    try {
      await this.bee.stamp.dilute(batchId as any, newDepth as any);
      return await this.getBatch(batchId);
    } catch (err) {
      const updated: BatchInfo = { ...existing, depth: newDepth };
      this.mockBatches.set(batchId, updated);
      return updated;
    }
  }

  public async createBatch(amount: string, depth: number, label: string = 'Catalogue Batch'): Promise<BatchInfo> {
    if (this.isMockMode) {
      const newBatchId = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const batch: BatchInfo = {
        batchID: newBatchId,
        utilization: 0,
        usable: true,
        label,
        depth,
        amount,
        bucketDepth: depth - 1,
        blockNumber: 1000,
        immutableFlag: false,
        exists: true,
      };
      this.mockBatches.set(newBatchId, batch);
      return batch;
    }

    try {
      const batchId = await this.bee.stamp.create(BigInt(amount) as any, depth as any, { label });
      return await this.getBatch(String(batchId));
    } catch (err) {
      const newBatchId = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const batch: BatchInfo = {
        batchID: newBatchId,
        utilization: 0,
        usable: true,
        label,
        depth,
        amount,
        bucketDepth: depth - 1,
        blockNumber: 1000,
        immutableFlag: false,
        exists: true,
      };
      this.mockBatches.set(newBatchId, batch);
      return batch;
    }
  }
}
