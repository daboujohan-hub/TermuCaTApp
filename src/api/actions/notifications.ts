/**
 * actions/notifications.ts
 * Enregistrement du jeton de notification push (expo-notifications).
 */

import { sendRequest } from '../request';
import type {
  EnregistrerPushTokenRequest, EnregistrerPushTokenResponse,
  SupprimerPushTokenRequest, SupprimerPushTokenResponse,
  ErrorResponse,
} from '../protocol';

export function estErreur(res: { ok: boolean }): res is ErrorResponse {
  return res.ok === false;
}

export function enregistrerPushToken(token: string, plateforme: string): Promise<EnregistrerPushTokenResponse | ErrorResponse> {
  const req: EnregistrerPushTokenRequest = { action: 'enregistrer_push_token', token, plateforme };
  return sendRequest(req);
}

export function supprimerPushToken(): Promise<SupprimerPushTokenResponse | ErrorResponse> {
  const req: SupprimerPushTokenRequest = { action: 'supprimer_push_token' };
  return sendRequest(req);
}
