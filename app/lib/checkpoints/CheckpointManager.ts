import type { Node, Edge } from 'reactflow';
import type { AISummary } from '~/components/workbench/CarbonFlow';
import type { NodeData } from '~/components/workbench/CarbonFlow/CarbonFlowActions';

export interface CarbonFlowCheckpoint {
  timestamp: number;
  name: string;
  data: {
    nodes: Node<NodeData>[];
    edges: Edge[];
    aiSummary: AISummary;
    settings: {
      theme?: string;
      language?: string;
      notifications?: boolean;
      eventLogs?: boolean;
      timezone?: string;
      contextOptimization?: boolean;
      autoSelectTemplate?: boolean;
    };
  };
  metadata?: {
    description?: string;
    tags?: string[];
    version?: string;
  };
}

export class CheckpointManager {
  private static readonly STORAGE_KEY = 'carbonflow_checkpoints';
  private static readonly MAX_CHECKPOINTS = 10;
  private static readonly DB_NAME = 'CarbonFlowCheckpoints';
  private static readonly STORE_NAME = 'checkpoints';
  private static readonly DB_VERSION = 1;

  private static async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  static async saveCheckpoint(
    name: string, 
    data: CarbonFlowCheckpoint['data'], 
    metadata?: CarbonFlowCheckpoint['metadata']
  ): Promise<void> {
    try {
      const checkpoint: CarbonFlowCheckpoint = {
        timestamp: Date.now(),
        name,
        data,
        metadata: {
          version: '1.0.0',
          ...metadata,
        }
      };

      // 获取现有检查点
      const existingCheckpoints = await this.listCheckpoints();
      
      // 添加新检查点并保持最大数量限制
      const updatedCheckpoints = [
        {
          name: checkpoint.name,
          timestamp: checkpoint.timestamp,
          metadata: checkpoint.metadata
        },
        ...existingCheckpoints.slice(0, this.MAX_CHECKPOINTS - 1)
      ];

      // 保存到 IndexedDB
      const db = await this.openDatabase();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      await store.put(checkpoint, name);

      // 保存元数据到 localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedCheckpoints));

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('Failed to save checkpoint:', error);
      throw error;
    }
  }

  static async restoreCheckpoint(name: string): Promise<CarbonFlowCheckpoint['data']> {
    try {
      const db = await this.openDatabase();
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const request = store.get(name);
        request.onsuccess = () => {
          const checkpoint = request.result as CarbonFlowCheckpoint;
          if (!checkpoint) {
            reject(new Error(`Checkpoint "${name}" not found`));
          } else {
            resolve(checkpoint.data);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to restore checkpoint:', error);
      throw error;
    }
  }

  static async listCheckpoints(): Promise<Array<{
    name: string;
    timestamp: number;
    metadata?: CarbonFlowCheckpoint['metadata'];
  }>> {
    const metadataString = localStorage.getItem(this.STORAGE_KEY);
    return metadataString ? JSON.parse(metadataString) : [];
  }

  static async deleteCheckpoint(name: string): Promise<void> {
    try {
      const db = await this.openDatabase();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // 更新 localStorage 中的元数据
      const checkpoints = await this.listCheckpoints();
      const updatedCheckpoints = checkpoints.filter(cp => cp.name !== name);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedCheckpoints));
    } catch (error) {
      console.error('Failed to delete checkpoint:', error);
      throw error;
    }
  }

  static async exportCheckpoint(name: string): Promise<string> {
    const checkpoint = await this.restoreCheckpoint(name);
    return JSON.stringify(checkpoint);
  }

  static async importCheckpoint(name: string, checkpointData: string): Promise<void> {
    try {
      const data = JSON.parse(checkpointData);
      await this.saveCheckpoint(name, data);
    } catch (error) {
      console.error('Failed to import checkpoint:', error);
      throw error;
    }
  }
} 