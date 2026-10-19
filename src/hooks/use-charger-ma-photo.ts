import { useEffect } from 'react';

import { sendRequest } from '@/api/request';
import { useSessionStore } from '@/store/sessionStore';

// Recharge ma propre photo de profil après connexion (le serveur ne l'envoie pas au login).
export function useChargerMaPhoto() {
  const status = useSessionStore((s) => s.status);
  const numero = useSessionStore((s) => s.user?.numero);
  const aPhoto = useSessionStore((s) => !!s.user?.photo_profil);
  const updateUser = useSessionStore((s) => s.updateUser);

  useEffect(() => {
    if (status !== 'connecte' || !numero || aPhoto) return;
    (async () => {
      try {
        const r: any = await sendRequest<{ action: string; numero: string }, any>({ action: 'profil_contact', numero });
        const b64 = r?.ok ? r.profil?.photo_base64 : null;
        if (b64) updateUser({ photo_profil: `data:image/jpeg;base64,${b64}` });
      } catch {}
    })();
  }, [status, numero, aPhoto]);
}
