import { Redirect } from 'expo-router';

import { useSessionStore } from '@/store/sessionStore';

export default function Index() {
  const status = useSessionStore((s) => s.status);
  return <Redirect href={status === 'connecte' ? '/(tabs)' : '/(auth)/login'} />;
}
