import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet, Text, TextInput, View, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { mesConversations, effacerHistorique, estErreur } from '@/api/actions/messaging';
import termchatSocket from '@/api/socket';
import AvatarContact from '@/components/AvatarContact';
import type { ConversationItem, PushNotification } from '@/api/protocol';

export default function DiscussionsScreen() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [rechercheOuverte, setRechercheOuverte] = useState(false);

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

  const nomPropre = (c: ConversationItem) =>
    (c.nom || c.numero || '').replace(/\s+/g, ' ').trim() || c.numero;

  const heureAffichee = (h?: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(h ?? '');
    if (!m) return h ?? '';
    const [, annee, mois, jour, heures, minutes] = m;
    const pad = (n: number) => String(n).padStart(2, '0');
    const formater = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const auj = new Date();
    const hier = new Date(auj.getTime() - 24 * 60 * 60 * 1000);
    const date = `${annee}-${mois}-${jour}`;
    if (date === formater(auj)) return `${heures}:${minutes}`;
    if (date === formater(hier)) return 'Hier';
    return `${jour}/${mois}/${annee.slice(2)}`;
  };

  const conversationsAffichees = recherche.trim()
    ? conversations.filter((c) => {
        const q = recherche.trim().toLowerCase();
        return (
          nomPropre(c).toLowerCase().includes(q) ||
          (c.numero ?? '').toLowerCase().includes(q) ||
          (c.chiffre ? '' : (c.dernier_msg ?? '')).toLowerCase().includes(q)
        );
      })
    : conversations;

  const ouvrirConversation = (numero: string, nom?: string) => {
    router.push(`/chat/${encodeURIComponent(numero)}?nom=${encodeURIComponent(nom ?? '')}`);
  };

  const confirmerSuppression = (item: ConversationItem) => {
    Alert.alert(
      'Supprimer la conversation',
      `Supprimer toute la conversation avec ${item.nom || item.numero} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const res = await effacerHistorique(item.numero);
            if (estErreur(res)) {
              Alert.alert('Erreur', res.msg);
            } else {
              setConversations((prev) => prev.filter((c) => c.numero !== item.numero));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('@/assets/images/icon.png')} style={styles.headerLogo} />
          <View>
            <Text style={styles.title}>TERMCHAT</Text>
            <Text style={styles.subtitle}>MESSAGERIE SÉCURISÉE</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconBtn} onPress={() => { setRechercheOuverte((o) => !o); setRecherche(''); }}>
            <Ionicons name="search-outline" size={20} color="#111827" />
          </Pressable>
          <Pressable style={styles.newBtn} onPress={() => router.push('/search' as any)}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      {rechercheOuverte && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFFFFF' }}>
          <TextInput
            value={recherche}
            onChangeText={setRecherche}
            placeholder="Rechercher une conversation"
            placeholderTextColor="#9CA3AF"
            autoFocus
            autoCorrect={false}
            style={{ backgroundColor: '#F6F6F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#111827' }}
          />
        </View>
      )}
      <FlatList
        data={conversationsAffichees}
        keyExtractor={(item) => item.numero}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={charger} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={40} color="#C7C7CC" />
              <Text style={styles.emptyText}>Aucune discussion pour l'instant.</Text>
              <Text style={styles.emptySub}>Tape sur ＋ pour démarrer une conversation.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => ouvrirConversation(item.numero, item.nom)}
            onLongPress={() => confirmerSuppression(item)}
          >
            <AvatarContact numero={item.numero} nom={nomPropre(item)} taille={50} />
            <View style={styles.rowContent}>
              <View style={styles.rowTop}>
                <Text style={styles.rowName} numberOfLines={1}>{nomPropre(item)}</Text>
                <Text style={[styles.rowTime, item.non_lus > 0 && styles.rowTimeUnread]}>{heureAffichee(item.heure)}</Text>
              </View>
              <View style={styles.rowBottom}>
                <Text style={styles.rowMsg} numberOfLines={1}>
                  {item.chiffre ? '🔒 Message chiffré' : (item.dernier_msg || '—')}
                </Text>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo: { width: 34, height: 34, borderRadius: 9 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6F6F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: 0.5 },
  subtitle: { fontSize: 9.5, fontWeight: '600', color: '#2F80ED', letterSpacing: 0.8, marginTop: 1 },
  newBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2F80ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 14,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2F80ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  rowContent: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 11 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rowName: { fontSize: 15.5, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  rowTime: { fontSize: 11.5, color: '#8E8E93' },
  rowTimeUnread: { color: '#2F80ED', fontWeight: '700' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  rowMsg: { fontSize: 13.5, color: '#8E8E93', flex: 1, marginRight: 8 },
  badge: {
    backgroundColor: '#2F80ED',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 10 },
  emptyText: { color: '#8E8E93', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptySub: { color: '#8E8E93', fontSize: 13, textAlign: 'center' },
});
