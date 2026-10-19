import * as SecureStore from 'expo-secure-store';

const K_PIN = 'termchat_pin';
const K_BIO = 'termchat_bio';
const K_ESSAIS = 'termchat_pin_essais';
const K_BLOC = 'termchat_pin_bloque';
const MAX_ESSAIS = 5;
const BLOCAGE_MS = 5 * 60 * 1000;

export const pinDefini = async () => !!(await SecureStore.getItemAsync(K_PIN));
export const definirPin = (pin: string) => SecureStore.setItemAsync(K_PIN, pin);

export async function supprimerPin() {
  await Promise.all([K_PIN, K_BIO, K_ESSAIS, K_BLOC].map((k) => SecureStore.deleteItemAsync(k)));
}

// Empreinte : pas disponible dans cette version (module non installé).
export const empreinteActive = async () => false;
export const setEmpreinte = async (_actif: boolean) => {};
export const empreinteDisponible = async () => false;
export const demanderEmpreinte = async (_message?: string) => false;

export async function verifierPin(pin: string): Promise<{ ok: boolean; restant: number; bloqueSec: number }> {
  const bloque = Number((await SecureStore.getItemAsync(K_BLOC)) ?? 0);
  if (bloque > Date.now()) return { ok: false, restant: 0, bloqueSec: Math.ceil((bloque - Date.now()) / 1000) };
  const bon = await SecureStore.getItemAsync(K_PIN);
  if (bon && pin === bon) {
    await SecureStore.deleteItemAsync(K_ESSAIS);
    return { ok: true, restant: MAX_ESSAIS, bloqueSec: 0 };
  }
  const essais = Number((await SecureStore.getItemAsync(K_ESSAIS)) ?? 0) + 1;
  if (essais >= MAX_ESSAIS) {
    await SecureStore.setItemAsync(K_BLOC, String(Date.now() + BLOCAGE_MS));
    await SecureStore.deleteItemAsync(K_ESSAIS);
    return { ok: false, restant: 0, bloqueSec: BLOCAGE_MS / 1000 };
  }
  await SecureStore.setItemAsync(K_ESSAIS, String(essais));
  return { ok: false, restant: MAX_ESSAIS - essais, bloqueSec: 0 };
}
