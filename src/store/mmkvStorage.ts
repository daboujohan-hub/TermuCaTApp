import type { StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Stockage de session via AsyncStorage (remplace MMKV, qui échouait
 * silencieusement à l'initialisation sur certains builds Android New
 * Architecture, empêchant toute persistance de session sans erreur visible).
 */
export const mmkvStorage: StateStorage = {
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      console.warn('[storage] setItem échoué:', e);
    }
  },

  getItem: async (name) => {
    try {
      return await AsyncStorage.getItem(name);
    } catch (e) {
      console.warn('[storage] getItem échoué:', e);
      return null;
    }
  },

  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (e) {
      console.warn('[storage] removeItem échoué:', e);
    }
  },
};
