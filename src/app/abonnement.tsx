import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Lien de la page de paiement (laisser vide pour masquer le bouton).
const URL_PAGE_PAIEMENT = 'https://daboujohan-hub.github.io/PAIEMENT.DE.TERMCHAT/';

export default function AbonnementScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Abonnement Premium</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Premium : 5 000 FCFA</Text>
          <Text style={styles.heroSub}>5 000 FCFA pour 5 mois de Premium.</Text>
        </View>

        <Text style={styles.h2}>Ce que Premium apporte</Text>
        <Text style={styles.li}>• Plus de contacts qu'avec le compte gratuit</Text>
        <Text style={styles.li}>• Des messages plus longs</Text>
        <Text style={styles.li}>• Des limites augmentées</Text>
        <Text style={styles.li}>• Les futures fonctions réservées au Premium, comme l'envoi de fichiers, bientôt disponible</Text>

        <Text style={styles.h2}>Toujours gratuit</Text>
        <Text style={styles.p}>
          Les fonctions essentielles de messagerie restent accessibles gratuitement : écrire à tes contacts, envoyer des messages vocaux et recevoir des notifications.
        </Text>

        <Text style={styles.h2}>Pourquoi un abonnement ?</Text>
        <Text style={styles.p}>
          Une application de messagerie a besoin de ressources pour fonctionner : serveurs, stockage, maintenance, sécurité et développement. Sans financement, il devient beaucoup plus difficile de maintenir le service dans la durée et de l'améliorer.
        </Text>
        <Text style={[styles.p, { marginTop: 10 }]}>L'abonnement sert notamment à :</Text>
        <Text style={styles.li}>• financer la maintenance de l'application ;</Text>
        <Text style={styles.li}>• payer les serveurs et l'infrastructure ;</Text>
        <Text style={styles.li}>• continuer à développer TermChat ;</Text>
        <Text style={styles.li}>• ajouter de nouvelles fonctionnalités ;</Text>
        <Text style={styles.li}>• augmenter les capacités de l'application ;</Text>
        <Text style={styles.li}>• permettre au projet de rester actif dans le temps.</Text>

        {URL_PAGE_PAIEMENT ? (
          <Pressable style={styles.btn} onPress={() => Linking.openURL(URL_PAGE_PAIEMENT)}>
            <Text style={styles.btnText}>Ouvrir la page de paiement</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.lien} onPress={() => router.push('/privacy' as any)}>
          <Text style={styles.lienText}>Lire la politique de confidentialité</Text>
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
