import { fernetDecrypt, fernetEncrypt } from '../../src/crypto/fernet';

const TEST_KEY = 'fhqjpskDcwkVW5rXmkDdo0sfXcchMw64z39jgqjyXYM=';
const TEST_TOKEN = 'gAAAAABqlnLZobR3YwHULWJw-WMxKREh32KvZ22KjY1kt_3kIvTbOtBlU8j5lqkSVlhQpfZIR6XyctVDF0GmgY4C4mvakWrl4Q==';

describe('Interopérabilité Fernet avec le serveur Python', () => {
  it('déchiffre un token généré par cryptography.fernet (Python)', () => {
    const plaintext = fernetDecrypt(TEST_TOKEN, TEST_KEY);
    expect(plaintext).toBe('test message');
  });

  it('chiffre puis déchiffre un message (aller-retour côté JS)', () => {
    const original = 'Bonjour depuis TermChat mobile 🔐';
    const token = fernetEncrypt(original, TEST_KEY);
    const decrypted = fernetDecrypt(token, TEST_KEY);
    expect(decrypted).toBe(original);
  });

  it('rejette un token altéré (HMAC invalide)', () => {
    const tampered = TEST_TOKEN.slice(0, -5) + 'XXXXX';
    expect(() => fernetDecrypt(tampered, TEST_KEY)).toThrow();
  });
});
