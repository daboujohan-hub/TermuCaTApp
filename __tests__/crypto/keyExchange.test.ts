import { deriveSharedKey } from '../../src/crypto/keyExchange';

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return new Uint8Array(Buffer.from(padded, 'base64'));
}

const PRIV_A = fromBase64Url('UJDuRQLrzwcUK6TEEPnZmiH74ysOLy8erPKcFRNNIlE=');
const PUB_A = 'vMa0YxzAG0sKvdd5ut6oluRlxE47of8DcRKBncC6VAc=';
const PRIV_B = fromBase64Url('YJ0InWH8Ni5veBdm-pZ8n3ys3vjcV4vrTfLLYf9W5mo=');
const PUB_B = 'qushdA0rsYLvcVLGvXbBPWpZDk2Pe3jz3T9qM18xgEs=';
const N1 = '+2250700000001';
const N2 = '+2250700000002';
const EXPECTED_SHARED_KEY = 'dM3o-cZQk7lTjhnYYB_ftFMcO4odRAHWYdMT97ptXwY=';

describe('Interopérabilité échange de clés X25519 + HKDF avec le serveur Python', () => {
  it('dérive exactement la même clé partagée que server.py (côté A)', () => {
    const sharedKey = deriveSharedKey(PRIV_A, PUB_B, N1, N2);
    expect(sharedKey).toBe(EXPECTED_SHARED_KEY);
  });

  it('dérive la même clé côté B (réciprocité de l\'ECDH)', () => {
    const sharedKey = deriveSharedKey(PRIV_B, PUB_A, N1, N2);
    expect(sharedKey).toBe(EXPECTED_SHARED_KEY);
  });

  it('le sel est indépendant de l\'ordre des numéros passés', () => {
    const key1 = deriveSharedKey(PRIV_A, PUB_B, N1, N2);
    const key2 = deriveSharedKey(PRIV_A, PUB_B, N2, N1);
    expect(key1).toBe(key2);
  });
});
