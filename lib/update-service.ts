import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateStatus {
  available: boolean;
  version?: string;
  body?: string;
  error?: string;
}

export const checkForAppUpdates = async (): Promise<UpdateStatus> => {
  try {
    const update = await check();
    
    if (update?.available) {
      return {
        available: true,
        version: update.version,
        body: update.body,
      };
    }
    
    return { available: false };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return { 
      available: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

export const installAppUpdate = async () => {
  try {
    const update = await check();
    if (update?.available) {
      await update.downloadAndInstall();
      await relaunch();
    }
  } catch (error) {
    console.error('Failed to install update:', error);
    throw error;
  }
};
