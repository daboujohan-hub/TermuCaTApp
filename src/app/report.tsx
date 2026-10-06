import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const NUMERO_WHATSAPP = '2250170404109';

export default function ReportScreen() {
  const [description, setDescription] = useState('');
  const [capture, setCapture] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  const ajouterCapture = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission refusée', "L'accès à tes photos est nécessaire pour joindre une capture."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
    if (!result.canceled && result.assets?.[0]) setCapture(result.assets[0].uri);
  };

  const envoyer = () => {
    if (!description.trim()) { Alert.alert('Description requise', "Décris le problème avant d'envoyer."); return; }
    const texte = `TermChat - Signalement de problème\n\n${description.trim()}${capture ? "\n\n(Capture d'écran à joindre manuellement)" : ''}`;
    Linking.openURL(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(texte)}`);
    setEnvoye(true);
  };

  if (envoye) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#111827" /></Pressable>
          <Text style={styles.title}>Signaler un problème</Text>
        </View>
        <View style={styles.confirmationWrap}>
          <Ionicons name="checkmark-circle" size={52} color="#22C55E" />
          <Text style={styles.confirmationTitre}>Signalement envoyé</Text>
          <Text style={styles.confirmationText}>Merci de nous avoir signalé ce problème. Notre équipe va examiner votre demande.</Text>
          <Pressable style={styles.btn} onPress={() => router.back()}><Text style={styles.btnText}>Retour</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#111827" /></Pressable>
        <Text style={styles.title}>Signaler un problème</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Quel est le problème ?</Text>
        <TextInput style={styles.textarea} placeholder="Décrivez le problème..." placeholderTextColor="#9CA3AF" value={description} onChangeText={setDescription} multiline />
        <Text style={styles.label}>Capture d'écran (optionnel)</Text>
        {capture ? (
          <Pressable onPress={ajouterCapture}><Image source={{ uri: capture }} style={styles.capturePreview} /></Pressable>
        ) : (
          <Pressable style={styles.ajoutBtn} onPress={ajouterCapture}>
            <Ionicons name="add" size={16} color="#2F80ED" />
            <Text style={styles.ajoutBtnText}>Ajouter</Text>
          </Pressable>
        )}
        {!!capture && <Text style={styles.hint}>Le lien WhatsApp ne joint pas automatiquement l'image — tu pourras l'ajouter directement dans la conversation WhatsApp après l'ouverture.</Text>}
        <Pressable style={styles.btn} onPress={envoyer}><Text style={styles.btnText}>Envoyer le signalement</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '700', color: '#8E8E93', marginTop: 16, marginBottom: 8 },
  textarea: { backgroundColor: '#F6F6F7', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14.5, color: '#111827', minHeight: 120, textAlignVertical: 'top' },
  ajoutBtn: { flexDirection: 'row', gap: 6, backgroundColor: '#F6F6F7', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ajoutBtnText: { color: '#2F80ED', fontWeight: '700', fontSize: 14 },
  capturePreview: { width: '100%', height: 160, borderRadius: 16 },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 8, lineHeight: 17 },
  btn: { backgroundColor: '#2F80ED', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 26 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  confirmationWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  confirmationTitre: { fontSize: 19, fontWeight: '800', color: '#111827', marginTop: 14, marginBottom: 8 },
  confirmationText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
});
