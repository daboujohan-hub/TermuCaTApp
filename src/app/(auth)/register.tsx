import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

import { inscrire, estErreur } from '@/api/actions/auth';
import { DEFAULT_COUNTRY, type Country } from '@/constants/countries';
import CountryPickerModal from '@/components/CountryPickerModal';

const registerSchema = z
  .object({
    prenom: z.string().min(1, 'Requis').max(15, 'Trop long'),
    nom: z.string().min(1, 'Requis').max(15, 'Trop long'),
    pseudo: z.string().min(3, '3 à 20 caractères').max(20, '3 à 20 caractères')
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Doit commencer par une lettre, puis lettres/chiffres/_'),
    mdp: z.string().min(12, 'Minimum 12 caractères').refine(
      (v) => [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(v)).length >= 3,
      'Utilise au moins 3 types : minuscule, majuscule, chiffre, symbole'
    ),
  })
  .refine((data) => `${data.prenom} ${data.nom}`.trim().length <= 20, {
    message: 'Prénom + Nom : 20 caractères max au total', path: ['nom'],
  });
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pays, setPays] = useState<Country>(DEFAULT_COUNTRY);
  const [pickerOuvert, setPickerOuvert] = useState(false);
  const [mdpVisible, setMdpVisible] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { prenom: '', nom: '', pseudo: '', mdp: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setLoading(true);
    try {
      const res = await inscrire({ prenom: data.prenom, nom: `${data.prenom} ${data.nom}`.trim(), pseudo: data.pseudo, prefixe: pays.code, mdp: data.mdp });
      if (estErreur(res)) setError(res.msg);
      else router.replace({ pathname: '/(auth)/login', params: { numeroGenere: res.numero } });
    } catch (e: any) {
      setError(e?.message ?? 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.title}>Créer ton compte</Text>
          <Text style={styles.subtitle}>Quelques infos pour démarrer sur TermChat.</Text>

          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <Text style={styles.label}>Prénom</Text>
              <Controller control={control} name="prenom" render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} placeholder="Ton prénom" placeholderTextColor="#9CA3AF" onBlur={onBlur} onChangeText={onChange} value={value} />
              )} />
              {errors.prenom && <Text style={styles.errorText}>{errors.prenom.message}</Text>}
            </View>
            <View style={styles.nameField}>
              <Text style={styles.label}>Nom</Text>
              <Controller control={control} name="nom" render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} placeholder="Ton nom" placeholderTextColor="#9CA3AF" onBlur={onBlur} onChangeText={onChange} value={value} />
              )} />
              {errors.nom && <Text style={styles.errorText}>{errors.nom.message}</Text>}
            </View>
          </View>

          <Text style={styles.label}>Pseudo</Text>
          <Controller control={control} name="pseudo" render={({ field: { onChange, onBlur, value } }) => (
            <TextInput style={styles.input} placeholder="tonpseudo" placeholderTextColor="#9CA3AF" autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} />
          )} />
          {errors.pseudo && <Text style={styles.errorText}>{errors.pseudo.message}</Text>}

          <Text style={styles.label}>Pays</Text>
          <Pressable style={styles.countryRow} onPress={() => setPickerOuvert(true)}>
            <Text style={styles.countryFlag}>{pays.flag}</Text>
            <Text style={styles.countryName}>{pays.name}</Text>
            <Text style={styles.countryCode}>{pays.code}</Text>
            <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
          </Pressable>

          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.passwordRow}>
            <Controller control={control} name="mdp" render={({ field: { onChange, onBlur, value } }) => (
              <TextInput style={styles.passwordInput} placeholder="••••••••" placeholderTextColor="#9CA3AF"
                secureTextEntry={!mdpVisible} autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} />
            )} />
            <Pressable style={styles.eyeBtn} onPress={() => setMdpVisible((v) => !v)}>
              <Ionicons name={mdpVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8E8E93" />
            </Pressable>
          </View>
          {errors.mdp && <Text style={styles.errorText}>{errors.mdp.message}</Text>}
          <Text style={styles.hint}>Min. 12 caractères, 3 classes parmi minuscule/majuscule/chiffre/symbole</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit(onSubmit)} disabled={loading}>
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.buttonText}>Inscription en cours...</Text>
              </View>
            ) : <Text style={styles.buttonText}>S'inscrire</Text>}
          </Pressable>

          <Text style={[styles.hint, { textAlign: 'center', marginTop: 16 }]}>
              En t'inscrivant, tu acceptes les{' '}
              <Text style={styles.link} onPress={() => router.push('/terms' as any)}>Conditions d'utilisation</Text>
              {' '}et la{' '}
              <Text style={styles.link} onPress={() => router.push('/privacy' as any)}>Politique de confidentialité</Text>.
            </Text>

            <Link href="/(auth)/login" asChild>
            <Pressable style={styles.linkWrap}>
              <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>

      <CountryPickerModal visible={pickerOuvert} onClose={() => setPickerOuvert(false)} onSelect={setPays} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, padding: 24, paddingTop: 12, paddingBottom: 48 },
  logo: { width: 52, height: 52, borderRadius: 13, alignSelf: 'center', marginBottom: 14 },
  title: { color: '#111827', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: '#8E8E93', fontSize: 14, marginBottom: 22, marginTop: 6, textAlign: 'center' },
  label: { color: '#8E8E93', fontSize: 12, marginBottom: 6, marginTop: 16, fontWeight: '500' },
  nameRow: { flexDirection: 'row', gap: 12 },
  nameField: { flex: 1 },
  input: { backgroundColor: '#F6F6F7', color: '#111827', borderRadius: 16, padding: 14, fontSize: 16 },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F6F6F7', borderRadius: 16, padding: 14 },
  countryFlag: { fontSize: 19 },
  countryName: { flex: 1, fontSize: 15, color: '#111827' },
  countryCode: { fontSize: 14, color: '#8E8E93', fontFamily: 'monospace' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passwordInput: { flex: 1, backgroundColor: '#F6F6F7', color: '#111827', borderRadius: 16, padding: 14, fontSize: 16 },
  eyeBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F6F7', borderRadius: 16 },
  hint: { color: '#9CA3AF', fontSize: 12, marginTop: 6 },
  errorText: { color: '#E5484D', fontSize: 13, marginTop: 4 },
  button: { backgroundColor: '#2F80ED', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 26 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { color: '#2F80ED', fontSize: 14, fontWeight: '600' },
});
