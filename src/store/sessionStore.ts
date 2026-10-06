import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import * as auth from '../api/actions/auth';
import { publierClePublique, estErreur as estErreurCrypto } from '../api/actions/crypto';
import { loadOrCreateIdentity } from '../crypto/identity';
import type { SessionResponse } from '../api/protocol';
import { mmkvStorage } from './mmkvStorage';

type SessionStatus = 'non_connecte' | 'attente_2fa' | 'connecte';

const CLE_IDENTIFIANT = 'termchat_identifiant';
const CLE_MDP = 'termchat_mdp';

// Empêche plusieurs restaurations simultanées après une reconnexion réseau.
let restaurationSessionEnCours = false;

interface SessionState {
  status: SessionStatus;
  user: SessionResponse | null;
  loading: boolean;
  error: string | null;
  numeroEnAttente2fa: string | null;
  hasHydrated: boolean;

  login: (numero: string, mdp: string) => Promise<void>;
  loginEmail: (email: string, mdp: string) => Promise<void>;
  verifyCode2fa: (code: string) => Promise<void>;
  verifyTotp: (code: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (partial: Partial<SessionResponse>) => void;
  // Tente une reconnexion silencieuse au demarrage de l'app avec les
  // identifiants sauvegardes (stockage securise Keystore/Keychain). A
  // appeler une fois, apres l'hydratation du store persiste, AVANT de
  // faire confiance au statut "connecte" persiste localement: ce statut
  // ne reflete que ce que le telephone a memorise, pas une authentification
  // reelle aupres du serveur sur la connexion socket actuelle.
  resumeSession: () => Promise<void>;
}

async function publierClePubliqueApresConnexion() {
  try {
    const identity = await loadOrCreateIdentity();
    const res = await publierClePublique(identity.publicKey);
    if (estErreurCrypto(res)) {
      console.warn('Publication clé publique échouée:', res.msg);
    }
  } catch (e) {
    console.warn('Erreur lors de la publication de la clé publique:', e);
  }
}

function traiterReponseConnexion(
  set: (partial: Partial<SessionState>) => void,
  res: import('../api/protocol').ConnecterResponse
) {
  if (!res.ok) {
    set({ status: 'non_connecte', loading: false, error: res.msg ?? 'Erreur de connexion.' });
    return;
  }
  if ('totp_requis' in res && res.totp_requis) {
    set({
      status: 'attente_2fa',
      loading: false,
      error: null,
    });
    return;
  }
  set({ status: 'connecte', user: res as SessionResponse, loading: false, error: null });
  publierClePubliqueApresConnexion();
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      status: 'non_connecte',
      user: null,
      loading: false,
      error: null,
      numeroEnAttente2fa: null,
      hasHydrated: false,

      login: async (numero, mdp) => {
        set({ loading: true, error: null });
        try {
          const res = await auth.connecterNumero(numero, mdp);
          if (res.ok) {
            // Le serveur a accepte numero+mdp (avec ou sans 2FA a suivre) -
            // on les garde pour pouvoir se reconnecter silencieusement au
            // prochain demarrage de l'app.
            try {
              await SecureStore.setItemAsync(CLE_IDENTIFIANT, numero);
              await SecureStore.setItemAsync(CLE_MDP, mdp);
            } catch (e) {
              console.warn('Sauvegarde sécurisée des identifiants échouée:', e);
            }
          }
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

      verifyCode2fa: async (code) => {
        set({ loading: true, error: null });
        try {
          const res = await auth.totpVerifierConnexion(code);
          traiterReponseConnexion(set, res);
        } catch (e: any) {
          set({ loading: false, error: e?.message ?? 'Erreur réseau.' });
        }
      },

      verifyTotp: async (code) => {
        await get().verifyCode2fa(code);
      },

      logout: () => {
        auth.deconnecter();
        SecureStore.deleteItemAsync(CLE_IDENTIFIANT).catch(() => {});
        SecureStore.deleteItemAsync(CLE_MDP).catch(() => {});
        set({ status: 'non_connecte', user: null, loading: false, error: null, numeroEnAttente2fa: null });
      },

      clearError: () => set({ error: null }),

      updateUser: (partial) =>
        set((state) => (state.user ? { user: { ...state.user, ...partial } } : {})),

      resumeSession: async () => {
        if (restaurationSessionEnCours) return;

        restaurationSessionEnCours = true;

        try {
          const identifiant = await SecureStore.getItemAsync(CLE_IDENTIFIANT);
          const mdp = await SecureStore.getItemAsync(CLE_MDP);

          if (identifiant && mdp) {
            await get().login(identifiant, mdp);
          } else {
            // Aucun identifiant sauvegardé : il ne s'agit pas d'une
            // reconnexion automatique possible.
            set({ status: 'non_connecte', user: null, loading: false });
          }
        } catch (e) {
          // Une coupure réseau temporaire ne doit pas effacer la session
          // locale ni envoyer l'utilisateur vers l'écran de connexion.
          set({
            loading: false,
            error: e instanceof Error ? e.message : 'Erreur réseau.'
          });
        } finally {
          restaurationSessionEnCours = false;
        }
      },
    }),
    {
      name: 'termchat-session',
      storage: {
        getItem: async (name) => {
          const v = await mmkvStorage.getItem(name);
          return v ? JSON.parse(v) : null;
        },
        setItem: (name, value) => mmkvStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => mmkvStorage.removeItem(name),
      },
      partialize: (state) => ({
        status: state.status,
        user: state.user,
      }) as SessionState,
      onRehydrateStorage: () => (state, error) => {
        useSessionStore.setState({ hasHydrated: true });
      },
    }
  )
);
