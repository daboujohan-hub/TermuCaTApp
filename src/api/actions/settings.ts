/**
 * actions/settings.ts
 */

import { sendRequest } from '../request';
import type { ErrorResponse } from '../protocol';

export type Statut = 'disponible' | 'occupe' | 'ne_pas_deranger' | 'absent';

export interface ChangerStatutResponse {
  ok: true;
  msg: string;
}

export interface ChangerCouleurResponse {
  ok: true;
  msg: string;
  couleur: string;
}

export function changerStatut(statut: Statut): Promise<ChangerStatutResponse | ErrorResponse> {
  return sendRequest({ action: 'changer_statut', statut });
}

export function changerCouleur(couleur: string): Promise<ChangerCouleurResponse | ErrorResponse> {
  return sendRequest({ action: 'changer_couleur', couleur });
}
