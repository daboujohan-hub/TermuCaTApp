import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { totpSetupDemarrer, totpSetupConfirmer, estErreur } from '@/api/actions/auth';
import { suspendreReconnexionAuto, reprendreReconnexionAuto } from '@/api/socket';

type EtapeTotp = 'idle' | 'en_cours' | 'codes_recuperation';

export default function SecurityScreen() {
  const [etapeTotp, setEtapeTotp] = useState<EtapeTotp>('idle');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [codesRecup, setCodesRecup] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (etapeTotp === 'en_cours') {
      suspendreReconnexionAuto();
      return () => reprendreReconnexionAuto();
    }
  }, [etapeTotp]);

  const demarrerTotp = async () => {
    setLoading(true); setErreur(null);
    try {
      const res = await totpSetupDemarrer();
      if (estErreur(res)) setErreur(res.msg);
      else { setSecret(res.secret); setEtapeTotp('en_cours'); }
    } catch (e: any) {
      setErreur(e?.message ?? 'Erreur réseau.');
    } finally { setLoading(false); }
  };

  const confirmerTotp = async () => {
    if (code.length !== 6) return;
    setLoading(true); setErreur(null);
    try {
      const res = await totpSetupConfirmer(code);
      if (estErreur(res)) setErreur(res.msg);
      else { setCodesRecup(res.codes_recuperation); setEtapeTotp('codes_recuperation'); }
    } catch (e: any) {
      setErreur(e?.message ?? 'Erreur réseau.');
    } finally { setLoading(false); }
  };

  const terminerTotp = () => {
    setEtapeTotp('idle'); setCode(''); setSecret(''); setCodesRecup([]);
    Alert.alert('2FA activée', 'La double authentification est maintenant active sur ton compte.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Sécurité</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>DOUBLE AUTHENTIFICATION</Text>

        {etapeTotp === 'idle' && (
          <Pressable style={styles.row} onPress={demarrerTotp} disabled={loading}>
            <Text style={styles.rowLabel}>Activer la 2FA</Text>
            {loading ? <ActivityIndicator /> : <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />}
          </Pressable>
        )}

        {etapeTotp === 'en_cours' && (
          <View style={styles.totpCard}>
            <Text style={styles.totpHint}>
              Ajoute ce compte dans Google Authenticator (ou app équivalente) avec le secret ci-dessous, puis entre le code à 6 chiffres généré.
            </Text>
            <View style={styles.secretBox}>
              <Text style={styles.secretText} selectable>{secret}</Text>
            </View>
            <TextInput style={styles.codeInput} placeholder="123456" placeholderTextColor="#9CA3AF"
              keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
            {erreur && <Text style={styles.erreur}>{erreur}</Text>}
            <Pressable style={[styles.btn, (loading || code.length !== 6) && styles.btnDisabled]} onPress={confirmerTotp} disabled={loading || code.length !== 6}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirmer</Text>}
            </Pressable>
            <Text style={styles.annuler} onPress={() => setEtapeTotp('idle')}>Annuler</Text>
          </View>
        )}

        {etapeTotp === 'codes_recuperation' && (
          <View style={styles.totpCard}>
            <Text style={styles.totpHint}>
              Note ces codes de récupération dans un endroit sûr — ils ne seront plus jamais affichés. Chacun ne peut être utilisé qu'une seule fois si tu perds l'accès à ton app d'authentification.
            </Text>
            {codesRecup.map((c) => <Text key={c} style={styles.codeRecup} selectable>{c}</Text>)}
            <Pressable style={styles.btn} onPress={terminerTotp}>
              <Text style={styles.btnText}>J'ai noté mes codes</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F6F6F7', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { fontSize: 14.5, color: '#111827' },
  totpCard: { backgroundColor: '#F6F6F7', borderRadius: 16, padding: 16 },
  totpHint: { fontSize: 13, color: '#8E8E93', lineHeight: 19, marginBottom: 14 },
  secretBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 14 },
  secretText: { fontFamily: 'monospace', fontSize: 13, color: '#111827', textAlign: 'center', letterSpacing: 1 },
  codeInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, fontSize: 18, fontFamily: 'monospace', textAlign: 'center', letterSpacing: 6, color: '#111827', marginBottom: 12 },
  erreur: { color: '#E5484D', fontSize: 13, marginBottom: 10 },
  btn: { backgroundColor: '#2F80ED', borderRadius: 14, padding: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
  annuler: { textAlign: 'center', color: '#8E8E93', fontSize: 13, marginTop: 12 },
  codeRecup: { fontFamily: 'monospace', fontSize: 14, color: '#111827', textAlign: 'center', paddingVertical: 4 },
});
