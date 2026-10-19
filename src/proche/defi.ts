// Défi-réponse à la connexion : prouve que l'autre téléphone possède bien la clé privée du contact scanné.
import nacl from 'tweetnacl';

import { deriveSharedKey } from '@/crypto/keyExchange';
import { fernetEncrypt, fernetDecrypt } from '@/crypto/fernet';

const RE_DEFI = /^[0-9a-f]{32}$/;

export function creerDefi(): string {
  return Buffer.from(nacl.randomBytes(16)).toString('hex');
}

// Le message lie le défi aux deux identifiants et à leur rôle : une réponse renvoyée en miroir est refusée.
const charge = (initiateur: string, repondeur: string, defi: string) =>
  `termchat-defi-v1|${initiateur}|${repondeur}|${defi}`;

export async function repondreDefi(args: {
  defi: string;
  monId: string;
  idInitiateur: string;
  maCleSecrete: Uint8Array;
  cleContactVerifiee: string;
}): Promise<string> {
  if (!RE_DEFI.test(args.defi) || args.monId === args.idInitiateur) throw new Error('Défi invalide.');
  const cle = deriveSharedKey(args.maCleSecrete, args.cleContactVerifiee, args.monId, args.idInitiateur);
  return await fernetEncrypt(charge(args.idInitiateur, args.monId, args.defi), cle);
}

export async function verifierReponse(args: {
  defi: string;
  monId: string;
  idRepondeur: string;
  maCleSecrete: Uint8Array;
  cleRepondeurVerifiee: string;
  reponse: string;
}): Promise<boolean> {
  if (!RE_DEFI.test(args.defi) || args.idRepondeur === args.monId) return false;
  try {
    const cle = deriveSharedKey(args.maCleSecrete, args.cleRepondeurVerifiee, args.monId, args.idRepondeur);
    const clair = await fernetDecrypt(args.reponse, cle);
    return clair === charge(args.monId, args.idRepondeur, args.defi);
  } catch {
    return false;
  }
}
