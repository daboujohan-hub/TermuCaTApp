/**
 * api/request.ts
 * Aide générique pour envoyer une requête au serveur et attendre sa réponse.
 *
 * Le serveur peut aussi pousser des notifications non sollicitées (ex:
 * message entrant en temps réel: {"type":"message",...}) qui n'ont PAS de
 * champ "ok". On filtre donc strictement sur la présence de "ok" pour ne
 * résoudre que sur une vraie réponse, sans consommer les notifications
 * (les autres abonnés à onMessage les recevront normalement).
 */

import termchatSocket from './socket';

const TIMEOUT_MS = 10000;

export function sendRequest<TReq extends { action: string }, TRes>(req: TReq): Promise<TRes> {
  return new Promise((resolve, reject) => {
    let reglee = false;

    const nettoyer = () => {
      unsubMsg();
      unsubDisc();
      clearTimeout(minuteur);
    };

    const unsubMsg = termchatSocket.onMessage((data: any) => {
      if (reglee) return;
      if (!data || typeof data !== 'object' || !('ok' in data)) return; // notification push, pas notre réponse
      reglee = true;
      nettoyer();
      resolve(data as TRes);
    });

    const unsubDisc = termchatSocket.onDisconnect(() => {
      if (reglee) return;
      reglee = true;
      nettoyer();
      reject(new Error('Déconnecté du serveur avant réception de la réponse.'));
    });

    const minuteur = setTimeout(() => {
      if (reglee) return;
      reglee = true;
      nettoyer();
      reject(new Error(`Aucune réponse du serveur après ${TIMEOUT_MS / 1000}s.`));
    }, TIMEOUT_MS);

    termchatSocket.send(req);
  });
}
