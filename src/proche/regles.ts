// Règles locales du mode proche (sans chiffrement) : validation, blocage, anti-rejeu, limites, file de sortie.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TEXTE_MAX = 500;
const AGE_MAX_MS = 30 * 24 * 3600 * 1000;
const DECALAGE_MS = 60 * 1000;
const RE_ID_MSG = /^[0-9a-f]{32}$/;
const RE_ID_USER = /^TC\d{10,16}$/;
const RE_JETON = /^[A-Za-z0-9+/_=-]{20,5000}$/;

export interface Enveloppe { v: 1; id: string; de: string; vers: string; t: number; c: string }

export function enveloppeValide(e: unknown, maintenant: number = Date.now()): e is Enveloppe {
  if (!e || typeof e !== 'object') return false;
  const o = e as Record<string, unknown>;
  if (Object.keys(o).length !== 6) return false;
  if (o.v !== 1) return false;
  if (typeof o.id !== 'string' || !RE_ID_MSG.test(o.id)) return false;
  if (typeof o.de !== 'string' || !RE_ID_USER.test(o.de)) return false;
  if (typeof o.vers !== 'string' || !RE_ID_USER.test(o.vers) || o.vers === o.de) return false;
  if (typeof o.t !== 'number' || !Number.isInteger(o.t)) return false;
  if (o.t < maintenant - AGE_MAX_MS || o.t > maintenant + DECALAGE_MS) return false;
  if (typeof o.c !== 'string' || !RE_JETON.test(o.c)) return false;
  return true;
}

async function lire<T>(cle: string, defaut: T): Promise<T> {
  try {
    const brut = await AsyncStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}
const ecrire = (cle: string, valeur: unknown) => AsyncStorage.setItem(cle, JSON.stringify(valeur));

// --- Blocage local ---
const K_BLOQUES = 'proche:bloques:v1';
export async function estBloque(id: string): Promise<boolean> {
  return (await lire<string[]>(K_BLOQUES, [])).includes(id);
}
export async function bloquer(id: string): Promise<void> {
  const l = await lire<string[]>(K_BLOQUES, []);
  if (!l.includes(id)) { l.push(id); await ecrire(K_BLOQUES, l); }
}
export async function debloquer(id: string): Promise<void> {
  const l = await lire<string[]>(K_BLOQUES, []);
  await ecrire(K_BLOQUES, l.filter((x) => x !== id));
}

// --- Anti-rejeu : un message déjà reçu est ignoré ---
const K_VUS = 'proche:vus:v1';
const VUS_MAX = 2000;
export async function dejaVu(id: string): Promise<boolean> {
  const v = await lire<Record<string, number>>(K_VUS, {});
  return Object.prototype.hasOwnProperty.call(v, id);
}
export async function marquerVu(id: string, t: number, maintenant: number = Date.now()): Promise<void> {
  const v = await lire<Record<string, number>>(K_VUS, {});
  v[id] = t;
  let paires = Object.entries(v).filter(([, ts]) => maintenant - ts < AGE_MAX_MS);
  if (paires.length > VUS_MAX) paires = paires.sort((a, b) => b[1] - a[1]).slice(0, VUS_MAX);
  await ecrire(K_VUS, Object.fromEntries(paires));
}

// --- Limite de débit (en mémoire) ---
const fenetres = new Map<string, number[]>();
export function autoriserDebit(cle: string, max: number, fenetreMs: number, maintenant: number = Date.now()): boolean {
  const l = (fenetres.get(cle) ?? []).filter((x) => maintenant - x < fenetreMs);
  if (l.length >= max) { fenetres.set(cle, l); return false; }
  l.push(maintenant);
  fenetres.set(cle, l);
  return true;
}
export function reinitialiserLimiteur(): void { fenetres.clear(); }

// --- File de sortie : messages à transmettre au serveur au retour d'internet ---
const K_SORTIE = 'proche:sortie:v1';
const SORTIE_MAX = 500;
export async function ajouterSortie(e: Enveloppe): Promise<boolean> {
  const l = await lire<Enveloppe[]>(K_SORTIE, []);
  if (l.some((x) => x.id === e.id)) return true;
  if (l.length >= SORTIE_MAX) return false;
  l.push(e);
  await ecrire(K_SORTIE, l);
  return true;
}
export async function lireSorties(maintenant: number = Date.now()): Promise<Enveloppe[]> {
  const l = await lire<unknown[]>(K_SORTIE, []);
  return l.filter((x): x is Enveloppe => enveloppeValide(x, maintenant));
}
export async function retirerSorties(ids: string[]): Promise<void> {
  const l = await lire<Enveloppe[]>(K_SORTIE, []);
  await ecrire(K_SORTIE, l.filter((x) => !ids.includes(x.id)));
}
