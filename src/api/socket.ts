import TcpSocket from 'react-native-tcp-socket';

const HOST = 'altaria.proxy.rlwy.net';
const PORT = 20022;

type MessageCallback = (data: any) => void;
type StatusCallback = () => void;
type ErrorCallback = (err: any) => void;

class TermChatSocket {
  private socket: any = null;
  private buffer: string = '';
  private messageListeners: MessageCallback[] = [];
  private disconnectListeners: StatusCallback[] = [];
  private connected: boolean = false;

  connect(onConnect: StatusCallback, onError: ErrorCallback) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = TcpSocket.createConnection(
      {
        host: HOST,
        port: PORT,
        tls: true,
        tlsCert: require('../certs/server-cert.pem'), // certificat auto-signé du serveur (temporaire, sera remplacé par le pinning TOFU)
      },
      () => {
        this.connected = true;
        onConnect();
      }
    );

    this.socket.on('data', (data: string | Buffer) => {
      this.buffer += data.toString('utf8');
      this.processBuffer();
    });

    this.socket.on('error', (err: any) => {
      this.connected = false;
      onError(err);
    });

    this.socket.on('close', () => {
      this.connected = false;
      this.disconnectListeners.forEach((cb) => cb());
    });
  }

  private processBuffer() {
    let idx;
    while ((idx = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, idx).trim();
      this.buffer = this.buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const parsed = JSON.parse(line);
        this.messageListeners.forEach((cb) => cb(parsed));
      } catch (e) {
        console.warn('JSON invalide reçu du serveur:', line);
      }
    }
  }

  send(packet: Record<string, any>) {
    if (!this.connected || !this.socket) {
      console.warn('Envoi impossible: socket non connecté');
      return false;
    }
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

export default new TermChatSocket();
