import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import ConnectionBanner from '@/components/ConnectionBanner';
import MessageHost from '@/components/MessageHost';
import VerrouApp from '@/components/VerrouApp';
import { useChargerMaPhoto } from '@/hooks/use-charger-ma-photo';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useChargerMaPhoto();
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <ConnectionBanner />
      <Stack screenOptions={{ headerShown: false }} />
      <MessageHost />
      <VerrouApp />
    </>
  );
}
