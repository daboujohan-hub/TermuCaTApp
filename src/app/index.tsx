import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';

import { useSessionStore } from '@/store/sessionStore';
import { publierClePublique, estErreur } from '@/api/actions/crypto';
import { loadOrCreateIdentity } from '@/crypto/identity';

export default function Index() {
  const status = useSessionStore((s) => s.status);
  const hasHydrated = useSessionStore((s) => s.hasHydrated);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    (async () => {
      // Le statut "connecte" persiste localement ne garantit pas que la
      // connexion socket actuelle est authentifiee cote serveur (num_co
      // est attache a la connexion, pas au telephone) - on tente donc une
      // vraie reconnexion silencieuse avant d'afficher quoi que ce soit.
      await useSessionStore.getState().resumeSession();
      setPret(true);
    })();
  }, [hasHydrated]);

  useEffect(() => {
    if (pret && status === 'connecte') {
      (async () => {
        try {
          const identity = await loadOrCreateIdentity();
          const res = await publierClePublique(identity.publicKey);
          if (estErreur(res)) {
            console.warn('Republication cle publique echouee:', res.msg);
          }
        } catch (e) {
          console.warn('Erreur republication cle publique:', e);
        }
      })();
    }
  }, [pret, status]);

  if (!hasHydrated || !pret) {
    return null;
  }

  if (status === 'attente_2fa') {
    return <Redirect href={'/(auth)/login' as any} />;
  }
  return <Redirect href={status === 'connecte' ? '/(tabs)' : ('/welcome' as any)} />;
}
