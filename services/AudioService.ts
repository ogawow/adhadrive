import { Audio } from 'expo-av';

export class AudioService {
  private static instance: AudioService;
  private recording: Audio.Recording | null = null;

  private constructor() {}

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('音声録音の許可取得に失敗しました:', error);
      return false;
    }
  }

  public async startRecording(): Promise<Audio.Recording | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('音声録音の許可が必要です');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      this.recording = recording;
      return recording;
    } catch (error) {
      console.error('録音の開始に失敗しました:', error);
      return null;
    }
  }

  public async stopRecording(): Promise<string | null> {
    if (!this.recording) return null;

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      return uri;
    } catch (error) {
      console.error('録音の停止に失敗しました:', error);
      return null;
    }
  }

  public getCurrentRecording(): Audio.Recording | null {
    return this.recording;
  }
}