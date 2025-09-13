import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Animated, 
  Alert
} from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Web用のVibration代替
const Vibration = {
  vibrate: (pattern) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
};

interface TrustLevel {
  level: number;
  history: number[];
}

export default function App() {
  const [trustLevel, setTrustLevel] = useState<TrustLevel>({ level: 85, history: [85] });
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [tasks, setTasks] = useState<string[]>([
    '来週までに資料まとめ',
    '明日のプレゼンチェック',
    '急ぎの件対応'
  ]);
  
  // アニメーション用のref
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // 緊急モードの開始
  const startEmergencyMode = () => {
    setIsEmergencyMode(true);
    setCountdown(5);
    Vibration.vibrate([0, 500, 200, 500]); // 緊急振動
    
    // 点滅アニメーション
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 振動アニメーション
    Animated.loop(
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
    ).start();
  };

  // カウントダウンタイマー
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isEmergencyMode && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          const newCount = prev - 0.1;
          if (newCount <= 0) {
            setIsEmergencyMode(false);
            Alert.alert('記録しませんでした', '信頼度が下がりました...');
            updateTrustLevel(-5);
            return 0;
          }
          return Math.round(newCount * 10) / 10;
        });
      }, 100);
    }
    
    return () => clearInterval(interval);
  }, [isEmergencyMode, countdown]);

  // 音声録音の開始
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('許可が必要です', '音声録音の許可が必要です');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setIsEmergencyMode(false);
      
      // 信頼度上昇
      updateTrustLevel(5);
      
      Alert.alert('記録開始', '音声を録音しています...');
    } catch (error) {
      Alert.alert('エラー', '録音の開始に失敗しました');
    }
  };

  // 音声録音の停止
  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      
      // 新しいタスクを追加
      const newTask = `録音タスク ${new Date().toLocaleTimeString()}`;
      setTasks(prev => [newTask, ...prev.slice(0, 4)]); // 最新5件を保持
      
      Alert.alert('記録完了', 'よくできました！先輩に信頼されています');
    } catch (error) {
      Alert.alert('エラー', '録音の停止に失敗しました');
    }
  };

  // 信頼度の更新
  const updateTrustLevel = (change: number) => {
    setTrustLevel(prev => {
      const newLevel = Math.max(0, Math.min(100, prev.level + change));
      const newHistory = [...prev.history, newLevel].slice(-10); // 最新10件を保持
      
      // ローカルストレージに保存
      AsyncStorage.setItem('trustLevel', JSON.stringify({ level: newLevel, history: newHistory }));
      
      return { level: newLevel, history: newHistory };
    });
  };

  // アプリ起動時に信頼度を読み込み
  useEffect(() => {
    const loadTrustLevel = async () => {
      try {
        const stored = await AsyncStorage.getItem('trustLevel');
        if (stored) {
          setTrustLevel(JSON.parse(stored));
        }
      } catch (error) {
        console.error('信頼度の読み込みに失敗しました:', error);
      }
    };
    
    loadTrustLevel();
  }, []);

  // 緊急モード画面
  if (isEmergencyMode) {
    return (
      <View style={styles.emergencyContainer}>
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
          style={styles.emergencyButton}
          onPress={startRecording}
          activeOpacity={0.8}
        >
          <Text style={styles.emergencyButtonText}>今すぐ記録</Text>
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
  }

  // 記録中画面
  if (isRecording) {
    return (
      <View style={styles.recordingContainer}>
        <Text style={styles.recordingIcon}>🎤</Text>
        <Text style={styles.recordingTitle}>記録中...</Text>
        <Text style={styles.recordingSubtitle}>音声を録音しています</Text>
        
        <TouchableOpacity 
          style={styles.stopButton}
          onPress={stopRecording}
        >
          <Text style={styles.stopButtonText}>停止</Text>
        </TouchableOpacity>
        
        <View style={styles.trustContainer}>
          <Text style={styles.trustLabel}>信頼度: {trustLevel.level}%</Text>
          <View style={styles.trustBar}>
            <View 
              style={[styles.trustProgress, { width: `${trustLevel.level}%` }]} 
            />
          </View>
        </View>
      </View>
    );
  }

  // メイン画面
  return (
    <View style={styles.container}>
      <Text style={styles.title}>アドハドライブ</Text>
      
      <View style={styles.trustContainer}>
        <Text style={styles.trustLabel}>信頼度: {trustLevel.level}%</Text>
        <View style={styles.trustBar}>
          <View 
            style={[styles.trustProgress, { width: `${trustLevel.level}%` }]} 
          />
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.recordButton}
        onPress={startEmergencyMode}
      >
        <Text style={styles.recordButtonText}>緊急モード開始</Text>
      </TouchableOpacity>
      
      <View style={styles.tasksContainer}>
        <Text style={styles.tasksTitle}>最近のタスク:</Text>
        {tasks.map((task, index) => (
          <Text key={index} style={styles.taskItem}>• {task}</Text>
        ))}
      </View>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>先輩からの信頼度: {trustLevel.level}%</Text>
        <Text style={styles.statsSubtitle}>チームへの影響度: {Math.min(100, trustLevel.level + 10)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1A1A1A',
  },
  trustContainer: {
    marginBottom: 30,
  },
  trustLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1A1A1A',
  },
  trustBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  trustProgress: {
    height: 8,
    backgroundColor: '#00C851',
    borderRadius: 4,
  },
  recordButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tasksContainer: {
    flex: 1,
    marginBottom: 20,
  },
  tasksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1A1A1A',
  },
  taskItem: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 5,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  // 緊急モードのスタイル
  emergencyContainer: {
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
  emergencyButton: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  emergencyButtonText: {
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
  // 記録中画面のスタイル
  recordingContainer: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  recordingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  recordingSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  stopButton: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  stopButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});