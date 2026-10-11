#!/usr/bin/env python3
"""V1 : permet à chaque utilisateur de PROPOSER une école (nom exact, quartier, GPS, jusqu'à 4 photos).
La proposition part en attente de validation (action serveur existante : edumap_proposer_ecole).
Modifie : src/assets/edumap.html (bouton + formulaire), src/app/(tabs)/edumap.tsx (relais vers le serveur)
Prérequis : securiser_edumap.py déjà appliqué. Tout ou rien.
Usage, depuis ~/TermChatApp : python proposer_ecole.py
"""
import sys, shutil, time, os, re

racine = sys.argv[1] if len(sys.argv) > 1 else "."
F_TSX = os.path.join(racine, "src/app/(tabs)/edumap.tsx")
F_HTML = os.path.join(racine, "src/assets/edumap.html")

def motif(a):
    return re.compile(r"\s+".join(re.escape(t) for t in a.split()))

BLOC_HTML = r"""
<!-- ===== Proposition d'école par les utilisateurs ===== -->
<style>
#prop-btn{position:fixed;right:14px;bottom:14px;z-index:9998;background:#208AEF;color:#fff;border:0;border-radius:24px;padding:12px 16px;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(0,0,0,.4)}
#prop-backdrop{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,.6);align-items:flex-end;justify-content:center}
#prop-backdrop.show{display:flex}
#prop-sheet{background:#141a2e;color:#fff;width:100%;max-width:520px;max-height:92%;overflow-y:auto;border-radius:20px 20px 0 0;padding:20px;box-sizing:border-box}
#prop-sheet h3{margin:0 0 6px;font-size:18px}
#prop-sheet .note{font-size:12px;color:#9aa3b8;line-height:1.5;margin:0 0 12px}
#prop-sheet input{width:100%;box-sizing:border-box;background:#0e1322;color:#fff;border:1px solid #2a3350;border-radius:12px;padding:12px;font-size:15px;margin-bottom:10px}
#prop-gps{font-size:12px;color:#9aa3b8;margin-bottom:10px}
#prop-photos{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.prop-ph{position:relative;width:64px;height:64px;border-radius:10px;overflow:hidden;background:#0e1322;border:1px dashed #2a3350;display:flex;align-items:center;justify-content:center;color:#9aa3b8;font-size:24px}
.prop-ph img{width:100%;height:100%;object-fit:cover}
.prop-ph .x{position:absolute;top:2px;right:2px;background:rgba(0,0,0,.7);color:#fff;border-radius:50%;width:18px;height:18px;font-size:12px;line-height:18px;text-align:center}
#prop-msg{display:none;font-size:13px;margin-bottom:10px}
#prop-send{width:100%;background:#208AEF;color:#fff;border:0;border-radius:12px;padding:14px;font-size:15px;font-weight:700}
#prop-send:disabled{opacity:.6}
#prop-close{text-align:center;color:#9aa3b8;font-size:13px;margin-top:14px}
</style>
<button id="prop-btn" type="button" onclick="ouvrirProposition()">＋ Proposer une école</button>
<div id="prop-backdrop">
  <div id="prop-sheet">
    <h3>🏫 Proposer une école</h3>
    <p class="note">Ta proposition sera vérifiée avant d'être publiée. Photographie uniquement le bâtiment, sans visage d'élèves ni de personnes.</p>
    <input id="prop-nom" type="text" maxlength="120" placeholder="Nom exact de l'école">
    <input id="prop-quartier" type="text" maxlength="120" placeholder="Quartier / adresse">
    <div id="prop-gps">📡 Position GPS : en attente…</div>
    <div id="prop-photos"></div>
    <div id="prop-msg"></div>
    <button id="prop-send" type="button" onclick="soumettreProposition()">Envoyer la proposition</button>
    <div id="prop-close" onclick="fermerProposition()">Annuler</div>
  </div>
</div>
<script>
(function () {
  var MAX_PHOTOS = 4;
  var pos = null, photos = [], envoi = false;
  var $ = function (id) { return document.getElementById(id); };

  function message(texte, erreur) {
    var e = $('prop-msg');
    e.textContent = texte || '';
    e.style.display = texte ? 'block' : 'none';
    e.style.color = erreur ? '#ff6a6a' : '#7ee787';
  }

  function rendrePhotos() {
    var zone = $('prop-photos');
    zone.innerHTML = '';
    photos.forEach(function (p, i) {
      var d = document.createElement('div');
      d.className = 'prop-ph';
      var img = document.createElement('img');
      img.src = 'data:image/jpeg;base64,' + p.b64;
      var x = document.createElement('div');
      x.className = 'x';
      x.textContent = '×';
      x.onclick = function () { photos.splice(i, 1); rendrePhotos(); };
      d.appendChild(img);
      d.appendChild(x);
      zone.appendChild(d);
    });
    if (photos.length < MAX_PHOTOS) {
      var plus = document.createElement('div');
      plus.className = 'prop-ph';
      plus.textContent = '+';
      plus.onclick = function () {
        window.__photosCible = 'proposition';
        envoyerAuNatif({ type: 'edumap_pick_photos', restant: MAX_PHOTOS - photos.length });
      };
      zone.appendChild(plus);
    }
  }

  function compresser(b64) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var k = Math.min(1, 1280 / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * k));
        c.height = Math.max(1, Math.round(img.height * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        var q = 0.7;
        var out = c.toDataURL('image/jpeg', q).split(',')[1];
        while (out.length * 0.75 > 500 * 1024 && q > 0.3) {
          q -= 0.1;
          out = c.toDataURL('image/jpeg', q).split(',')[1];
        }
        resolve(out);
      };
      img.onerror = function () { resolve(null); };
      img.src = 'data:image/jpeg;base64,' + b64;
    });
  }

  function tailleOctets(b64) {
    var pad = b64.slice(-2) === '==' ? 2 : (b64.slice(-1) === '=' ? 1 : 0);
    return b64.length * 3 / 4 - pad;
  }

  window.ouvrirProposition = function () {
    pos = null; photos = []; envoi = false;
    $('prop-nom').value = '';
    $('prop-quartier').value = '';
    $('prop-send').disabled = false;
    $('prop-send').textContent = 'Envoyer la proposition';
    message('');
    rendrePhotos();
    $('prop-gps').textContent = '📡 Position GPS : recherche…';
    $('prop-backdrop').classList.add('show');
    envoyerAuNatif({ type: 'geoloc_request', contexte: 'proposition' });
  };

  window.fermerProposition = function () {
    window.__photosCible = null;
    $('prop-backdrop').classList.remove('show');
  };

  window.soumettreProposition = function () {
    if (envoi) return;
    var nom = $('prop-nom').value.trim();
    var quartier = $('prop-quartier').value.trim();
    if (nom.length < 3) { message("Saisis le nom exact de l'école.", true); return; }
    if (!quartier) { message('Indique le quartier ou l\'adresse.', true); return; }
    if (!pos) { message('Position GPS indisponible : active le GPS puis rouvre ce formulaire depuis l\'école.', true); return; }
    if (photos.length < 1) { message('Ajoute au moins une photo de l\'école.', true); return; }
    envoi = true;
    $('prop-send').disabled = true;
    $('prop-send').textContent = 'Envoi…';
    message('');
    envoyerAuNatif({
      type: 'edumap_propose',
      payload: {
        nom: nom, quartier: quartier, lat: pos.lat, lng: pos.lng,
        photos: photos.map(function (p) { return p.b64; }),
        photos_tailles: photos.map(function (p) { return p.taille; })
      }
    });
  };

  window.edumapPropositionResultat = function (donnees) {
    var r = null;
    try { r = typeof donnees === 'string' ? JSON.parse(donnees) : donnees; } catch (e) {}
    envoi = false;
    $('prop-send').disabled = false;
    $('prop-send').textContent = 'Envoyer la proposition';
    if (r && r.ok) {
      message('Merci ! Ta proposition a été envoyée. Elle sera vérifiée avant publication.', false);
      $('prop-send').disabled = true;
      setTimeout(window.fermerProposition, 2800);
    } else {
      message((r && r.msg) || 'Erreur : proposition non envoyée.', true);
    }
  };

  var posOrig = window.edumapPositionResultat;
  window.edumapPositionResultat = function (contexte, lat, lng) {
    if (contexte === 'proposition') {
      pos = { lat: lat, lng: lng };
      $('prop-gps').textContent = '✅ Position GPS trouvée';
      return;
    }
    if (posOrig) return posOrig.apply(this, arguments);
  };

  var erreurOrig = window.edumapPositionErreur;
  window.edumapPositionErreur = function (contexte) {
    if (contexte === 'proposition') {
      pos = null;
      $('prop-gps').textContent = '⚠️ Position indisponible. Active le GPS et autorise la localisation.';
      return;
    }
    if (erreurOrig) return erreurOrig.apply(this, arguments);
  };

  var photosOrig = window.edumapPhotosResultat;
  window.edumapPhotosResultat = function (donnees) {
    if (window.__photosCible !== 'proposition') {
      if (photosOrig) return photosOrig.apply(this, arguments);
      return;
    }
    window.__photosCible = null;
    var liste = [];
    try { liste = typeof donnees === 'string' ? JSON.parse(donnees) : donnees; } catch (e) {}
    if (!Array.isArray(liste)) liste = [];
    var place = MAX_PHOTOS - photos.length;
    liste.slice(0, place).reduce(function (suite, b64) {
      return suite.then(function () {
        return compresser(b64).then(function (out) {
          if (out) photos.push({ b64: out, taille: tailleOctets(out) });
        });
      });
    }, Promise.resolve()).then(rendrePhotos);
  };

  rendrePhotos();
})();
</script>
"""

BRANCHE_TSX = """} else if (msg.type === 'edumap_propose') {
      try {
        const res = await sendRequest({ ...msg.payload, action: 'edumap_proposer_ecole' } as any);
        envoyerAuWebView('edumapPropositionResultat', res);
      } catch (e: any) {
        envoyerAuWebView('edumapPropositionResultat', { ok: false, msg: e?.message ?? 'Erreur reseau.' });
      }
    } else if (msg.type === 'open_maps') {"""

plan = {
    F_TSX: [("} else if (msg.type === 'open_maps') {", BRANCHE_TSX)],
    F_HTML: [("</body>", BLOC_HTML + "</body>")],
}

contenus = {}
for f, lst in plan.items():
    if not os.path.exists(f):
        sys.exit(f"STOP : fichier introuvable : {f}. Rien modifié.")
    s = open(f, encoding="utf-8").read()
    if "edumap_propose" in s or "prop-backdrop" in s:
        sys.exit(f"STOP : {f} déjà modifié. Rien modifié.")
    for a, _ in lst:
        n = len(motif(a).findall(s))
        if n != 1:
            hint = " (appliquer d'abord securiser_edumap.py)" if "open_maps" in a else ""
            sys.exit(f"STOP : {f} : motif trouvé {n} fois (1 attendu) : {a[:40]!r}{hint}. Rien modifié.")
    contenus[f] = s

ts = time.strftime("%Y%m%d_%H%M%S")
for f, lst in plan.items():
    shutil.copy2(f, f"{f}.backup_proposition_{ts}")
    s = contenus[f]
    for a, n in lst:
        s = motif(a).sub(lambda m, n=n: n, s, count=1)
    open(f, "w", encoding="utf-8").write(s)
    print(f"OK : {f}")
print(f"Sauvegardes : *.backup_proposition_{ts}")
print("Vérifie maintenant : npx tsc --noEmit")

