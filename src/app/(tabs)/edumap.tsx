import { useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

import { sendRequest } from '@/api/request';

export default function EduMapScreen() {
  const webviewRef = useRef<WebView>(null);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(require('../../assets/edumap.html'));
        await asset.downloadAsync();
        const contenu = await FileSystem.readAsStringAsync(asset.localUri || asset.uri);
        setHtml(contenu);
      } catch (e) {
        setHtml('<html><body style="background:#0B0F1A;color:#fff;padding:20px;font-family:sans-serif">Erreur de chargement de la page.</body></html>');
      }
    })();
  }, []);

  const envoyerAuWebView = (fonction: string, data: any) => {
    const script = `
      if (window.${fonction}) { window.${fonction}(${JSON.stringify(JSON.stringify(data))}); }
      true;
    `;
    webviewRef.current?.injectJavaScript(script);
  };

  // Injection "brute" pour appeler une fonction avec plusieurs arguments simples
  // (pas un unique objet JSON, contrairement à envoyerAuWebView ci-dessus).
  const injecterScript = (script: string) => {
    webviewRef.current?.injectJavaScript(`${script} true;`);
  };

  const demanderPosition = async (contexte: string) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        injecterScript(
          `window.edumapPositionErreur && window.edumapPositionErreur(${JSON.stringify(contexte)});`
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      injecterScript(
        `window.edumapPositionResultat && window.edumapPositionResultat(${JSON.stringify(contexte)}, ${pos.coords.latitude}, ${pos.coords.longitude});`
      );
    } catch (e) {
      injecterScript(
        `window.edumapPositionErreur && window.edumapPositionErreur(${JSON.stringify(contexte)});`
      );
    }
  };

  const choisirPhotosEcole = async (restant: number) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        injecterScript(`window.edumapPhotosResultat && window.edumapPhotosResultat('[]');`);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, restant),
        quality: 0.5,
        base64: true,
      });
      if (result.canceled) {
        injecterScript(`window.edumapPhotosResultat && window.edumapPhotosResultat('[]');`);
        return;
      }
      const base64s = result.assets.map((a) => a.base64).filter((b): b is string => !!b);
      injecterScript(
        `window.edumapPhotosResultat && window.edumapPhotosResultat(${JSON.stringify(JSON.stringify(base64s))});`
      );
    } catch (e) {
      injecterScript(`window.edumapPhotosResultat && window.edumapPhotosResultat('[]');`);
    }
  };

  const onMessage = async (event: any) => {
    let msg: any;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'edumap_list_request') {
      try {
        const res = await sendRequest({ action: 'edumap_lister_ecoles', sans_photos: true } as any);
        envoyerAuWebView('edumapListeResultat', res);
      } catch (e: any) {
        envoyerAuWebView('edumapListeResultat', { ok: false, msg: e?.message ?? 'Erreur reseau.' });
      }
    } else if (msg.type === 'edumap_add') {
      try {
        const res = await sendRequest({ ...msg.payload, action: 'edumap_ajouter_ecole' } as any);
        envoyerAuWebView('edumapAjoutResultat', res);
      } catch (e: any) {
        envoyerAuWebView('edumapAjoutResultat', { ok: false, msg: e?.message ?? 'Erreur reseau.' });
      }
    } else if (msg.type === 'geoloc_request') {
      demanderPosition(msg.contexte ?? 'utilisateur');
    } else if (msg.type === 'edumap_photo_request') {
      const id = String(msg.id ?? '');
      const index = Number(msg.index);
      if (/^[A-Za-z0-9_-]{1,64}$/.test(id) && Number.isInteger(index) && index >= 0 && index <= 9) {
        try {
          const res: any = await sendRequest({ action: 'edumap_photo', id, index } as any);
          envoyerAuWebView('edumapPhotoResultat', { ...res, id, index });
        } catch (e: any) {
          envoyerAuWebView('edumapPhotoResultat', { ok: false, msg: e?.message ?? 'Erreur reseau.', id, index });
        }
      }
    } else if (msg.type === 'edumap_propose') {
      try {
        const res = await sendRequest({ ...msg.payload, action: 'edumap_proposer_ecole' } as any);
        envoyerAuWebView('edumapPropositionResultat', res);
      } catch (e: any) {
        envoyerAuWebView('edumapPropositionResultat', { ok: false, msg: e?.message ?? 'Erreur reseau.' });
      }
    } else if (msg.type === 'open_maps') {
      const lat = Number(msg.lat);
      const lng = Number(msg.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
      }
    } else if (msg.type === 'edumap_pick_photos') {
      choisirPhotosEcole(msg.restant ?? 5);
    }
  };

  if (!html) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.loading}>
          <ActivityIndicator color="#208AEF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <WebView
        ref={webviewRef}
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        
        onMessage={onMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0C1B' },
  webview: { flex: 1, backgroundColor: '#0A0C1B' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
