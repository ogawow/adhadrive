import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AudioRecording {
  id: string;
  uri: string;
  duration: number;
  timestamp: Date;
  transcribedText?: string;
  trustLevelChange: number;
}

export class AudioService {
  private static instance: AudioService;
  private recording: Audio.Recording | null = null;
  private recordings: AudioRecording[] = [];

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  // 音声録音の開始
  async startRecording(): Promise<void> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('音声録音の許可が必要です');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });

      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();
    } catch (error) {
      throw new Error(`音声録音の開始に失敗しました: ${error}`);
    }
  }

  // 音声録音の停止
  async stopRecording(): Promise<AudioRecording> {
    if (!this.recording) {
      throw new Error('録音が開始されていません');
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();
      
      const recording: AudioRecording = {
        id: Date.now().toString(),
        uri: uri || '',
        duration: status.durationMillis || 0,
        timestamp: new Date(),
        trustLevelChange: 5, // 録音成功で信頼度+5
      };

      this.recordings.push(recording);
      await this.saveRecordings();
      
      this.recording = null;
      return recording;
    } catch (error) {
      throw new Error(`音声録音の停止に失敗しました: ${error}`);
    }
  }

  // 録音状態の確認
  isRecording(): boolean {
    return this.recording !== null;
  }

  // 録音の一覧取得
  getRecordings(): AudioRecording[] {
    return this.recordings;
  }

  // 録音の削除
  async deleteRecording(id: string): Promise<void> {
    this.recordings = this.recordings.filter(recording => recording.id !== id);
    await this.saveRecordings();
  }

  // 録音の保存
  private async saveRecordings(): Promise<void> {
    try {
      await AsyncStorage.setItem('recordings', JSON.stringify(this.recordings));
    } catch (error) {
      console.error('録音の保存に失敗しました:', error);
    }
  }

  // 録音の読み込み
  async loadRecordings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('recordings');
      if (stored) {
        this.recordings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('録音の読み込みに失敗しました:', error);
    }
  }

  // 録音の再生
  async playRecording(uri: string): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (error) {
      throw new Error(`録音の再生に失敗しました: ${error}`);
    }
  }

  // 録音の統計情報
  getRecordingStats(): {
    totalRecordings: number;
    totalDuration: number;
    averageDuration: number;
    todayRecordings: number;
  } {
    const totalRecordings = this.recordings.length;
    const totalDuration = this.recordings.reduce((sum, recording) => sum + recording.duration, 0);
    const averageDuration = totalRecordings > 0 ? totalDuration / totalRecordings : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRecordings = this.recordings.filter(
      recording => recording.timestamp >= today
    ).length;

    return {
      totalRecordings,
      totalDuration,
      averageDuration,
      todayRecordings,
    };
  }

  // 録音の検索
  searchRecordings(query: string): AudioRecording[] {
    return this.recordings.filter(recording => 
      recording.transcribedText?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // 録音のフィルタリング
  filterRecordings(filters: {
    startDate?: Date;
    endDate?: Date;
    minDuration?: number;
    maxDuration?: number;
  }): AudioRecording[] {
    return this.recordings.filter(recording => {
      if (filters.startDate && recording.timestamp < filters.startDate) return false;
      if (filters.endDate && recording.timestamp > filters.endDate) return false;
      if (filters.minDuration && recording.duration < filters.minDuration) return false;
      if (filters.maxDuration && recording.duration > filters.maxDuration) return false;
      return true;
    });
  }
}
