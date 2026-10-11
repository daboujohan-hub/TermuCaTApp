#!/usr/bin/env python3
"""App : (1) la proposition d'école exige 4 photos ; (2) l'auteur voit une alerte quand sa proposition
est approuvée ou rejetée (écoute globale dans la barre d'onglets).
Modifie : src/assets/edumap.html, src/app/(tabs)/_layout.tsx   (tout ou rien)
Pour changer le nombre de photos : valeur de MIN_PHOTOS dans edumap.html.
Usage, depuis ~/TermChatApp : python ecole_4photos_notifications_app.py
"""
import sys, shutil, time, os, re

racine = sys.argv[1] if len(sys.argv) > 1 else "."
F_HTML = os.path.join(racine, "src/assets/edumap.html")
F_LAY = os.path.join(racine, "src/app/(tabs)/_layout.tsx")

def motif(a):
    return re.compile(r"\s+".join(re.escape(t) for t in a.split()))

EFFET = """export default function TabsLayout() {
  useEffect(() => {
    const unsub = termchatSocket.onMessage((data: any) => {
      if (!data || 'ok' in data) return;
      const nom = data.nom ? `« ${data.nom} »` : "de l'école";
      if (data.type === 'edumap_approuvee') {
        Alert.alert('École publiée', `Ta proposition ${nom} a été validée et publiée sur la carte.`);
      } else if (data.type === 'edumap_rejetee') {
        Alert.alert('Proposition non retenue', `Ta proposition ${nom} n'a pas été retenue.${data.raison ? '\\n\\nMotif : ' + data.raison : ''}`);
      }
    });
    return unsub;
  }, []);
"""

plan = {
    F_HTML: [
        ("var MAX_PHOTOS = 4;", "var MAX_PHOTOS = 4;\n  var MIN_PHOTOS = 4;"),
        (r"""if (photos.length < 1) { message('Ajoute au moins une photo de l\'école.', true); return; }""",
         r"""if (photos.length < MIN_PHOTOS) { message('Ajoute ' + MIN_PHOTOS + ' photos de l\'école (' + photos.length + '/' + MIN_PHOTOS + ').', true); return; }"""),
    ],
    F_LAY: [
        ("import { Ionicons } from '@expo/vector-icons';",
         "import { Ionicons } from '@expo/vector-icons';\nimport { useEffect } from 'react';\nimport { Alert } from 'react-native';\nimport termchatSocket from '@/api/socket';"),
        ("export default function TabsLayout() {", EFFET),
    ],
}

contenus = {}
for f, lst in plan.items():
    if not os.path.exists(f):
        sys.exit(f"STOP : fichier introuvable : {f}. Rien modifié.")
    s = open(f, encoding="utf-8").read()
    if "MIN_PHOTOS" in s or "edumap_approuvee" in s:
        sys.exit(f"STOP : {f} déjà modifié. Rien modifié.")
    for a, _ in lst:
        n = len(motif(a).findall(s))
        if n != 1:
            sys.exit(f"STOP : {f} : motif trouvé {n} fois (1 attendu) : {a[:50]!r}. Rien modifié.")
    contenus[f] = s

ts = time.strftime("%Y%m%d_%H%M%S")
for f, lst in plan.items():
    shutil.copy2(f, f"{f}.backup_4photos_{ts}")
    s = contenus[f]
    for a, n in lst:
        s = motif(a).sub(lambda m, n=n: n, s, count=1)
    open(f, "w", encoding="utf-8").write(s)
    print(f"OK : {f}")
print(f"Sauvegardes : *.backup_4photos_{ts}")
print("Vérifie maintenant : npx tsc --noEmit")

