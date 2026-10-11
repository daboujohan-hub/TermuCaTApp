#!/usr/bin/env python3
"""V1 : sécurise et répare l'onglet École (EduMap).
 edumap.tsx : 1) le contenu envoyé par la page ne peut plus changer l'action serveur
              2) ouverture de Google Maps via l'app (window.open ne marchait pas dans la WebView)
              3) retire allowFileAccess (inutile)
 edumap.html : 4) Leaflet chargé avec empreinte d'intégrité (SRI) : un CDN piraté ne peut plus injecter de code
               5) bouton itinéraire -> message vers l'app
Usage, depuis ~/TermChatApp : python securiser_edumap.py
"""
import sys, shutil, time, os, re

racine = sys.argv[1] if len(sys.argv) > 1 else "."
F_TSX = os.path.join(racine, "src/app/(tabs)/edumap.tsx")
F_HTML = os.path.join(racine, "src/assets/edumap.html")

def motif(a):
    return re.compile(r"\s+".join(re.escape(t) for t in a.split()))

OPEN_MAPS = """} else if (msg.type === 'open_maps') {
      const lat = Number(msg.lat);
      const lng = Number(msg.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
      }
    } else if (msg.type === 'edumap_pick_photos') {"""

plan = {
    F_TSX: [
        ("import { ActivityIndicator, StyleSheet, View } from 'react-native';",
         "import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';"),
        ("{ action: 'edumap_ajouter_ecole', ...msg.payload }",
         "{ ...msg.payload, action: 'edumap_ajouter_ecole' }"),
        ("} else if (msg.type === 'edumap_pick_photos') {", OPEN_MAPS),
        ("allowFileAccess", ""),
    ],
    F_HTML: [
        ('href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"',
         'href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""'),
        ('src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"',
         'src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""'),
        ("window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,'_blank')",
         "envoyerAuNatif({ type: 'open_maps', lat: lat, lng: lng })"),
    ],
}

contenus = {}
for f, lst in plan.items():
    if not os.path.exists(f):
        sys.exit(f"STOP : fichier introuvable : {f}. Rien modifié.")
    s = open(f, encoding="utf-8").read()
    if "open_maps" in s or "integrity=" in s:
        sys.exit(f"STOP : {f} déjà modifié. Rien modifié.")
    for a, _ in lst:
        n = len(motif(a).findall(s))
        if n != 1:
            sys.exit(f"STOP : {f} : motif trouvé {n} fois (1 attendu) : {a[:60]!r}. Rien modifié.")
    contenus[f] = s

ts = time.strftime("%Y%m%d_%H%M%S")
for f, lst in plan.items():
    shutil.copy2(f, f"{f}.backup_securite_{ts}")
    s = contenus[f]
    for a, n in lst:
        s = motif(a).sub(lambda m, n=n: n, s, count=1)
    open(f, "w", encoding="utf-8").write(s)
    print(f"OK : {f} ({len(lst)} modif.)")
print(f"Sauvegardes : *.backup_securite_{ts}")
print("Vérifie maintenant : npx tsc --noEmit")

