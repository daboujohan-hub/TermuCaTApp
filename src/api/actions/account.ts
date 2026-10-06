/**
 * actions/account.ts
 * Blocage, signalement d'un utilisateur, changement de mot de passe.
 */
import { sendRequest } from '../request';

export function bloquerUtilisateur(numero: string, bloquer = true): Promise<any> {
  return sendRequest<{ action: string; numero: string; bloquer: boolean }, any>({
    action: 'bloquer',
    numero,
    bloquer,
  });
}

export function signalerUtilisateur(numero: string, raison: string, msgId?: string): Promise<any> {
  return sendRequest<{ action: string; numero: string; raison: string; msg_id?: string }, any>({
    action: 'signaler',
    numero,
    raison,
    msg_id: msgId,
  });
}

export function changerMotDePasse(ancien: string, nouveau: string): Promise<any> {
  return sendRequest<{ action: string; ancien: string; nouveau: string }, any>({
    action: 'changer_mdp',
    ancien,
    nouveau,
  });
}

export function supprimerCompte(mdp: string): Promise<any> {
  return sendRequest<{ action: string; mdp: string }, any>({
    action: 'supprimer_compte',
    mdp,
  });
}
