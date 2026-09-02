import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { inscrire, estErreur } from '@/api/actions/auth';

const registerSchema = z.object({
  nom: z.string().min(2, '2 à 20 caractères').max(20, '2 à 20 caractères'),
  pseudo: z
    .string()
    .min(3, '3 à 20 caractères')
    .max(20, '3 à 20 caractères')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Doit commencer par une lettre, puis lettres/chiffres/_'),
  prefixe: z.string().min(1, 'Requis'),
  mdp: z.string().min(12, 'Minimum 12 caractères'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nom: '', pseudo: '', prefixe: '+225', mdp: '', email: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setLoading(true);
    try {
      const res = await inscrire({
        nom: data.nom,
        pseudo: data.pseudo,
        prefixe: data.prefixe,
        mdp: data.mdp,
        email: data.email || undefined,
      });
      if (estErreur(res)) {
        setError(res.msg);
      } else {
        router.replace({ pathname: '/(auth)/login', params: { numeroGenere: res.numero } });
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Créer un compte</Text>

        <Text style={styles.label}>Nom</Text>
        <Controller
          control={control}
          name="nom"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Ton nom"
              placeholderTextColor="#666"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.nom && <Text style={styles.errorText}>{errors.nom.message}</Text>}

        <Text style={styles.label}>Pseudo</Text>
        <Controller
          control={control}
          name="pseudo"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="tonpseudo"
              placeholderTextColor="#666"
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.pseudo && <Text style={styles.errorText}>{errors.pseudo.message}</Text>}

        <Text style={styles.label}>Préfixe pays</Text>
        <Controller
          control={control}
          name="prefixe"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="+225"
              placeholderTextColor="#666"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.prefixe && <Text style={styles.errorText}>{errors.prefixe.message}</Text>}

        <Text style={styles.label}>Email (optionnel)</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="toi@exemple.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

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
        <Text style={styles.hint}>Min. 12 caractères, 3 classes parmi minuscule/majuscule/chiffre/symbole</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.linkWrap}>
            <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { padding: 24, paddingBottom: 48 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
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
  hint: { color: '#666', fontSize: 12, marginTop: 4 },
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
