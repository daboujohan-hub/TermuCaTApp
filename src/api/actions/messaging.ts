/**
 * actions/messaging.ts
 * Fonctions de messagerie v1 (texte + fichier, 1-à-1 uniquement).
 */

import termchatSocket from '../socket';
import { sendRequest } from '../request';
import type {
  MesConversationsRequest,
  MesConversationsResponse,
  MessageRequest,
  MessageResponse,
  HistoriqueRequest,
  HistoriqueResponse,
  MarquerLuRequest,
  EnvoyerFichierRequest,
  EnvoyerFichierResponse,
  ErrorResponse,
} from '../protocol';

export function mesConversations(): Promise<MesConversationsResponse | ErrorResponse> {
  const req: MesConversationsRequest = { action: 'mes_conversations' };
  return sendRequest(req);
}

export function envoyerMessage(dest: string, texte: string): Promise<MessageResponse | ErrorResponse> {
  const req: MessageRequest = { action: 'message', dest, texte };
  return sendRequest(req);
}

export function historique(avec: string, limite = 50): Promise<HistoriqueResponse | ErrorResponse> {
  const req: HistoriqueRequest = { action: 'historique', avec, limite };
  return sendRequest(req);
}

/** Fire-and-forget: le serveur ne répond rien à cette action. */
export function marquerLu(avec: string): void {
  const req: MarquerLuRequest = { action: 'marquer_lu', avec };
  termchatSocket.send(req);
}

/**
 * Envoie un fichier (base64). Réservé aux comptes premium côté serveur —
 * l'appelant doit vérifier `session.premium` avant d'afficher cette option,
 * mais on laisse aussi le serveur trancher en dernier ressort (source de vérité).
 */
export function envoyerFichier(
  dest: string,
  nomFichier: string,
  contenuBase64: string,
  tailleOctets: number
): Promise<EnvoyerFichierResponse | ErrorResponse> {
  const req: EnvoyerFichierRequest = {
    action: 'envoyer_fichier',
    dest,
    nom_fichier: nomFichier,
    contenu: contenuBase64,
    taille: tailleOctets,
  };
  return sendRequest(req);
}
