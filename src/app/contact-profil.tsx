import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { sendRequest } from '@/api/request';
import { bloquerUtilisateur, signalerUtilisateur } from '@/api/actions/account';
import { enregistrerPhotoEnCache } from '@/hooks/use-photo-profil';

type Profil = {
  numero: string; nom: string; pseudo: string; bio: string; statut: string;
  verifie: boolean; en_ligne: boolean; photo_base64: string | null;
};

const LABELS_STATUT: Record<string, string> = {
  disponible: 'Disponible', occupe: 'Occupé', ne_pas_deranger: 'Ne pas déranger', absent: 'Absent',
};
const COULEURS_STATUT: Record<string, string> = {
  disponible: '#22C55E', occupe: '#F97316', ne_pas_deranger: '#EF4444', absent: '#9CA3AF',
};

export default function ContactProfilScreen() {
  const { numero, nom } = useLocalSearchParams<{ numero: string; nom?: string }>();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const r: any = await sendRequest<{ action: string; numero: string }, any>({ action: 'profil_contact', numero: String(numero ?? '') });
        if (annule) return;
        if (r?.ok && r.profil) {
          setProfil(r.profil as Profil);
          enregistrerPhotoEnCache(String(numero ?? ''), r.profil.photo_base64 ?? null);
        }
        else setErreur(r?.msg ?? 'Profil non disponible.');
      } catch (e: any) {
        if (!annule) setErreur(e?.message ?? 'Erreur réseau.');
      } finally {
        if (!annule) setChargement(false);
      }
    })();
    return () => { annule = true; };
  }, [numero]);

  const nomPropre = (profil?.nom || nom || numero || '?').toString().replace(/\s+/g, ' ').trim();
  const photoOk = !!profil?.photo_base64 && /^[A-Za-z0-9+/=]+$/.test(profil.photo_base64);

  const bloquer = () => {
    Alert.alert(`Bloquer ${nomPropre} ?`, "Cette personne ne pourra plus t'envoyer de messages.", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Bloquer', style: 'destructive',
        onPress: async () => {
          try {
            const res = await bloquerUtilisateur(String(numero), true);
            if (res?.ok) router.replace('/(tabs)' as any);
            else Alert.alert('Erreur', res?.msg ?? 'Impossible de bloquer cet utilisateur.');
          } catch (e: any) {
            Alert.alert('Erreur réseau', e?.message ?? 'Impossible de bloquer cet utilisateur.');
          }
        },
      },
    ]);
  };

  const envoyerSignalement = async (raison: string) => {
    try {
      const res = await signalerUtilisateur(String(numero), raison);
      if (res?.ok) Alert.alert('Signalement envoyé', "Merci. L'équipe va examiner ce signalement.");
      else Alert.alert('Erreur', res?.msg ?? "Impossible d'envoyer le signalement.");
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message ?? "Impossible d'envoyer le signalement.");
    }
  };

  const signaler = () => {
    Alert.alert(`Signaler ${nomPropre}`, 'Pour quelle raison ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Spam ou arnaque', onPress: () => envoyerSignalement('Spam ou arnaque') },
      { text: 'Harcèlement ou contenu choquant', onPress: () => envoyerSignalement('Harcèlement ou contenu choquant') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          {photoOk ? (
            <Image source={{ uri: `data:image/jpeg;base64,${profil!.photo_base64}` }} style={styles.avatarPhoto} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{nomPropre[0]?.toUpperCase()}</Text>
            </View>
          )}
          {!!profil && <View style={[styles.statutDot, { backgroundColor: profil.en_ligne ? '#22C55E' : '#D1D5DB' }]} />}
        </View>

        <Text style={styles.nom}>{nomPropre}</Text>
        {!!profil?.pseudo && <Text style={styles.pseudo}>@{profil.pseudo}</Text>}
        <Text selectable style={styles.identifiant}>{numero}</Text>

        {chargement && <ActivityIndicator style={{ marginTop: 24 }} />}
        {!chargement && !!erreur && <Text style={styles.erreur}>{erreur}</Text>}

        {!!profil && (
          <>
            <View style={styles.carte}>
              <Text style={styles.label}>Statut</Text>
              <View style={styles.statutRow}>
                <View style={[styles.petitPoint, { backgroundColor: COULEURS_STATUT[profil.statut] ?? '#9CA3AF' }]} />
                <Text style={styles.valeur}>{LABELS_STATUT[profil.statut] ?? 'Disponible'}{profil.en_ligne ? ' · en ligne' : ''}</Text>
              </View>
              <Text style={[styles.label, { marginTop: 14 }]}>Infos</Text>
              <Text style={styles.valeur}>{profil.bio?.trim() ? profil.bio : 'Aucune info.'}</Text>
            </View>
          </>
        )}

        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Ionicons name="chatbubble-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Envoyer un message</Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={signaler}>
            <Ionicons name="flag-outline" size={18} color="#F97316" />
            <Text style={[styles.actionText, { color: '#F97316' }]}>Signaler</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={bloquer}>
            <Ionicons name="ban-outline" size={18} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Bloquer</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 20, paddingBottom: 60, alignItems: 'center' },
  avatarWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#2F80ED', alignItems: 'center', justifyContent: 'center' },
  avatarPhoto: { width: 112, height: 112, borderRadius: 56 },
  avatarText: { color: '#fff', fontSize: 42, fontWeight: '700' },
  statutDot: { position: 'absolute', bottom: 6, right: 6, width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#FFFFFF' },
  nom: { fontSize: 21, fontWeight: '800', color: '#111827', marginTop: 14, textAlign: 'center' },
  pseudo: { fontSize: 14, color: '#6B7280', marginTop: 3 },
  identifiant: { fontSize: 12, color: '#9CA3AF', marginTop: 3, fontFamily: 'monospace' },
  erreur: { color: '#E5484D', fontSize: 13, marginTop: 18, textAlign: 'center' },
  carte: { alignSelf: 'stretch', backgroundColor: '#F6F6F7', borderRadius: 16, padding: 16, marginTop: 22 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  valeur: { fontSize: 14.5, color: '#111827', lineHeight: 21 },
  statutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  petitPoint: { width: 10, height: 10, borderRadius: 5 },
  btn: { alignSelf: 'stretch', backgroundColor: '#2F80ED', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  actions: { alignSelf: 'stretch', flexDirection: 'row', gap: 12, marginTop: 14 },
  action: { flex: 1, backgroundColor: '#F6F6F7', borderRadius: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontWeight: '600', fontSize: 14 },
});
