import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { activerNotifications, desactiverNotifications, verifierPermissionNotifications } from '@/notifications/pushRegistration';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(false);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      const actives = await verifierPermissionNotifications();
      setNotifications(actives);
      setChargement(false);
    })();
  }, []);

  const basculerNotifications = async (valeur: boolean) => {
    if (valeur) {
      const ok = await activerNotifications();
      if (ok) {
        setNotifications(true);
      } else {
        Alert.alert(
          'Permission refusée',
          "Active les notifications pour TermChat dans les réglages de ton téléphone pour recevoir des alertes même quand l'app est fermée."
        );
      }
    } else {
      await desactiverNotifications();
      setNotifications(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Notifications activées</Text>
            <Switch value={notifications} onValueChange={basculerNotifications} disabled={chargement} trackColor={{ false: '#D1D5DB', true: '#2F80ED' }} thumbColor="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.hint}>
          Reçois une notification pour les nouveaux messages même quand TermChat est fermé.
        </Text>
      
        <Text style={styles.sectionTitle}>ABONNEMENT</Text>
        <View style={styles.card}>
          <Pressable style={styles.optionRow} onPress={() => router.push('/abonnement' as any)}>
            <Text style={styles.optionLabel}>Abonnement Premium</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
          <Pressable style={[styles.optionRow, { borderTopWidth: 1, borderTopColor: '#E5E7EB' }]} onPress={() => router.push('/soutenir' as any)}>
            <Text style={styles.optionLabel}>Soutenir TermChat</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>AIDE</Text>
        <View style={styles.card}>
          <Pressable style={styles.optionRow} onPress={() => router.push('/docs' as any)}>
            <Text style={styles.optionLabel}>Aide et informations</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>COMPTE</Text>
        <View style={styles.card}>
          <Pressable style={styles.optionRow} onPress={() => router.push('/change-password' as any)}>
            <Text style={styles.optionLabel}>Changer le mot de passe</Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
          <Pressable style={[styles.optionRow, { borderTopWidth: 1, borderTopColor: '#E5E7EB' }]} onPress={() => router.push('/delete-account' as any)}>
            <Text style={[styles.optionLabel, { color: '#EF4444' }]}>Supprimer mon compte</Text>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginTop: 12, marginBottom: 8, letterSpacing: 0.5 },
  card: { backgroundColor: '#F6F6F7', borderRadius: 16, overflow: 'hidden' },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  optionLabel: { fontSize: 14.5, color: '#111827' },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 10, marginBottom: 4, lineHeight: 17 },
});
