import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { totpSetupDemarrer, totpSetupConfirmer, estErreur } from '@/api/actions/auth';
import { sendRequest } from '@/api/request';
import { suspendreReconnexionAuto, reprendreReconnexionAuto } from '@/api/socket';

type EtapeTotp = 'idle' | 'en_cours' | 'codes_recuperation' | 'desactivation';

export default function SecurityScreen() {
  const [etapeTotp, setEtapeTotp] = useState<EtapeTotp>('idle');
  const [secret, setSecret] = useState('');
  const [uriTotp, setUriTotp] = useState('');
  const [code, setCode] = useState('');
  const [mdp, setMdp] = useState('');
  const [codesRecup, setCodesRecup] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actif, setActif] = useState<boolean | null>(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const r: any = await sendRequest<{ action: string }, any>({ action: 'totp_statut' });
        if (!annule && r?.ok) setActif(!!r.actif);
      } catch {}
    })();
    return () => { annule = true; };
  }, []);

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
      if (estErreur(res)) {
        setErreur(res.msg);
        if (/deja active/i.test(res.msg)) setActif(true);
      } else {
        setSecret(res.secret);
        setUriTotp(String((res as any).uri ?? ''));
        setEtapeTotp('en_cours');
      }
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
    setEtapeTotp('idle'); setCode(''); setSecret(''); setUriTotp(''); setCodesRecup([]); setActif(true);
    Alert.alert('2FA activée', 'La double authentification est maintenant active sur ton compte.');
  };

  const desactiverTotp = async () => {
    if (!mdp || code.length !== 6) return;
    setLoading(true); setErreur(null);
    try {
      const res: any = await sendRequest<{ action: string; mdp: string; code: string }, any>({ action: 'totp_desactiver', mdp, code });
      if (res?.ok) {
        setActif(false); setEtapeTotp('idle'); setMdp(''); setCode('');
        Alert.alert('2FA désactivée', 'La double authentification est désactivée sur ton compte.');
      } else {
        setErreur(res?.msg ?? 'Impossible de désactiver la 2FA.');
      }
    } catch (e: any) {
      setErreur(e?.message ?? 'Erreur réseau.');
    } finally { setLoading(false); }
  };

  const ouvrirApplication = async () => {
    try {
      await Linking.openURL(uriTotp);
    } catch {
      Alert.alert('Application introuvable', "Aucune application d'authentification n'a été trouvée sur ce téléphone. Saisis le secret à la main.");
    }
  };

  const partagerCodes = () => {
    Share.share({ message: 'Codes de récupération TermChat (usage unique) :\n' + codesRecup.join('\n') }).catch(() => {});
  };

  const retour = () => {
    if (etapeTotp === 'codes_recuperation') {
      Alert.alert('Codes non notés ?', 'Tes codes de récupération ne seront plus jamais affichés.', [
        { text: 'Rester', style: 'cancel' },
        { text: 'Quitter', style: 'destructive', onPress: () => router.back() },
      ]);
      return;
    }
    router.back();
  };

  const secretAffiche = secret.replace(/(.{4})/g, '$1 ').trim();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={retour}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Sécurité</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>DOUBLE AUTHENTIFICATION</Text>

        {etapeTotp === 'idle' && (
          <>
            {actif !== null && (
              <View style={styles.statutRow}>
                <Ionicons name={actif ? 'shield-checkmark' : 'shield-outline'} size={20} color={actif ? '#22C55E' : '#9CA3AF'} />
                <Text style={styles.statutText}>{actif ? 'Double authentification activée' : 'Double authentification désactivée'}</Text>
              </View>
            )}
            {erreur && <Text style={styles.erreur}>{erreur}</Text>}
            {actif ? (
              <Pressable style={styles.row} onPress={() => { setErreur(null); setCode(''); setMdp(''); setEtapeTotp('desactivation'); }}>
                <Text style={[styles.rowLabel, { color: '#E5484D' }]}>Désactiver la 2FA</Text>
                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
              </Pressable>
            ) : (
              <Pressable style={styles.row} onPress={demarrerTotp} disabled={loading}>
                <Text style={styles.rowLabel}>Activer la 2FA</Text>
                {loading ? <ActivityIndicator /> : <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />}
              </Pressable>
            )}
          </>
        )}

        {etapeTotp === 'en_cours' && (
          <View style={styles.totpCard}>
            <Text style={styles.totpHint}>
              Ajoute ce compte dans Google Authenticator (ou app équivalente) avec le secret ci-dessous, puis entre le code à 6 chiffres généré.
            </Text>
            <View style={styles.secretBox}>
              <Text style={styles.secretText} selectable>{secretAffiche}</Text>
            </View>
            {!!uriTotp && (
              <Pressable style={styles.btnSecondaire} onPress={ouvrirApplication}>
                <Text style={styles.btnSecondaireText}>Ouvrir dans mon application d'authentification</Text>
              </Pressable>
            )}
            <TextInput style={styles.codeInput} placeholder="123456" placeholderTextColor="#9CA3AF"
              keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
            {erreur && <Text style={styles.erreur}>{erreur}</Text>}
            <Pressable style={[styles.btn, (loading || code.length !== 6) && styles.btnDisabled]} onPress={confirmerTotp} disabled={loading || code.length !== 6}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirmer</Text>}
            </Pressable>
            <Text style={styles.annuler} onPress={() => { setEtapeTotp('idle'); setErreur(null); }}>Annuler</Text>
          </View>
        )}

        {etapeTotp === 'codes_recuperation' && (
          <View style={styles.totpCard}>
            <Text style={styles.totpHint}>
              Note ces codes de récupération dans un endroit sûr — ils ne seront plus jamais affichés. Chacun ne peut être utilisé qu'une seule fois si tu perds l'accès à ton app d'authentification.
            </Text>
            {codesRecup.map((c) => <Text key={c} style={styles.codeRecup} selectable>{c}</Text>)}
            <Pressable style={[styles.btnSecondaire, { marginTop: 10 }]} onPress={partagerCodes}>
              <Text style={styles.btnSecondaireText}>Partager / enregistrer les codes</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={terminerTotp}>
              <Text style={styles.btnText}>J'ai noté mes codes</Text>
            </Pressable>
          </View>
        )}

        {etapeTotp === 'desactivation' && (
          <View style={styles.totpCard}>
            <Text style={styles.totpHint}>
              Pour désactiver la double authentification, entre ton mot de passe et le code à 6 chiffres de ton application d'authentification.
            </Text>
            <TextInput style={styles.input} secureTextEntry placeholder="Mot de passe" placeholderTextColor="#9CA3AF"
              autoCapitalize="none" autoCorrect={false} value={mdp} onChangeText={setMdp} />
            <TextInput style={styles.codeInput} placeholder="123456" placeholderTextColor="#9CA3AF"
              keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
            {erreur && <Text style={styles.erreur}>{erreur}</Text>}
            <Pressable style={[styles.btn, (loading || !mdp || code.length !== 6) && styles.btnDisabled]} onPress={desactiverTotp} disabled={loading || !mdp || code.length !== 6}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Désactiver</Text>}
            </Pressable>
            <Text style={styles.annuler} onPress={() => { setEtapeTotp('idle'); setErreur(null); }}>Annuler</Text>
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
  statutRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  statutText: { fontSize: 14, color: '#374151' },
  totpCard: { backgroundColor: '#F6F6F7', borderRadius: 16, padding: 16 },
  totpHint: { fontSize: 13, color: '#8E8E93', lineHeight: 19, marginBottom: 14 },
  secretBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 14 },
  secretText: { fontFamily: 'monospace', fontSize: 13, color: '#111827', textAlign: 'center', letterSpacing: 1 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, fontSize: 15, color: '#111827', marginBottom: 12 },
  codeInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, fontSize: 18, fontFamily: 'monospace', textAlign: 'center', letterSpacing: 6, color: '#111827', marginBottom: 12 },
  erreur: { color: '#E5484D', fontSize: 13, marginBottom: 10 },
  btn: { backgroundColor: '#2F80ED', borderRadius: 14, padding: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
  btnSecondaire: { backgroundColor: '#E8F0FD', borderRadius: 14, padding: 12, alignItems: 'center', marginBottom: 12 },
  btnSecondaireText: { color: '#2F80ED', fontWeight: '600', fontSize: 13.5 },
  annuler: { textAlign: 'center', color: '#8E8E93', fontSize: 13, marginTop: 12 },
  codeRecup: { fontFamily: 'monospace', fontSize: 14, color: '#111827', textAlign: 'center', paddingVertical: 4 },
});
