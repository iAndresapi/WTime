import { useRouter } from 'expo-router';
import { Play, Square } from 'lucide-react-native';
import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const UNLOCK_HOLD_DURATION = 6000;
const HAPTIC_INTERVAL = 1000;

export default function StopwatchScreen() {
  const router = useRouter();
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const hapticCountRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 10);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const updateHoldProgress = () => {
    if (holdStartRef.current) {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(elapsed / UNLOCK_HOLD_DURATION, 1);
      setHoldProgress(progress);

      const currentHapticCount = Math.floor(elapsed / HAPTIC_INTERVAL);
      if (currentHapticCount > hapticCountRef.current && currentHapticCount <= 6) {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        hapticCountRef.current = currentHapticCount;
      }

      if (elapsed >= UNLOCK_HOLD_DURATION) {
        handleUnlock();
      } else {
        animationFrameRef.current = requestAnimationFrame(updateHoldProgress);
      }
    }
  };

  const handleUnlock = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setHoldProgress(0);
    holdStartRef.current = null;
    hapticCountRef.current = 0;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    router.push('/safe-mode');
  };

  const handleStartPressIn = () => {
    holdStartRef.current = Date.now();
    hapticCountRef.current = 0;
    updateHoldProgress();
  };

  const handleStartPressOut = () => {
    if (holdStartRef.current) {
      const elapsed = Date.now() - holdStartRef.current;
      if (elapsed < UNLOCK_HOLD_DURATION) {
        setIsRunning(true);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    }
    setHoldProgress(0);
    holdStartRef.current = null;
    hapticCountRef.current = 0;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setTime(0);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>WTime</Text>
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.time}>{formatTime(time)}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          onPressIn={handleStartPressIn}
          onPressOut={handleStartPressOut}
          style={({ pressed }) => [
            styles.button,
            styles.startButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.buttonContent}>
            {holdProgress > 0 && (
              <View 
                style={[
                  styles.progressOverlay,
                  { height: `${holdProgress * 100}%` }
                ]}
              />
            )}
            <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.buttonText}>Start</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={handleStop}
          style={({ pressed }) => [
            styles.button,
            styles.stopButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Square size={32} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.buttonText}>Stop</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Simple Stopwatch Utility</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: '#1D1D1F',
    letterSpacing: 0.3,
  },
  timeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  time: {
    fontSize: 72,
    fontWeight: '200' as const,
    color: '#1D1D1F',
    fontVariant: ['tabular-nums'] as any,
    letterSpacing: -2,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 60,
    gap: 16,
  },
  button: {
    flex: 1,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#86868B',
    letterSpacing: 0.2,
  },
});
