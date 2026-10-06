import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ecritureDetail, ecriturePublier, ecritureModifier, estErreur } from '@/api/actions/ecritures';

const MAX_TITRE = 100;
const MAX_TEXTE = 10000;
const MAX_PHOTO_OCTETS = 500 * 1024;

export default function EcritureCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const modeEdition = !!id;

  const [titre, setTitre] = useState('');
  const [texte, setTexte] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoModifiee, setPhotoModifiee] = useState(false);
  const [chargement, setChargement] = useState(modeEdition);
  const [chargementPhoto, setChargementPhoto] = useState(false);
  const [publication, setPublication] = useState(false);

  useEffect(() => {
    if (!modeEdition || !id) return;
    (async () => {
      const res = await ecritureDetail(id);
      if (!estErreur(res)) {
        setTitre(res.ecriture.titre);
        setTexte(res.ecriture.texte);
        setPhoto(res.ecriture.photo_couverture ?? null);
      }
      setChargement(false);
    })();
  }, [id, modeEdition]);

  const choisirPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée', "L'accès à tes photos est nécessaire pour ajouter une couverture.");
      return;
    }
    setChargementPhoto(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.5, base64: true,
      });
      if (result.canceled || !result.assets?.[0]?.base64) return;
      const base64 = result.assets[0].base64;
      const taille = Math.floor((base64.length * 3) / 4);
      if (taille > MAX_PHOTO_OCTETS) {
        Alert.alert('Photo trop lourde', 'Choisis une photo plus légère (max 500 Ko après compression).');
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

  const retirerPhoto = () => { setPhoto(null); setPhotoModifiee(true); };

  const publier = async () => {
    const titreNet = titre.trim();
    const texteNet = texte.trim();
    if (!titreNet) { Alert.alert('Titre requis', 'Donne un titre à ton écriture.'); return; }
    if (!texteNet) { Alert.alert('Texte requis', "Écris le contenu de ton écriture."); return; }
    setPublication(true);
    try {
      let photoBase64: string | undefined;
      let photoTaille: number | undefined;
      if (photoModifiee && photo) {
        photoBase64 = photo.split(',')[1] ?? photo;
        photoTaille = Math.floor((photoBase64.length * 3) / 4);
      }
      const res = modeEdition && id
        ? await ecritureModifier(id, titreNet, texteNet, photoBase64, photoTaille)
        : await ecriturePublier(titreNet, texteNet, photoBase64, photoTaille);
      if (estErreur(res)) {
        Alert.alert('Erreur', res.msg);
      } else {
        router.back();
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message ?? "Impossible de publier.");
    } finally {
      setPublication(false);
    }
  };

  if (chargement) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}><ActivityIndicator color="#2F80ED" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>{modeEdition ? "Modifier l'écriture" : 'Nouvelle écriture'}</Text>
        <Pressable onPress={publier} disabled={publication}>
          <Text style={styles.publishBtn}>{publication ? '…' : (modeEdition ? 'Enregistrer' : 'Publier')}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {photo ? (
            <Pressable onPress={choisirPhoto}>
              <Image source={{ uri: photo }} style={styles.cover} />
            </Pressable>
          ) : (
            <Pressable style={styles.coverPicker} onPress={choisirPhoto} disabled={chargementPhoto}>
              {chargementPhoto ? <ActivityIndicator color="#2F80ED" /> : (
                <>
                  <Ionicons name="image-outline" size={26} color="#8E8E93" />
                  <Text style={styles.coverPickerText}>Ajouter une photo de couverture (optionnel)</Text>
                </>
              )}
            </Pressable>
          )}
          {!!photo && (
            <Pressable onPress={retirerPhoto}>
              <Text style={styles.retirerPhoto}>Retirer la photo</Text>
            </Pressable>
          )}

          <TextInput
            style={styles.titreInput}
            placeholder="Titre"
            placeholderTextColor="#9CA3AF"
            value={titre}
            onChangeText={(t) => setTitre(t.slice(0, MAX_TITRE))}
          />
          <Text style={styles.compteur}>{titre.length}/{MAX_TITRE}</Text>

          <TextInput
            style={styles.texteInput}
            placeholder="Écris ton écriture ici…"
            placeholderTextColor="#9CA3AF"
            value={texte}
            onChangeText={(t) => setTexte(t.slice(0, MAX_TEXTE))}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.compteur}>{texte.length}/{MAX_TEXTE}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  publishBtn: { fontSize: 14, fontWeight: '700', color: '#2F80ED' },
  content: { padding: 20, paddingBottom: 60 },
  cover: { width: '100%', height: 160, borderRadius: 16, marginBottom: 8 },
  coverPicker: {
    width: '100%', height: 120, borderRadius: 16, backgroundColor: '#F6F6F7',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8,
  },
  coverPickerText: { fontSize: 12.5, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 20 },
  retirerPhoto: { color: '#E5484D', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  titreInput: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 14, paddingVertical: 6 },
  texteInput: { fontSize: 15, color: '#111827', lineHeight: 22, marginTop: 10, minHeight: 240 },
  compteur: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 2 },
});
