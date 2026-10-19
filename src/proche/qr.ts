// Contenu du QR code de jumelage : uniquement des informations publiques.
// Format : termchat-pair|1|<identifiant>|<clé publique>|<date en ms>
export const PREFIXE_QR = 'termchat-pair';
export const VERSION_QR = '1';
export const VALIDITE_QR_MS = 5 * 60 * 1000;
const DECALAGE_HORLOGE_MS = 60 * 1000;
const LONGUEUR_MAX = 200;

const RE_ID = /^TC\d{10,16}$/;
const RE_CLE = /^[A-Za-z0-9_-]{43}=?$/;

export interface DonneesQr {
  id: string;
  clePublique: string;
  creeLe: number;
}
export type ResultatQr = { ok: true; donnees: DonneesQr } | { ok: false; raison: string };

export function cleValide(cle: string): boolean {
  if (!RE_CLE.test(cle)) return false;
  const brut = Buffer.from(cle.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return brut.length === 32;
}

export function creerContenuQr(id: string, clePublique: string, maintenant: number = Date.now()): string {
  if (!RE_ID.test(id) || !cleValide(clePublique)) throw new Error('Identité invalide.');
  return [PREFIXE_QR, VERSION_QR, id, clePublique, String(maintenant)].join('|');
}

const refus = (raison: string): ResultatQr => ({ ok: false, raison });

export function lireContenuQr(brut: unknown, maintenant: number = Date.now()): ResultatQr {
  if (typeof brut !== 'string' || brut.length > LONGUEUR_MAX) return refus('QR code invalide.');
  const p = brut.split('|');
  if (p.length !== 5 || p[0] !== PREFIXE_QR) return refus("Ce QR code n'est pas un QR code TermChat.");
  if (p[1] !== VERSION_QR) return refus('Version du QR code non prise en charge. Mets à jour TermChat.');
  if (!RE_ID.test(p[2])) return refus('Identifiant invalide dans le QR code.');
  if (!cleValide(p[3])) return refus('Clé invalide dans le QR code.');
  if (!/^\d{10,15}$/.test(p[4])) return refus('Date invalide dans le QR code.');
  const creeLe = Number(p[4]);
  if (creeLe > maintenant + DECALAGE_HORLOGE_MS) return refus("L'heure de ton téléphone ne correspond pas à celle du QR code.");
  if (maintenant - creeLe > VALIDITE_QR_MS) return refus("QR code expiré. Demande à ton contact d'en afficher un nouveau.");
  return { ok: true, donnees: { id: p[2], clePublique: p[3], creeLe } };
}
