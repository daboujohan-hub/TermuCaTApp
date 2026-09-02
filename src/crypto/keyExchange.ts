import nacl from 'tweetnacl';
import crypto from 'react-native-quick-crypto';

function toBase64Url(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return new Uint8Array(Buffer.from(padded, 'base64'));
}

// HKDF-SHA256 manuel (RFC 5869) — extract puis expand
function hkdfSha256(ikm: Uint8Array, salt: Buffer, info: Buffer, length: number): Buffer {
  const prk = crypto.createHmac('sha256', salt).update(Buffer.from(ikm)).digest();

  let t = Buffer.alloc(0);
  let okm = Buffer.alloc(0);
  let counter = 1;

  while (okm.length < length) {
    const hmac = crypto.createHmac('sha256', prk);
    hmac.update(Buffer.concat([t, info, Buffer.from([counter])]));
    t = hmac.digest();
    okm = Buffer.concat([okm, t]);
    counter++;
  }

  return okm.subarray(0, length);
}

/**
 * Dérive la clé Fernet partagée avec un contact via ECDH X25519 + HKDF.
 * Équivalent exact de deriver_cle_partagee() côté server.py.
 */
export function deriveSharedKey(
  mySecretKey: Uint8Array,
  peerPublicKeyB64: string,
  n1: string,
  n2: string
): string {
  const peerPublicKey = fromBase64Url(peerPublicKeyB64);
  const secret = nacl.scalarMult(mySecretKey, peerPublicKey); // ECDH brut, 32 octets

  const salt = Buffer.from([n1, n2].sort().join(''), 'utf8');
  const info = Buffer.from('termchat-e2e-v2', 'utf8');

  const derived = hkdfSha256(secret, salt, info, 32);
  return toBase64Url(derived);
}
