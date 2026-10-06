import { useEffect, useState } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { router } from 'expo-router';

import termchatSocket from '@/api/socket';
import { useSessionStore } from '@/store/sessionStore';

export default function ConnectionBanner() {
  const [etat, setEtat] = useState<'reconnecting' | 'failed' | null>(null);
  const [sessionExpiree, setSessionExpiree] = useState(false);

  useEffect(() => {
    const unsub = termchatSocket.onReconnectState((state) => {
      setEtat(state === 'connected' ? null : state);

      if (state === 'connected') {
        const session = useSessionStore.getState();

        // Le socket TCP/TLS peut être nouveau après une coupure.
        // Si l'application pense toujours être connectée,
        // restaurer l'authentification sur ce nouveau socket.
        if (session.status === 'connecte') {
          void session.resumeSession();
        }
      }
    });

    return unsub;
  }, []);

  useEffect(() => {
    // Si le socket est ouvert mais que le serveur ne nous reconnait plus
    // (reponse "Non connecte." a une action), proposer de se reconnecter -
    // et se réinitialiser automatiquement dès qu'une action réussit,
    // pour ne pas rester bloqué affiché après une reconnexion reussie.
    const unsub = termchatSocket.onMessage((data: any) => {
      if (data && data.ok === false && data.msg === 'Non connecté.') {
        // Une réponse "Non connecté." sur un nouveau socket peut
        // simplement signifier que la réauthentification est encore
        // en cours. Ne pas envoyer immédiatement l'utilisateur au login.
        return;
      } else if (data && data.ok === true) {
        setSessionExpiree(false);
      }
    });
    return unsub;
  }, []);

  if (sessionExpiree) {
    return (
      <Pressable
        style={[styles.banner, styles.bannerErreur]}
        onPress={() => {
          setSessionExpiree(false);
          router.replace('/(auth)/login' as any);
        }}
      >
        <Text style={styles.texte}>⚠️ Session expirée — appuie pour te reconnecter</Text>
      </Pressable>
    );
  }

  if (etat === 'reconnecting') {
    return (
      <View style={styles.banner}>
        <Text style={styles.texte}>🔄 Reconnexion…</Text>
      </View>
    );
  }

  if (etat === 'failed') {
    return (
      <Pressable style={[styles.banner, styles.bannerErreur]} onPress={() => termchatSocket.reconnecter()}>
        <Text style={styles.texte}>⚠️ Connexion au serveur impossible — appuie pour réessayer</Text>
      </Pressable>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1565C0',
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  bannerErreur: { backgroundColor: '#7A1F24' },
  texte: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '600' },
});
