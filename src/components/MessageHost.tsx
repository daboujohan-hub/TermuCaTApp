import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Msg = { texte: string; type: 'erreur' | 'info' };
let ecouteur: ((m: Msg) => void) | null = null;

export function afficherErreur(texte: unknown) {
  ecouteur?.({ texte: String(texte ?? 'Une erreur est survenue.'), type: 'erreur' });
}
export function afficherInfo(texte: unknown) {
  ecouteur?.({ texte: String(texte ?? ''), type: 'info' });
}

export default function MessageHost() {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<Msg | null>(null);
  const opacite = useRef(new Animated.Value(0)).current;
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fermer = () => {
    Animated.timing(opacite, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setMsg(null));
  };

  useEffect(() => {
    ecouteur = (m) => {
      if (minuteur.current) clearTimeout(minuteur.current);
      setMsg(m);
      opacite.setValue(0);
      Animated.timing(opacite, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      minuteur.current = setTimeout(fermer, 4000);
    };
    return () => { ecouteur = null; if (minuteur.current) clearTimeout(minuteur.current); };
  }, []);

  if (!msg) return null;
  const erreur = msg.type === 'erreur';
  return (
    <Animated.View pointerEvents="box-none" style={[s.wrap, { top: insets.top + 8, opacity: opacite }]}>
      <Pressable onPress={fermer} style={[s.carte, erreur ? s.carteErreur : s.carteInfo]}>
        <Ionicons name={erreur ? 'alert-circle' : 'information-circle'} size={22} color={erreur ? '#E5484D' : '#2F80ED'} />
        <Text style={s.texte}>{msg.texte}</Text>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14, zIndex: 9999, elevation: 20 },
  carte: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14, borderLeftWidth: 5,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  carteErreur: { borderLeftColor: '#E5484D' },
  carteInfo: { borderLeftColor: '#2F80ED' },
  texte: { flex: 1, color: '#111827', fontSize: 14, lineHeight: 19 },
});
