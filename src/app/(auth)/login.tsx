import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { useSessionStore } from '@/store/sessionStore';

const loginSchema = z.object({
  numero: z.string().min(4, 'Numéro invalide'),
  mdp: z.string().min(1, 'Mot de passe requis'),
});
type LoginForm = z.infer<typeof loginSchema>;

const totpSchema = z.object({
  code: z.string().length(6, 'Le code doit faire 6 chiffres'),
});
type TotpForm = z.infer<typeof totpSchema>;

export default function LoginScreen() {
  const { status, loading, error, login, verifyTotp, clearError } = useSessionStore();
  const [totpVisible, setTotpVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { numero: '', mdp: '' },
  });

  const {
    control: totpControl,
    handleSubmit: handleTotpSubmit,
    formState: { errors: totpErrors },
  } = useForm<TotpForm>({
    resolver: zodResolver(totpSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    clearError();
    await login(data.numero, data.mdp);
  };

  const onSubmitTotp = async (data: TotpForm) => {
    clearError();
    await verifyTotp(data.code);
  };

  // Bascule automatiquement sur le formulaire TOTP quand le store l'indique
  if (status === 'attente_totp' && !totpVisible) {
    setTotpVisible(true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>TermChat</Text>

        {!totpVisible ? (
          <>
            <Text style={styles.label}>Numéro</Text>
            <Controller
              control={control}
              name="numero"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="+225XXXXXXXXX"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.numero && <Text style={styles.errorText}>{errors.numero.message}</Text>}

            <Text style={styles.label}>Mot de passe</Text>
            <Controller
              control={control}
              name="mdp"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  secureTextEntry
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.mdp && <Text style={styles.errorText}>{errors.mdp.message}</Text>}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
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
            <Controller
              control={totpControl}
              name="code"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={6}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {totpErrors.code && <Text style={styles.errorText}>{totpErrors.code.message}</Text>}
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleTotpSubmit(onSubmitTotp)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Vérifier</Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
  label: { color: '#aaa', fontSize: 14, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  errorText: { color: '#ff5555', fontSize: 13, marginTop: 4 },
  button: {
    backgroundColor: '#0f0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { color: '#0af', fontSize: 14 },
});
