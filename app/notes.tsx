import { useRouter } from 'expo-router';
import { FileText, Trash2, AlertCircle, Heart, Scale, Plus } from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSecureStorage } from '@/contexts/SecureStorageContext';
import type { EncryptedNote } from '@/types';

export default function NotesScreen() {
  const router = useRouter();
  const { settings, removeNote } = useSecureStorage();

  const handleDelete = (note: EncryptedNote) => {
    Alert.alert('Delete Note', `Delete "${note.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeNote(note.id);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ]);
  };

  const getNoteIcon = (type: EncryptedNote['type']) => {
    const iconProps = { size: 20, strokeWidth: 2 };
    switch (type) {
      case 'incident':
        return <AlertCircle {...iconProps} color="#DC2626" />;
      case 'medical':
        return <Heart {...iconProps} color="#DC2626" />;
      case 'legal':
        return <Scale {...iconProps} color="#DC2626" />;
      default:
        return <FileText {...iconProps} color="#DC2626" />;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Secure Notes</Text>
          <Text style={styles.subtitle}>
            Document incidents, medical information, and legal records securely
          </Text>
        </View>

        {settings.notes.length > 0 ? (
          <View style={styles.notesList}>
            {settings.notes
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((note) => (
                <View key={note.id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <View style={styles.noteTitleRow}>
                      {getNoteIcon(note.type)}
                      <Text style={styles.noteTitle}>{note.title}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleDelete(note)}
                      style={({ pressed }) => [
                        styles.deleteButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Trash2 size={20} color="#DC2626" />
                    </Pressable>
                  </View>
                  <Text style={styles.noteContent} numberOfLines={3}>
                    {note.content}
                  </Text>
                  <View style={styles.noteFooter}>
                    <Text style={styles.noteType}>{note.type.toUpperCase()}</Text>
                    <Text style={styles.noteDate}>{formatDate(note.date)}</Text>
                  </View>
                </View>
              ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <FileText size={48} color="#C7C7CC" strokeWidth={1.5} />
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySubtext}>
              Store important information securely with encrypted notes
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => router.push('/add-note')}
          style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}
        >
          <Plus size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add New Note</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1D1D1F',
  },
  subtitle: {
    fontSize: 16,
    color: '#86868B',
    lineHeight: 22,
  },
  notesList: {
    gap: 12,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noteTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noteTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1D1D1F',
  },
  deleteButton: {
    padding: 4,
  },
  noteContent: {
    fontSize: 15,
    color: '#3C3C43',
    lineHeight: 21,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  noteType: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  noteDate: {
    fontSize: 13,
    color: '#86868B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#86868B',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#A8A8AE',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 40,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
