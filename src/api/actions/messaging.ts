/**
 * actions/messaging.ts
 * Fonctions de messagerie v1 (texte + fichier + vocal, 1-à-1 uniquement).
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
  EnvoyerVocalRequest,
  EnvoyerVocalResponse,
  TelechargerVocalRequest,
  TelechargerVocalResponse,
  EffacerHistoriqueRequest,
  EffacerHistoriqueResponse,
  ErrorResponse,
} from '../protocol';

/**
 * Vérifie si la réponse du serveur est une erreur.
 */
export function estErreur(
  res: { ok: boolean }
): res is ErrorResponse {
  return res.ok === false;
}

/**
 * Récupère les conversations de l'utilisateur connecté.
 */
export function mesConversations(): Promise<
  MesConversationsResponse | ErrorResponse
> {
  const req: MesConversationsRequest = {
    action: 'mes_conversations',
  };

  return sendRequest(req);
}

/**
 * Envoie un message texte à un utilisateur.
 */
export function envoyerMessage(
  dest: string,
  texte: string,
  chiffre = false
): Promise<MessageResponse | ErrorResponse> {
  const req: MessageRequest = {
    action: 'message',
    dest,
    texte,
    chiffre,
  };

  return sendRequest(req);
}

/**
 * Récupère l'historique d'une conversation.
 */
export function historique(
  avec: string,
  limite = 50
): Promise<HistoriqueResponse | ErrorResponse> {
  const req: HistoriqueRequest = {
    action: 'historique',
    avec,
    limite,
  };

  return sendRequest(req);
}

/**
 * Marque une conversation comme lue.
 * Fire-and-forget : le serveur ne répond pas à cette action.
 */
export function marquerLu(avec: string): void {
  const req: MarquerLuRequest = {
    action: 'marquer_lu',
    avec,
  };

  termchatSocket.send(req);
}

/**
 * Envoie un fichier en base64.
 * Réservé aux comptes premium côté serveur.
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

/**
 * Envoie un message vocal en base64 (pas de restriction premium côté serveur).
 */
export function envoyerVocal(
  dest: string,
  contenuBase64: string,
  tailleOctets: number,
  dureeSecondes: number
): Promise<EnvoyerVocalResponse | ErrorResponse> {
  const req: EnvoyerVocalRequest = {
    action: 'envoyer_vocal',
    dest,
    contenu: contenuBase64,
    taille: tailleOctets,
    duree: dureeSecondes,
  };

  return sendRequest(req);
}


/**
 * Récupère un message vocal historique depuis le serveur.
 */
export function telechargerVocal(
  avec: string,
  msgId: string
): Promise<TelechargerVocalResponse | ErrorResponse> {
  const req: TelechargerVocalRequest = {
    action: 'telecharger_vocal',
    avec,
    msg_id: msgId,
  };

  return sendRequest(req);
}

export function effacerHistorique(
  avec: string
): Promise<EffacerHistoriqueResponse | ErrorResponse> {
  const req: EffacerHistoriqueRequest = { action: 'effacer_historique', avec };
  return sendRequest(req);
}

// Recherche d'un utilisateur par numéro ou par pseudo.
// Le serveur attend soit le champ "numero", soit le champ "pseudo" (pas les deux).
export async function chercherUtilisateur(
  identifiant: string
): Promise<any> {
  const valeur = identifiant.trim();
  const ressembleANumero = /^\+?\d+$/.test(valeur);
  return sendRequest(
    ressembleANumero
      ? { action: 'chercher', numero: valeur }
      : { action: 'chercher', pseudo: valeur }
  );
}
