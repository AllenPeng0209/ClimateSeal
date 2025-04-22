import { CheckpointManager } from '~/lib/checkpoints/CheckpointManager';
import { supabase } from '~/lib/supabase';
import { message } from 'antd';

interface CheckpointSyncStatus {
  status: 'idle' | 'pending' | 'synced' | 'error';
  lastSynced: number;
  error?: string;
}

const SYNC_STATUS_KEY = 'checkpoint_sync_status';
const CHECKPOINT_TABLE = 'carbon_workflow_checkpoints';

export class CheckpointSyncService {

  static getSyncStatus(): CheckpointSyncStatus {
    const statusJson = localStorage.getItem(SYNC_STATUS_KEY);
    if (statusJson) {
      try {
        return JSON.parse(statusJson);
      } catch (e) {
        console.error("Error parsing sync status from localStorage", e);
      }
    }
    return { status: 'idle', lastSynced: 0 };
  }

  private static updateSyncStatus(status: CheckpointSyncStatus['status'], error?: string) {
    const newStatus: CheckpointSyncStatus = {
      status,
      lastSynced: status === 'synced' ? Date.now() : this.getSyncStatus().lastSynced,
      error: error,
    };
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(newStatus));
    console.log('Sync status updated:', newStatus);
  }

  static async syncSingleCheckpointToSupabase(name: string): Promise<{ success: boolean; error?: string }> {
    this.updateSyncStatus('pending');
    try {
      const allMetadata = await CheckpointManager.listCheckpoints();
      const checkpointMetadata = allMetadata.find(meta => meta.name === name);
      
      if (!checkpointMetadata) {
        throw new Error(`Checkpoint metadata for '${name}' not found locally.`);
      }
      
      const checkpointData = await CheckpointManager.restoreCheckpoint(name);
      
      if (!checkpointData) {
        throw new Error(`Checkpoint data for '${name}' could not be restored.`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated.');
      }

      const checkpointRecord = {
        id: `${user.id}-${name}`,
        user_id: user.id,
        name: name,
        timestamp: checkpointMetadata.timestamp,
        data: checkpointData,
        metadata: checkpointMetadata.metadata || {},
        last_updated: new Date().toISOString(),
      };

      const { error } = await supabase
        .from(CHECKPOINT_TABLE)
        .upsert(checkpointRecord, { onConflict: 'id' });

      if (error) {
        throw error;
      }

      this.updateSyncStatus('synced');
      return { success: true };

    } catch (error: any) {
      console.error(`Error syncing checkpoint '${name}' to Supabase:`, error);
      this.updateSyncStatus('error', error.message);
      return { success: false, error: error.message };
    }
  }
  
  static async syncToSupabase(): Promise<{ success: boolean; error?: string }> {
    this.updateSyncStatus('pending');
    try {
      const localCheckpointsMeta = await CheckpointManager.listCheckpoints();
      if (localCheckpointsMeta.length === 0) {
        message.info('No local checkpoints to sync.');
        this.updateSyncStatus('idle');
        return { success: true };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');

      const recordsToUpsert = [];
      for (const meta of localCheckpointsMeta) {
        const data = await CheckpointManager.restoreCheckpoint(meta.name);
        if (data) {
          recordsToUpsert.push({
            id: `${user.id}-${meta.name}`,
            user_id: user.id,
            name: meta.name,
            timestamp: meta.timestamp,
            data: data,
            metadata: meta.metadata || {},
            last_updated: new Date().toISOString(),
          });
        }
      }

      if (recordsToUpsert.length > 0) {
        const { error } = await supabase
          .from(CHECKPOINT_TABLE)
          .upsert(recordsToUpsert, { onConflict: 'id' });
        if (error) throw error;
      }

      this.updateSyncStatus('synced');
      message.success('All local checkpoints synced to Supabase.');
      return { success: true };

    } catch (error: any) {
      console.error('Error syncing all checkpoints to Supabase:', error);
      this.updateSyncStatus('error', error.message);
      message.error(`Sync failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  static async restoreFromSupabase(): Promise<{ success: boolean; error?: string }> {
    this.updateSyncStatus('pending');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated.');

      const { data: cloudCheckpoints, error } = await supabase
        .from(CHECKPOINT_TABLE)
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!cloudCheckpoints || cloudCheckpoints.length === 0) {
        message.info('No checkpoints found in Supabase to restore.');
        this.updateSyncStatus('idle');
        return { success: true };
      }

      for (const cp of cloudCheckpoints) {
        let checkpointData = cp.data;
        if (typeof cp.data === 'string') {
          try {
            checkpointData = JSON.parse(cp.data);
          } catch (e) {
            console.error(`Failed to parse data for checkpoint ${cp.name}`, e);
            continue;
          }
        } else if (typeof cp.data !== 'object' || cp.data === null) {
           console.error(`Invalid data format for checkpoint ${cp.name}`);
           continue;
        }

        if (!checkpointData || typeof checkpointData !== 'object') continue; 

        await CheckpointManager.saveCheckpoint(
          cp.name,
          checkpointData as any,
          cp.metadata || {}
        );
      }

      this.updateSyncStatus('synced');
      message.success('Checkpoints restored from Supabase.');
      return { success: true };

    } catch (error: any) {
      console.error('Error restoring checkpoints from Supabase:', error);
      this.updateSyncStatus('error', error.message);
      message.error(`Restore failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  static startAutoSync(): () => void {
    console.log("Starting auto-sync (currently inactive, logic needs implementation)");
    const intervalId = setInterval(async () => {
       // Implement auto-sync logic if desired
       // console.log("Auto-sync running...");
       // await this.syncToSupabase(); 
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }
} 