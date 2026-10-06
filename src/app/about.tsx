import { router } from 'expo-router';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const LIENS: { icon: keyof typeof Ionicons.glyphMap; label: string; url: string }[] = [
  { icon: 'logo-github', label: 'GitHub', url: 'https://github.com/daboujohan-hub' },
  { icon: 'logo-tiktok', label: 'TikTok', url: 'https://tiktok.com/@aboujohan.dev' },
  { icon: 'logo-facebook', label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61575741733606' },
  { icon: 'logo-whatsapp', label: 'WhatsApp', url: 'https://wa.me/2250170404109' },
];

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#111827" /></Pressable>
        <Text style={styles.title}>À propos</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.centre}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.nom}>TERMCHAT</Text>
          <Text style={styles.slogan}>Messagerie sécurisée</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.description}>TermChat est une plateforme permettant de communiquer, partager des écritures et accéder à des ressources éducatives.</Text>
        </View>

        <Text style={styles.sectionTitle}>ABOUDEV LABS</Text>
        <View style={styles.card}>
          {LIENS.map((l, i) => (
            <Pressable key={l.label} style={[styles.row, i === LIENS.length - 1 && styles.rowLast]} onPress={() => Linking.openURL(l.url)}>
              <Ionicons name={l.icon} size={18} color="#2F80ED" />
              <Text style={styles.rowLabel}>{l.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </Pressable>
          ))}
        </View>

        <Text style={styles.copyright}>© TermChat · Tous droits réservés</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 20, paddingBottom: 60 },
  centre: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 64, height: 64, borderRadius: 16, marginBottom: 12 },
  nom: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: 0.5 },
  slogan: { fontSize: 13, color: '#2F80ED', fontWeight: '600', marginTop: 4 },
  version: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  description: { fontSize: 13.5, color: '#8E8E93', textAlign: 'center', lineHeight: 20, marginTop: 14 },
  sectionTitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  card: { backgroundColor: '#F6F6F7', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EDEDED' },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 14.5, color: '#111827', flex: 1 },
  copyright: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 24 },
});
