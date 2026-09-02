/**
 * protocol.ts
 * Types TypeScript des actions et réponses du serveur TermChat (server.py).
 *
 * Portée actuelle : authentification uniquement (inscription, connexion,
 * TOTP, pseudo, clé publique, déconnexion). Les actions de messagerie,
 * groupes, premium, etc. seront ajoutées au fur et à mesure des écrans
 * correspondants.
 *
 * NB: les actions admin_* ne sont PAS incluses ici — le panel admin reste
 * exclusivement en terminal (décision d'architecture).
 */

// ─────────────────────────────────────────────
// Requêtes (client → serveur)
// ─────────────────────────────────────────────

export interface InscrireRequest {
  action: 'inscrire';
  nom: string;
  mdp: string;
  prefixe: string; // ex: "+225"
  couleur?: string;
  pseudo: string; // sans le '@'
  email?: string;
  cle_publique?: string;
}

export interface ConnecterNumeroRequest {
  action: 'connecter_numero';
  numero: string;
  mdp: string;
}

export interface ConnecterEmailRequest {
  action: 'connecter_email';
  email: string;
  mdp: string;
}

export interface DefinirPseudoRequest {
  action: 'definir_pseudo';
  pseudo: string;
}

export interface TotpVerifierConnexionRequest {
  action: 'totp_verifier_connexion';
  code: string;
}

export interface TotpSetupDemarrerRequest {
  action: 'totp_setup_demarrer';
}

export interface TotpSetupConfirmerRequest {
  action: 'totp_setup_confirmer';
  code: string;
}

export interface TotpDesactiverRequest {
  action: 'totp_desactiver';
  mdp: string;
  code: string;
}

export interface DeconnecterRequest {
  action: 'deconnecter';
}

export type AuthRequest =
  | InscrireRequest
  | ConnecterNumeroRequest
  | ConnecterEmailRequest
  | DefinirPseudoRequest
  | TotpVerifierConnexionRequest
  | TotpSetupDemarrerRequest
  | TotpSetupConfirmerRequest
  | TotpDesactiverRequest
  | DeconnecterRequest;

// ─────────────────────────────────────────────
// Réponses (serveur → client)
// ─────────────────────────────────────────────

/** Réponse générique d'échec — la quasi-totalité des actions peuvent la renvoyer. */
export interface ErrorResponse {
  ok: false;
  msg: string;
}

/** Réponse de succès à `inscrire`. */
export interface InscrireResponse {
  ok: true;
  numero: string;
  nom: string;
  pays: string;
  pseudo: string;
}

/**
 * Réponse à `connecter_numero` / `connecter_email` quand le compte a la 2FA
 * active : il faut alors envoyer `totp_verifier_connexion` avant d'obtenir
 * la session complète.
 */
export interface TotpRequisResponse {
  ok: true;
  totp_requis: true;
  msg: string;
}

/**
 * Réponse de connexion complète (envoyée par `_connecter_user`), reçue soit
 * directement après `connecter_numero`/`connecter_email` (si pas de 2FA),
 * soit après `totp_verifier_connexion` (si 2FA active).
 */
export interface SessionResponse {
  ok: true;
  nom: string;
  numero: string;
  pays: string;
  bio: string;
  couleur: string;
  statut: string;
  est_admin: boolean;
  non_lus: number;
  a_pin: boolean;
  pseudo: string;
  premium: boolean;
  premium_type: string | null;
  role: string | null;
  verifie: boolean;
}

export type ConnecterResponse = TotpRequisResponse | SessionResponse | ErrorResponse;

export interface DefinirPseudoResponse {
  ok: true;
  pseudo: string;
  msg: string;
}

export interface TotpSetupDemarrerResponse {
  ok: true;
  secret: string;
  uri: string; // otpauth://... — à afficher en QR code
  msg: string;
}

export interface TotpSetupConfirmerResponse {
  ok: true;
  msg: string;
  codes_recuperation: string[]; // affichés une seule fois, à faire noter à l'utilisateur
}

export interface TotpDesactiverResponse {
  ok: true;
  msg: string;
}

/** Notification serveur non sollicitée : session invalidée par une connexion plus récente. */
export interface KickNotification {
  type: 'kick';
  msg: string;
}

/** Notification serveur non sollicitée : déconnecté pour inactivité (30 min sans trafic). */
export interface TimeoutNotification {
  type: 'timeout';
  msg: string;
}

export type ServerNotification = KickNotification | TimeoutNotification;

// ═════════════════════════════════════════════
// Messagerie (v1: liste conversations, message texte, fichier, historique)
// ═════════════════════════════════════════════

// ---------- Requêtes ----------

export interface MesConversationsRequest {
  action: 'mes_conversations';
}

export interface MessageRequest {
  action: 'message';
  dest: string; // numéro du destinataire
  texte: string;
  chiffre?: boolean;
  reply_to?: string | null;
  expire_secondes?: number;
}

export interface HistoriqueRequest {
  action: 'historique';
  avec: string; // numéro de l'autre participant
  limite?: number;
}

/** Pas de réponse attendue: le serveur ne renvoie rien pour cette action (fire-and-forget). */
export interface MarquerLuRequest {
  action: 'marquer_lu';
  avec: string;
}

export interface EnvoyerFichierRequest {
  action: 'envoyer_fichier';
  dest: string;
  nom_fichier: string;
  contenu: string; // base64
  taille: number; // octets
  chiffre?: boolean;
}

// ---------- Réponses ----------

export interface ConversationItem {
  numero: string;
  nom: string;
  dernier_msg: string;
  non_lus: number;
  heure: string;
}

export interface MesConversationsResponse {
  ok: true;
  conversations: ConversationItem[];
}

export interface MessageResponse {
  ok: true;
  livre: boolean; // true si le destinataire était en ligne au moment de l'envoi
  msg_id: string;
}

export interface MessageItem {
  id: string;
  de: string;
  vers: string;
  texte: string; // pour type 'fichier': le nom du fichier
  type: 'texte' | 'fichier';
  heure: string;
  lu: boolean;
  chiffre: boolean;
  reply_to?: string | null;
  nom_de?: string; // ajouté par le serveur pour affichage
  nom_fichier?: string;
  taille?: number;
}

export interface HistoriqueResponse {
  ok: true;
  historique: MessageItem[];
}

export interface EnvoyerFichierResponse {
  ok: true;
  livre: boolean;
  msg_id: string;
  msg: string;
}

// ---------- Notifications push (non sollicitées, sans champ "ok") ----------

/** Message texte reçu en temps réel (l'expéditeur est en ligne). */
export interface IncomingMessageNotification {
  type: 'message';
  de: string; // nom de l'expéditeur
  numero: string; // numéro de l'expéditeur
  texte: string;
  heure: string;
  chiffre: boolean;
  reply_to?: string | null;
  msg_id: string;
  premium: boolean;
  premium_type: string | null;
  verifie: boolean;
}

/** Fichier reçu en temps réel. */
export interface IncomingFileNotification {
  type: 'fichier';
  de: string;
  numero: string;
  nom_fichier: string;
  contenu: string; // base64
  taille: number;
  heure: string;
  msg_id: string;
  chiffre: boolean;
}

/** Confirmation que notre message a été livré (destinataire en ligne). */
export interface DeliveredNotification {
  type: 'livre';
  dest: string;
  msg_id: string;
}

/** Le destinataire a lu nos messages. */
export interface ReadNotification {
  type: 'lu';
  par: string;
}

export type PushNotification =
  | IncomingMessageNotification
  | IncomingFileNotification
  | DeliveredNotification
  | ReadNotification
  | KickNotification
  | TimeoutNotification;
