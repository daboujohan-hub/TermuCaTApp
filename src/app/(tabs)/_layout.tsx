import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function Icon({ label }: { label: string }) {
  return <Text style={{ fontSize: 18 }}>{label}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#0B8A6B' }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Discussions', tabBarIcon: () => <Icon label="💬" /> }}
      />
      <Tabs.Screen
        name="docs"
        options={{ title: 'Aide', tabBarIcon: () => <Icon label="📘" /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Réglages', tabBarIcon: () => <Icon label="⚙️" /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Compte', tabBarIcon: () => <Icon label="👤" /> }}
      />
    </Tabs>
  );
}
