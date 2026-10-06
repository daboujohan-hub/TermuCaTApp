import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

import { useSessionStore } from '@/store/sessionStore';
import { suspendreReconnexionAuto, reprendreReconnexionAuto } from '@/api/socket';

const loginSchema = z.object({
  identifiant: z.string().min(4, 'Identifiant invalide'),
  mdp: z.string().min(1, 'Mot de passe requis'),
});
type LoginForm = z.infer<typeof loginSchema>;

const totpSchema = z.object({ code: z.string().length(6, 'Le code doit faire 6 chiffres') });
type TotpForm = z.infer<typeof totpSchema>;

export default function LoginScreen() {
  const { numeroGenere } = useLocalSearchParams<{ numeroGenere?: string }>();
  const { status, loading, error, login, verifyTotp, clearError } = useSessionStore();
  const [totpVisible, setTotpVisible] = useState(false);
  const [mdpVisible, setMdpVisible] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifiant: numeroGenere ?? '', mdp: '' },
  });

  const { control: totpControl, handleSubmit: handleTotpSubmit, formState: { errors: totpErrors } } = useForm<TotpForm>({
    resolver: zodResolver(totpSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = async (data: LoginForm) => { clearError(); await login(data.identifiant.trim(), data.mdp); };
  const onSubmitTotp = async (data: TotpForm) => { clearError(); await verifyTotp(data.code); };

  if (status === 'attente_2fa' && !totpVisible) setTotpVisible(true);

  useEffect(() => {
    if (status === 'connecte') router.replace('/(tabs)');
  }, [status]);

  useEffect(() => {
    if (totpVisible) {
      suspendreReconnexionAuto();
      return () => reprendreReconnexionAuto();
    }
  }, [totpVisible]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.title}>Connexion à TermChat</Text>
          <Text style={styles.subtitle}>Entre ton identifiant et ton mot de passe pour te connecter.</Text>

          {!!numeroGenere && !totpVisible && (
            <View style={styles.numeroGenereBox}>
              <Text style={styles.numeroGenereText}>
                Compte créé ! Ton identifiant : <Text style={styles.numeroGenereBold}>{numeroGenere}</Text>
              </Text>
            </View>
          )}

          {!totpVisible ? (
            <>
              <Text style={styles.label}>Identifiant</Text>
              <Controller control={control} name="identifiant" render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} placeholder="ex: TC010512345678" placeholderTextColor="#9CA3AF"
                  autoCapitalize="none" autoCorrect={false} onBlur={onBlur} onChangeText={onChange} value={value} />
              )} />
              {errors.identifiant && <Text style={styles.errorText}>{errors.identifiant.message}</Text>}

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
              {error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit(onSubmit)} disabled={loading}>
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.buttonText}>Connexion en cours...</Text>
                  </View>
                ) : <Text style={styles.buttonText}>Se connecter</Text>}
              </Pressable>

              <Link href="/(auth)/register" asChild>
                <Pressable style={styles.linkWrap}>
                  <Text style={styles.link}>Pas encore de compte ? S'inscrire</Text>
                </Pressable>
              </Link>
            </>
          ) : (
            <>
              <Text style={styles.label}>Code de vérification (Google Authenticator)</Text>
              <Controller control={totpControl} name="code" render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} placeholder="123456" placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad" maxLength={6} onBlur={onBlur} onChangeText={onChange} value={value} />
              )} />
              {totpErrors.code && <Text style={styles.errorText}>{totpErrors.code.message}</Text>}
              {error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleTotpSubmit(onSubmitTotp)} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Vérifier</Text>}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logo: { width: 56, height: 56, borderRadius: 14, alignSelf: 'center', marginBottom: 16 },
  title: { color: '#111827', fontSize: 26, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#8E8E93', fontSize: 14, marginBottom: 24, lineHeight: 20, textAlign: 'center' },
  numeroGenereBox: { backgroundColor: '#EAF2FE', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#CFE0FB' },
  numeroGenereText: { color: '#1565C0', fontSize: 13 },
  numeroGenereBold: { fontWeight: '700', fontFamily: 'monospace' },
  label: { color: '#8E8E93', fontSize: 12, marginBottom: 6, marginTop: 12, fontWeight: '500' },
  input: { backgroundColor: '#F6F6F7', color: '#111827', borderRadius: 16, padding: 14, fontSize: 16 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passwordInput: { flex: 1, backgroundColor: '#F6F6F7', color: '#111827', borderRadius: 16, padding: 14, fontSize: 16 },
  eyeBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F6F7', borderRadius: 16 },
  errorText: { color: '#E5484D', fontSize: 13, marginTop: 4 },
  button: { backgroundColor: '#2F80ED', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { color: '#2F80ED', fontSize: 14, fontWeight: '600' },
});
