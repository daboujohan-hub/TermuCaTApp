import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SECTIONS = [
  { titre: 'Ce que nous collectons', texte: "Pour créer ton compte : ton prénom, ton nom, ton pseudo, ton pays, et un mot de passe (stocké chiffré). Si tu actives la double authentification, un secret TOTP est aussi conservé. Ton identifiant TermChat (ex: TC010512345678) sert de clé unique de compte." },
  { titre: 'Tes messages', texte: "Les messages texte sont chiffrés de bout en bout : ton téléphone chiffre le contenu avant envoi, et seul le destinataire peut le déchiffrer. Le serveur ne voit pas le texte des messages chiffrés (signalés par un petit cadenas). Si ton contact n'a pas encore de clé de chiffrement, le message est envoyé sans chiffrement de bout en bout. Les fichiers et messages vocaux, eux, ne sont pas chiffrés de bout en bout actuellement. Les messages vocaux sont conservés temporairement sur le serveur (environ 24 heures), puis supprimés." },
  { titre: 'École (EduMap)', texte: "Les informations et photos d'écoles ajoutées via EduMap (nom, quartier, position, photos) sont visibles par tous les utilisateurs de l'app — ce ne sont pas des données personnelles liées à ton compte." },
  { titre: 'Avec qui on partage', texte: "Tes données ne sont pas vendues ni partagées avec des tiers à des fins publicitaires. Elles sont stockées sur l'infrastructure technique utilisée par TermChat (hébergement Railway, base de données Firebase) pour faire fonctionner le service." },
  { titre: 'Tes choix', texte: "Tu peux modifier ou supprimer ton pseudo, ta bio, ton statut, ta couleur et ta photo de profil à tout moment depuis l'app. Tu peux aussi supprimer des messages ou des conversations entières. Tu peux supprimer ton compte depuis Paramètres → Compte → Supprimer mon compte : il est alors désactivé immédiatement. Pour demander l'effacement complet de tes données, contacte AbouDev Labs via la page Nous contacter." },
  { titre: 'Abonnement Premium et dons', texte: "Le Premium coûte 5 000 FCFA pour 5 mois. Il sert à financer la maintenance, les serveurs et le développement de TermChat. Le paiement se fait sur une page dédiée, en dehors de l'application. Les dons sont volontaires : ils soutiennent TermChat, la création de communautés et, selon les possibilités du projet, de petits projets. Plus de détails dans Paramètres → Abonnement Premium et Soutenir TermChat." },
  { titre: 'Contact', texte: "Pour toute question sur tes données ou cette politique, contacte AbouDev Labs (voir Compte → Aide → À propos)." },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#111827" /></Pressable>
        <Text style={styles.title}>Confidentialité</Text>
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
