/**
 * actions/profile.ts
 * Modification du profil (statut, couleur, bio) et suppression de message.
 */

import { sendRequest } from '../request';

import type {
  ChangerStatutRequest,
  ChangerStatutResponse,
  ChangerCouleurRequest,
  ChangerCouleurResponse,
  ModifierBioRequest,
  ModifierBioResponse,
  SupprimerMessageRequest,
  SupprimerMessageResponse,
  DefinirPseudoRequest,
  DefinirPseudoResponse,
  DefinirPhotoProfilRequest,
  DefinirPhotoProfilResponse,
  SupprimerPhotoProfilRequest,
  SupprimerPhotoProfilResponse,
  ErrorResponse,
} from '../protocol';

export const STATUTS = [
  { valeur: 'disponible', label: 'Disponible' },
  { valeur: 'occupe', label: 'Occupé' },
  { valeur: 'ne_pas_deranger', label: 'Ne pas déranger' },
  { valeur: 'absent', label: 'Absent' },
] as const;

export const COULEURS = [
  'cyan', 'bleu', 'vert', 'violet', 'orange', 'rose', 'rouge', 'jaune',
] as const;

export function changerStatut(
  statut: string
): Promise<ChangerStatutResponse | ErrorResponse> {
  const req: ChangerStatutRequest = { action: 'changer_statut', statut };
  return sendRequest(req);
}

export function changerCouleur(
  couleur: string
): Promise<ChangerCouleurResponse | ErrorResponse> {
  const req: ChangerCouleurRequest = { action: 'changer_couleur', couleur };
  return sendRequest(req);
}

export function modifierBio(
  bio: string
): Promise<ModifierBioResponse | ErrorResponse> {
  const req: ModifierBioRequest = { action: 'modifier_bio', bio };
  return sendRequest(req);
}

export function supprimerMessage(
  avec: string,
  msgId: string
): Promise<SupprimerMessageResponse | ErrorResponse> {
  const req: SupprimerMessageRequest = { action: 'supprimer_message', avec, msg_id: msgId };
  return sendRequest(req);
}

export function definirPseudo(
  pseudo: string
): Promise<DefinirPseudoResponse | ErrorResponse> {
  const req: DefinirPseudoRequest = { action: 'definir_pseudo', pseudo };
  return sendRequest(req);
}

export function definirPhotoProfil(
  photoBase64: string,
  tailleOctets: number
): Promise<DefinirPhotoProfilResponse | ErrorResponse> {
  const req: DefinirPhotoProfilRequest = { action: 'definir_photo_profil', photo: photoBase64, taille: tailleOctets };
  return sendRequest(req);
}

export function supprimerPhotoProfil(): Promise<SupprimerPhotoProfilResponse | ErrorResponse> {
  const req: SupprimerPhotoProfilRequest = { action: 'supprimer_photo_profil' };
  return sendRequest(req);
}

export function estErreur(res: { ok: boolean }): res is ErrorResponse {
  return res.ok === false;
}
