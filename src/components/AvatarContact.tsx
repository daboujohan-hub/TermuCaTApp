import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { usePhotoProfil } from '@/hooks/use-photo-profil';

// Avatar d'un contact : sa photo si elle est disponible, sinon la première lettre de son nom.
export default function AvatarContact({ numero, nom, taille = 50 }: { numero?: string; nom?: string; taille?: number }) {
  const uri = usePhotoProfil(numero);
  const [casse, setCasse] = useState(false);
  useEffect(() => { setCasse(false); }, [uri]);

  const initiale = (nom || numero || '?').trim()[0]?.toUpperCase() ?? '?';
  const forme = { width: taille, height: taille, borderRadius: taille / 2 };

  if (uri && !casse) {
    return <Image source={{ uri }} style={[forme, styles.photo]} onError={() => setCasse(true)} />;
  }
  return (
    <View style={[forme, styles.initiale]}>
      <Text style={[styles.lettre, { fontSize: taille * 0.36 }]}>{initiale}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { backgroundColor: '#E5E7EB' },
  initiale: { backgroundColor: '#2F80ED', alignItems: 'center', justifyContent: 'center' },
  lettre: { color: '#fff', fontWeight: '700' },
});
