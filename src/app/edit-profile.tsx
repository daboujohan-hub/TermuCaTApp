import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';


import {
  STATUTS, COULEURS, changerStatut, changerCouleur, modifierBio, definirPseudo,
  definirPhotoProfil, supprimerPhotoProfil, estErreur,
} from '@/api/actions/profile';
import { useSessionStore } from '@/store/sessionStore';

const MAX_BIO = 150;
const MAX_PHOTO_OCTETS = 400 * 1024;

const NOMS_COULEURS: Record<string, string> = {
  cyan: '#22D3EE', bleu: '#2F80ED', vert: '#22C55E', violet: '#A855F7',
  orange: '#F97316', rose: '#EC4899', rouge: '#EF4444', jaune: '#EAB308',
};

export default function EditProfileScreen() {
  const user = useSessionStore((s) => s.user);
  const updateUser = useSessionStore((s) => s.updateUser);

  const [pseudo, setPseudo] = useState(user?.pseudo ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [statut, setStatut] = useState(user?.statut ?? 'disponible');
  const [couleur, setCouleur] = useState(user?.couleur ?? 'cyan');
  const [photo, setPhoto] = useState<string | null | undefined>(user?.photo_profil);
  const [photoModifiee, setPhotoModifiee] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [chargementPhoto, setChargementPhoto] = useState(false);

  // Réduit la photo (512 px puis plus petit si besoin) et la convertit en JPEG sous la limite du serveur.
  const preparerPhotoProfil = async (uri: string): Promise<string | null> => {
    let IM: any = null;
    try { IM = require('expo-image-manipulator'); } catch {}
    if (!IM) throw new Error("Mise à jour nécessaire : installe la dernière version de l'application pour changer ta photo.");
    const essais: Array<[number, number]> = [[512, 0.7], [384, 0.5], [256, 0.5]];
    for (const [largeur, qualite] of essais) {
      let base64: string | undefined;
      if (typeof IM.manipulateAsync === 'function') {
        const r = await IM.manipulateAsync(uri, [{ resize: { width: largeur } }], {
          compress: qualite, format: IM.SaveFormat.JPEG, base64: true,
        });
        base64 = r?.base64;
      } else {
        const contexte = IM.ImageManipulator.manipulate(uri);
        contexte.resize({ width: largeur });
        const image = await contexte.renderAsync();
        const r = await image.saveAsync({ compress: qualite, format: IM.SaveFormat.JPEG, base64: true });
        base64 = r?.base64;
      }
      if (!base64) return null;
      const pad = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
      if (Math.floor((base64.length * 3) / 4) - pad <= MAX_PHOTO_OCTETS) return base64;
    }
    return null;
  };

  const choisirPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée', "L'accès à tes photos est nécessaire pour changer ta photo de profil.");
      return;
    }
    setChargementPhoto(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 1,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const base64 = await preparerPhotoProfil(result.assets[0].uri);
      if (!base64) {
        Alert.alert('Photo illisible', "Impossible de préparer cette photo. Essaie une autre image.");
        return;
      }
      setPhoto(`data:image/jpeg;base64,${base64}`);
      setPhotoModifiee(true);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de charger la photo.');
    } finally {
      setChargementPhoto(false);
    }
  };

  const supprimerPhoto = () => { setPhoto(null); setPhotoModifiee(true); };

  const enregistrer = async () => {
    setEnregistrement(true);
    try {
      const maj: Record<string, any> = {};

      if (photoModifiee) {
        if (photo) {
          const base64Pur = photo.split(',')[1] ?? photo;
          const taille = Math.floor((base64Pur.length * 3) / 4) - (base64Pur.endsWith('==') ? 2 : base64Pur.endsWith('=') ? 1 : 0);
          const res = await definirPhotoProfil(base64Pur, taille);
          if (estErreur(res)) { if (Object.keys(maj).length > 0) updateUser(maj); Alert.alert('Erreur', res.msg); setEnregistrement(false); return; }
          maj.photo_profil = photo; setPhotoModifiee(false);
        } else {
          const res = await supprimerPhotoProfil();
          if (estErreur(res)) { if (Object.keys(maj).length > 0) updateUser(maj); Alert.alert('Erreur', res.msg); setEnregistrement(false); return; }
          maj.photo_profil = null; setPhotoModifiee(false);
        }
      }

      if (pseudo.trim() && pseudo.trim() !== user?.pseudo) {
        const res = await definirPseudo(pseudo.trim());
        if (estErreur(res)) { if (Object.keys(maj).length > 0) updateUser(maj); Alert.alert('Erreur', res.msg); setEnregistrement(false); return; }
        maj.pseudo = pseudo.trim();
      }

      if (bio.trim() !== (user?.bio ?? '')) {
        const res = await modifierBio(bio.trim());
        if (estErreur(res)) { if (Object.keys(maj).length > 0) updateUser(maj); Alert.alert('Erreur', res.msg); setEnregistrement(false); return; }
        maj.bio = bio.trim();
      }

      if (statut !== user?.statut) {
        const res = await changerStatut(statut);
        if (estErreur(res)) { if (Object.keys(maj).length > 0) updateUser(maj); Alert.alert('Erreur', res.msg); setEnregistrement(false); return; }
        maj.statut = statut;
      }

      if (couleur !== user?.couleur) {
        const res = await changerCouleur(couleur);
        if (estErreur(res)) { if (Object.keys(maj).length > 0) updateUser(maj); Alert.alert('Erreur', res.msg); setEnregistrement(false); return; }
        maj.couleur = couleur;
      }

      if (Object.keys(maj).length > 0) updateUser(maj);
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message ?? "Impossible d'enregistrer.");
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <Pressable onPress={enregistrer} disabled={enregistrement}>
          <Text style={styles.save}>{enregistrement ? '…' : 'Enregistrer'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.photoSection}>
            <Pressable style={styles.photoWrap} onPress={choisirPhoto} disabled={chargementPhoto}>
              {chargementPhoto ? (
                <ActivityIndicator color="#fff" />
              ) : photo ? (
                <Image source={{ uri: photo }} style={styles.photo} />
              ) : (
                <Text style={styles.photoInitiale}>{(user?.nom || '?')[0]?.toUpperCase()}</Text>
              )}
              <View style={styles.photoEditBadge}>
                <Ionicons name="camera" size={13} color="#111827" />
              </View>
            </Pressable>
            {!!photo && (
              <Pressable onPress={supprimerPhoto}>
                <Text style={styles.retirerPhoto}>Retirer la photo</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.label}>Pseudo</Text>
          <TextInput style={styles.input} value={pseudo} onChangeText={setPseudo} placeholder="pseudo" placeholderTextColor="#9CA3AF" autoCapitalize="none" />

          <Text style={styles.label}>Bio</Text>
          <TextInput style={[styles.input, styles.bioInput]} value={bio} onChangeText={(t) => setBio(t.slice(0, MAX_BIO))} placeholder="Quelques mots sur toi…" placeholderTextColor="#9CA3AF" multiline />
          <Text style={styles.compteur}>{bio.length}/{MAX_BIO}</Text>

          <Text style={styles.label}>Statut</Text>
          <View style={styles.optionsRow}>
            {STATUTS.map((s) => (
              <Pressable key={s.valeur} style={[styles.statutChip, statut === s.valeur && styles.statutChipActif]} onPress={() => setStatut(s.valeur)}>
                <Text style={[styles.statutChipText, statut === s.valeur && styles.statutChipTextActif]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Couleur</Text>
          <View style={styles.optionsRow}>
            {COULEURS.map((c) => (
              <Pressable key={c} style={[styles.swatch, { backgroundColor: NOMS_COULEURS[c] ?? '#2F80ED' }, couleur === c && styles.swatchActif]} onPress={() => setCouleur(c)} />
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  save: { fontSize: 14, fontWeight: '700', color: '#2F80ED' },
  content: { padding: 20, paddingBottom: 60 },
  photoSection: { alignItems: 'center', marginBottom: 10 },
  photoWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#2F80ED', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { width: 96, height: 96, borderRadius: 48 },
  photoInitiale: { color: '#fff', fontSize: 34, fontWeight: '700' },
  photoEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: '#F6F6F7', borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  retirerPhoto: { color: '#E5484D', fontSize: 13, fontWeight: '600', marginTop: 10 },
  label: { fontSize: 13, fontWeight: '700', color: '#8E8E93', marginTop: 22, marginBottom: 8 },
  input: { backgroundColor: '#F6F6F7', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14.5, color: '#111827' },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  compteur: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statutChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F6F6F7' },
  statutChipActif: { backgroundColor: '#EAF2FE' },
  statutChipText: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
  statutChipTextActif: { color: '#1565C0' },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: 'transparent' },
  swatchActif: { borderColor: '#111827' },
});
