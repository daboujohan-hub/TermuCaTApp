import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const NUMERO_WHATSAPP = '2250170404109';
const SUJETS = ['Problème de compte', 'Problème de connexion', 'Problème de sécurité', 'Problème avec une discussion', 'Problème avec Écritures', 'Problème avec École', 'Signaler un contenu', 'Autre'];

export default function ContactScreen() {
  const [sujet, setSujet] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [envoye, setEnvoye] = useState(false);

  const envoyer = () => {
    if (!sujet) { Alert.alert('Sujet requis', "Choisis un sujet avant d'envoyer ton message."); return; }
    if (!message.trim()) { Alert.alert('Message vide', "Écris ton message avant d'envoyer."); return; }
    const texte = `TermChat - ${sujet}\n\n${message.trim()}`;
    Linking.openURL(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(texte)}`);
    setEnvoye(true);
  };

  if (envoye) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#111827" /></Pressable>
          <Text style={styles.title}>Nous contacter</Text>
        </View>
        <View style={styles.confirmationWrap}>
          <Ionicons name="checkmark-circle" size={52} color="#22C55E" />
          <Text style={styles.confirmationTitre}>Message envoyé</Text>
          <Text style={styles.confirmationText}>Merci. Notre équipe a bien reçu votre demande via WhatsApp. Nous vous répondrons dès que possible.</Text>
          <Pressable style={styles.btn} onPress={() => router.back()}><Text style={styles.btnText}>Retour</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#111827" /></Pressable>
        <Text style={styles.title}>Nous contacter</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Sujet</Text>
        <View style={styles.chipsWrap}>
          {SUJETS.map((s) => (
            <Pressable key={s} style={[styles.chip, sujet === s && styles.chipActif]} onPress={() => setSujet(s)}>
              <Text style={[styles.chipText, sujet === s && styles.chipTextActif]}>{s}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Votre message</Text>
        <TextInput style={styles.textarea} placeholder="Écrivez votre message ici..." placeholderTextColor="#9CA3AF" value={message} onChangeText={setMessage} multiline />
        <Pressable style={styles.btn} onPress={envoyer}><Text style={styles.btnText}>Envoyer</Text></Pressable>
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
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F6F6F7' },
  chipActif: { backgroundColor: '#EAF2FE' },
  chipText: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
  chipTextActif: { color: '#1565C0' },
  textarea: { backgroundColor: '#F6F6F7', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14.5, color: '#111827', minHeight: 120, textAlignVertical: 'top' },
  btn: { backgroundColor: '#2F80ED', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 26 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  confirmationWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  confirmationTitre: { fontSize: 19, fontWeight: '800', color: '#111827', marginTop: 14, marginBottom: 8 },
  confirmationText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
});
