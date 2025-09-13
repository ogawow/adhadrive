import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Animated, 
  Alert,
  Vibration
} from 'react-native';

interface EmergencyModeProps {
  onStartRecording: () => void;
  onCancel: () => void;
}

export const EmergencyMode: React.FC<EmergencyModeProps> = ({
  onStartRecording,
  onCancel,
}) => {
  const [countdown, setCountdown] = useState(5);
  const [isActive, setIsActive] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [shakeAnim] = useState(new Animated.Value(0));

  // カウントダウンタイマー
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          const newCount = prev - 0.1;
          if (newCount <= 0) {
            setIsActive(false);
            onCancel();
            return 0;
          }
          return Math.round(newCount * 10) / 10;
        });
      }, 100);
    }
    
    return () => clearInterval(interval);
  }, [isActive, countdown, onCancel]);

  // アニメーション効果
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );

    const shake = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    shake.start();

    // 緊急振動
    Vibration.vibrate([0, 500, 200, 500]);

    return () => {
      pulse.stop();
      shake.stop();
    };
  }, [pulseAnim, shakeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.warningContainer, 
          { 
            transform: [
              { scale: pulseAnim },
              { translateX: shakeAnim }
            ] 
          }
        ]}
      >
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningTitle}>緊急タスク発生！</Text>
        <Text style={styles.warningSubtitle}>先輩が話しています</Text>
      </Animated.View>
      
      <TouchableOpacity 
        style={styles.recordButton}
        onPress={onStartRecording}
        activeOpacity={0.8}
      >
        <Text style={styles.recordButtonText}>今すぐ記録</Text>
      </TouchableOpacity>
      
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownLabel}>
          残り時間: {countdown.toFixed(1)}秒
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progress, { width: `${(countdown / 5) * 100}%` }]} 
          />
        </View>
      </View>
      
      <View style={styles.warningList}>
        <Text style={styles.warningItem}>• 先輩に怒られる</Text>
        <Text style={styles.warningItem}>• 信頼度が下がる</Text>
        <Text style={styles.warningItem}>• プロジェクト遅延</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 20,
    justifyContent: 'center',
  },
  warningContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  warningSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  recordButton: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  recordButtonText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countdownContainer: {
    marginBottom: 40,
  },
  countdownLabel: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
  },
  progress: {
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  warningList: {
    alignItems: 'center',
  },
  warningItem: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 5,
  },
});
