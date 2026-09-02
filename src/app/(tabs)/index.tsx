import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mesConversations, estErreur } from '@/api/actions/messaging';
import termchatSocket from '@/api/socket';
import type { ConversationItem, PushNotification } from '@/api/protocol';

export default function DiscussionsScreen() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nouveauNumero, setNouveauNumero] = useState('');

  const charger = useCallback(async () => {
    const res = await mesConversations();
    if (!estErreur(res)) {
      setConversations(res.conversations);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    charger();

    const unsub = termchatSocket.onMessage((data: any) => {
      if (!data || 'ok' in data) return;
      const notif = data as PushNotification;
      if (notif.type === 'message' || notif.type === 'fichier') {
        charger();
      }
    });
    return unsub;
  }, [charger]);

  const ouvrirConversation = (numero: string) => {
    if (!numero.trim()) return;
    setNouveauNumero('');
    router.push(`/chat/${encodeURIComponent(numero.trim())}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discussions</Text>
      </View>

      <View style={styles.newRow}>
        <TextInput
          style={styles.newInput}
          placeholder="Numéro pour démarrer une discussion..."
          placeholderTextColor="#A3B0AA"
          value={nouveauNumero}
          onChangeText={setNouveauNumero}
          keyboardType="phone-pad"
          onSubmitEditing={() => ouvrirConversation(nouveauNumero)}
        />
        <Pressable style={styles.newBtn} onPress={() => ouvrirConversation(nouveauNumero)}>
          <Text style={styles.newBtnText}>➤</Text>
        </Pressable>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.numero}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={charger} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune discussion pour l'instant.</Text>
              <Text style={styles.emptySub}>Entre un numéro ci-dessus pour commencer.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => ouvrirConversation(item.numero)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(item.nom || item.numero)[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.rowContent}>
              <View style={styles.rowTop}>
                <Text style={styles.rowName} numberOfLines={1}>{item.nom || item.numero}</Text>
                <Text style={[styles.rowTime, item.non_lus > 0 && styles.rowTimeUnread]}>{item.heure}</Text>
              </View>
              <View style={styles.rowBottom}>
                <Text style={styles.rowMsg} numberOfLines={1}>{item.dernier_msg || '—'}</Text>
                {item.non_lus > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.non_lus}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F8' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 23, fontWeight: '800', color: '#16201C' },
  newRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  newInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E7ECE9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#16201C',
  },
  newBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#0B8A6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBtnText: { color: '#fff', fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 14,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0B8A6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  rowContent: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#E7ECE9', paddingBottom: 11 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rowName: { fontSize: 15.5, fontWeight: '600', color: '#16201C', flex: 1, marginRight: 8 },
  rowTime: { fontSize: 11.5, color: '#A3B0AA' },
  rowTimeUnread: { color: '#076B52', fontWeight: '700' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  rowMsg: { fontSize: 13.5, color: '#6B7A73', flex: 1, marginRight: 8 },
  badge: {
    backgroundColor: '#0B8A6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyText: { color: '#6B7A73', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptySub: { color: '#A3B0AA', fontSize: 13, textAlign: 'center', marginTop: 6 },
});
