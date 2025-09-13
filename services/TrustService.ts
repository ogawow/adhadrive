import AsyncStorage from '@react-native-async-storage/async-storage';

interface TrustLevel {
  level: number;
  history: number[];
}

export class TrustService {
  private static instance: TrustService;
  private trustLevel: TrustLevel = { level: 85, history: [85] };

  private constructor() {}

  public static getInstance(): TrustService {
    if (!TrustService.instance) {
      TrustService.instance = new TrustService();
    }
    return TrustService.instance;
  }

  public async getTrustLevel(): Promise<TrustLevel> {
    try {
      const stored = await AsyncStorage.getItem('trustLevel');
      if (stored) {
        this.trustLevel = JSON.parse(stored);
      }
    } catch (error) {
      console.error('信頼度の読み込みに失敗しました:', error);
    }
    return this.trustLevel;
  }

  public async updateTrustLevel(change: number): Promise<TrustLevel> {
    const newLevel = Math.max(0, Math.min(100, this.trustLevel.level + change));
    const newHistory = [...this.trustLevel.history, newLevel].slice(-10);
    
    this.trustLevel = { level: newLevel, history: newHistory };
    
    try {
      await AsyncStorage.setItem('trustLevel', JSON.stringify(this.trustLevel));
    } catch (error) {
      console.error('信頼度の保存に失敗しました:', error);
    }
    
    return this.trustLevel;
  }

  public getTrustLevelSync(): TrustLevel {
    return this.trustLevel;
  }
}