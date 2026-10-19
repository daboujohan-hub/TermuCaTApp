export function erreurConviviale(e: any): Error {
  const brut = String(e?.message ?? e ?? '');
  if (/Broken pipe|EPIPE|ECONNRESET|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|Network request failed|timeout|timed out|TLS|SSL|certificate|getaddrinfo/i.test(brut)) {
    return new Error('Connexion impossible. Vérifie ta connexion internet et réessaie.');
  }
  const propre = brut
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b/g, '')
    .replace(/\b[\w-]+(?:\.[\w-]+)*\.(?:app|com|net|io|dev|org)(?::\d+)?\b/gi, '')
    .trim();
  return new Error(propre || 'Une erreur est survenue. Réessaie.');
}
