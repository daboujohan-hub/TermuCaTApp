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
  TotpSetupDemarrerResponse,
  TotpSetupConfirmerResponse,
  TotpDesactiverResponse,
  DeconnecterRequest,
  ErrorResponse,
} from '../protocol';

export function estErreur(res: { ok: boolean }): res is ErrorResponse {
  return res.ok === false;
}

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

export function totpVerifierConnexion(code: string): Promise<ConnecterResponse> {
  const req: TotpVerifierConnexionRequest = { action: 'totp_verifier_connexion', code };
  return sendRequest(req);
}

export function deconnecter(): void {
  const req: DeconnecterRequest = { action: 'deconnecter' };
  termchatSocket.send(req);
}


export function totpSetupDemarrer(): Promise<TotpSetupDemarrerResponse | ErrorResponse> {
  return sendRequest({ action: 'totp_setup_demarrer' });
}

export function totpSetupConfirmer(code: string): Promise<TotpSetupConfirmerResponse | ErrorResponse> {
  return sendRequest({ action: 'totp_setup_confirmer', code });
}

export function totpDesactiver(mdp: string, code: string): Promise<TotpDesactiverResponse | ErrorResponse> {
  return sendRequest({ action: 'totp_desactiver', mdp, code });
}
