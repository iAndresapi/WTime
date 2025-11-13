import { useRouter } from 'expo-router';
import {
  Shield,
  Users,
  FileText,
  AlertCircle,
  Phone,
  LogOut,
  Trash2,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { useSecureStorage } from '@/contexts/SecureStorageContext';
import { useRorkAgent } from '@rork-ai/toolkit-sdk';

const PANIC_HOLD_DURATION = 6000;
const HAPTIC_INTERVAL = 1000;

export default function SafeModeScreen() {
  const router = useRouter();
  const { settings, clearAllData } = useSecureStorage();
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isPanicking, setIsPanicking] = useState<boolean>(false);
  const [chatExpanded, setChatExpanded] = useState<boolean>(true);
  const [inputMessage, setInputMessage] = useState<string>('');

  const holdStartRef = useRef<number | null>(null);
  const hapticCountRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  const { messages, error, sendMessage } = useRorkAgent({
    tools: {},
  });

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0 && chatScrollRef.current) {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const updateHoldProgress = () => {
    if (holdStartRef.current) {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(elapsed / PANIC_HOLD_DURATION, 1);
      setHoldProgress(progress);

      const currentHapticCount = Math.floor(elapsed / HAPTIC_INTERVAL);
      if (currentHapticCount > hapticCountRef.current && currentHapticCount <= 6) {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        hapticCountRef.current = currentHapticCount;
      }

      if (elapsed >= PANIC_HOLD_DURATION) {
        handlePanicActivate();
      } else {
        animationFrameRef.current = requestAnimationFrame(updateHoldProgress);
      }
    }
  };

  const handlePanicActivate = async () => {
    setHoldProgress(0);
    holdStartRef.current = null;
    hapticCountRef.current = 0;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsPanicking(true);
    await sendEmergencyAlert();
    setIsPanicking(false);
  };

  const sendEmergencyAlert = async () => {
    try {
      if (settings.emergencyContacts.length === 0) {
        Alert.alert(
          'No Contacts',
          'Please add emergency contacts before using the panic button.',
          [{ text: 'OK' }]
        );
        return;
      }

      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      let locationText = 'Location unavailable';
      
      if (locationStatus === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          locationText = `https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
        } catch (error) {
          console.error('Failed to get location:', error);
        }
      }

      const message = `EMERGENCY ALERT: I need help. My location: ${locationText}`;

      if (Platform.OS === 'web') {
        Alert.alert(
          'Emergency Alert',
          `SMS not available on web.\n\nWould send to ${settings.emergencyContacts.length} contacts:\n"${message}"`,
          [{ text: 'OK' }]
        );
        return;
      }

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const phoneNumbers = settings.emergencyContacts.map((c) => c.phone);
        await SMS.sendSMSAsync(phoneNumbers, message);
        Alert.alert('Alert Sent', 'Emergency SMS sent to your contacts.', [
          { text: 'OK' },
        ]);
      } else {
        Alert.alert(
          'SMS Unavailable',
          'Cannot send SMS on this device. Please call your emergency contacts manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Emergency alert error:', error);
      Alert.alert('Error', 'Failed to send emergency alert. Please try again.', [
        { text: 'OK' },
      ]);
    }
  };

  const handlePanicPressIn = () => {
    holdStartRef.current = Date.now();
    hapticCountRef.current = 0;
    updateHoldProgress();
  };

  const handlePanicPressOut = () => {
    setHoldProgress(0);
    holdStartRef.current = null;
    hapticCountRef.current = 0;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleQuickExit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all contacts and notes. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Data Cleared', 'All secure data has been deleted.', [
              { text: 'OK', onPress: handleQuickExit },
            ]);
          },
        },
      ]
    );
  };

  const callEmergency = (number: string) => {
    Alert.alert(
      'Emergency Call',
      `Call ${number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            if (Platform.OS === 'web') {
              Alert.alert('Call Feature', 'Phone calls are not available on web.', [
                { text: 'OK' },
              ]);
            } else {
              Alert.alert('Call', `Would dial ${number} (feature not fully implemented in demo)`, [
                { text: 'OK' },
              ]);
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleRow}>
          <Shield size={28} color="#DC2626" strokeWidth={2.5} />
          <Text style={styles.headerTitle}>Safe Mode</Text>
        </View>
        <Pressable onPress={handleQuickExit} style={styles.exitButton}>
          <LogOut size={24} color="#DC2626" />
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.chatSection}>
            <Pressable
              onPress={() => setChatExpanded(!chatExpanded)}
              style={({ pressed }) => [
                styles.chatHeader,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.chatHeaderLeft}>
                <MessageCircle size={22} color="#007AFF" strokeWidth={2} />
                <Text style={styles.chatHeaderTitle}>AI Support</Text>
              </View>
              {chatExpanded ? (
                <ChevronUp size={20} color="#86868B" />
              ) : (
                <ChevronDown size={20} color="#86868B" />
              )}
            </Pressable>

            {chatExpanded && (
              <View style={styles.chatContent}>
                <ScrollView
                  ref={chatScrollRef}
                  style={styles.messagesContainer}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.map((message, index) => (
                    <View
                      key={message.id || index}
                      style={[
                        styles.messageBubble,
                        message.role === 'user'
                          ? styles.userMessage
                          : styles.assistantMessage,
                      ]}
                    >
                      {message.parts.map((part, partIndex) => {
                        if (part.type === 'text') {
                          return (
                            <Text
                              key={partIndex}
                              style={[
                                styles.messageText,
                                message.role === 'user'
                                  ? styles.userMessageText
                                  : styles.assistantMessageText,
                              ]}
                            >
                              {part.text}
                            </Text>
                          );
                        }
                        return null;
                      })}
                    </View>
                  ))}
                  {error && (
                    <View style={styles.errorMessage}>
                      <Text style={styles.errorText}>Failed to send message. Please try again.</Text>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={inputMessage}
                    onChangeText={setInputMessage}
                    placeholder="Type your message..."
                    placeholderTextColor="#86868B"
                    multiline
                    maxLength={500}
                  />
                  <Pressable
                    onPress={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    style={({ pressed }) => [
                      styles.sendButton,
                      !inputMessage.trim() && styles.sendButtonDisabled,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Send
                      size={20}
                      color={inputMessage.trim() ? '#FFFFFF' : '#C7C7CC'}
                    />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

        <View style={styles.panicSection}>
          <Pressable
            onPressIn={handlePanicPressIn}
            onPressOut={handlePanicPressOut}
            disabled={isPanicking}
            style={({ pressed }) => [
              styles.panicButton,
              pressed && styles.panicButtonPressed,
              isPanicking && styles.panicButtonDisabled,
            ]}
          >
            <View style={styles.panicButtonContent}>
              {holdProgress > 0 && (
                <View
                  style={[
                    styles.panicProgressOverlay,
                    { width: `${holdProgress * 100}%` },
                  ]}
                />
              )}
              <AlertCircle size={48} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.panicButtonText}>
                {isPanicking ? 'Sending Alert...' : 'Emergency Panic Button'}
              </Text>
              <Text style={styles.panicButtonSubtext}>Hold for 6 seconds</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          
          <View style={styles.emergencyNumbers}>
            <Pressable
              onPress={() => callEmergency('112')}
              style={({ pressed }) => [
                styles.emergencyNumberButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Phone size={24} color="#DC2626" />
              <Text style={styles.emergencyNumberText}>112</Text>
            </Pressable>
            
            <Pressable
              onPress={() => callEmergency('016')}
              style={({ pressed }) => [
                styles.emergencyNumberButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Phone size={24} color="#DC2626" />
              <Text style={styles.emergencyNumberText}>016</Text>
            </Pressable>
          </View>

          {settings.emergencyContacts.length > 0 && (
            <View style={styles.savedContacts}>
              {settings.emergencyContacts.map((contact) => (
                <Pressable
                  key={contact.id}
                  onPress={() => callEmergency(contact.phone)}
                  style={({ pressed }) => [
                    styles.savedContact,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.savedContactName}>{contact.name}</Text>
                  <Text style={styles.savedContactPhone}>{contact.phone}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.menuSection}>
          <Pressable
            onPress={() => router.push('/contacts')}
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Users size={24} color="#1D1D1F" />
            <View style={styles.menuButtonText}>
              <Text style={styles.menuButtonTitle}>Manage Contacts</Text>
              <Text style={styles.menuButtonSubtitle}>
                {settings.emergencyContacts.length} contact
                {settings.emergencyContacts.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/notes')}
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <FileText size={24} color="#1D1D1F" />
            <View style={styles.menuButtonText}>
              <Text style={styles.menuButtonTitle}>Secure Notes</Text>
              <Text style={styles.menuButtonSubtitle}>
                {settings.notes.length} note
                {settings.notes.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.dangerSection}>
          <Pressable
            onPress={handleClearData}
            style={({ pressed }) => [
              styles.dangerButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Trash2 size={20} color="#DC2626" />
            <Text style={styles.dangerButtonText}>Clear All Data</Text>
          </Pressable>
        </View>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1D1D1F',
  },
  exitButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 24,
  },
  chatSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatHeaderTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1D1D1F',
  },
  chatContent: {
    maxHeight: 400,
  },
  messagesContainer: {
    maxHeight: 300,
    padding: 16,
  },
  messagesContent: {
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#1D1D1F',
  },
  errorMessage: {
    alignSelf: 'center',
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F5F7',
    borderRadius: 20,
    fontSize: 15,
    color: '#1D1D1F',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5E7',
  },
  panicSection: {
    marginBottom: 8,
  },
  panicButton: {
    height: 160,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  panicButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  panicButtonDisabled: {
    opacity: 0.7,
  },
  panicButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  panicProgressOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  panicButtonText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  panicButtonSubtext: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  quickActionsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1D1D1F',
    marginBottom: 4,
  },
  emergencyNumbers: {
    flexDirection: 'row',
    gap: 12,
  },
  emergencyNumberButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#DC2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emergencyNumberText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#DC2626',
  },
  savedContacts: {
    gap: 12,
    marginTop: 4,
  },
  savedContact: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  savedContactName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1D1D1F',
    marginBottom: 4,
  },
  savedContactPhone: {
    fontSize: 15,
    color: '#86868B',
  },
  menuSection: {
    gap: 12,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuButtonText: {
    flex: 1,
  },
  menuButtonTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1D1D1F',
    marginBottom: 2,
  },
  menuButtonSubtitle: {
    fontSize: 14,
    color: '#86868B',
  },
  dangerSection: {
    marginTop: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
