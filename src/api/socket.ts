import { erreurConviviale } from './erreurs';
import { AppState } from 'react-native';

const HOSTNAME = 'iriguchi.proxy.rlwy.net'; // Railway TCP Proxy 
const PORT = 35944;

type MessageCallback = (data: any) => void; type StatusCallback = () => void; 
type ErrorCallback = (err: any) => void; type ReconnectStateCallback = (state: 
'reconnecting' | 'connected' | 'failed') => void;

let dernierIpConnu: string | null = null;

async function resoudreVia(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: { accept: 'application/dns-json' } });
  const data = await res.json();
  return data.Answer?.find((a: any) => a.type === 1)?.data ?? null;
}

// Résout le hostname via DNS-over-HTTPS pour contourner le bug de résolution
// DNS d'Android avec react-native-tcp-socket. Essaie Cloudflare puis Google,
// avec une petite retentative sur chacun, et garde en cache la dernière IP
// qui a fonctionné (utilisée si toutes les résolutions échouent ce coup-ci).
async function resolveHost(hostname: string): Promise<string> {
  const fournisseurs = [
    `https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`,
    `https://dns.google/resolve?name=${hostname}&type=A`,
  ];

  for (const url of fournisseurs) {
    for (let tentative = 0; tentative < 2; tentative++) {
      try {
        const ip = await resoudreVia(url);
        if (ip) {
          console.log('[TermChatSocket] 🌐 DNS résolu:', hostname, '->', ip);
          dernierIpConnu = ip;
          return ip;
        }
      } catch (e) {
        console.warn('[TermChatSocket] ⚠️ Echec resolution DNS via', url, e);
      }
    }
  }

  if (dernierIpConnu) {
    console.warn('[TermChatSocket] ⚠️ Toutes les resolutions DNS ont echoue, reutilisation de la derniere IP connue:', dernierIpConnu);
    return dernierIpConnu;
  }

  console.warn('[TermChatSocket] ⚠️ Resolution DNS totalement echouee, fallback hostname brut (risque d\'echouer sur Android)');
  return hostname;
}

class TermChatSocket {
  private socket: any = null;
  private buffer: string = '';
  private messageListeners: MessageCallback[] = [];
  private disconnectListeners: StatusCallback[] = [];
  private reconnectStateListeners: ReconnectStateCallback[] = [];
  private connected: boolean = false;
  private connectingPromise: Promise<void> | null = null;
  lastError: any = null;

  // Tente une connexion; en cas d'echec (timeout, connexion refusee...),
  // reessaie avec un delai croissant. Utile car le service Railway peut
  // mettre du temps a se reveiller (cold start) - une seule tentative a 10s
  // comme avant peut echouer alors qu'une deuxieme, un peu plus tard,
  // aurait reussi.
  private async connectUneFois(host: string, delaiConnexion: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const TcpSocketModule = require('react-native-tcp-socket');
        const TcpSocket = TcpSocketModule.default ?? TcpSocketModule;

        const sock = TcpSocket.connectTLS(
          {
            host,
            port: PORT,
            ca: require('../certs/server-cert.pem'),
            connectTimeout: delaiConnexion,
          },
          () => {
            this.socket = sock;
            this.connected = true;
            console.log('[TermChatSocket] ✅ CONNECTÉ AU SERVEUR');

            sock.on('data', (data: string | Buffer) => {
              const raw = data.toString('utf8');
              console.log('[TermChatSocket] 📥 DATA:', JSON.stringify(raw));
              this.buffer += raw;
              this.processBuffer();
            });

            sock.on('close', (hadError?: any) => {
              console.warn('[TermChatSocket] 🔴 CONNEXION FERMÉE, hadError:', hadError);
              this.connected = false;
              this.disconnectListeners.forEach((cb) => cb());
            });

            resolve();
          }
        );

        sock.setKeepAlive?.(true, 5000);

        sock.on('error', (err: any) => {
          console.error('[TermChatSocket] ❌ ERREUR TLS/RÉSEAU:', err?.message ?? err);
          this.connected = false;
          this.lastError = err;
          reject(err instanceof Error ? err : new Error(String(err?.message ?? err)));
        });
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  async connect(onConnect: StatusCallback, onError: ErrorCallback) {
    if (this.socket) {
      this.disconnect();
    }

    try {
      const host = await resolveHost(HOSTNAME);

      // 3 tentatives: 10s, 15s, 20s. Couvre un reveil lent du service
      // Railway sans faire attendre indefiniment en cas de vraie panne.
      const delais = [10000, 15000, 20000];
      let derniereErreur: any = null;

      for (let i = 0; i < delais.length; i++) {
        console.log(`[TermChatSocket] 🔌 Connexion à ${host}:${PORT} (tentative ${i + 1}/${delais.length}, timeout ${delais[i]}ms)`);
        try {
          await this.connectUneFois(host, delais[i]);
          onConnect();
          return;
        } catch (e) {
          derniereErreur = e;
          this.disconnect();
        }
      }

      console.error('[TermChatSocket] ❌ Toutes les tentatives de connexion ont echoue');
      this.lastError = derniereErreur;
      onError(erreurConviviale(derniereErreur));
    } catch (e) {
      console.error('[TermChatSocket] ❌ Exception pendant connect():', e);
      this.lastError = e;
      onError(erreurConviviale(e));
    }
  }

  ensureConnected(): Promise<void> {
    if (this.connected) return Promise.resolve();
    if (this.connectingPromise) return this.connectingPromise;

    this.connectingPromise = new Promise((resolve, reject) => {
      this.connect(
        () => {
          this.connectingPromise = null;
          resolve();
        },
        (err) => {
          this.connectingPromise = null;
          reject(err instanceof Error ? err : new Error(String(err?.message ?? err)));
        }
      );
    });
    return this.connectingPromise;
  }

  // Force une reconnexion propre (ferme le socket existant, meme s'il se
  // croit connecte, puis retente une connexion fraiche). Utilise au retour
  // au premier plan de l'app, car un socket peut etre mort cote reseau sans
  // que l'evenement 'close' se soit declenche (device mis en veille).
  async reconnecter(): Promise<boolean> {
    this.reconnectStateListeners.forEach((cb) => cb('reconnecting'));
    this.disconnect();
    try {
      await this.ensureConnected();
      this.reconnectStateListeners.forEach((cb) => cb('connected'));
      return true;
    } catch (e) {
      console.warn('[TermChatSocket] ⚠️ Reconnexion echouee:', e);
      this.reconnectStateListeners.forEach((cb) => cb('failed'));
      return false;
    }
  }

  private processBuffer() {
    let idx;
    while ((idx = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, idx).trim();
      this.buffer = this.buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const parsed = JSON.parse(line);
        console.log('[TermChatSocket] 📩 Réponse reçue:', parsed);
        this.messageListeners.forEach((cb) => cb(parsed));
      } catch (e) {
        console.warn('[TermChatSocket] ⚠️ JSON invalide reçu:', line);
      }
    }
  }

  send(packet: Record<string, any>) {
    if (!this.connected || !this.socket) {
      console.warn('Envoi impossible: socket non connecté');
      return false;
    }
    console.log('[TermChatSocket] 📤 ENVOI:', packet.action);
    this.socket.write(JSON.stringify(packet) + '\n');
    return true;
  }

  onMessage(cb: MessageCallback) {
    this.messageListeners.push(cb);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== cb);
    };
  }

  onDisconnect(cb: StatusCallback) {
    this.disconnectListeners.push(cb);
    return () => {
      this.disconnectListeners = this.disconnectListeners.filter((l) => l !== cb);
    };
  }

  onReconnectState(cb: ReconnectStateCallback) {
    this.reconnectStateListeners.push(cb);
    return () => {
      this.reconnectStateListeners = this.reconnectStateListeners.filter((l) => l !== cb);
    };
  }

  disconnect() {
    this.socket?.destroy();
    this.socket = null;
    this.connected = false;
    this.buffer = '';
  }

  isConnected() {
    return this.connected;
  }
}

const termchatSocketInstance = new TermChatSocket();

let dansLeFond = false;
let reconnexionAutoSuspendue = false;

// A appeler quand une action sensible cote serveur depend de CETTE connexion
// precise (ex: attente du code 2FA juste apres connecter_numero) - la
// reconnexion automatique au retour au premier plan romprait cet etat.
export function suspendreReconnexionAuto() {
  reconnexionAutoSuspendue = true;
}
export function reprendreReconnexionAuto() {
  reconnexionAutoSuspendue = false;
}

AppState.addEventListener('change', (state) => {
  console.log('[TermChatSocket] AppState change:', state);
  if (state === 'active' && dansLeFond) {
    dansLeFond = false;
    if (reconnexionAutoSuspendue) {
      console.log('[TermChatSocket] Reconnexion auto suspendue (ex: attente 2FA), on ne force pas.');
      return;
    }
    // L'app revient au premier plan apres avoir ete en veille: le socket
    // peut etre mort sans que l'app le sache encore, on force une
    // reconnexion propre plutot que d'attendre un timeout sur la prochaine
    // requete.
    termchatSocketInstance.reconnecter();
  } else if (state === 'background' || state === 'inactive') {
    dansLeFond = true;
  }
});

export default termchatSocketInstance;
