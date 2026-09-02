import crypto from 'react-native-quick-crypto';

/**
 * Calcule une empreinte de vérification anti-MITM à partir de deux clés publiques X25519 (base64url).
 * Équivalent exact de calculer_empreinte_verification() côté server.py.
 * L'ordre des arguments n'a pas d'importance : le résultat est toujours identique pour une paire donnée.
 */
export function calculerEmpreinteVerification(maClePubB64: string, clePubPairB64: string): string {
  const cles = [maClePubB64 || '', clePubPairB64 || ''].sort();
  const combinaison = cles[0] + cles[1];

  const hash = crypto.createHash('sha256').update(Buffer.from(combinaison, 'utf8')).digest('hex');

  const groupes: string[] = [];
  for (let i = 0; i < 30; i += 5) {
    groupes.push(hash.slice(i, i + 5));
  }

  return groupes.join(' ').toUpperCase();
}
