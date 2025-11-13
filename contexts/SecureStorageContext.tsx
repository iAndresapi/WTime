import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';
import type { AppSettings, EmergencyContact, EncryptedNote } from '@/types';

const STORAGE_KEY = '@wtime_secure_data';
const ENCRYPTION_KEY = 'wtime_security_2025_key_v1';

async function encryptData(data: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    ENCRYPTION_KEY + data
  );
  return Buffer.from(JSON.stringify({ data, digest })).toString('base64');
}

async function decryptData(encryptedData: string): Promise<string | null> {
  try {
    const decoded = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
    const expectedDigest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      ENCRYPTION_KEY + decoded.data
    );
    if (expectedDigest === decoded.digest) {
      return decoded.data;
    }
    return null;
  } catch {
    return null;
  }
}

const defaultSettings: AppSettings = {
  emergencyContacts: [],
  notes: [],
  isFirstLaunch: true,
};

export const [SecureStorageProvider, useSecureStorage] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const encrypted = await AsyncStorage.getItem(STORAGE_KEY);
      if (encrypted) {
        const decrypted = await decryptData(encrypted);
        if (decrypted) {
          const parsed = JSON.parse(decrypted);
          setSettings(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSettings(newSettings: AppSettings) {
    try {
      const dataString = JSON.stringify(newSettings);
      const encrypted = await encryptData(dataString);
      await AsyncStorage.setItem(STORAGE_KEY, encrypted);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async function addContact(contact: Omit<EmergencyContact, 'id'>) {
    const newContact: EmergencyContact = {
      ...contact,
      id: Date.now().toString(),
    };
    const updated = {
      ...settings,
      emergencyContacts: [...settings.emergencyContacts, newContact],
    };
    await saveSettings(updated);
  }

  async function removeContact(id: string) {
    const updated = {
      ...settings,
      emergencyContacts: settings.emergencyContacts.filter((c) => c.id !== id),
    };
    await saveSettings(updated);
  }

  async function updateContact(id: string, updates: Partial<EmergencyContact>) {
    const updated = {
      ...settings,
      emergencyContacts: settings.emergencyContacts.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    };
    await saveSettings(updated);
  }

  async function addNote(note: Omit<EncryptedNote, 'id' | 'date'>) {
    const newNote: EncryptedNote = {
      ...note,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    const updated = {
      ...settings,
      notes: [...settings.notes, newNote],
    };
    await saveSettings(updated);
  }

  async function removeNote(id: string) {
    const updated = {
      ...settings,
      notes: settings.notes.filter((n) => n.id !== id),
    };
    await saveSettings(updated);
  }

  async function updateNote(id: string, updates: Partial<EncryptedNote>) {
    const updated = {
      ...settings,
      notes: settings.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    };
    await saveSettings(updated);
  }

  async function completeFirstLaunch() {
    await saveSettings({ ...settings, isFirstLaunch: false });
  }

  async function clearAllData() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSettings(defaultSettings);
  }

  return {
    settings,
    isLoading,
    addContact,
    removeContact,
    updateContact,
    addNote,
    removeNote,
    updateNote,
    completeFirstLaunch,
    clearAllData,
  };
});
