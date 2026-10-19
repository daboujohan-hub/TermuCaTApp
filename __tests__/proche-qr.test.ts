import { creerContenuQr, lireContenuQr, VALIDITE_QR_MS } from '../src/proche/qr';

const ID = 'TC013613086452';
const CLE = 'A'.repeat(43) + '=';
const T = 1_800_000_000_000;

describe('QR code de jumelage', () => {
  it('relit ce qu\'il a créé', () => {
    const r = lireContenuQr(creerContenuQr(ID, CLE, T), T + 1000);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.donnees).toEqual({ id: ID, clePublique: CLE, creeLe: T });
  });
  it('refuse un QR expiré', () => {
    expect(lireContenuQr(creerContenuQr(ID, CLE, T), T + VALIDITE_QR_MS + 1).ok).toBe(false);
  });
  it('refuse un QR daté du futur', () => {
    expect(lireContenuQr(creerContenuQr(ID, CLE, T + 3_600_000), T).ok).toBe(false);
  });
  it('refuse un mauvais préfixe, un mauvais identifiant et une mauvaise clé', () => {
    expect(lireContenuQr('autre|1|' + ID + '|' + CLE + '|' + T, T).ok).toBe(false);
    expect(lireContenuQr('termchat-pair|1|XX1|' + CLE + '|' + T, T).ok).toBe(false);
    expect(lireContenuQr('termchat-pair|1|' + ID + '|' + 'A'.repeat(42) + '|' + T, T).ok).toBe(false);
  });
  it('refuse un contenu trop long ou qui n\'est pas du texte', () => {
    expect(lireContenuQr('x'.repeat(500), T).ok).toBe(false);
    expect(lireContenuQr(42 as unknown, T).ok).toBe(false);
  });
});
