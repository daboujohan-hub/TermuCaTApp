import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Lien de la page de don (laisser vide pour masquer le bouton).
const URL_PAGE_DON = '';

export default function SoutenirScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Soutenir TermChat</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Pourquoi faire un don ?</Text>
          <Text style={styles.heroSub}>
            Vos dons permettent de soutenir le développement de TermChat et de contribuer à la création de nouvelles communautés.
          </Text>
        </View>

        <Text style={styles.h2}>À quoi servent les dons</Text>
        <Text style={styles.li}>• Développer TermChat : serveurs, développement, maintenance, nouvelles fonctionnalités.</Text>
        <Text style={styles.li}>• Créer des communautés : aider des utilisateurs et des créateurs à développer des communautés autour de leurs projets.</Text>
        <Text style={styles.li}>• Soutenir de petits projets : selon les possibilités, aider d'autres initiatives à progresser.</Text>

        <Text style={styles.h2}>Comment les dons sont-ils utilisés ?</Text>
        <Text style={styles.p}>
          Les dons peuvent contribuer au développement et à la maintenance de TermChat, à la création de communautés et, selon les possibilités du projet, au soutien de petits projets et d'initiatives.
        </Text>

        {URL_PAGE_DON ? (
          <Pressable style={styles.btn} onPress={() => Linking.openURL(URL_PAGE_DON)}>
            <Text style={styles.btnText}>Faire un don</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.lien} onPress={() => router.push('/abonnement' as any)}>
          <Text style={styles.lienText}>Découvrir l'abonnement Premium</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 20, paddingBottom: 60 },
  hero: { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 18, marginBottom: 6 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#1D4ED8' },
  heroSub: { fontSize: 13.5, color: '#1E3A8A', marginTop: 4, lineHeight: 19 },
  h2: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 22, marginBottom: 8 },
  p: { fontSize: 14, color: '#374151', lineHeight: 21 },
  li: { fontSize: 14, color: '#374151', lineHeight: 22 },
  btn: { backgroundColor: '#2F80ED', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  lien: { alignItems: 'center', marginTop: 18 },
  lienText: { color: '#2F80ED', fontSize: 13.5, fontWeight: '600' },
});
