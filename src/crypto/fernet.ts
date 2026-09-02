import crypto from 'react-native-quick-crypto';

// Un token Fernet Python encode la clé complète (32 octets) en base64url.
// On la sépare en clé de signature (16 premiers octets) et clé de chiffrement (16 derniers).
function splitKey(base64Key: string): { signingKey: Buffer; encryptionKey: Buffer } {
  const raw = Buffer.from(base64Key.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  if (raw.length !== 32) {
    throw new Error('Clé Fernet invalide: doit faire 32 octets décodés');
  }
  return {
    signingKey: raw.subarray(0, 16),
    encryptionKey: raw.subarray(16, 32),
  };
}

function toBase64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Buffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

export function fernetEncrypt(plaintext: string, base64Key: string): string {
  const { signingKey, encryptionKey } = splitKey(base64Key);

  const version = Buffer.from([0x80]);
  const timestamp = Buffer.alloc(8);
  timestamp.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 1000)));
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-128-cbc', encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);

  const payload = Buffer.concat([version, timestamp, iv, ciphertext]);
  const hmac = crypto.createHmac('sha256', signingKey).update(payload).digest();

  return toBase64Url(Buffer.concat([payload, hmac]));
}

export function fernetDecrypt(token: string, base64Key: string): string {
  const { signingKey, encryptionKey } = splitKey(base64Key);
  const data = fromBase64Url(token);

  if (data.length < 57) throw new Error('Token Fernet trop court');

  const payload = data.subarray(0, data.length - 32);
  const receivedHmac = data.subarray(data.length - 32);

  const expectedHmac = crypto.createHmac('sha256', signingKey).update(payload).digest();
  if (!crypto.timingSafeEqual(receivedHmac, expectedHmac)) {
    throw new Error('HMAC invalide: le token a peut-être été altéré');
  }

  const iv = payload.subarray(9, 25);
  const ciphertext = payload.subarray(25);

  const decipher = crypto.createDecipheriv('aes-128-cbc', encryptionKey, iv);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return plaintext.toString('utf8');
}
