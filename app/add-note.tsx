import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSecureStorage } from '@/contexts/SecureStorageContext';
import type { EncryptedNote } from '@/types';

const NOTE_TYPES: Array<{ value: EncryptedNote['type']; label: string }> = [
  { value: 'incident', label: 'Incident' },
  { value: 'medical', label: 'Medical' },
  { value: 'legal', label: 'Legal' },
  { value: 'other', label: 'Other' },
];

export default function AddNoteScreen() {
  const router = useRouter();
  const { addNote } = useSecureStorage();
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [type, setType] = useState<EncryptedNote['type']>('incident');

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for this note.', [
        { text: 'OK' },
      ]);
      return;
    }

    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please enter content for this note.', [
        { text: 'OK' },
      ]);
      return;
    }

    await addNote({
      title: title.trim(),
      content: content.trim(),
      type,
    });

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief description"
                placeholderTextColor="#86868B"
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeButtons}>
                {NOTE_TYPES.map((noteType) => (
                  <Pressable
                    key={noteType.value}
                    onPress={() => {
                      setType(noteType.value);
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.typeButton,
                      type === noteType.value && styles.typeButtonActive,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === noteType.value && styles.typeButtonTextActive,
                      ]}
                    >
                      {noteType.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Detailed information..."
                placeholderTextColor="#86868B"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.saveButtonText}>Save Note</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 24,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1D1D1F',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1D1D1F',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 160,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E5E7',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#86868B',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
