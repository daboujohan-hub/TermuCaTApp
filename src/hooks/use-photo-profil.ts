import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { sendRequest } from '@/api/request';

// Photos de profil des contacts : téléchargées à la demande, gardées dans le cache du téléphone.
const TTL_OK = 24 * 60 * 60 * 1000;      // photo récupérée : on la garde 24 h
const TTL_VIDE = 6 * 60 * 60 * 1000;     // la personne n'a pas de photo : on revérifie dans 6 h
const TTL_ERREUR = 5 * 60 * 1000;        // erreur réseau ou serveur pas à jour : on réessaie dans 5 min

type Meta = { t: number; etat: 'ok' | 'vide' | 'erreur'; f?: string };

const dossier = () => `${FileSystem.cacheDirectory ?? ''}photos-profil/`;
const cleMeta = (numero: string) => `photoprofil:${numero}`;
const nomSur = (numero: string) => numero.replace(/[^A-Za-z0-9_-]/g, '_');

const memoire = new Map<string, string | null>();
const ecouteurs = new Map<string, Set<(uri: string | null) => void>>();
const file: string[] = [];
const enFile = new Set<string>();
let enCours = false;

function notifier(numero: string, uri: string | null) {
  memoire.set(numero, uri);
  ecouteurs.get(numero)?.forEach((f) => f(uri));
}

async function ecrireMeta(numero: string, meta: Meta) {
  try { await AsyncStorage.setItem(cleMeta(numero), JSON.stringify(meta)); } catch {}
}

async function lireCache(numero: string): Promise<{ uri: string | null; frais: boolean }> {
  try {
    const brut = await AsyncStorage.getItem(cleMeta(numero));
    if (!brut) return { uri: null, frais: false };
    const meta: Meta = JSON.parse(brut);
    const age = Date.now() - meta.t;
    if (meta.etat === 'ok' && meta.f) {
      const chemin = dossier() + meta.f;
      const info = await FileSystem.getInfoAsync(chemin);
      if (!info.exists) return { uri: null, frais: false };
      return { uri: chemin, frais: age < TTL_OK };
    }
    return { uri: null, frais: age < (meta.etat === 'vide' ? TTL_VIDE : TTL_ERREUR) };
  } catch {
    return { uri: null, frais: false };
  }
}

export async function enregistrerPhotoEnCache(numero: string, base64: string | null) {
  try {
    const ancien = await AsyncStorage.getItem(cleMeta(numero));
    if (base64 && /^[A-Za-z0-9+/=]+$/.test(base64)) {
      await FileSystem.makeDirectoryAsync(dossier(), { intermediates: true }).catch(() => {});
      const nom = `${nomSur(numero)}_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(dossier() + nom, base64, { encoding: FileSystem.EncodingType.Base64 });
      await ecrireMeta(numero, { t: Date.now(), etat: 'ok', f: nom });
      try {
        const m: Meta | null = ancien ? JSON.parse(ancien) : null;
        if (m?.f && m.f !== nom) await FileSystem.deleteAsync(dossier() + m.f, { idempotent: true });
      } catch {}
      notifier(numero, dossier() + nom);
    } else {
      await ecrireMeta(numero, { t: Date.now(), etat: 'vide' });
      notifier(numero, null);
    }
  } catch {}
}

async function chargerDepuisServeur(numero: string) {
  try {
    const r: any = await sendRequest<{ action: string; numero: string }, any>({ action: 'profil_contact', numero });
    if (r?.ok && r.profil) await enregistrerPhotoEnCache(numero, r.profil.photo_base64 ?? null);
    else await ecrireMeta(numero, { t: Date.now(), etat: 'erreur' });
  } catch {
    await ecrireMeta(numero, { t: Date.now(), etat: 'erreur' });
  }
}

async function traiterFile() {
  if (enCours) return;
  enCours = true;
  while (file.length) {
    const numero = file[0];
    await chargerDepuisServeur(numero);
    file.shift();
    enFile.delete(numero); // reste « en file » pendant le téléchargement : pas de doublon
    await new Promise((resolve) => setTimeout(resolve, 150)); // laisse passer les autres requêtes (messages…)
  }
  enCours = false;
}

function demander(numero: string) {
  if (enFile.has(numero)) return;
  enFile.add(numero);
  file.push(numero);
  traiterFile();
}

export function usePhotoProfil(numero?: string): string | null {
  const [uri, setUri] = useState<string | null>(numero ? memoire.get(numero) ?? null : null);

  useEffect(() => {
    if (!numero) return;
    let actif = true;
    const abonne = (u: string | null) => { if (actif) setUri(u); };
    let groupe = ecouteurs.get(numero);
    if (!groupe) { groupe = new Set(); ecouteurs.set(numero, groupe); }
    groupe.add(abonne);
    (async () => {
      const { uri: u, frais } = await lireCache(numero);
      if (!actif) return;
      if (u) { memoire.set(numero, u); setUri(u); }
      if (!frais) demander(numero);
    })();
    return () => { actif = false; groupe!.delete(abonne); };
  }, [numero]);

  return uri;
}

export const __interne = { demander, lireCache };
