// Carnet des clés vérifiées en personne (scan de QR code). Il prime sur les clés du serveur.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { calculerEmpreinteVerification } from '@/crypto/fingerprint';
import type { DonneesQr } from './qr';

const CLE_STOCKAGE = 'proche:carnet:v1';

export interface EntreeCarnet {
  clePublique: string;
  verifieLe: number;
  empreinte: string;
}
export type Carnet = Record<string, EntreeCarnet>;
export type StatutAjout = 'nouveau' | 'identique' | 'cle_changee' | 'remplace';

const norm = (cle: string) => cle.replace(/=+$/, '');

export async function chargerCarnet(): Promise<Carnet> {
  try {
    const brut = await AsyncStorage.getItem(CLE_STOCKAGE);
    if (!brut) return {};
    const j = JSON.parse(brut);
    return j && typeof j === 'object' ? (j as Carnet) : {};
  } catch {
    return {};
  }
}

async function sauver(carnet: Carnet): Promise<void> {
  await AsyncStorage.setItem(CLE_STOCKAGE, JSON.stringify(carnet));
}

export async function clePubliqueVerifiee(id: string): Promise<string | null> {
  const carnet = await chargerCarnet();
  return carnet[id]?.clePublique ?? null;
}

// Enregistre un contact scanné. Si sa clé a changé, on NE remplace PAS sans accord explicite (remplacer = true).
export async function ajouterContactVerifie(
  donnees: DonneesQr,
  maClePublique: string,
  remplacer: boolean = false,
): Promise<{ statut: StatutAjout; empreinte: string }> {
  const carnet = await chargerCarnet();
  const empreinte = calculerEmpreinteVerification(maClePublique, donnees.clePublique);
  const existant = carnet[donnees.id];
  if (existant && norm(existant.clePublique) === norm(donnees.clePublique)) return { statut: 'identique', empreinte };
  if (existant && !remplacer) return { statut: 'cle_changee', empreinte };
  carnet[donnees.id] = { clePublique: donnees.clePublique, verifieLe: Date.now(), empreinte };
  await sauver(carnet);
  return { statut: existant ? 'remplace' : 'nouveau', empreinte };
}

export async function supprimerContactCarnet(id: string): Promise<void> {
  const carnet = await chargerCarnet();
  if (carnet[id]) {
    delete carnet[id];
    await sauver(carnet);
  }
}
