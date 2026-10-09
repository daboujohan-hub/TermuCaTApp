import { router } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { useSessionStore } from '@/store/sessionStore';

const LABELS_STATUT: Record<string, string> = {
  disponible: 'Disponible',
  occupe: 'Occupé',
  ne_pas_deranger: 'Ne pas déranger',
  absent: 'Absent',
};

const COULEURS_STATUT: Record<string, string> = {
  disponible: '#22C55E',
  occupe: '#F97316',
  ne_pas_deranger: '#EF4444',
  absent: '#9CA3AF',
};

export default function AccountScreen() {
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);
  const statutCouleur = COULEURS_STATUT[user?.statut ?? 'disponible'] ?? '#9CA3AF';
  const statutLabel = LABELS_STATUT[user?.statut ?? 'disponible'] ?? 'Disponible';

  const partagerIdentifiant = () => {
    if (!user?.numero) return;
    Share.share({ message: `Retrouve-moi sur TermChat ! Mon identifiant : ${user.numero}` }).catch(() => {});
  };

  const seDeconnecter = () => {
    Alert.alert('Se déconnecter ?', 'Tu devras ressaisir ton identifiant et ton mot de passe pour te reconnecter.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => { logout(); router.replace('/welcome' as any); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#2F80ED', '#1565C0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <Text style={styles.bannerTitle}>Compte</Text>
        </LinearGradient>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {user?.photo_profil ? (
              <Image source={{ uri: user.photo_profil }} style={styles.avatarPhoto} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.nom || '?')[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={[styles.statutDot, { backgroundColor: statutCouleur }]} />
          </View>
          <Text style={styles.nom}>{(user?.nom ?? '—').replace(/\s+/g, ' ').trim()}</Text>
          <Text selectable style={styles.pseudo}>@{user?.pseudo ?? '—'} · {user?.numero ?? '—'}</Text>
          <Text style={styles.statutLabel}>{statutLabel}</Text>
          {!!user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
          <Pressable style={styles.badge} onPress={() => router.push('/abonnement' as any)}>
            <Text style={styles.badgeText}>
              {user?.premium ? '⭐ ' + (user.premium_type ?? 'Premium') : '🆓 Compte gratuit'}
            </Text>
          </Pressable>

          <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile' as any)}>
            <Ionicons name="create-outline" size={15} color="#111827" />
            <Text style={styles.editBtnText}>Modifier le profil</Text>
          </Pressable>
        </View>

        <View style={styles.menu}>
          <Pressable style={styles.row} onPress={partagerIdentifiant}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="share-social-outline" size={18} color="#2F80ED" />
            </View>
            <Text style={styles.rowLabel}>Partager mon identifiant</Text>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </Pressable>

          <Pressable style={styles.row} onPress={() => router.push('/settings' as any)}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="settings-outline" size={18} color="#2F80ED" />
            </View>
            <Text style={styles.rowLabel}>Paramètres</Text>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </Pressable>

          <Pressable style={styles.row} onPress={() => router.push('/security' as any)}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#2F80ED" />
            </View>
            <Text style={styles.rowLabel}>Sécurité</Text>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </Pressable>

          <Pressable style={styles.row} onPress={() => router.push('/docs' as any)}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="help-circle-outline" size={18} color="#2F80ED" />
            </View>
            <Text style={styles.rowLabel}>Aide</Text>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </Pressable>

          <Pressable style={styles.row} onPress={seDeconnecter}>
            <View style={[styles.rowIconWrap, styles.rowIconWrapDanger]}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.rowLabel, styles.logoutText]}>Se déconnecter</Text>
          </Pressable>
        </View>
      <Text style={{ textAlign: 'center', color: '#C7C7CC', fontSize: 12, marginTop: 24 }}>
          TermChat v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingBottom: 60 },
  banner: {
    height: 120,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 8,
    justifyContent: 'flex-start',
  },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  profileCard: { alignItems: 'center', paddingHorizontal: 20, marginTop: -46 },
  avatarWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#2F80ED', alignItems: 'center', justifyContent: 'center',
  },
  avatarPhoto: { width: 84, height: 84, borderRadius: 42 },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
  statutDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 3, borderColor: '#FFFFFF',
  },
  nom: { fontSize: 19, fontWeight: '800', color: '#111827', marginTop: 12 },
  pseudo: { fontSize: 13, color: '#8E8E93', marginTop: 3, fontFamily: 'monospace' },
  statutLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  bio: { fontSize: 13, color: '#8E8E93', marginTop: 8, textAlign: 'center' },
  badge: {
    marginTop: 12, backgroundColor: '#1565C0', borderRadius: 50,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  editBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F6F6F7',
  },
  editBtnText: { color: '#111827', fontSize: 13, fontWeight: '600' },
  menu: { paddingHorizontal: 20, marginTop: 28, gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F6F6F7', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rowIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#EAF2FE', alignItems: 'center', justifyContent: 'center',
  },
  rowIconWrapDanger: { backgroundColor: '#FDECEC' },
  rowLabel: { fontSize: 15, color: '#111827', flex: 1, fontWeight: '600' },
  logoutText: { color: '#EF4444' },
});
