import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSessionStore } from '@/store/sessionStore';

export default function AccountScreen() {
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Compte</Text>
      <Text style={styles.stub}>
        {user ? `${user.nom} · ${user.pseudo} · ${user.numero}` : 'Non connecté'}
      </Text>
      <Text style={styles.stub}>Profil, abonnement, sécurité — à venir.</Text>
      <Text style={styles.logout} onPress={logout}>Se déconnecter</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F8', padding: 20 },
  title: { fontSize: 23, fontWeight: '800', color: '#16201C', marginBottom: 8 },
  stub: { fontSize: 14, color: '#6B7A73', marginBottom: 4 },
  logout: { fontSize: 14, color: '#E5484D', fontWeight: '700', marginTop: 24 },
});
