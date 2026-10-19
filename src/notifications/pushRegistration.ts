/**
 * notifications/pushRegistration.ts
 * Demande la permission de notifications et enregistre le jeton push
 * auprès du serveur (service de notifications Expo).
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { enregistrerPushToken, supprimerPushToken } from '@/api/actions/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function verifierPermissionNotifications(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function activerNotifications(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('[notifications] Pas de jeton push disponible sur simulateur.');
    return false;
  }

  const { status: statutExistant } = await Notifications.getPermissionsAsync();
  let statut = statutExistant;
  if (statut !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    statut = status;
  }
  if (statut !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync('messages_v2', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'termchat_notif.mp3',
      vibrationPattern: [0, 250, 150, 250],
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const res = await enregistrerPushToken(tokenData.data, Platform.OS);
    if ('ok' in res && !res.ok) {
      console.warn('[notifications] Enregistrement du jeton refusé par le serveur:', res.msg);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[notifications] Erreur enregistrement du jeton push:', e);
    return false;
  }
}

export async function desactiverNotifications(): Promise<void> {
  try {
    await supprimerPushToken();
  } catch (e) {
    console.warn('[notifications] Erreur suppression du jeton push:', e);
  }
}
