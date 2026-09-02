/**
 * store/sessionStore.ts
 * Store zustand pour l'état de session utilisateur. Encapsule les appels à
 * api/actions/auth.ts et expose un état simple aux écrans : pas besoin
 * d'appeler auth.ts directement depuis les composants.
 *
 * `user` et `status` sont persistés via MMKV pour éviter de reconnecter
 * l'utilisateur à chaque redémarrage de l'app. NB: c'est une persistance
 * optimiste — le statut "connecte" n'est pas revalidé auprès du serveur
 * au démarrage (à faire plus tard si besoin, ex: un ping de vérification).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as auth from '../api/actions/auth';
import type { SessionResponse } from '../api/protocol';
import { mmkvStorage } from './mmkvStorage';

type SessionStatus = 'non_connecte' | 'attente_totp' | 'connecte';

interface SessionState {
  status: SessionStatus;
  user: SessionResponse | null;
  loading: boolean;
  error: string | null;

  login: (numero: string, mdp: string) => Promise<void>;
  loginEmail: (email: string, mdp: string) => Promise<void>;
  verifyTotp: (code: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

/** Distingue les 3 formes possibles de ConnecterResponse. */
function traiterReponseConnexion(
  set: (partial: Partial<SessionState>) => void,
  res: { ok: boolean; totp_requis?: boolean; msg?: string } & Partial<SessionResponse>
) {
  if (!res.ok) {
    set({ status: 'non_connecte', loading: false, error: res.msg ?? 'Erreur de connexion.' });
    return;
  }
  if (res.totp_requis) {
    set({ status: 'attente_totp', loading: false, error: null });
    return;
  }
  set({ status: 'connecte', user: res as SessionResponse, loading: false, error: null });
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      status: 'non_connecte',
      user: null,
      loading: false,
      error: null,

      login: async (numero, mdp) => {
        set({ loading: true, error: null });
        try {
          const res = await auth.connecterNumero(numero, mdp);
          traiterReponseConnexion(set, res);
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'Erreur réseau.' });
        }
      },

      loginEmail: async (email, mdp) => {
        set({ loading: true, error: null });
        try {
          const res = await auth.connecterEmail(email, mdp);
          traiterReponseConnexion(set, res);
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'Erreur réseau.' });
        }
      },

      verifyTotp: async (code) => {
        set({ loading: true, error: null });
        try {
          const res = await auth.totpVerifierConnexion(code);
          traiterReponseConnexion(set, res);
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'Erreur réseau.' });
        }
      },

      logout: () => {
        auth.deconnecter();
        set({ status: 'non_connecte', user: null, loading: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'termchat-session',
      storage: {
        getItem: (name) => {
          const v = mmkvStorage.getItem(name);
          return v ? JSON.parse(v) : null;
        },
        setItem: (name, value) => mmkvStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => mmkvStorage.removeItem(name),
      },
      partialize: (state) => ({ status: state.status, user: state.user }),
    }
  )
);
