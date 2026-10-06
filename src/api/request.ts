/**
 * api/request.ts
 * Aide générique pour envoyer une requête au serveur et attendre sa réponse.
 */

import termchatSocket from './socket';

const TIMEOUT_MS = 10000;

interface RequeteEnAttente {
  resolve: (data: any) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const fileAttente: RequeteEnAttente[] = [];
let ecouteurInstalle = false;

function installerEcouteurUnique() {
  if (ecouteurInstalle) return;
  ecouteurInstalle = true;

  termchatSocket.onMessage((data: any) => {
    if (!data || typeof data !== 'object' || !('ok' in data)) return;
    const requete = fileAttente.shift();
    if (!requete) return;
    clearTimeout(requete.timer);
    requete.resolve(data);
  });

  termchatSocket.onDisconnect(() => {
    while (fileAttente.length) {
      const requete = fileAttente.shift()!;
      clearTimeout(requete.timer);
      const detail = (termchatSocket as any).lastError;
      const msg = detail
        ? `Déconnecté du serveur: ${detail.message || detail.code || JSON.stringify(detail)}`
        : 'Déconnecté du serveur avant réception de la réponse (aucune erreur détaillée).';
      requete.reject(new Error(msg));
    }
  });
}

async function envoyerEtAttendre<TRes>(req: Record<string, any>): Promise<TRes> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = fileAttente.findIndex((r) => r.resolve === resolve);
      if (idx !== -1) fileAttente.splice(idx, 1);
      reject(new Error(`Aucune réponse du serveur après ${TIMEOUT_MS / 1000}s.`));
    }, TIMEOUT_MS);

    fileAttente.push({ resolve, reject, timer });

    try {
      const envoye = termchatSocket.send(req);
      if (!envoye) {
        const idx = fileAttente.findIndex((r) => r.resolve === resolve);
        if (idx !== -1) fileAttente.splice(idx, 1);
        clearTimeout(timer);
        reject(new Error('Socket non connecté au moment de l’envoi.'));
      }
    } catch (e: any) {
      const idx = fileAttente.findIndex((r) => r.resolve === resolve);
      if (idx !== -1) fileAttente.splice(idx, 1);
      clearTimeout(timer);
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

export async function sendRequest<TReq extends { action: string }, TRes>(req: TReq, dejaReessaye = false): Promise<TRes> {
  installerEcouteurUnique();

  let connexionEtablie = false;

  try {
    await termchatSocket.ensureConnected();
    connexionEtablie = true;
    return await envoyerEtAttendre<TRes>(req);
  } catch (e: any) {
    const msg = e?.message ?? '';
    const connexionMorte =
      !connexionEtablie ||
      msg.includes('Broken pipe') ||
      msg.includes('Déconnecté') ||
      msg.includes('EPIPE') ||
      msg.includes('ECONNRESET') ||
      msg.includes('Socket non connecté');

    if (!dejaReessaye && connexionMorte) {
      console.warn('[request] Échec de connexion ou socket interrompu; nouvelle tentative unique:', msg);
      termchatSocket.disconnect();
      return sendRequest(req, true);
    }

    throw e;
  }
}

