# TermChat

Version : 1.0.0  
Identifiant Android : com.aboudev.TermChatApp  
Permissions : android.permission.ACCESS_FINE_LOCATION, android.permission.ACCESS_COARSE_LOCATION, android.permission.CAMERA, android.permission.RECORD_AUDIO, android.permission.RECORD_AUDIO, android.permission.MODIFY_AUDIO_SETTINGS, android.permission.FOREGROUND_SERVICE, android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK, android.permission.ACCESS_COARSE_LOCATION, android.permission.ACCESS_FINE_LOCATION

## Démarrage

- Point d'entrée : `src/app/_layout.tsx` (Expo Router)
- `npm run start` : expo start
- `npm run reset-project` : node ./scripts/reset-project.js
- `npm run android` : expo run:android
- `npm run ios` : expo run:ios
- `npm run web` : expo start --web
- `npm run lint` : expo lint

## Écrans (src/app)

- `(auth)/_layout.tsx`
- `(auth)/login.tsx`
- `(auth)/register.tsx`
- `(tabs)/_layout.tsx`
- `(tabs)/account.tsx`
- `(tabs)/docs.tsx`
- `(tabs)/edumap.tsx`
- `(tabs)/index.tsx`
- `(tabs)/settings.tsx`
- `_layout.tsx`
- `abonnement.tsx`
- `about.tsx`
- `change-password.tsx`
- `chat/[numero].tsx`
- `contact-profil.tsx`
- `contact.tsx`
- `delete-account.tsx`
- `edit-profile.tsx`
- `faq.tsx`
- `index.tsx`
- `privacy.tsx`
- `report.tsx`
- `search.tsx`
- `security.tsx`
- `soutenir.tsx`
- `terms.tsx`
- `welcome.tsx`

## Requêtes vers le serveur

Toutes passent par `sendRequest` (`src/api/request.ts`), qui envoie une action JSON au serveur et attend la réponse.

### account.ts

| Fonction | Action serveur |
|---|---|
| `bloquerUtilisateur` | `bloquer` |
| `signalerUtilisateur` | `signaler` |
| `changerMotDePasse` | `changer_mdp` |
| `supprimerCompte` | `supprimer_compte` |

### auth.ts

| Fonction | Action serveur |
|---|---|
| `inscrire` | `inscrire` |
| `connecterNumero` | `connecter_numero` |
| `connecterEmail` | `connecter_email` |
| `definirPseudo` | `definir_pseudo` |
| `totpVerifierConnexion` | `totp_verifier_connexion` |
| `deconnecter` | `deconnecter` |
| `totpSetupDemarrer` | `totp_setup_demarrer` |
| `totpSetupConfirmer` | `totp_setup_confirmer` |
| `totpDesactiver` | `totp_desactiver` |

### crypto.ts

| Fonction | Action serveur |
|---|---|
| `publierClePublique` | `publier_cle_publique` |

### messaging.ts

| Fonction | Action serveur |
|---|---|
| `mesConversations` | `mes_conversations` |
| `envoyerMessage` | `message` |
| `historique` | `historique` |
| `marquerLu` | `marquer_lu` |
| `envoyerFichier` | `envoyer_fichier` |
| `envoyerVocal` | `envoyer_vocal` |
| `telechargerVocal` | `telecharger_vocal` |
| `effacerHistorique` | `effacer_historique` |
| `chercherUtilisateur` | `chercher` |

### notifications.ts

| Fonction | Action serveur |
|---|---|
| `enregistrerPushToken` | `enregistrer_push_token` |
| `supprimerPushToken` | `supprimer_push_token` |

### profile.ts

| Fonction | Action serveur |
|---|---|
| `changerStatut` | `changer_statut` |
| `changerCouleur` | `changer_couleur` |
| `modifierBio` | `modifier_bio` |
| `supprimerMessage` | `supprimer_message` |
| `definirPseudo` | `definir_pseudo` |
| `definirPhotoProfil` | `definir_photo_profil` |
| `supprimerPhotoProfil` | `supprimer_photo_profil` |

### settings.ts

| Fonction | Action serveur |
|---|---|
| `changerStatut` | `changer_statut` |
| `changerCouleur` | `changer_couleur` |

