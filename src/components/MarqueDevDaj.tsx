import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Signature de l'éditeur. Par défaut collée en bas de l'écran ;
// avec enFlux, elle s'affiche dans la mise en page normale (sous les boutons).
export default function MarqueDevDaj({ enFlux = false }: { enFlux?: boolean }) {
  const insets = useSafeAreaInsets();
  const placement = enFlux
    ? { paddingBottom: 12 }
    : { position: 'absolute' as const, left: 0, right: 0, bottom: insets.bottom + 8 };
  return (
    <View pointerEvents="none" style={[styles.conteneur, placement]}>
      <Text style={styles.nom}>DEV.D.A.J</Text>
      <Text style={styles.sous}>ABOUDEV LABS 🇨🇮</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { alignItems: 'center' },
  nom: { fontSize: 12, fontWeight: '800', letterSpacing: 3, color: '#6B7280' },
  sous: { fontSize: 9.5, letterSpacing: 2, color: '#9CA3AF', marginTop: 2 },
});
