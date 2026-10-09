import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const RUBRIQUES: { icon: keyof typeof Ionicons.glyphMap; titre: string; sous: string; route: string }[] = [
  { icon: 'help-circle-outline', titre: 'FAQ', sous: 'Questions fréquentes', route: '/faq' },
  { icon: 'mail-outline', titre: 'Nous contacter', sous: "Envoyer un message à l'équipe", route: '/contact' },
  { icon: 'warning-outline', titre: 'Signaler un problème', sous: 'Aide technique', route: '/report' },
  { icon: 'document-text-outline', titre: "Conditions d'utilisation", sous: 'Vos droits et obligations', route: '/terms' },
  { icon: 'star-outline', titre: 'Abonnement Premium', sous: 'Avantages et tarif', route: '/abonnement' },
  { icon: 'heart-outline', titre: 'Soutenir TermChat', sous: 'Faire un don', route: '/soutenir' },
  { icon: 'lock-closed-outline', titre: 'Politique de confidentialité', sous: 'Protection de vos données', route: '/privacy' },
  { icon: 'information-circle-outline', titre: 'À propos de TermChat', sous: 'Notre mission et informations', route: '/about' },
];

export default function DocsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Aide</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeCard}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.welcomeTitle}>Besoin d'aide ?</Text>
          <Text style={styles.welcomeText}>
            Nous sommes là pour vous accompagner. Consultez les questions fréquentes ou contactez notre équipe d'assistance.
          </Text>
        </View>

        <View style={styles.card}>
          {RUBRIQUES.map((r, i) => (
            <Pressable key={r.titre} style={[styles.row, i === RUBRIQUES.length - 1 && styles.rowLast]} onPress={() => router.push(r.route as any)}>
              <View style={styles.rowIconWrap}>
                <Ionicons name={r.icon} size={18} color="#2F80ED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitre}>{r.titre}</Text>
                <Text style={styles.rowSous}>{r.sous}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </Pressable>
          ))}
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
  welcomeCard: { backgroundColor: '#EAF2FE', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 22 },
  logo: { width: 40, height: 40, borderRadius: 10, marginBottom: 10 },
  welcomeTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  welcomeText: { fontSize: 13, color: '#8E8E93', textAlign: 'center', lineHeight: 19 },
  card: { backgroundColor: '#F6F6F7', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EDEDED' },
  rowLast: { borderBottomWidth: 0 },
  rowIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EAF2FE', alignItems: 'center', justifyContent: 'center' },
  rowTitre: { fontSize: 14.5, fontWeight: '600', color: '#111827' },
  rowSous: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
