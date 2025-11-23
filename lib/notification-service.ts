import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export interface NotificationOptions {
  title: string;
  body?: string;
}

export const sendSystemNotification = async (options: NotificationOptions) => {
  try {
    let permissionGranted = await isPermissionGranted();

    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }

    if (permissionGranted) {
      sendNotification({
        title: options.title,
        body: options.body,
      });
      console.log('Notification sent:', options);
    } else {
      console.warn('Notification permission not granted');
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};
