import nacl from 'tweetnacl';
import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE = 'termchat_identity';

export interface Identity {
  publicKey: string;   // base64url, 32 octets bruts
  secretKey: Uint8Array; // 32 octets bruts
}

function toBase64Url(buf: Uint8Array): string {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return new Uint8Array(Buffer.from(padded, 'base64'));
}

export async function loadOrCreateIdentity(): Promise<Identity> {
  const existing = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });

  if (existing) {
    const secretKey = fromBase64Url(existing.password);
    const publicKey = nacl.scalarMult.base(secretKey);
    return { publicKey: toBase64Url(publicKey), secretKey };
  }

  const keyPair = nacl.box.keyPair(); // génère une paire X25519 (secretKey/publicKey bruts, 32 octets)
  await Keychain.setGenericPassword('identity', toBase64Url(keyPair.secretKey), {
    service: KEYCHAIN_SERVICE,
  });

  return {
    publicKey: toBase64Url(keyPair.publicKey),
    secretKey: keyPair.secretKey,
  };
}

export async function deleteIdentity(): Promise<void> {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
}
