import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  ecritureDetail, ecritureAimer, ecritureRetirerLike, ecritureFavorisAjouter,
  ecritureFavorisRetirer, ecritureCommenter, ecritureCommentaires, ecritureSupprimer, estErreur,
} from '@/api/actions/ecritures';
import type { EcritureDetailComplete, EcritureCommentaireItem } from '@/api/protocol';

export default function EcritureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ecriture, setEcriture] = useState<EcritureDetailComplete | null>(null);
  const [commentaires, setCommentaires] = useState<EcritureCommentaireItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nouveauCommentaire, setNouveauCommentaire] = useState('');
  const [envoiCommentaire, setEnvoiCommentaire] = useState(false);

  const charger = useCallback(async () => {
    if (!id) return;
    const [resDetail, resComs] = await Promise.all([ecritureDetail(id), ecritureCommentaires(id)]);
    if (!estErreur(resDetail)) setEcriture(resDetail.ecriture);
    if (!estErreur(resComs)) setCommentaires(resComs.commentaires);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    charger();
  }, [charger]);

  const toggleLike = async () => {
    if (!ecriture) return;
    const avant = ecriture;
    setEcriture({ ...ecriture, a_aime: !ecriture.a_aime, nb_likes: ecriture.nb_likes + (ecriture.a_aime ? -1 : 1) });
    const res = ecriture.a_aime ? await ecritureRetirerLike(ecriture.id) : await ecritureAimer(ecriture.id);
    if (estErreur(res)) setEcriture(avant);
  };

  const toggleFavori = async () => {
    if (!ecriture) return;
    const avant = ecriture;
    setEcriture({ ...ecriture, est_favori: !ecriture.est_favori });
    const res = ecriture.est_favori ? await ecritureFavorisRetirer(ecriture.id) : await ecritureFavorisAjouter(ecriture.id);
    if (estErreur(res)) setEcriture(avant);
  };

  const envoyerCommentaire = async () => {
    const texte = nouveauCommentaire.trim();
    if (!texte || !id || envoiCommentaire) return;
    setEnvoiCommentaire(true);
    setNouveauCommentaire('');
    try {
      const res = await ecritureCommenter(id, texte);
      if (estErreur(res)) {
        Alert.alert('Erreur', res.msg);
        setNouveauCommentaire(texte);
      } else {
        const resComs = await ecritureCommentaires(id);
        if (!estErreur(resComs)) setCommentaires(resComs.commentaires);
        setEcriture((prev) => (prev ? { ...prev, nb_commentaires: prev.nb_commentaires + 1 } : prev));
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? "Impossible d'envoyer le commentaire.");
      setNouveauCommentaire(texte);
    } finally {
      setEnvoiCommentaire(false);
    }
  };

  const supprimer = () => {
    Alert.alert('Supprimer cette écriture', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          if (!id) return;
          const res = await ecritureSupprimer(id);
          if (estErreur(res)) Alert.alert('Erreur', res.msg);
          else router.back();
        },
      },
    ]);
  };

  if (loading || !ecriture) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator color="#2F80ED" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Écriture</Text>
        {ecriture.est_auteur ? (
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push(`/ecriture-create?id=${ecriture.id}` as any)} hitSlop={8}>
              <Ionicons name="create-outline" size={20} color="#111827" />
            </Pressable>
            <Pressable onPress={supprimer} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          </View>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          data={commentaires}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              {!!ecriture.photo_couverture && <Image source={{ uri: ecriture.photo_couverture }} style={styles.cover} />}
              <Text style={styles.titre}>{ecriture.titre}</Text>
              <Text style={styles.meta}>{ecriture.auteur_nom} · {ecriture.date_creation?.slice(0, 10)}</Text>
              <Text style={styles.texte}>{ecriture.texte}</Text>

              <View style={styles.actionsRow}>
                <Pressable style={styles.actionBtn} onPress={toggleLike}>
                  <Ionicons name={ecriture.a_aime ? 'heart' : 'heart-outline'} size={20} color={ecriture.a_aime ? '#EF4444' : '#8E8E93'} />
                  <Text style={styles.actionText}>{ecriture.nb_likes}</Text>
                </Pressable>
                <View style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={18} color="#8E8E93" />
                  <Text style={styles.actionText}>{ecriture.nb_commentaires}</Text>
                </View>
                <Pressable style={styles.actionBtn} onPress={toggleFavori}>
                  <Ionicons name={ecriture.est_favori ? 'bookmark' : 'bookmark-outline'} size={20} color={ecriture.est_favori ? '#2F80ED' : '#8E8E93'} />
                </Pressable>
              </View>

              <Text style={styles.commentairesTitle}>Commentaires</Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.videCommentaires}>Aucun commentaire pour l'instant.</Text>}
          renderItem={({ item }) => (
            <View style={styles.commentaireCard}>
              <Text style={styles.commentaireAuteur}>{item.nom}</Text>
              <Text style={styles.commentaireTexte}>{item.texte}</Text>
              <Text style={styles.commentaireHeure}>{item.heure?.slice(0, 16).replace('T', ' ')}</Text>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un commentaire…"
            placeholderTextColor="#9CA3AF"
            value={nouveauCommentaire}
            onChangeText={setNouveauCommentaire}
            multiline
          />
          <Pressable style={styles.sendBtn} onPress={envoyerCommentaire} disabled={envoiCommentaire}>
            <Ionicons name="send" size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  headerActions: { flexDirection: 'row', gap: 16 },
  listContent: { padding: 16, paddingBottom: 90 },
  cover: { width: '100%', height: 180, borderRadius: 16, marginBottom: 16 },
  titre: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 6 },
  meta: { fontSize: 12.5, color: '#9CA3AF', marginBottom: 16 },
  texte: { fontSize: 15, color: '#111827', lineHeight: 23 },
  actionsRow: { flexDirection: 'row', gap: 24, marginTop: 22, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  commentairesTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  videCommentaires: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 10 },
  commentaireCard: { backgroundColor: '#F6F6F7', borderRadius: 14, padding: 12, marginBottom: 8 },
  commentaireAuteur: { fontSize: 13, fontWeight: '700', color: '#111827' },
  commentaireTexte: { fontSize: 13.5, color: '#111827', marginTop: 3, lineHeight: 19 },
  commentaireHeure: { fontSize: 10.5, color: '#9CA3AF', marginTop: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10,
    borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1, backgroundColor: '#F6F6F7', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', maxHeight: 90,
  },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2F80ED', alignItems: 'center', justifyContent: 'center' },
});
