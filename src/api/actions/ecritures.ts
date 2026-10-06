/**
 * actions/ecritures.ts
 * Articles longs publics (Écritures) : publication, likes, commentaires, favoris.
 */

import { sendRequest } from '../request';
import type {
  EcriturePublierRequest, EcriturePublierResponse,
  EcritureModifierRequest, EcritureModifierResponse,
  EcritureSupprimerRequest, EcritureSupprimerResponse,
  EcritureListerRequest, EcritureListerResponse,
  EcritureDetailRequest, EcritureDetailResponse,
  EcritureAimerRequest, EcritureRetirerLikeRequest, EcritureLikeResponse,
  EcritureCommenterRequest, EcritureCommenterResponse,
  EcritureCommentairesRequest, EcritureCommentairesResponse,
  EcritureFavorisAjouterRequest, EcritureFavorisRetirerRequest, EcritureFavorisResponse,
  MesFavorisRequest, MesEcrituresRequest, EcritureListerResponse as ListeResponse,
  ErrorResponse,
} from '../protocol';

export function estErreur(res: { ok: boolean }): res is ErrorResponse {
  return res.ok === false;
}

export function ecriturePublier(
  titre: string,
  texte: string,
  photoCouverture?: string,
  photoTaille?: number
): Promise<EcriturePublierResponse | ErrorResponse> {
  const req: EcriturePublierRequest = {
    action: 'ecriture_publier', titre, texte,
    photo_couverture: photoCouverture, photo_taille: photoTaille,
  };
  return sendRequest(req);
}

export function ecritureModifier(
  id: string,
  titre: string,
  texte: string,
  photoCouverture?: string,
  photoTaille?: number
): Promise<EcritureModifierResponse | ErrorResponse> {
  const req: EcritureModifierRequest = {
    action: 'ecriture_modifier', id, titre, texte,
    photo_couverture: photoCouverture, photo_taille: photoTaille,
  };
  return sendRequest(req);
}

export function ecritureSupprimer(id: string): Promise<EcritureSupprimerResponse | ErrorResponse> {
  const req: EcritureSupprimerRequest = { action: 'ecriture_supprimer', id };
  return sendRequest(req);
}

export function ecritureLister(curseur?: string): Promise<EcritureListerResponse | ErrorResponse> {
  const req: EcritureListerRequest = { action: 'ecriture_lister', curseur };
  return sendRequest(req);
}

export function ecritureDetail(id: string): Promise<EcritureDetailResponse | ErrorResponse> {
  const req: EcritureDetailRequest = { action: 'ecriture_detail', id };
  return sendRequest(req);
}

export function ecritureAimer(id: string): Promise<EcritureLikeResponse | ErrorResponse> {
  const req: EcritureAimerRequest = { action: 'ecriture_aimer', id };
  return sendRequest(req);
}

export function ecritureRetirerLike(id: string): Promise<EcritureLikeResponse | ErrorResponse> {
  const req: EcritureRetirerLikeRequest = { action: 'ecriture_retirer_like', id };
  return sendRequest(req);
}

export function ecritureCommenter(id: string, texte: string): Promise<EcritureCommenterResponse | ErrorResponse> {
  const req: EcritureCommenterRequest = { action: 'ecriture_commenter', id, texte };
  return sendRequest(req);
}

export function ecritureCommentaires(id: string): Promise<EcritureCommentairesResponse | ErrorResponse> {
  const req: EcritureCommentairesRequest = { action: 'ecriture_commentaires', id };
  return sendRequest(req);
}

export function ecritureFavorisAjouter(id: string): Promise<EcritureFavorisResponse | ErrorResponse> {
  const req: EcritureFavorisAjouterRequest = { action: 'ecriture_favoris_ajouter', id };
  return sendRequest(req);
}

export function ecritureFavorisRetirer(id: string): Promise<EcritureFavorisResponse | ErrorResponse> {
  const req: EcritureFavorisRetirerRequest = { action: 'ecriture_favoris_retirer', id };
  return sendRequest(req);
}

export function mesFavoris(): Promise<ListeResponse | ErrorResponse> {
  const req: MesFavorisRequest = { action: 'mes_favoris' };
  return sendRequest(req);
}

export function mesEcritures(): Promise<ListeResponse | ErrorResponse> {
  const req: MesEcrituresRequest = { action: 'mes_ecritures' };
  return sendRequest(req);
}
