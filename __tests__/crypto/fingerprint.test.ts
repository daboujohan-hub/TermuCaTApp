import { calculerEmpreinteVerification } from '../../src/crypto/fingerprint';

const PUB_A = 'vMa0YxzAG0sKvdd5ut6oluRlxE47of8DcRKBncC6VAc=';
const PUB_B = 'qushdA0rsYLvcVLGvXbBPWpZDk2Pe3jz3T9qM18xgEs=';
const EXPECTED = 'F6423 F66F3 0CDFE 3786E C45EF 952FF';

describe('Interopérabilité empreinte anti-MITM avec le serveur Python', () => {
  it('calcule exactement la même empreinte que server.py', () => {
    expect(calculerEmpreinteVerification(PUB_A, PUB_B)).toBe(EXPECTED);
  });

  it("l'ordre des arguments n'affecte pas le résultat (tri interne)", () => {
    expect(calculerEmpreinteVerification(PUB_B, PUB_A)).toBe(EXPECTED);
  });
});
