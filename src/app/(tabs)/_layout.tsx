import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import termchatSocket from '@/api/socket';

export default function TabsLayout() {
  useEffect(() => {
    const unsub = termchatSocket.onMessage((data: any) => {
      if (!data || 'ok' in data) return;
      const nom = data.nom ? `« ${data.nom} »` : "de l'école";
      if (data.type === 'edumap_approuvee') {
        Alert.alert('École publiée', `Ta proposition ${nom} a été validée et publiée sur la carte.`);
      } else if (data.type === 'edumap_rejetee') {
        Alert.alert('Proposition non retenue', `Ta proposition ${nom} n'a pas été retenue.${data.raison ? '\n\nMotif : ' + data.raison : ''}`);
      }
    });
    return unsub;
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2F80ED',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#F0F0F0' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discussions',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="docs"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="edumap"
        options={{
          title: 'École',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'school' : 'school-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
