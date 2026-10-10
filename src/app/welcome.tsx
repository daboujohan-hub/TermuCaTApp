import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MarqueDevDaj from '@/components/MarqueDevDaj';
export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.title}>TermChat</Text>
        <Text style={styles.subtitle}>Messagerie chiffrée, par AbouDev Labs.</Text>
      </View>

      <View style={styles.buttons}>
        <Pressable style={styles.primaryBtn} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.primaryBtnText}>Créer un compte</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.secondaryBtnText}>Se connecter</Text>
        </Pressable>
      </View>
      <MarqueDevDaj />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { width: 84, height: 84, borderRadius: 20, marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#8E8E93', marginTop: 8, textAlign: 'center' },
  buttons: { padding: 24, gap: 12 },
  primaryBtn: { backgroundColor: '#2F80ED', borderRadius: 16, padding: 16, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#F6F6F7', borderRadius: 16, padding: 16, alignItems: 'center' },
  secondaryBtnText: { color: '#111827', fontSize: 16, fontWeight: '700' },
});
