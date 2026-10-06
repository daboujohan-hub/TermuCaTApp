import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
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
