import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  createAudioPlayer,
  type AudioPlayer,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  envoyerMessage,
  envoyerFichier,
  envoyerVocal,
  telechargerVocal,
  historique,
  marquerLu,
  estErreur,
} from '@/api/actions/messaging';
import { supprimerMessage } from '@/api/actions/profile';
import { bloquerUtilisateur, signalerUtilisateur } from '@/api/actions/account';
import { chiffrerPourContact, dechiffrerDeContact } from '@/crypto/e2e';
import termchatSocket from '@/api/socket';
import type { MessageItem, PushNotification } from '@/api/protocol';
import { useSessionStore } from '@/store/sessionStore';

const MAX_FICHIER_OCTETS = 5 * 1024 * 1024;
// V1 : l'envoi de fichiers est désactivé (la réception n'est pas encore disponible).
const FICHIERS_ACTIFS = false;

function formaterDuree(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function ChatScreen() {
  const { numero, nom } = useLocalSearchParams<{ numero: string; nom?: string }>();
  const nomAffiche = nom || numero;
  const insets = useSafeAreaInsets();
  const user = useSessionStore((s) => s.user);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [texte, setTexte] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [envoiFichierEnCours, setEnvoiFichierEnCours] = useState(false);
  const [fichierPret, setFichierPret] = useState<{ uri: string; nom: string; taille: number } | null>(null);
  const [enregistrementActif, setEnregistrementActif] = useState(false);
  const [dureeEnregistrement, setDureeEnregistrement] = useState(0);
  const [vocalPret, setVocalPret] = useState<{ uri: string; duree: number } | null>(null);
  const [previewEnLecture, setPreviewEnLecture] = useState(false);
  const [lecture, setLecture] = useState<{ id: string } | null>(null);
  const [vocauxExpires, setVocauxExpires] = useState<Set<string>>(new Set());
  const listRef = useRef<FlatList>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playersRef = useRef<Map<string, AudioPlayer>>(new Map());
  const previewPlayerRef = useRef<AudioPlayer | null>(null);

  const charger = useCallback(async () => {
    if (!numero || !user?.numero) return;
    try {
      const cache = await AsyncStorage.getItem(`historique:${numero}`);
      if (cache) setMessages(JSON.parse(cache));
    } catch {}
    try {
      const res = await historique(numero);
      if (!estErreur(res)) {
        const items = [...res.historique].reverse();
        const dechiffres = await Promise.all(
          items.map(async (item) => {
            if (item.type === 'texte' && item.chiffre) {
              const clair = await dechiffrerDeContact(item.texte, user.numero, numero);
              return { ...item, texte: clair };
            }
            return item;
          })
        );
        setMessages(dechiffres);
        AsyncStorage.setItem(`historique:${numero}`, JSON.stringify(dechiffres)).catch(() => {});
      }
      marquerLu(numero);
    } catch {}
  }, [numero, user?.numero]);

  useEffect(() => {
    charger();

    const unsub = termchatSocket.onMessage(async (data: any) => {
      if (!data || 'ok' in data) return;
      const notif = data as PushNotification;
      if (notif.type === 'message' && notif.numero === numero) {
        let texteAffiche = notif.texte;
        if (notif.chiffre && user?.numero) {
          texteAffiche = await dechiffrerDeContact(notif.texte, user.numero, numero);
        }
        const nouveau: MessageItem = {
          id: notif.msg_id, de: notif.numero, vers: user?.numero ?? '', texte: texteAffiche,
          type: 'texte', heure: notif.heure, lu: true, chiffre: notif.chiffre,
        };
        setMessages((prev) => [nouveau, ...prev]);
        marquerLu(numero);
      } else if (notif.type === 'fichier' && notif.numero === numero) {
        const nouveau: MessageItem = {
          id: notif.msg_id, de: notif.numero, vers: user?.numero ?? '', texte: notif.nom_fichier,
          type: 'fichier', heure: notif.heure, lu: true, chiffre: notif.chiffre,
          nom_fichier: notif.nom_fichier, taille: notif.taille,
        };
        setMessages((prev) => [nouveau, ...prev]);
        marquerLu(numero);
      } else if (notif.type === 'message_supprime' && notif.de === numero) {
        setMessages((prev) => prev.filter((m) => m.id !== notif.msg_id));
      } else if (notif.type === 'vocal' && notif.numero === numero) {
        let uriLocal: string | undefined;
        try {
          uriLocal = (FileSystem.cacheDirectory ?? '') + notif.msg_id + '.m4a';
          await FileSystem.writeAsStringAsync(uriLocal, notif.contenu, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (e) {
          uriLocal = undefined;
        }
        const nouveau: MessageItem = {
          id: notif.msg_id, de: notif.numero, vers: user?.numero ?? '', texte: '',
          type: 'vocal', heure: notif.heure, lu: true, chiffre: notif.chiffre,
          duree: notif.duree, uriLocal,
        };
        setMessages((prev) => [nouveau, ...prev]);
        marquerLu(numero);
      }
    });
    return unsub;
  }, [numero, charger, user?.numero]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      playersRef.current.forEach((p) => { try { p.remove(); } catch {} });
      playersRef.current.clear();
    };
  }, []);

  const envoyer = async () => {
    const contenu = texte.trim();
    if (!contenu || !numero || !user?.numero || envoiEnCours) return;
    setTexte('');
    setEnvoiEnCours(true);
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      { id: tempId, de: user.numero, vers: numero, texte: contenu, type: 'texte',
        heure: new Date().toISOString(), lu: false, chiffre: false, enAttente: true },
      ...prev,
    ]);
    try {
      const { texte: texteEnvoi, chiffre } = await chiffrerPourContact(contenu, user.numero, numero);
      const res = await envoyerMessage(numero, texteEnvoi, chiffre);
      if (estErreur(res)) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        Alert.alert('Erreur', res.msg);
        setTexte(contenu);
      } else {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: res.msg_id, chiffre, enAttente: false } : m)));
      }
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert('Erreur réseau', e?.message ?? 'Impossible d\'envoyer le message.');
      setTexte(contenu);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const choisirFichier = async () => {
    if (!FICHIERS_ACTIFS) {
      Alert.alert('Bientôt disponible', "L'envoi de fichiers arrivera dans une prochaine mise à jour.");
      return;
    }
    if (!numero || !user?.numero || envoiFichierEnCours) return;
    if (!user.premium) {
      Alert.alert('Réservé au premium', "L'envoi de fichiers est réservé aux comptes premium.");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_FICHIER_OCTETS) {
        Alert.alert('Fichier trop volumineux', 'Le fichier ne doit pas dépasser 5 Mo.');
        return;
      }
      setFichierPret({ uri: asset.uri, nom: asset.name, taille: asset.size ?? 0 });
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? "Impossible de charger le fichier.");
    }
  };

  const annulerFichierPret = () => setFichierPret(null);

  const envoyerFichierPret = async () => {
    if (!fichierPret || !numero || !user?.numero) return;
    const { uri, nom, taille } = fichierPret;
    setFichierPret(null);
    setEnvoiFichierEnCours(true);
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      { id: tempId, de: user.numero, vers: numero, texte: nom, type: 'fichier',
        heure: new Date().toISOString(), lu: false, chiffre: false, nom_fichier: nom, taille, enAttente: true },
      ...prev,
    ]);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const tailleFinale = taille || Math.floor((base64.length * 3) / 4);
      const res = await envoyerFichier(numero, nom, base64, tailleFinale);
      if (estErreur(res)) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        Alert.alert('Erreur', res.msg);
      } else {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: res.msg_id, enAttente: false } : m)));
      }
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert('Erreur', e?.message ?? "Impossible d'envoyer le fichier.");
    } finally {
      setEnvoiFichierEnCours(false);
    }
  };

  const demarrerEnregistrement = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission refusée', "L'accès au micro est nécessaire pour enregistrer un vocal.");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setDureeEnregistrement(0);
      setEnregistrementActif(true);
      timerRef.current = setInterval(() => setDureeEnregistrement((d) => d + 1), 1000);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? "Impossible de démarrer l'enregistrement.");
    }
  };

  const annulerEnregistrement = async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setEnregistrementActif(false);
    try { await audioRecorder.stop(); } catch {}
  };

  const arreterEnregistrement = async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const dureeFinale = dureeEnregistrement;
    setEnregistrementActif(false);
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) return;
      if (dureeFinale < 1) { Alert.alert('Trop court', "L'enregistrement est trop court."); return; }
      setVocalPret({ uri, duree: dureeFinale });
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? "Impossible de terminer l'enregistrement.");
    }
  };

  const annulerVocalPret = async () => {
    if (previewPlayerRef.current) {
      try { previewPlayerRef.current.pause(); previewPlayerRef.current.remove(); } catch {}
      previewPlayerRef.current = null;
    }
    setPreviewEnLecture(false);
    setVocalPret(null);
  };

  const ecouterVocalPret = () => {
    if (!vocalPret) return;
    if (previewEnLecture) {
      previewPlayerRef.current?.pause();
      setPreviewEnLecture(false);
      return;
    }
    try {
      if (!previewPlayerRef.current) {
        previewPlayerRef.current = createAudioPlayer({ uri: vocalPret.uri });
      }
      previewPlayerRef.current.seekTo(0);
      previewPlayerRef.current.play();
      setPreviewEnLecture(true);
      setTimeout(() => setPreviewEnLecture(false), (vocalPret.duree + 0.4) * 1000);
    } catch (e: any) {
      Alert.alert('Erreur', "Impossible de lire l'aperçu.");
    }
  };

  const envoyerVocalPret = async () => {
    if (!vocalPret || !numero || !user?.numero) return;
    const { uri, duree } = vocalPret;
    if (previewPlayerRef.current) {
      try { previewPlayerRef.current.pause(); previewPlayerRef.current.remove(); } catch {}
      previewPlayerRef.current = null;
    }
    setPreviewEnLecture(false);
    setVocalPret(null);
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      { id: tempId, de: user.numero, vers: numero, texte: '', type: 'vocal',
        heure: new Date().toISOString(), lu: false, chiffre: false, duree, uriLocal: uri, enAttente: true },
      ...prev,
    ]);
    try {
      const info = await FileSystem.getInfoAsync(uri);
      const taille = info.exists && 'size' in info ? info.size ?? 0 : 0;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const res = await envoyerVocal(numero, base64, taille, duree);
      if (estErreur(res)) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        Alert.alert('Erreur', res.msg);
      } else {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: res.msg_id, enAttente: false } : m)));
      }
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert('Erreur', e?.message ?? "Impossible d'envoyer le vocal.");
    }
  };

  const confirmerSuppression = (item: MessageItem) => {
    Alert.alert('Supprimer le message', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          if (!numero) return;
          const res = await supprimerMessage(numero, item.id);
          if (estErreur(res)) Alert.alert('Erreur', res.msg);
          else setMessages((prev) => prev.filter((m) => m.id !== item.id));
        },
      },
    ]);
  };

    const bloquerContact = () => {
    if (!numero) return;
    Alert.alert(`Bloquer ${nomAffiche} ?`, "Cette personne ne pourra plus t'envoyer de messages.", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Bloquer',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await bloquerUtilisateur(numero, true);
            if (res?.ok) {
              Alert.alert('Utilisateur bloqué', `${nomAffiche} ne peut plus t'écrire.`, [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } else {
              Alert.alert('Erreur', res?.msg ?? 'Impossible de bloquer cet utilisateur.');
            }
          } catch (e: any) {
            Alert.alert('Erreur réseau', e?.message ?? 'Impossible de bloquer cet utilisateur.');
          }
        },
      },
    ]);
  };

  const envoyerSignalement = async (raison: string) => {
    if (!numero) return;
    try {
      const res = await signalerUtilisateur(numero, raison);
      if (res?.ok) Alert.alert('Signalement envoyé', "Merci. L'équipe va examiner ce signalement.");
      else Alert.alert('Erreur', res?.msg ?? "Impossible d'envoyer le signalement.");
    } catch (e: any) {
      Alert.alert('Erreur réseau', e?.message ?? "Impossible d'envoyer le signalement.");
    }
  };

  const signalerContact = () => {
    Alert.alert(`Signaler ${nomAffiche}`, 'Pour quelle raison ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Spam ou arnaque', onPress: () => envoyerSignalement('Spam ou arnaque') },
      { text: 'Harcèlement ou contenu choquant', onPress: () => envoyerSignalement('Harcèlement ou contenu choquant') },
    ]);
  };

  const ouvrirProfil = () => {
    if (!numero) return;
    router.push({ pathname: '/contact-profil', params: { numero, nom: nomAffiche ?? '' } } as any);
  };

  const partagerVocal = async (item: MessageItem) => {
    try {
      let uri = item.uriLocal;
      if (uri) {
        const infoLocal = await FileSystem.getInfoAsync(uri);
        if (!infoLocal.exists) uri = undefined;
      }
      if (!uri) {
        if (!numero) return;
        const cible = `${FileSystem.cacheDirectory ?? ''}${item.id}.m4a`;
        const info = await FileSystem.getInfoAsync(cible);
        if (!(info.exists && (info.size ?? 0) > 0)) {
          const res = await telechargerVocal(numero, item.id);
          if (estErreur(res)) {
            Alert.alert('Vocal indisponible', res.msg || "Ce message vocal n'est plus disponible.");
            return;
          }
          await FileSystem.writeAsStringAsync(cible, res.contenu, { encoding: FileSystem.EncodingType.Base64 });
        }
        uri = cible;
      }
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Partage impossible', "Le partage de fichiers n'est pas disponible sur cet appareil.");
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'audio/mp4', dialogTitle: 'Enregistrer ou partager le vocal' });
    } catch {
      Alert.alert('Erreur', 'Impossible de partager ce vocal.');
    }
  };

  const menuMessage = (item: MessageItem) => {
    if (item.enAttente) return;
    const boutons: any[] = [];
    if (item.type === 'texte' && item.texte) {
      boutons.push({ text: 'Copier', onPress: () => { Clipboard.setStringAsync(item.texte); } });
    } else if (item.type === 'vocal') {
      boutons.push({ text: 'Enregistrer / partager', onPress: () => partagerVocal(item) });
    }
    if (item.de === user?.numero) {
      boutons.push({ text: 'Supprimer', style: 'destructive', onPress: () => confirmerSuppression(item) });
    }
    if (!boutons.length) return;
    boutons.push({ text: 'Annuler', style: 'cancel' });
    Alert.alert('Message', undefined, boutons);
  };

  const ouvrirMenuContact = () => {
    Alert.alert(nomAffiche ?? 'Contact', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Signaler', onPress: signalerContact },
      { text: 'Bloquer', style: 'destructive', onPress: bloquerContact },
    ]);
  };

  const jouerVocal = async (item: MessageItem) => {
    if (vocauxExpires.has(item.id)) {
      Alert.alert('Vocal expiré', "Ce message vocal n'est plus disponible.");
      return;
    }
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }

    if (lecture?.id === item.id) {
      playersRef.current.get(item.id)?.pause();
      setLecture(null);
      return;
    }

    if (lecture) {
      playersRef.current.get(lecture.id)?.pause();
    }

    try {
      let uriLocal = item.uriLocal;

      // Le cache système peut avoir été vidé : on vérifie que le fichier existe encore.
      if (uriLocal) {
        try {
          const infoLocal = await FileSystem.getInfoAsync(uriLocal);
          if (!infoLocal.exists) uriLocal = undefined;
        } catch {
          uriLocal = undefined;
        }
      }

      // Les vocaux reçus dans une session précédente ne possèdent
      // pas encore de fichier local : on les récupère à la demande.
      if (!uriLocal) {
        if (!numero) {
          Alert.alert('Erreur', 'Conversation introuvable.');
          return;
        }

        const uri = `${FileSystem.cacheDirectory ?? ''}${item.id}.m4a`;

        const info = await FileSystem.getInfoAsync(uri);

        if (info.exists && (info.size ?? 0) > 0) {
          uriLocal = uri;
        } else {
          const res = await telechargerVocal(numero, item.id);

          if (estErreur(res)) {
            if ((res.msg || '').includes('plus disponible')) {
              setVocauxExpires((s) => new Set(s).add(item.id));
              Alert.alert('Vocal expiré', "Ce message vocal n'est plus disponible.");
            } else {
              Alert.alert('Vocal indisponible', res.msg || 'Impossible de récupérer ce vocal.');
            }
            return;
          }

          await FileSystem.writeAsStringAsync(uri, res.contenu, {
            encoding: FileSystem.EncodingType.Base64,
          });

          uriLocal = uri;

          setMessages((prev) => {
            const maj = prev.map((m) =>
              m.id === item.id
                ? {
                    ...m,
                    uriLocal: uri,
                    taille: res.taille,
                    duree: res.duree,
                  }
                : m
            );

            AsyncStorage.setItem(
              `historique:${numero}`,
              JSON.stringify(maj)
            ).catch(() => {});

            return maj;
          });
        }
      }

      let player = playersRef.current.get(item.id);

      if (!player) {
        player = createAudioPlayer({ uri: uriLocal });
        playersRef.current.set(item.id, player);
      }

      player.seekTo(0);
      player.play();
      setLecture({ id: item.id });

      playTimeoutRef.current = setTimeout(() => {
        setLecture((cur) => (cur?.id === item.id ? null : cur));
      }, ((item.duree ?? 0) + 0.4) * 1000);
    } catch (e: any) {
      console.log('Erreur lecture vocal:', e);
      Alert.alert('Erreur', 'Impossible de récupérer ou lire le message vocal.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText} onPress={ouvrirProfil}>{nomAffiche?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.headerTitle} numberOfLines={1} onPress={ouvrirProfil}>{nomAffiche}</Text>
        <Pressable onPress={ouvrirMenuContact} hitSlop={10} style={{ marginLeft: 'auto', padding: 4 }}>
          <Ionicons name="ellipsis-vertical" size={20} color="#111827" />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const sortant = item.de === user?.numero;
            return (
              <Pressable onLongPress={() => menuMessage(item)} delayLongPress={350} style={[styles.bubble, sortant ? styles.bubbleOut : styles.bubbleIn]}>
                {item.type === 'fichier' ? (
                  <View style={styles.fileRow}>
                    <Ionicons name="document-attach-outline" size={16} color="#111827" />
                    <Text style={styles.fileText} numberOfLines={1}>
                      {item.nom_fichier ?? item.texte}
                      {typeof item.taille === 'number' && item.taille > 0 ? ` · ${formaterTaille(item.taille)}` : ''}
                    </Text>
                  </View>
                ) : item.type === 'vocal' ? (
                  <Pressable style={styles.vocalRow} onPress={() => jouerVocal(item)}>
                    <Ionicons name={lecture?.id === item.id ? 'pause' : 'play'} size={16} color="#111827" />
                    <Text style={styles.bubbleText}>{vocauxExpires.has(item.id) ? 'Vocal expiré' : `Vocal · ${formaterDuree(item.duree ?? 0)}`}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.bubbleText}>{item.texte}</Text>
                )}
                <View style={styles.bubbleFooter}>
                  {item.enAttente ? (
                    <View style={styles.enAttenteRow}>
                      <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                      <Text style={styles.bubbleTime}>Envoi…</Text>
                    </View>
                  ) : (
                    <View style={styles.enAttenteRow}>
                      {item.chiffre && <Ionicons name="lock-closed" size={9} color="#9CA3AF" />}
                      <Text style={styles.bubbleTime}>{item.heure?.slice(-8, -3) || ''}</Text>
                    </View>
                  )}
                  {sortant && !item.enAttente && (
                    <Pressable onPress={() => confirmerSuppression(item)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={13} color="#9CA3AF" />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          }}
        />

        {enregistrementActif ? (
          <View style={[styles.recordingRow, { paddingBottom: 10 + insets.bottom }]}>
            <Pressable onPress={annulerEnregistrement} style={styles.recordingCancel}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
            <View style={styles.recordingInfo}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Enregistrement… {formaterDuree(dureeEnregistrement)} (relâche pour arrêter)</Text>
            </View>
            <Pressable style={styles.sendBtn} onPress={arreterEnregistrement}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </Pressable>
          </View>
        ) : vocalPret ? (
          <View style={[styles.recordingRow, { paddingBottom: 10 + insets.bottom }]}>
            <Pressable onPress={annulerVocalPret} style={styles.recordingCancel}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
            <Pressable style={styles.previewInfo} onPress={ecouterVocalPret}>
              <Ionicons name={previewEnLecture ? 'pause' : 'play'} size={18} color="#111827" />
              <Text style={styles.recordingText}>Vocal · {formaterDuree(vocalPret.duree)}</Text>
            </Pressable>
            <Pressable style={styles.sendBtn} onPress={envoyerVocalPret}>
              <Ionicons name="send" size={17} color="#fff" />
            </Pressable>
          </View>
        ) : fichierPret ? (
          <View style={[styles.recordingRow, { paddingBottom: 10 + insets.bottom }]}>
            <Pressable onPress={annulerFichierPret} style={styles.recordingCancel}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
            <View style={styles.previewInfo}>
              <Ionicons name="document-attach-outline" size={18} color="#111827" />
              <Text style={styles.recordingText} numberOfLines={1}>
                {fichierPret.nom}{fichierPret.taille ? ` · ${formaterTaille(fichierPret.taille)}` : ''}
              </Text>
            </View>
            <Pressable style={styles.sendBtn} onPress={envoyerFichierPret}>
              <Ionicons name="send" size={17} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <View style={[styles.inputRow, { paddingBottom: 10 + insets.bottom }]}>
            <Pressable style={styles.attachBtn} onPress={choisirFichier} disabled={envoiFichierEnCours}>
              <Ionicons name="attach-outline" size={20} color="#8E8E93" />
            </Pressable>
            <TextInput
              style={styles.input}
              placeholder="Message"
              placeholderTextColor="#9CA3AF"
              value={texte}
              onChangeText={setTexte}
              multiline
            />
            {texte.trim().length === 0 ? (
              <Pressable
                style={styles.sendBtn}
                onLongPress={demarrerEnregistrement}
                onPressOut={() => { if (enregistrementActif) arreterEnregistrement(); }}
                delayLongPress={180}
              >
                <Ionicons name="mic-outline" size={19} color="#fff" />
              </Pressable>
            ) : (
              <Pressable style={styles.sendBtn} onPress={envoyer} disabled={envoiEnCours}>
                <Ionicons name="send" size={17} color="#fff" />
              </Pressable>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#FFFFFF',
  },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2F80ED', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  listContent: { padding: 14, gap: 2 },
  bubble: { maxWidth: '78%', padding: 9, paddingHorizontal: 12, borderRadius: 16, marginVertical: 2 },
  bubbleIn: { alignSelf: 'flex-start', backgroundColor: '#F6F6F7', borderBottomLeftRadius: 4 },
  bubbleOut: { alignSelf: 'flex-end', backgroundColor: '#DCEEFF', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14.5, color: '#111827' },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fileText: { fontSize: 14.5, color: '#111827', fontWeight: '600', flexShrink: 1 },
  vocalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 3 },
  enAttenteRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bubbleTime: { fontSize: 10, color: '#9CA3AF' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10,
    borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#FFFFFF',
  },
  attachBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F6F6F7', alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, backgroundColor: '#F6F6F7', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14.5, color: '#111827', maxHeight: 100,
  },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2F80ED', alignItems: 'center', justifyContent: 'center' },
  recordingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
    borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#FFFFFF',
  },
  recordingCancel: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  recordingInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  recordingText: { color: '#111827', fontSize: 14 },
});
