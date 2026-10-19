import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useSessionStore } from '@/store/sessionStore';
import {
  pinDefini, verifierPin, supprimerPin, empreinteActive, empreinteDisponible, demanderEmpreinte,
} from '@/lib/verrou';

const DELAI_MS = 30000;

export default function VerrouApp() {
  const logout = useSessionStore((s) => s.logout);
  const [verrouille, setVerrouille] = useState(false);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [bio, setBio] = useState(false);
  const quitteA = useRef<number | null>(null);

  function deverrouiller() { setVerrouille(false); setPin(''); setMessage(''); }

  const verrouiller = useCallback(async () => {
    if (!(await pinDefini())) return;
    setPin(''); setMessage('');
    setVerrouille(true);
    if ((await empreinteActive()) && (await empreinteDisponible())) {
      setBio(true);
      if (await demanderEmpreinte()) deverrouiller();
    } else {
      setBio(false);
    }
  }, []);

  useEffect(() => { verrouiller(); }, [verrouiller]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (etat) => {
      if (etat === 'background') quitteA.current = Date.now();
      else if (etat === 'active' && quitteA.current && Date.now() - quitteA.current > DELAI_MS) {
        quitteA.current = null;
        verrouiller();
      }
    });
    return () => sub.remove();
  }, [verrouiller]);

  const saisir = async (t: string) => {
    const v = t.replace(/\D/g, '').slice(0, 6);
    setPin(v);
    if (v.length < 6) return;
    const r = await verifierPin(v);
    if (r.ok) { deverrouiller(); return; }
    setPin('');
    setMessage(r.bloqueSec
      ? `Trop d'essais. Réessaie dans ${Math.ceil(r.bloqueSec / 60)} min.`
      : `Code incorrect. ${r.restant} essai(s) restant(s).`);
  };

  const essayerEmpreinte = async () => { if (await demanderEmpreinte()) deverrouiller(); };

  const oublie = () => {
    Alert.alert('Se déconnecter ?', 'Le code PIN sera supprimé. Tu pourras te reconnecter avec ton identifiant et ton mot de passe.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter', style: 'destructive',
        onPress: async () => { logout(); await supprimerPin(); deverrouiller(); router.replace('/welcome' as any); },
      },
    ]);
  };

  return (
    <Modal visible={verrouille} animationType="none" statusBarTranslucent onRequestClose={() => {}}>
      <View style={s.container}>
        <Ionicons name="lock-closed" size={38} color="#2F80ED" />
        <Text style={s.titre}>TermChat est verrouillé</Text>
        <Text style={s.aide}>Entre ton code PIN à 6 chiffres</Text>
        <TextInput
          style={s.input} value={pin} onChangeText={saisir} keyboardType="number-pad"
          secureTextEntry maxLength={6} autoFocus placeholder="••••••" placeholderTextColor="#9CA3AF"
        />
        {!!message && <Text style={s.erreur}>{message}</Text>}
        {bio && (
          <Pressable style={s.bioBtn} onPress={essayerEmpreinte}>
            <Ionicons name="finger-print" size={22} color="#2F80ED" />
            <Text style={s.bioText}>Utiliser l'empreinte</Text>
          </Pressable>
        )}
        <Text style={s.lien} onPress={oublie}>PIN oublié ? Se déconnecter</Text>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 24 },
  titre: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 14 },
  aide: { fontSize: 14, color: '#8E8E93', marginTop: 6, marginBottom: 20 },
  input: { width: 220, backgroundColor: '#F6F6F7', borderRadius: 14, padding: 14, fontSize: 22, textAlign: 'center', letterSpacing: 8, color: '#111827' },
  erreur: { color: '#E5484D', fontSize: 13, marginTop: 12, textAlign: 'center' },
  bioBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, padding: 10 },
  bioText: { color: '#2F80ED', fontWeight: '600', fontSize: 14 },
  lien: { color: '#8E8E93', fontSize: 13, marginTop: 28 },
});
