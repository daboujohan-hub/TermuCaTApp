import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  pinDefini, definirPin, supprimerPin, empreinteActive, setEmpreinte, empreinteDisponible, demanderEmpreinte,
} from '@/lib/verrou';

type Etape = 'idle' | 'saisie' | 'confirmer';

export default function VerrouSection() {
  const [pinActif, setPinActif] = useState(false);
  const [bioActive, setBioActive] = useState(false);
  const [bioDispo, setBioDispo] = useState(false);
  const [etape, setEtape] = useState<Etape>('idle');
  const [premier, setPremier] = useState('');
  const [valeur, setValeur] = useState('');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    (async () => {
      setPinActif(await pinDefini());
      setBioActive(await empreinteActive());
      setBioDispo(await empreinteDisponible());
    })();
  }, []);

  const saisir = async (t: string) => {
    const v = t.replace(/\D/g, '').slice(0, 6);
    setValeur(v); setErreur('');
    if (v.length < 6) return;
    if (etape === 'saisie') { setPremier(v); setValeur(''); setEtape('confirmer'); return; }
    if (v !== premier) {
      setErreur('Les deux codes sont différents. Recommence.');
      setValeur(''); setPremier(''); setEtape('saisie');
      return;
    }
    await definirPin(v);
    setPinActif(true); setEtape('idle'); setValeur(''); setPremier('');
    Alert.alert('Code PIN activé', "L'application se verrouillera après 30 secondes hors de l'écran.");
  };

  const desactiver = () =>
    Alert.alert('Désactiver le code PIN ?', "L'empreinte digitale sera aussi désactivée.", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Désactiver', style: 'destructive', onPress: async () => { await supprimerPin(); setPinActif(false); setBioActive(false); } },
    ]);

  const basculerEmpreinte = async (v: boolean) => {
    if (v && !(await demanderEmpreinte('Confirme ton empreinte'))) return;
    await setEmpreinte(v);
    setBioActive(v);
  };

  return (
    <View style={s.wrap}>
      <Text style={s.section}>VERROUILLAGE DE L'APPLICATION</Text>
      <View style={s.card}>
        {etape === 'idle' ? (
          <>
            <Pressable style={s.row} onPress={pinActif ? desactiver : () => { setErreur(''); setEtape('saisie'); }}>
              <Text style={[s.label, pinActif && { color: '#E5484D' }]}>
                {pinActif ? 'Désactiver le code PIN' : 'Activer le code PIN (6 chiffres)'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </Pressable>
            {pinActif && bioDispo && (
              <View style={[s.row, s.sep]}>
                <Text style={s.label}>Empreinte digitale</Text>
                <Switch value={bioActive} onValueChange={basculerEmpreinte} trackColor={{ false: '#D1D5DB', true: '#2F80ED' }} thumbColor="#FFFFFF" />
              </View>
            )}
          </>
        ) : (
          <View style={{ padding: 16 }}>
            <Text style={s.hint}>{etape === 'saisie' ? 'Choisis un code PIN à 6 chiffres.' : 'Saisis-le encore pour confirmer.'}</Text>
            <TextInput
              style={s.input} value={valeur} onChangeText={saisir} keyboardType="number-pad"
              secureTextEntry maxLength={6} autoFocus placeholder="••••••" placeholderTextColor="#9CA3AF"
            />
            <Text style={s.annuler} onPress={() => { setEtape('idle'); setValeur(''); setPremier(''); setErreur(''); }}>Annuler</Text>
          </View>
        )}
      </View>
      {!!erreur && <Text style={s.erreur}>{erreur}</Text>}
      <Text style={s.note}>Le code PIN protège l'accès à l'application sur ce téléphone. Il ne remplace pas ton mot de passe.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 28 },
  section: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  card: { backgroundColor: '#F6F6F7', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  sep: { borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  label: { fontSize: 14.5, color: '#111827' },
  hint: { fontSize: 13, color: '#8E8E93', marginBottom: 12 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, fontSize: 20, textAlign: 'center', letterSpacing: 8, color: '#111827' },
  annuler: { textAlign: 'center', color: '#8E8E93', fontSize: 13, marginTop: 12 },
  erreur: { color: '#E5484D', fontSize: 13, marginTop: 8 },
  note: { fontSize: 12, color: '#9CA3AF', marginTop: 10, lineHeight: 17 },
});
