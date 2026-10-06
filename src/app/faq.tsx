import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  {
    titre: 'Compte',
    questions: [
      { q: 'Comment créer un compte TermChat ?', r: "Depuis l'écran d'accueil, appuie sur \"Créer un compte\", renseigne prénom, nom, pseudo, pays et mot de passe. Un identifiant unique te sera attribué." },
      { q: 'Comment modifier mon profil ?', r: "Va dans Compte → Modifier le profil pour changer ta photo, ton pseudo, ta bio, ton statut ou ta couleur." },
      { q: 'Comment changer mon mot de passe ?', r: "Cette fonctionnalité arrive prochainement. En attendant, contacte l'équipe via Aide → Nous contacter." },
      { q: 'Comment récupérer mon compte ?', r: "Si tu as activé la double authentification, utilise l'un de tes codes de récupération. Sinon, contacte l'équipe via Aide → Nous contacter." },
    ],
  },
  {
    titre: 'Sécurité',
    questions: [
      { q: 'Comment fonctionne la double authentification (2FA) ?', r: "Active-la depuis Compte → Sécurité. Elle ajoute un code à usage unique généré par une app comme Google Authenticator à chaque connexion." },
      { q: 'Mes conversations sont-elles protégées ?', r: "Les messages texte sont chiffrés de bout en bout : seuls toi et ton contact pouvez les lire, le serveur ne voit jamais le contenu en clair." },
      { q: 'Comment sécuriser mon compte ?', r: "Utilise un mot de passe fort et active la double authentification depuis Compte → Sécurité." },
      { q: "Que faire si quelqu'un essaie d'accéder à mon compte ?", r: "Change ton mot de passe dès que possible et active la 2FA. Contacte l'équipe si tu constates une activité suspecte." },
    ],
  },
  {
    titre: 'Discussions',
    questions: [
      { q: 'Comment démarrer une discussion ?', r: "Appuie sur ＋ ou 🔍 depuis l'écran Discussions, puis recherche un identifiant ou un pseudo." },
      { q: 'Comment envoyer un message ?', r: "Ouvre une conversation, écris ton texte et appuie sur ➤. Tu peux aussi envoyer un fichier (📎) ou un vocal (appui maintenu sur 🎤)." },
      { q: 'Comment supprimer une conversation ?', r: "Depuis la liste Discussions, fais un appui long sur la conversation à supprimer." },
      { q: 'Comment supprimer un message ?', r: "Dans une conversation, appuie sur l'icône 🗑 sous l'un de tes messages." },
    ],
  },
  {
    titre: 'Écritures',
    questions: [
      { q: "Qu'est-ce que la section Écritures ?", r: "Une fonctionnalité à venir pour publier et partager des écrits avec la communauté TermChat." },
      { q: 'Comment publier une écriture ?', r: "Cette fonctionnalité est en cours de développement." },
      { q: 'Comment aimer ou commenter une écriture ?', r: "Cette fonctionnalité est en cours de développement." },
      { q: 'Comment enregistrer une écriture dans mes favoris ?', r: "Cette fonctionnalité est en cours de développement." },
    ],
  },
  {
    titre: 'École',
    questions: [
      { q: "Comment utiliser l'espace École ?", r: "L'onglet École affiche une carte des établissements scolaires avec recherche, filtres par quartier et itinéraire." },
      { q: 'Comment ajouter une école ?', r: "Cette fonction est réservée aux administrateurs (accès via 5 appuis sur le logo École)." },
      { q: "Puis-je voir plusieurs photos d'une école ?", r: "Oui, certaines écoles ont plusieurs photos, visibles en appuyant sur leur marqueur sur la carte." },
    ],
  },
];

export default function FaqScreen() {
  const [ouvertes, setOuvertes] = useState<Set<string>>(new Set());

  const toggler = (cle: string) => {
    setOuvertes((prev) => {
      const next = new Set(prev);
      if (next.has(cle)) next.delete(cle);
      else next.add(cle);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>FAQ</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {CATEGORIES.map((cat) => (
          <View key={cat.titre} style={styles.categorie}>
            <Text style={styles.categorieTitre}>{cat.titre.toUpperCase()}</Text>
            <View style={styles.card}>
              {cat.questions.map((item, i) => {
                const cle = `${cat.titre}-${i}`;
                const ouvert = ouvertes.has(cle);
                return (
                  <View key={cle}>
                    <Pressable style={[styles.questionRow, i === cat.questions.length - 1 && !ouvert && styles.rowLast]} onPress={() => toggler(cle)}>
                      <Text style={styles.questionText}>{item.q}</Text>
                      <Ionicons name={ouvert ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
                    </Pressable>
                    {ouvert && (
                      <View style={styles.reponseWrap}>
                        <Text style={styles.reponseText}>{item.r}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
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
  categorie: { marginBottom: 20 },
  categorieTitre: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  card: { backgroundColor: '#F6F6F7', borderRadius: 16, overflow: 'hidden' },
  questionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EDEDED' },
  rowLast: { borderBottomWidth: 0 },
  questionText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827', marginRight: 10 },
  reponseWrap: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#EDEDED' },
  reponseText: { fontSize: 13, color: '#8E8E93', lineHeight: 19 },
});
