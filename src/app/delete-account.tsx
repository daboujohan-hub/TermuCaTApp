import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { supprimerCompte } from '@/api/actions/account';
import { useSessionStore } from '@/store/sessionStore';

export default function DeleteAccountScreen() {
  const logout = useSessionStore((s) => s.logout);
  const [mdp, setMdp] = useState('');
  const [enCours, setEnCours] = useState(false);

  const executer = async () => {
    setEnCours(true);
    try {
      const res = await supprimerCompte(mdp);
      if (res?.ok) {
        Alert.alert('Suppression programmée', 'Ton compte est désactivé. Tes données seront effacées définitivement dans 30 jours.', [
          {
            text: 'OK',
            onPress: () => {
              logout();
              router.replace('/welcome' as any);
            },
          },
        ]);
      } else {
        Alert.alert('Impossible de supprimer', res?.msg ?? 'Une erreur est survenue.');
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message ?? 'Impossible de contacter le serveur.');
    } finally {
      setEnCours(false);
    }
  };

  const confirmer = () => {
    if (enCours) return;
    if (!mdp.trim()) {
      Alert.alert('Mot de passe requis', 'Saisis ton mot de passe pour confirmer.');
      return;
    }
    Alert.alert('Supprimer définitivement ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer mon compte', style: 'destructive', onPress: executer },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Supprimer mon compte</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.warnBox}>
          <Text style={styles.warnTitle}>Ce qui va se passer</Text>
          <Text style={styles.warnText}>
            • Ton compte est désactivé immédiatement : tu ne pourras plus te connecter.{'\n'}
            • Ton abonnement premium prend fin avec ton compte.{'\n'}
            • Tes contacts ne pourront plus t'écrire.{'\n'}
            • Tes données (profil, photo, conversations) seront effacées définitivement après 30 jours. Pour annuler, contacte l'assistance avant cette date.
          </Text>
        </View>
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput style={styles.input} secureTextEntry value={mdp} onChangeText={setMdp} autoCapitalize="none" autoCorrect={false} />
        <Pressable style={[styles.btn, enCours && styles.btnOff]} onPress={confirmer} disabled={enCours}>
          <Text style={styles.btnText}>{enCours ? 'Suppression…' : 'Supprimer mon compte'}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/contact' as any)} style={styles.lien}>
          <Text style={styles.lienText}>Demander l'effacement de mes données</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 20, paddingBottom: 60 },
  warnBox: { backgroundColor: '#FEF2F2', borderRadius: 14, padding: 16 },
  warnTitle: { fontSize: 14, fontWeight: '700', color: '#B91C1C', marginBottom: 8 },
  warnText: { fontSize: 13.5, color: '#7F1D1D', lineHeight: 21 },
  label: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginTop: 20, marginBottom: 6 },
  input: { backgroundColor: '#F6F6F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  btn: { backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  btnOff: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  lien: { alignItems: 'center', marginTop: 20 },
  lienText: { color: '#2F80ED', fontSize: 13.5, fontWeight: '600' },
});
