import { sendRequest } from '../request';

export interface PublierClePubliqueRequest {
  action: 'publier_cle_publique';
  cle_publique: string;
}

export interface PublierClePubliqueResponse {
  ok: true;
}

export interface ErrorResponse {
  ok: false;
  msg: string;
}

export function estErreur(res: { ok: boolean }): res is ErrorResponse {
  return res.ok === false;
}

export function publierClePublique(
  clePublique: string
): Promise<PublierClePubliqueResponse | ErrorResponse> {
  const req: PublierClePubliqueRequest = { action: 'publier_cle_publique', cle_publique: clePublique };
  return sendRequest(req);
}
