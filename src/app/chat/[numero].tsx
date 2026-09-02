import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { envoyerMessage, historique, marquerLu, estErreur } from '@/api/actions/messaging';
import termchatSocket from '@/api/socket';
import type { MessageItem, PushNotification } from '@/api/protocol';
import { useSessionStore } from '@/store/sessionStore';

export default function ChatScreen() {
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const user = useSessionStore((s) => s.user);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [texte, setTexte] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const listRef = useRef<FlatList>(null);

  const charger = useCallback(async () => {
    if (!numero) return;
    const res = await historique(numero);
    if (!estErreur(res)) {
      setMessages([...res.historique].reverse());
    }
    marquerLu(numero);
  }, [numero]);

  useEffect(() => {
    charger();

    const unsub = termchatSocket.onMessage((data: any) => {
      if (!data || 'ok' in data) return;
      const notif = data as PushNotification;
      if ((notif.type === 'message' || notif.type === 'fichier') && notif.numero === numero) {
        const nouveau: MessageItem = {
          id: notif.msg_id,
          de: notif.numero,
          vers: user?.numero ?? '',
          texte: notif.type === 'message' ? notif.texte : notif.nom_fichier,
          type: notif.type === 'message' ? 'texte' : 'fichier',
          heure: notif.heure,
          lu: true,
          chiffre: notif.chiffre,
          nom_fichier: notif.type === 'fichier' ? notif.nom_fichier : undefined,
        };
        setMessages((prev) => [nouveau, ...prev]);
        marquerLu(numero);
      }
    });
    return unsub;
  }, [numero, charger, user?.numero]);

  const envoyer = async () => {
    const contenu = texte.trim();
    if (!contenu || !numero || envoiEnCours) return;
    setTexte('');
    setEnvoiEnCours(true);
    try {
      const res = await envoyerMessage(numero, contenu);
      if (estErreur(res)) {
        Alert.alert('Erreur', res.msg);
        setTexte(contenu);
      } else {
        setMessages((prev) => [
          {
            id: res.msg_id,
            de: user?.numero ?? '',
            vers: numero,
            texte: contenu,
            type: 'texte',
            heure: new Date().toISOString(),
            lu: false,
            chiffre: false,
          },
          ...prev,
        ]);
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message ?? 'Impossible d\'envoyer le message.');
      setTexte(contenu);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const envoyerFichierStub = () => {
    Alert.alert(
      'Envoi de fichier',
      user?.premium
        ? 'Sélecteur de fichier à venir.'
        : 'L\'envoi de fichiers est réservé aux comptes premium.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{numero?.[0]}</Text>
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>{numero}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const sortant = item.de === user?.numero;
            return (
              <View style={[styles.bubble, sortant ? styles.bubbleOut : styles.bubbleIn]}>
                {item.type === 'fichier' ? (
                  <Text style={styles.fileText}>📎 {item.nom_fichier ?? item.texte}</Text>
                ) : (
                  <Text style={styles.bubbleText}>{item.texte}</Text>
                )}
                <Text style={styles.bubbleTime}>{item.heure?.slice(-8, -3) || ''}</Text>
              </View>
            );
          }}
        />

        <View style={styles.inputRow}>
          <Pressable onPress={envoyerFichierStub}>
            <Text style={styles.attachIcon}>📎</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor="#A3B0AA"
            value={texte}
            onChangeText={setTexte}
            multiline
          />
          <Pressable style={styles.sendBtn} onPress={envoyer} disabled={envoiEnCours}>
            <Text style={styles.sendIcon}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E7ECE9',
    backgroundColor: '#fff',
  },
  back: { fontSize: 20, color: '#6B7A73' },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#0B8A6B', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#16201C', flex: 1 },
  listContent: { padding: 14, gap: 2 },
  bubble: { maxWidth: '78%', padding: 9, paddingHorizontal: 12, borderRadius: 14, marginVertical: 2 },
  bubbleIn: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 3 },
  bubbleOut: { alignSelf: 'flex-end', backgroundColor: '#DCF3EC', borderBottomRightRadius: 3 },
  bubbleText: { fontSize: 14.5, color: '#16201C' },
  fileText: { fontSize: 14.5, color: '#16201C', fontWeight: '600' },
  bubbleTime: { fontSize: 10, color: '#A3B0AA', marginTop: 3, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E7ECE9',
    backgroundColor: '#fff',
  },
  attachIcon: { fontSize: 20, color: '#6B7A73', marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: '#F7F9F8',
    borderWidth: 1.5,
    borderColor: '#E7ECE9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14.5,
    color: '#16201C',
    maxHeight: 100,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#0B8A6B', alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { color: '#fff', fontSize: 15 },
});
