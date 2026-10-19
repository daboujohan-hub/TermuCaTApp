jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  enveloppeValide, estBloque, bloquer, debloquer, dejaVu, marquerVu,
  autoriserDebit, reinitialiserLimiteur, ajouterSortie, lireSorties, retirerSorties, type Enveloppe,
} from '../src/proche/regles';

const T = 1_800_000_000_000;
const env = (o: Partial<Enveloppe> = {}): Enveloppe => ({
  v: 1, id: 'a'.repeat(32), de: 'TC013613086452', vers: 'TC013613086999', t: T, c: 'x'.repeat(40), ...o,
});

beforeEach(async () => { await AsyncStorage.clear(); reinitialiserLimiteur(); });

describe('validation des enveloppes', () => {
  it('accepte une enveloppe correcte', () => expect(enveloppeValide(env(), T)).toBe(true));
  it('refuse un mauvais identifiant de message', () => expect(enveloppeValide(env({ id: 'zz' }), T)).toBe(false));
  it('refuse expéditeur = destinataire', () => expect(enveloppeValide(env({ vers: 'TC013613086452' }), T)).toBe(false));
  it('refuse trop vieux et futur', () => {
    expect(enveloppeValide(env({ t: T - 31 * 24 * 3600 * 1000 }), T)).toBe(false);
    expect(enveloppeValide(env({ t: T + 3_600_000 }), T)).toBe(false);
  });
  it('refuse un champ en trop ou un jeton invalide', () => {
    expect(enveloppeValide({ ...env(), extra: 1 }, T)).toBe(false);
    expect(enveloppeValide(env({ c: '<script>' }), T)).toBe(false);
  });
});

describe('blocage local', () => {
  it('bloque puis débloque', async () => {
    expect(await estBloque('TC013613086452')).toBe(false);
    await bloquer('TC013613086452');
    expect(await estBloque('TC013613086452')).toBe(true);
    await debloquer('TC013613086452');
    expect(await estBloque('TC013613086452')).toBe(false);
  });
});

describe('anti-rejeu', () => {
  it('reconnaît un message déjà vu', async () => {
    expect(await dejaVu('a'.repeat(32))).toBe(false);
    await marquerVu('a'.repeat(32), T, T);
    expect(await dejaVu('a'.repeat(32))).toBe(true);
  });
});

describe('limite de débit', () => {
  it('refuse au-delà du maximum puis reautorise après la fenêtre', () => {
    expect(autoriserDebit('x', 3, 1000, T)).toBe(true);
    expect(autoriserDebit('x', 3, 1000, T + 1)).toBe(true);
    expect(autoriserDebit('x', 3, 1000, T + 2)).toBe(true);
    expect(autoriserDebit('x', 3, 1000, T + 3)).toBe(false);
    expect(autoriserDebit('x', 3, 1000, T + 2000)).toBe(true);
  });
});

describe('file de sortie', () => {
  it('ajoute sans doublon puis retire', async () => {
    await ajouterSortie(env());
    await ajouterSortie(env());
    expect((await lireSorties(T)).length).toBe(1);
    await retirerSorties(['a'.repeat(32)]);
    expect((await lireSorties(T)).length).toBe(0);
  });
});
