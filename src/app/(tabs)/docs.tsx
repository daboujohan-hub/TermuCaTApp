import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SECTIONS = [
  {
    titre: 'Sécurité',
    texte:
      "Tes messages texte sont chiffrés de bout en bout : ni le serveur ni personne d'autre que ton correspondant ne peut les lire. Les groupes ne sont pas encore chiffrés de bout en bout.",
  },
  {
    titre: 'Compte gratuit vs premium',
    texte:
      'Le compte gratuit permet des messages jusqu\'à 150 caractères et 5 contacts. Le premium débloque des messages plus longs, des contacts illimités et l\'envoi de fichiers.',
  },
  {
    titre: 'Double authentification (2FA)',
    texte:
      "Active la 2FA depuis ton compte pour sécuriser ta connexion avec un code à usage unique généré par une app comme Google Authenticator.",
  },
];

export default function DocsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Aide</Text>
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
  container: { flex: 1, backgroundColor: '#F7F9F8' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 23, fontWeight: '800', color: '#16201C', marginBottom: 20 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0B8A6B', marginBottom: 6 },
  sectionText: { fontSize: 13.5, color: '#6B7A73', lineHeight: 20 },
});
