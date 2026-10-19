// Messages du mode proche : toujours chiffrés, uniquement avec les contacts vérifiés par QR code.
import nacl from 'tweetnacl';

import { deriveSharedKey } from '@/crypto/keyExchange';
import { fernetEncrypt, fernetDecrypt } from '@/crypto/fernet';
import { clePubliqueVerifiee } from './carnet';
import {
  TEXTE_MAX, enveloppeValide, estBloque, dejaVu, marquerVu, autoriserDebit, ajouterSortie,
  type Enveloppe,
} from './regles';

export type Refus = { ok: false; raison: string };

const idMessage = () => Buffer.from(nacl.randomBytes(16)).toString('hex');

async function clePartagee(monId: string, maCleSecrete: Uint8Array, idContact: string): Promise<string | null> {
  const clePub = await clePubliqueVerifiee(idContact);
  return clePub ? deriveSharedKey(maCleSecrete, clePub, monId, idContact) : null;
}

export async function creerEnveloppe(
  args: { texte: string; monId: string; idContact: string; maCleSecrete: Uint8Array },
  maintenant: number = Date.now(),
): Promise<{ ok: true; enveloppe: Enveloppe } | Refus> {
  const texte = args.texte.trim();
  if (!texte) return { ok: false, raison: 'Message vide.' };
  if (texte.length > TEXTE_MAX) return { ok: false, raison: `Message trop long (${TEXTE_MAX} caractères maximum).` };
  if (await estBloque(args.idContact)) return { ok: false, raison: 'Tu as bloqué ce contact.' };
  if (!autoriserDebit('envoi:' + args.idContact, 20, 60000, maintenant)) {
    return { ok: false, raison: 'Trop de messages. Attends un instant.' };
  }
  const cle = await clePartagee(args.monId, args.maCleSecrete, args.idContact);
  if (!cle) return { ok: false, raison: 'Contact non vérifié : scanne son QR code.' };

  const id = idMessage();
  const charge = JSON.stringify({ id, de: args.monId, vers: args.idContact, t: maintenant, x: texte });
  const c = await fernetEncrypt(charge, cle);
  const enveloppe: Enveloppe = { v: 1, id, de: args.monId, vers: args.idContact, t: maintenant, c };
  if (!enveloppeValide(enveloppe, maintenant)) return { ok: false, raison: 'Message invalide.' };
  if (!(await ajouterSortie(enveloppe))) return { ok: false, raison: "File d'attente pleine. Reconnecte-toi à internet." };
  return { ok: true, enveloppe };
}

export async function ouvrirEnveloppe(
  brut: unknown,
  ctx: { monId: string; maCleSecrete: Uint8Array },
  maintenant: number = Date.now(),
): Promise<{ ok: true; id: string; de: string; t: number; texte: string } | Refus> {
  if (!enveloppeValide(brut, maintenant)) return { ok: false, raison: 'Message invalide.' };
  const e = brut;
  if (e.vers !== ctx.monId) return { ok: false, raison: "Ce message n'est pas pour toi." };
  if (await estBloque(e.de)) return { ok: false, raison: 'Expéditeur bloqué.' };
  if (!autoriserDebit('recu:' + e.de, 60, 60000, maintenant)) return { ok: false, raison: 'Trop de messages reçus.' };
  if (await dejaVu(e.id)) return { ok: false, raison: 'Message déjà reçu.' };

  const cle = await clePartagee(ctx.monId, ctx.maCleSecrete, e.de);
  if (!cle) return { ok: false, raison: 'Expéditeur non vérifié.' };
  try {
    const interne = JSON.parse(await fernetDecrypt(e.c, cle));
    const memes = interne && interne.id === e.id && interne.de === e.de && interne.vers === e.vers && interne.t === e.t;
    if (!memes || typeof interne.x !== 'string' || interne.x.length > TEXTE_MAX) {
      return { ok: false, raison: 'Message altéré.' };
    }
    await marquerVu(e.id, e.t, maintenant);
    return { ok: true, id: e.id, de: e.de, t: e.t, texte: interne.x };
  } catch {
    return { ok: false, raison: 'Déchiffrement impossible.' };
  }
}
