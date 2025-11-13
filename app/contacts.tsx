import { useRouter } from 'expo-router';
import { Plus, Trash2, Edit, X } from 'lucide-react-native';
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
import type { EmergencyContact } from '@/types';

export default function ContactsScreen() {
  const router = useRouter();
  const { settings, addContact, removeContact, updateContact } = useSecureStorage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing Information', 'Please enter both name and phone number.', [
        { text: 'OK' },
      ]);
      return;
    }

    if (settings.emergencyContacts.length >= 3) {
      Alert.alert(
        'Limit Reached',
        'You can only add up to 3 emergency contacts.',
        [{ text: 'OK' }]
      );
      return;
    }

    await addContact({ name: name.trim(), phone: phone.trim() });
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setName('');
    setPhone('');
    setIsAdding(false);
  };

  const handleUpdate = async (id: string) => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing Information', 'Please enter both name and phone number.', [
        { text: 'OK' },
      ]);
      return;
    }

    await updateContact(id, { name: name.trim(), phone: phone.trim() });
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setName('');
    setPhone('');
    setEditingId(null);
  };

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert(
      'Delete Contact',
      `Remove ${contact.name} from emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeContact(contact.id);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const startEdit = (contact: EmergencyContact) => {
    setEditingId(contact.id);
    setName(contact.name);
    setPhone(contact.phone);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setName('');
    setPhone('');
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
          <View style={styles.header}>
            <Text style={styles.title}>Emergency Contacts</Text>
            <Text style={styles.subtitle}>
              Add up to 3 trusted contacts who will be notified in emergencies
            </Text>
          </View>

          {settings.emergencyContacts.length > 0 && (
            <View style={styles.contactsList}>
              {settings.emergencyContacts.map((contact) => (
                <View key={contact.id} style={styles.contactCard}>
                  {editingId === contact.id ? (
                    <View style={styles.editForm}>
                      <TextInput
                        style={styles.input}
                        placeholder="Name"
                        placeholderTextColor="#86868B"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        placeholderTextColor="#86868B"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                      <View style={styles.editActions}>
                        <Pressable
                          onPress={cancelEdit}
                          style={({ pressed }) => [
                            styles.editCancelButton,
                            pressed && styles.buttonPressed,
                          ]}
                        >
                          <Text style={styles.editCancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleUpdate(contact.id)}
                          style={({ pressed }) => [
                            styles.editSaveButton,
                            pressed && styles.buttonPressed,
                          ]}
                        >
                          <Text style={styles.editSaveText}>Save</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.contactInfo}>
                      <View style={styles.contactText}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactPhone}>{contact.phone}</Text>
                      </View>
                      <View style={styles.contactActions}>
                        <Pressable
                          onPress={() => startEdit(contact)}
                          style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.buttonPressed,
                          ]}
                        >
                          <Edit size={20} color="#007AFF" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(contact)}
                          style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.buttonPressed,
                          ]}
                        >
                          <Trash2 size={20} color="#DC2626" />
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {isAdding && (
            <View style={styles.addForm}>
              <View style={styles.addFormHeader}>
                <Text style={styles.addFormTitle}>New Contact</Text>
                <Pressable onPress={cancelEdit} style={styles.closeButton}>
                  <X size={24} color="#86868B" />
                </Pressable>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#86868B"
                value={name}
                onChangeText={setName}
                autoFocus
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#86868B"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.addButtonText}>Add Contact</Text>
              </Pressable>
            </View>
          )}

          {!isAdding &&
            !editingId &&
            settings.emergencyContacts.length < 3 && (
              <Pressable
                onPress={() => setIsAdding(true)}
                style={({ pressed }) => [
                  styles.newContactButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Plus size={24} color="#007AFF" />
                <Text style={styles.newContactText}>Add Emergency Contact</Text>
              </Pressable>
            )}

          {settings.emergencyContacts.length === 0 && !isAdding && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No emergency contacts added yet
              </Text>
              <Text style={styles.emptySubtext}>
                These contacts will receive an SMS with your location when you
                activate the panic button
              </Text>
            </View>
          )}
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
  contactsList: {
    gap: 12,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactText: {
    flex: 1,
    gap: 4,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1D1D1F',
  },
  contactPhone: {
    fontSize: 16,
    color: '#86868B',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  editForm: {
    gap: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1D1D1F',
    backgroundColor: '#FAFAFA',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#86868B',
  },
  editSaveButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editSaveText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  addForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  addFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addFormTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#1D1D1F',
  },
  closeButton: {
    padding: 4,
  },
  addButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  newContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  newContactText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#86868B',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#A8A8AE',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
