import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SECTIONS = [
  { titre: 'Acceptation des conditions', texte: "En créant un compte TermChat, tu acceptes les présentes conditions d'utilisation. Si tu n'es pas d'accord, merci de ne pas utiliser l'application." },
  { titre: 'Ton compte', texte: "Tu es responsable de la confidentialité de ton mot de passe. Active la double authentification pour renforcer la sécurité de ton compte. Un seul compte par personne est autorisé." },
  { titre: 'Utilisation acceptable', texte: "Tu t'engages à ne pas utiliser TermChat pour harceler, menacer, usurper une identité, diffuser du contenu illégal, ou perturber le fonctionnement du service." },
  { titre: 'Contenu partagé', texte: "Tu restes propriétaire du contenu que tu publies (messages, fichiers, écritures, écoles ajoutées). Tu es seul responsable du contenu que tu partages et de sa conformité à la loi." },
  { titre: 'Compte Premium', texte: "Les fonctionnalités Premium (messages longs, contacts illimités, priorité de livraison) sont soumises à un abonnement payant, géré en dehors de l'application." },
  { titre: 'Suspension et résiliation', texte: "AbouDev Labs peut suspendre ou fermer un compte en cas de violation de ces conditions. Tu peux demander la suppression de ton compte à tout moment en contactant l'équipe." },
  { titre: 'Modifications', texte: "Ces conditions peuvent évoluer. Les changements importants seront communiqués dans l'application." },
  { titre: 'Contact', texte: "Pour toute question sur ces conditions, contacte AbouDev Labs (voir Compte → Aide → À propos)." },
];

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#111827" /></Pressable>
        <Text style={styles.title}>Conditions d'utilisation</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}</Text>
        {SECTIONS.map((s) => (
          <View key={s.titre} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.titre}</Text>
            <Text style={styles.sectionText}>{s.texte}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 20, paddingBottom: 60 },
  intro: { fontSize: 12, color: '#9CA3AF', marginBottom: 18 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2F80ED', marginBottom: 6 },
  sectionText: { fontSize: 13.5, color: '#8E8E93', lineHeight: 20 },
});
