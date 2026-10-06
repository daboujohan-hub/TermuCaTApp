import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { changerMotDePasse } from '@/api/actions/account';

const MIN_LONGUEUR = 12;

function assezFort(mdp: string): boolean {
  const classes = [/[a-z]/.test(mdp), /[A-Z]/.test(mdp), /[0-9]/.test(mdp), /[^a-zA-Z0-9]/.test(mdp)];
  return mdp.length >= MIN_LONGUEUR && classes.filter(Boolean).length >= 3;
}

export default function ChangePasswordScreen() {
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    if (enCours) return;
    if (!ancien || !nouveau || !confirmation) {
      Alert.alert('Champs requis', 'Remplis les trois champs.');
      return;
    }
    if (nouveau !== confirmation) {
      Alert.alert('Mots de passe différents', 'La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    if (!assezFort(nouveau)) {
      Alert.alert(
        'Mot de passe trop faible',
        `Il faut au moins ${MIN_LONGUEUR} caractères, avec au moins 3 types parmi : minuscules, majuscules, chiffres, symboles.`
      );
      return;
    }
    setEnCours(true);
    try {
      const res = await changerMotDePasse(ancien, nouveau);
      if (res?.ok) {
        Alert.alert('Mot de passe changé', 'Ton mot de passe a été modifié.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Erreur', res?.msg ?? 'Impossible de changer le mot de passe.');
      }
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message ?? 'Impossible de contacter le serveur.');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Changer le mot de passe</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Ancien mot de passe</Text>
        <TextInput style={styles.input} secureTextEntry value={ancien} onChangeText={setAncien} autoCapitalize="none" autoCorrect={false} />
        <Text style={styles.label}>Nouveau mot de passe</Text>
        <TextInput style={styles.input} secureTextEntry value={nouveau} onChangeText={setNouveau} autoCapitalize="none" autoCorrect={false} />
        <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
        <TextInput style={styles.input} secureTextEntry value={confirmation} onChangeText={setConfirmation} autoCapitalize="none" autoCorrect={false} />
        <Text style={styles.hint}>
          Au moins {MIN_LONGUEUR} caractères, avec au moins 3 types parmi : minuscules, majuscules, chiffres, symboles.
        </Text>
        <Pressable style={[styles.btn, enCours && styles.btnOff]} onPress={valider} disabled={enCours}>
          <Text style={styles.btnText}>{enCours ? 'Envoi…' : 'Changer le mot de passe'}</Text>
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
  label: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: '#F6F6F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 12, lineHeight: 17 },
  btn: { backgroundColor: '#2F80ED', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  btnOff: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
