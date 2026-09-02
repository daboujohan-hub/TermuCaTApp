import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Réglages</Text>
      <Text style={styles.stub}>Thème, statut, notifications — à venir.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F8', padding: 20 },
  title: { fontSize: 23, fontWeight: '800', color: '#16201C', marginBottom: 8 },
  stub: { fontSize: 14, color: '#6B7A73' },
});
