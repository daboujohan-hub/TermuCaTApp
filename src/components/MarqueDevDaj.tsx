import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Signature de l'éditeur, affichée en bas de l'écran.
export default function MarqueDevDaj() {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" style={[styles.conteneur, { bottom: insets.bottom + 8 }]}>
      <Text style={styles.nom}>DEV.D.A.J</Text>
      <Text style={styles.sous}>ABOUDEV LABS 🇨🇮</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  nom: { fontSize: 12, fontWeight: '800', letterSpacing: 3, color: '#6B7280' },
  sous: { fontSize: 9.5, letterSpacing: 2, color: '#9CA3AF', marginTop: 2 },
});
