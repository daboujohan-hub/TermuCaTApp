import { loadOrCreateIdentity } from './identity';
import { deriveSharedKey } from './keyExchange';
import { fernetEncrypt, fernetDecrypt } from './fernet';
import { sendRequest } from '@/api/request';

// Cache mémoire des clés publiques déjà récupérées (évite une requête "chercher" par message)
const cacheClesPubliques = new Map<string, string | null>();

async function getClePubliqueContact(numeroContact: string): Promise<string | null> {
  if (cacheClesPubliques.has(numeroContact)) {
    return cacheClesPubliques.get(numeroContact)!;
  }
  try {
    const res: any = await sendRequest({ action: 'chercher', numero: numeroContact });
    const cle = res?.ok ? res.user?.cle_publique ?? null : null;
    cacheClesPubliques.set(numeroContact, cle);
    return cle;
  } catch {
    return null;
  }
}

async function getClePartagee(numeroMoi: string, numeroContact: string): Promise<string | null> {
  const clePubliqueContact = await getClePubliqueContact(numeroContact);
  if (!clePubliqueContact) return null;
  const identity = await loadOrCreateIdentity();
  return deriveSharedKey(identity.secretKey, clePubliqueContact, numeroMoi, numeroContact);
}

export async function chiffrerPourContact(
  texte: string,
  numeroMoi: string,
  numeroContact: string,
): Promise<{ texte: string; chiffre: boolean }> {
  const cle = await getClePartagee(numeroMoi, numeroContact);
  if (!cle) {
    // Repli propre en clair si la clé du contact n'est pas disponible
    return { texte, chiffre: false };
  }
  return { texte: fernetEncrypt(texte, cle), chiffre: true };
}

export async function dechiffrerDeContact(
  token: string,
  numeroMoi: string,
  numeroContact: string,
): Promise<string> {
  try {
    const cle = await getClePartagee(numeroMoi, numeroContact);
    if (!cle) return '[message chiffré — clé indisponible]';
    return fernetDecrypt(token, cle);
  } catch {
    return '[message chiffré — déchiffrement impossible]';
  }
}
