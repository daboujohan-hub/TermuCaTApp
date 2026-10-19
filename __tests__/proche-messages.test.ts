jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-quick-crypto', () => require('crypto'));
jest.mock('@/crypto/fernet', () => ({
  fernetEncrypt: (t: string, k: string) => Buffer.from(JSON.stringify({ k, t })).toString('base64'),
  fernetDecrypt: (token: string, k: string) => {
    const o = JSON.parse(Buffer.from(token, 'base64').toString());
    if (o.k !== k) throw new Error('mauvaise clé');
    return o.t;
  },
}));

import nacl from 'tweetnacl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ajouterContactVerifie } from '../src/proche/carnet';
import { bloquer, reinitialiserLimiteur } from '../src/proche/regles';
import { creerEnveloppe, ouvrirEnveloppe } from '../src/proche/messages';

const T = 1_800_000_000_000;
const ID_A = 'TC013613086452';
const ID_B = 'TC013613086999';
const b64u = (u: Uint8Array) =>
  Buffer.from(u).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const A = nacl.box.keyPair();
const B = nacl.box.keyPair();

async function verifierLesDeux() {
  await ajouterContactVerifie({ id: ID_B, clePublique: b64u(B.publicKey), creeLe: T }, b64u(A.publicKey));
  await ajouterContactVerifie({ id: ID_A, clePublique: b64u(A.publicKey), creeLe: T }, b64u(B.publicKey));
}
const ecrireDeA = (texte: string) =>
  creerEnveloppe({ texte, monId: ID_A, idContact: ID_B, maCleSecrete: A.secretKey }, T);
const ouvrirParB = (e: unknown, maintenant: number = T + 1000) =>
  ouvrirEnveloppe(e, { monId: ID_B, maCleSecrete: B.secretKey }, maintenant);

beforeEach(async () => { await AsyncStorage.clear(); reinitialiserLimiteur(); });

describe('messages du mode proche', () => {
  it("refuse d'écrire à un contact non vérifié", async () => {
    expect((await ecrireDeA('salut')).ok).toBe(false);
  });
  it('envoie puis reçoit un message', async () => {
    await verifierLesDeux();
    const r = await ecrireDeA('bonjour');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const lu = await ouvrirParB(r.enveloppe);
    expect(lu.ok).toBe(true);
    if (lu.ok) { expect(lu.texte).toBe('bonjour'); expect(lu.de).toBe(ID_A); }
  });
  it('ignore un message rejoué', async () => {
    await verifierLesDeux();
    const r = await ecrireDeA('une seule fois');
    if (!r.ok) throw new Error('envoi refusé');
    expect((await ouvrirParB(r.enveloppe)).ok).toBe(true);
    const deux = await ouvrirParB(r.enveloppe);
    expect(deux.ok).toBe(false);
    if (!deux.ok) expect(deux.raison).toContain('déjà');
  });
  it('refuse un message modifié en route', async () => {
    await verifierLesDeux();
    const r = await ecrireDeA('original');
    if (!r.ok) throw new Error('envoi refusé');
    const triche = { ...r.enveloppe, t: r.enveloppe.t + 1 };
    const lu = await ouvrirParB(triche);
    expect(lu.ok).toBe(false);
    if (!lu.ok) expect(lu.raison).toContain('altéré');
  });
  it("refuse un message qui n'est pas pour nous", async () => {
    await verifierLesDeux();
    const r = await ecrireDeA('pour B');
    if (!r.ok) throw new Error('envoi refusé');
    const lu = await ouvrirEnveloppe(r.enveloppe, { monId: ID_A, maCleSecrete: A.secretKey }, T + 1000);
    expect(lu.ok).toBe(false);
  });
  it('refuse un expéditeur bloqué', async () => {
    await verifierLesDeux();
    const r = await ecrireDeA('coucou');
    if (!r.ok) throw new Error('envoi refusé');
    await bloquer(ID_A);
    expect((await ouvrirParB(r.enveloppe)).ok).toBe(false);
  });
  it("refuse d'écrire à un contact qu'on a bloqué", async () => {
    await verifierLesDeux();
    await bloquer(ID_B);
    expect((await ecrireDeA('salut')).ok).toBe(false);
  });
  it('refuse un message vide ou trop long', async () => {
    await verifierLesDeux();
    expect((await ecrireDeA('   ')).ok).toBe(false);
    expect((await ecrireDeA('x'.repeat(501))).ok).toBe(false);
  });
});
