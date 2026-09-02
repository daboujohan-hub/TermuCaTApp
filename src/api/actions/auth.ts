/**
 * actions/auth.ts
 * Fonctions d'authentification : encapsulent l'envoi d'une requête via
 * termchatSocket et la réception de la réponse correspondante, exposées
 * en Promises pour un usage simple avec async/await dans les écrans.
 */

import termchatSocket from '../socket';
import { sendRequest } from '../request';
import type {
  InscrireRequest,
  InscrireResponse,
  ConnecterNumeroRequest,
  ConnecterEmailRequest,
  ConnecterResponse,
  DefinirPseudoRequest,
  DefinirPseudoResponse,
  TotpVerifierConnexionRequest,
  TotpSetupDemarrerRequest,
  TotpSetupDemarrerResponse,
  TotpSetupConfirmerRequest,
  TotpSetupConfirmerResponse,
  TotpDesactiverRequest,
  TotpDesactiverResponse,
  DeconnecterRequest,
  ErrorResponse,
} from '../protocol';

/** Vérifie si une réponse est un échec (ok: false), utilisable comme garde de type. */
export function estErreur(res: { ok: boolean }): res is ErrorResponse {
  return res.ok === false;
}

// ─────────────────────────────────────────────

export function inscrire(payload: Omit<InscrireRequest, 'action'>): Promise<InscrireResponse | ErrorResponse> {
  return sendRequest({ action: 'inscrire', ...payload });
}

export function connecterNumero(numero: string, mdp: string): Promise<ConnecterResponse> {
  const req: ConnecterNumeroRequest = { action: 'connecter_numero', numero, mdp };
  return sendRequest(req);
}

export function connecterEmail(email: string, mdp: string): Promise<ConnecterResponse> {
  const req: ConnecterEmailRequest = { action: 'connecter_email', email, mdp };
  return sendRequest(req);
}

export function definirPseudo(pseudo: string): Promise<DefinirPseudoResponse | ErrorResponse> {
  const req: DefinirPseudoRequest = { action: 'definir_pseudo', pseudo };
  return sendRequest(req);
}

/** À envoyer après connecterNumero/connecterEmail si la réponse indiquait totp_requis. */
export function totpVerifierConnexion(code: string): Promise<ConnecterResponse> {
  const req: TotpVerifierConnexionRequest = { action: 'totp_verifier_connexion', code };
  return sendRequest(req);
}

export function totpSetupDemarrer(): Promise<TotpSetupDemarrerResponse | ErrorResponse> {
  const req: TotpSetupDemarrerRequest = { action: 'totp_setup_demarrer' };
  return sendRequest(req);
}

export function totpSetupConfirmer(code: string): Promise<TotpSetupConfirmerResponse | ErrorResponse> {
  const req: TotpSetupConfirmerRequest = { action: 'totp_setup_confirmer', code };
  return sendRequest(req);
}

export function totpDesactiver(mdp: string, code: string): Promise<TotpDesactiverResponse | ErrorResponse> {
  const req: TotpDesactiverRequest = { action: 'totp_desactiver', mdp, code };
  return sendRequest(req);
}

/** Ferme la session côté serveur. Ne rien attendre en retour: le serveur coupe la connexion (`break`). */
export function deconnecter(): void {
  const req: DeconnecterRequest = { action: 'deconnecter' };
  termchatSocket.send(req);
}
