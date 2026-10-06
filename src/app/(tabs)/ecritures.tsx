import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ecritureLister, ecritureAimer, ecritureRetirerLike, estErreur } from '@/api/actions/ecritures';
import type { EcritureApercu } from '@/api/protocol';

export default function EcrituresScreen() {
  const [ecritures, setEcritures] = useState<EcritureApercu[]>([]);
  const [loading, setLoading] = useState(true);
  const [curseurSuivant, setCurseurSuivant] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const res = await ecritureLister();
    if (!estErreur(res)) {
      setEcritures(res.ecritures);
      setCurseurSuivant(res.curseur_suivant ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const chargerPlus = async () => {
    if (!curseurSuivant) return;
    const res = await ecritureLister(curseurSuivant);
    if (!estErreur(res)) {
      setEcritures((prev) => [...prev, ...res.ecritures]);
      setCurseurSuivant(res.curseur_suivant ?? null);
    }
  };

  const toggleLike = async (item: EcritureApercu) => {
    setEcritures((prev) =>
      prev.map((e) => (e.id === item.id ? { ...e, a_aime: !e.a_aime, nb_likes: e.nb_likes + (e.a_aime ? -1 : 1) } : e))
    );
    const res = item.a_aime ? await ecritureRetirerLike(item.id) : await ecritureAimer(item.id);
    if (estErreur(res)) {
      // Annule le changement optimiste si ça échoue.
      setEcritures((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, a_aime: item.a_aime, nb_likes: item.nb_likes } : e))
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Écritures</Text>
        <Pressable style={styles.newBtn} onPress={() => router.push('/ecriture-create' as any)}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={ecritures}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={charger} />}
        onEndReached={chargerPlus}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={40} color="#C7C7CC" />
              <Text style={styles.emptyText}>Aucune écriture pour l'instant.</Text>
              <Text style={styles.emptySub}>Appuie sur ＋ pour publier la première.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/ecriture/${item.id}` as any)}>
            {!!item.photo_couverture && (
              <Image source={{ uri: item.photo_couverture }} style={styles.cover} />
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitre} numberOfLines={2}>{item.titre}</Text>
              <Text style={styles.cardExtrait} numberOfLines={2}>{item.extrait}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.auteur} numberOfLines={1}>{item.auteur_nom} · {item.date_creation?.slice(0, 10)}</Text>
                <View style={styles.statsRow}>
                  <Pressable style={styles.statBtn} onPress={() => toggleLike(item)} hitSlop={8}>
                    <Ionicons name={item.a_aime ? 'heart' : 'heart-outline'} size={16} color={item.a_aime ? '#EF4444' : '#8E8E93'} />
                    <Text style={styles.statText}>{item.nb_likes}</Text>
                  </Pressable>
                  <View style={styles.statBtn}>
                    <Ionicons name="chatbubble-outline" size={15} color="#8E8E93" />
                    <Text style={styles.statText}>{item.nb_commentaires}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  newBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2F80ED', alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#F6F6F7', borderRadius: 16, overflow: 'hidden', marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cover: { width: '100%', height: 150 },
  cardBody: { padding: 14 },
  cardTitre: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardExtrait: { fontSize: 13.5, color: '#8E8E93', lineHeight: 19, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  auteur: { fontSize: 12, color: '#9CA3AF', flex: 1, marginRight: 8 },
  statsRow: { flexDirection: 'row', gap: 14 },
  statBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#8E8E93' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 10 },
  emptyText: { color: '#8E8E93', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptySub: { color: '#8E8E93', fontSize: 13, textAlign: 'center' },
});
