/**
 * protocol.ts
 * Types TypeScript des actions et réponses du serveur TermChat (server.py).
 *
 * La 2FA de server.py est bien du TOTP (Google Authenticator), pas un code
 * par email. Actions: totp_verifier_connexion (à la connexion),
 * totp_setup_demarrer/confirmer/desactiver (gestion depuis Sécurité).
 */

export interface InscrireRequest {
  action: 'inscrire';
  nom: string;
  prenom: string;
  mdp: string;
  prefixe: string;
  couleur?: string;
  pseudo: string;
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

export interface ErrorResponse {
  ok: false;
  msg: string;
}

export interface InscrireResponse {
  ok: true;
  numero: string;
  nom: string;
  prenom: string;
  pays: string;
  pseudo: string;
}

export interface TotpRequisResponse {
  ok: true;
  totp_requis: true;
  msg: string;
}

export interface TotpSetupDemarrerResponse {
  ok: true;
  secret: string;
  uri: string;
  msg: string;
}

export interface TotpSetupConfirmerResponse {
  ok: true;
  msg: string;
  codes_recuperation: string[];
}

export interface TotpDesactiverResponse {
  ok: true;
  msg: string;
}

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
  photo_profil?: string | null;
}

export type ConnecterResponse = TotpRequisResponse | SessionResponse | ErrorResponse;

export interface DefinirPseudoResponse {
  ok: true;
  pseudo: string;
  msg: string;
}

export interface KickNotification {
  type: 'kick';
  msg: string;
}

export interface TimeoutNotification {
  type: 'timeout';
  msg: string;
}

export type ServerNotification = KickNotification | TimeoutNotification;

export interface MesConversationsRequest {
  action: 'mes_conversations';
}

export interface MessageRequest {
  action: 'message';
  dest: string;
  texte: string;
  chiffre?: boolean;
  reply_to?: string | null;
  expire_secondes?: number;
}

export interface HistoriqueRequest {
  action: 'historique';
  avec: string;
  limite?: number;
}

export interface TelechargerVocalRequest {
  action: 'telecharger_vocal';
  avec: string;
  msg_id: string;
}

export interface MarquerLuRequest {
  action: 'marquer_lu';
  avec: string;
}

export interface EnvoyerFichierRequest {
  action: 'envoyer_fichier';
  dest: string;
  nom_fichier: string;
  contenu: string;
  taille: number;
  chiffre?: boolean;
}

export interface EnvoyerVocalRequest {
  action: 'envoyer_vocal';
  dest: string;
  contenu: string;
  taille: number;
  duree: number;
  chiffre?: boolean;
}

export interface ConversationItem {
  numero: string;
  nom: string;
  dernier_msg: string;
  non_lus: number;
  heure: string;
  chiffre?: boolean;
}

export interface EffacerHistoriqueRequest {
  action: 'effacer_historique';
  avec: string;
}

export interface EffacerHistoriqueResponse {
  ok: true;
  msg: string;
}

export interface MesConversationsResponse {
  ok: true;
  conversations: ConversationItem[];
}

export interface MessageResponse {
  ok: true;
  livre: boolean;
  msg_id: string;
}

export interface MessageItem {
  id: string;
  de: string;
  vers: string;
  texte: string;
  type: 'texte' | 'fichier' | 'vocal';
  heure: string;
  lu: boolean;
  chiffre: boolean;
  reply_to?: string | null;
  nom_de?: string;
  nom_fichier?: string;
  taille?: number;
  duree?: number;
  // Champs client-only (jamais renvoyés par le serveur):
  uriLocal?: string; // chemin local du fichier audio (lecture des vocaux)
  enAttente?: boolean; // envoi optimiste en cours
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

export interface EnvoyerVocalResponse {
  ok: true;
  livre: boolean;
  msg_id: string;
  msg: string;
}

export interface TelechargerVocalResponse {
  ok: true;
  msg_id: string;
  nom_fichier: string;
  contenu: string;
  taille: number;
  duree: number;
}

export interface IncomingMessageNotification {
  type: 'message';
  de: string;
  numero: string;
  texte: string;
  heure: string;
  chiffre: boolean;
  reply_to?: string | null;
  msg_id: string;
  premium: boolean;
  premium_type: string | null;
  verifie: boolean;
}

export interface IncomingFileNotification {
  type: 'fichier';
  de: string;
  numero: string;
  nom_fichier: string;
  contenu: string;
  taille: number;
  heure: string;
  msg_id: string;
  chiffre: boolean;
}

export interface IncomingVocalNotification {
  type: 'vocal';
  de: string;
  numero: string;
  nom_fichier: string;
  contenu: string;
  duree: number;
  taille: number;
  heure: string;
  msg_id: string;
  chiffre: boolean;
}

export interface DefinirPhotoProfilRequest {
  action: 'definir_photo_profil';
  photo: string;
  taille: number;
}

export interface DefinirPhotoProfilResponse {
  ok: true;
  msg: string;
}

export interface SupprimerPhotoProfilRequest {
  action: 'supprimer_photo_profil';
}

export interface SupprimerPhotoProfilResponse {
  ok: true;
  msg: string;
}

export interface SupprimerMessageRequest {
  action: 'supprimer_message';
  avec: string;
  msg_id: string;
}

export interface SupprimerMessageResponse {
  ok: true;
  msg: string;
}

export interface MessageSupprimeNotification {
  type: 'message_supprime';
  msg_id: string;
  de: string;
  nom_de: string;
}

export interface ChangerStatutRequest {
  action: 'changer_statut';
  statut: string;
}

export interface ChangerStatutResponse {
  ok: true;
  msg: string;
}

export interface ChangerCouleurRequest {
  action: 'changer_couleur';
  couleur: string;
}

export interface ChangerCouleurResponse {
  ok: true;
  msg: string;
  couleur: string;
}

export interface ModifierBioRequest {
  action: 'modifier_bio';
  bio: string;
}

export interface ModifierBioResponse {
  ok: true;
  msg: string;
}

export interface StatutChangeNotification {
  type: 'statut_change';
  numero: string;
  nom: string;
  statut: string;
}

export interface DeliveredNotification {
  type: 'livre';
  dest: string;
  msg_id: string;
}

export interface ReadNotification {
  type: 'lu';
  par: string;
}

export type PushNotification =
  | IncomingMessageNotification
  | IncomingFileNotification
  | IncomingVocalNotification
  | DeliveredNotification
  | ReadNotification
  | MessageSupprimeNotification
  | StatutChangeNotification
  | KickNotification
  | TimeoutNotification
  | MsgGroupeNotification
  | InvitationGroupeNotification
  | RetireGroupeNotification
  | EpingleNotification;

// ═════════════════════════════════════════════
// Groupes (pas de chiffrement E2E, pas d'historique serveur — messages
// visibles uniquement en temps réel pendant que l'app est ouverte)
// ═════════════════════════════════════════════

// ---------- Requêtes ----------

export interface CreerGroupeRequest {
  action: 'creer_groupe';
  nom: string;
}

export interface AjouterGroupeRequest {
  action: 'ajouter_groupe';
  id_groupe: string;
  numero: string;
}

export interface RetirerGroupeRequest {
  action: 'retirer_groupe';
  id_groupe: string;
  numero: string;
}

export interface MembresGroupeRequest {
  action: 'membres_groupe';
  id_groupe: string;
}

export interface MsgGroupeRequest {
  action: 'msg_groupe';
  id_groupe: string;
  texte: string;
  chiffre?: boolean;
  reply_to?: string | null;
}

export interface MesGroupesRequest {
  action: 'mes_groupes';
}

// ---------- Réponses ----------

export interface CreerGroupeResponse {
  ok: true;
  id_groupe: string;
  nom: string;
}

export interface MembresGroupeResponse {
  ok: true;
  membres: string[];
  epoch: number;
}

export interface GroupeItem {
  id: string;
  nom: string;
  membres: number;
  createur: boolean;
}

export interface MesGroupesResponse {
  ok: true;
  groupes: GroupeItem[];
}

// ---------- Notifications push liées aux groupes ----------

export interface MsgGroupeNotification {
  type: 'msg_groupe';
  groupe: string;
  id_groupe: string;
  de: string;
  numero: string;
  texte: string;
  heure: string;
  reply_to?: string | null;
  chiffre: boolean;
  epoch?: number;
}

export interface InvitationGroupeNotification {
  type: 'invitation_groupe';
  groupe: string;
  id_groupe: string;
  heure: string;
}

export interface RetireGroupeNotification {
  type: 'retire_groupe';
  groupe: string;
  id_groupe: string;
  heure: string;
}

export interface EpingleNotification {
  type: 'epingle';
  groupe: string;
  texte: string;
  heure: string;
}


// ═════════════════════════════════════════════
// Écritures (articles longs publics, likes/commentaires/favoris)
// ═════════════════════════════════════════════

export interface EcriturePublierRequest {
  action: 'ecriture_publier';
  titre: string;
  texte: string;
  photo_couverture?: string;
  photo_taille?: number;
}
export interface EcriturePublierResponse {
  ok: true;
  id: string;
}

export interface EcritureModifierRequest {
  action: 'ecriture_modifier';
  id: string;
  titre: string;
  texte: string;
  photo_couverture?: string;
  photo_taille?: number;
}
export interface EcritureModifierResponse {
  ok: true;
  msg: string;
}

export interface EcritureSupprimerRequest {
  action: 'ecriture_supprimer';
  id: string;
}
export interface EcritureSupprimerResponse {
  ok: true;
  msg: string;
}

export interface EcritureListerRequest {
  action: 'ecriture_lister';
  curseur?: string;
}

export interface EcritureApercu {
  id: string;
  titre: string;
  extrait: string;
  auteur: string;
  auteur_nom: string;
  date_creation: string;
  nb_likes: number;
  nb_commentaires: number;
  a_aime: boolean;
  photo_couverture?: string | null;
}

export interface EcritureListerResponse {
  ok: true;
  ecritures: EcritureApercu[];
  curseur_suivant?: string | null;
}

export interface EcritureDetailRequest {
  action: 'ecriture_detail';
  id: string;
}

export interface EcritureDetailComplete extends EcritureApercu {
  texte: string;
  est_favori: boolean;
  est_auteur: boolean;
}

export interface EcritureDetailResponse {
  ok: true;
  ecriture: EcritureDetailComplete;
}

export interface EcritureAimerRequest {
  action: 'ecriture_aimer';
  id: string;
}
export interface EcritureRetirerLikeRequest {
  action: 'ecriture_retirer_like';
  id: string;
}
export interface EcritureLikeResponse {
  ok: true;
  msg: string;
}

export interface EcritureCommenterRequest {
  action: 'ecriture_commenter';
  id: string;
  texte: string;
}
export interface EcritureCommenterResponse {
  ok: true;
  msg: string;
}

export interface EcritureCommentaireItem {
  id: string;
  de: string;
  nom: string;
  texte: string;
  heure: string;
}

export interface EcritureCommentairesRequest {
  action: 'ecriture_commentaires';
  id: string;
}
export interface EcritureCommentairesResponse {
  ok: true;
  commentaires: EcritureCommentaireItem[];
}

export interface EcritureFavorisAjouterRequest {
  action: 'ecriture_favoris_ajouter';
  id: string;
}
export interface EcritureFavorisRetirerRequest {
  action: 'ecriture_favoris_retirer';
  id: string;
}
export interface EcritureFavorisResponse {
  ok: true;
  msg: string;
}

export interface MesFavorisRequest {
  action: 'mes_favoris';
}
export interface MesEcrituresRequest {
  action: 'mes_ecritures';
}


// ═════════════════════════════════════════════
// Notifications push (expo-notifications)
// ═════════════════════════════════════════════

export interface EnregistrerPushTokenRequest {
  action: 'enregistrer_push_token';
  token: string;
  plateforme: string;
}
export interface EnregistrerPushTokenResponse {
  ok: true;
  msg: string;
}

export interface SupprimerPushTokenRequest {
  action: 'supprimer_push_token';
}
export interface SupprimerPushTokenResponse {
  ok: true;
  msg: string;
}
