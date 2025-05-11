// import { openDB, type IDBPDatabase } from 'idb';
import type { Node, Edge } from 'reactflow';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import type { CarbonFlowCheckpoint, CheckpointData, CheckpointMetadata } from '~/types/checkpoints';

export class CheckpointManager {
  private static readonly STORAGE_KEY = 'carbonflow_checkpoints';
  private static readonly MAX_CHECKPOINTS = 10;
  private static readonly DB_NAME = 'CarbonFlowCheckpoints';
  private static readonly STORE_NAME = 'checkpoints';
  private static readonly DB_VERSION = 2;
  private static readonly METADATA_KEY = 'checkpointMetadata';

  private static async openDatabase(): Promise<IDBPDatabase> {
    const storeName = CheckpointManager.STORE_NAME;

    return openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading IndexedDB from version ${oldVersion} to ${newVersion}`);

        if (db.objectStoreNames.contains(storeName)) {
          console.log(`Deleting existing store '${storeName}' for schema update.`);
          db.deleteObjectStore(storeName);
        }
        
        console.log(`Creating new store '${storeName}'.`);
        db.createObjectStore(storeName, { keyPath: 'name' });
      },
      blocked() {
        toast.error("Database upgrade blocked. Please close other tabs/windows using this application.");
        console.error("IndexedDB upgrade blocked.");
      },
      blocking() {
        toast.warning("Database upgrade required. Please refresh the page or close this tab.");
        console.warn("IndexedDB upgrade blocking.");
      },
      terminated() {
        toast.error("Database connection terminated unexpectedly. Please refresh the page.");
        console.error("IndexedDB connection terminated.");
      },
    });
  }

  private static getMetadata(): CheckpointMetadata[] {
    try {
      const storedMetadata = localStorage.getItem(this.METADATA_KEY);
      return storedMetadata ? JSON.parse(storedMetadata) as CheckpointMetadata[] : [];
    } catch (error) {
      console.error("Error reading checkpoint metadata from localStorage:", error);
      toast.error("Failed to load checkpoint list.");
      return [];
    }
  }

  private static saveMetadata(metadata: CheckpointMetadata[]): void {
    try {
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error("Error saving checkpoint metadata to localStorage:", error);
      toast.error("Failed to update checkpoint list.");
    }
  }

  static async saveCheckpoint(
    name: string, 
    data: CheckpointData, 
    metadata?: Partial<CheckpointMetadata>
  ): Promise<boolean> {
    if (!name || !name.trim()) {
        toast.error("Checkpoint name cannot be empty.");
        return false;
    }

    const timestamp = Date.now();
    const trimmedName = name.trim();

    const metadataToStore: CheckpointMetadata = {
        name: trimmedName,
        timestamp: timestamp,
        description: metadata?.description || '',
        tags: metadata?.tags || [],
        version: metadata?.version || '1.0'
    };

    let db: IDBPDatabase | null = null;
    try {
        db = await this.openDatabase();
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);

        const dataWithKey = {
            ...data,
            name: trimmedName
        };
        await store.put(dataWithKey);

        let currentMetadata = this.getMetadata();
        const existingIndex = currentMetadata.findIndex(m => m.name === trimmedName);

        if (existingIndex > -1) {
          currentMetadata[existingIndex] = metadataToStore;
        } else {
          currentMetadata.push(metadataToStore);
          currentMetadata.sort((a, b) => b.timestamp - a.timestamp);
          if (currentMetadata.length > this.MAX_CHECKPOINTS) {
            const oldestCheckpoint = currentMetadata.pop();
            if (oldestCheckpoint) {
                const deleteTx = db.transaction(this.STORE_NAME, 'readwrite');
                await deleteTx.objectStore(this.STORE_NAME).delete(oldestCheckpoint.name);
                await deleteTx.done;
                console.log(`Removed oldest checkpoint '${oldestCheckpoint.name}' due to limit.`);
                toast.info(`Removed oldest checkpoint '${oldestCheckpoint.name}' to stay within the ${this.MAX_CHECKPOINTS} checkpoint limit.`);
            }
          }
        }

        await tx.done;
        this.saveMetadata(currentMetadata);

        console.log(`Checkpoint '${trimmedName}' saved successfully.`);
        toast.success(`Checkpoint '${trimmedName}' saved.`);
        return true;
    } catch (error) {
        console.error(`Error saving checkpoint '${trimmedName}':`, error);
        toast.error(`Failed to save checkpoint '${trimmedName}'. See console for details.`);
        this.saveMetadata(this.getMetadata());
        return false;
    } finally {
        db?.close();
    }
  }

  static async restoreCheckpoint(name: string): Promise<CheckpointData | null> {
    let db: IDBPDatabase | null = null;
    try {
      db = await this.openDatabase();
      const data = await db.get(this.STORE_NAME, name);
      if (data) {
        console.log(`Checkpoint '${name}' restored successfully.`);
        toast.success(`Checkpoint '${name}' restored.`);
        return data as CheckpointData;
      } else {
        console.warn(`Checkpoint '${name}' not found in database.`);
        toast.warn(`Checkpoint '${name}' not found.`);
        return null;
      }
    } catch (error) {
      console.error(`Error restoring checkpoint '${name}':`, error);
      toast.error(`Failed to restore checkpoint '${name}'.`);
      return null;
    } finally {
        db?.close();
    }
  }

  static async listCheckpoints(): Promise<CheckpointMetadata[]> {
    return this.getMetadata().sort((a, b) => b.timestamp - a.timestamp);
  }

  static async deleteCheckpoint(name: string): Promise<boolean> {
     let db: IDBPDatabase | null = null;
    try {
      db = await this.openDatabase();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      await tx.objectStore(this.STORE_NAME).delete(name);
      await tx.done;

      let currentMetadata = this.getMetadata();
      currentMetadata = currentMetadata.filter(m => m.name !== name);
      this.saveMetadata(currentMetadata);

      console.log(`Checkpoint '${name}' deleted successfully.`);
      toast.success(`Checkpoint '${name}' deleted.`);
      return true;
    } catch (error) {
      console.error(`Error deleting checkpoint '${name}':`, error);
      toast.error(`Failed to delete checkpoint '${name}'.`);
      return false;
    } finally {
        db?.close();
    }
  }

  static async exportCheckpoint(name: string): Promise<string | null> {
     let db: IDBPDatabase | null = null;
    try {
      db = await this.openDatabase();
      const data = await db.get(this.STORE_NAME, name);
      const metadata = this.getMetadata().find(m => m.name === name);

      if (data && metadata) {
         const checkpointToExport = {
            name: metadata.name,
            timestamp: metadata.timestamp,
            data: data as CheckpointData,
            metadata: {
                description: metadata.description,
                tags: metadata.tags,
                version: metadata.version
            }
         };
         return JSON.stringify(checkpointToExport as CarbonFlowCheckpoint, null, 2);
      } else {
         console.warn(`Checkpoint '${name}' data or metadata not found for export.`);
         toast.warn(`Could not find complete data for checkpoint '${name}' to export.`);
        return null;
      }
    } catch (error) {
      console.error(`Error exporting checkpoint '${name}':`, error);
      toast.error(`Failed to export checkpoint '${name}'.`);
      return null;
    } finally {
        db?.close();
    }
  }

  static async importCheckpoint(jsonString: string): Promise<boolean> {
    try {
      const checkpoint = JSON.parse(jsonString) as CarbonFlowCheckpoint;
      if (!checkpoint.name || !checkpoint.timestamp || !checkpoint.data) {
          throw new Error("Invalid checkpoint file format: Missing required fields.");
      }
      if (typeof checkpoint.name !== 'string' || typeof checkpoint.timestamp !== 'number' || typeof checkpoint.data !== 'object') {
          throw new Error("Invalid checkpoint file format: Incorrect field types.");
      }
      const metadataToSave = checkpoint.metadata ? {
        description: checkpoint.metadata.description,
        tags: checkpoint.metadata.tags,
        version: checkpoint.metadata.version
      } : {};
      return await this.saveCheckpoint(checkpoint.name, checkpoint.data, metadataToSave);
    } catch (error) {
        console.error("Error importing checkpoint:", error);
        if (error instanceof SyntaxError) {
            toast.error("Failed to import: Invalid JSON file.");
        } else if (error instanceof Error) {
             toast.error(`Failed to import checkpoint: ${error.message}`);
        } else {
             toast.error("An unknown error occurred during import.");
        }
        return false;
    }
  }

  static async clearAllCheckpoints(): Promise<boolean> {
    let db: IDBPDatabase | null = null;
    try {
        db = await this.openDatabase();
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        await tx.objectStore(this.STORE_NAME).clear();
        await tx.done;

        this.saveMetadata([]);

        console.log("All checkpoints cleared successfully.");
        toast.success("All local checkpoints cleared.");
        return true;
    } catch (error) {
        console.error("Error clearing all checkpoints:", error);
        toast.error("Failed to clear all local checkpoints.");
        return false;
    } finally {
        db?.close();
    }
  }
} 