import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { chercherUtilisateur } from '@/api/actions/messaging';
import { estErreur } from '@/api/actions/auth';

interface Resultat { nom: string; numero: string; pseudo: string; verifie: boolean; en_ligne: boolean; }

export default function SearchScreen() {
  const [saisie, setSaisie] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState(false);

  const lancerRecherche = async () => {
    const valeur = saisie.trim();
    if (!valeur) return;
    setLoading(true); setErreur(null); setResultat(null); setRecherche(true);
    try {
      const res = await chercherUtilisateur(valeur);
      if (estErreur(res)) setErreur(res.msg);
      else setResultat(res.user);
    } catch (e: any) {
      setErreur(e?.message ?? 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  const ouvrirConversation = () => {
    if (!resultat) return;
    router.replace(`/chat/${encodeURIComponent(resultat.numero)}?nom=${encodeURIComponent((resultat as any).nom ?? '')}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Nouvelle discussion</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput style={styles.input} placeholder="Identifiant (ex: TC010512345678) ou pseudo" placeholderTextColor="#9CA3AF"
          value={saisie} onChangeText={setSaisie} autoCapitalize="none" onSubmitEditing={lancerRecherche} />
        <Pressable style={styles.searchBtn} onPress={lancerRecherche} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="search" size={18} color="#fff" />}
        </Pressable>
      </View>

      {erreur && recherche && !loading && <Text style={styles.erreur}>{erreur}</Text>}

      {resultat && !loading && (
        <Pressable style={styles.resultCard} onPress={ouvrirConversation}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{resultat.nom[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resultNom}>{resultat.nom} {resultat.verifie && '✅'}</Text>
            <Text style={styles.resultPseudo}>@{resultat.pseudo} · {resultat.numero}</Text>
            <Text style={styles.resultStatut}>{resultat.en_ligne ? '🟢 En ligne' : 'Hors ligne'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  searchRow: { flexDirection: 'row', gap: 8, padding: 16 },
  input: { flex: 1, backgroundColor: '#F6F6F7', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  searchBtn: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#2F80ED', alignItems: 'center', justifyContent: 'center' },
  erreur: { color: '#E5484D', fontSize: 13, marginHorizontal: 16 },
  resultCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F6F6F7', marginHorizontal: 16, padding: 14, borderRadius: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#2F80ED', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultNom: { fontSize: 15, fontWeight: '700', color: '#111827' },
  resultPseudo: { fontSize: 12.5, color: '#8E8E93', marginTop: 2, fontFamily: 'monospace' },
  resultStatut: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
