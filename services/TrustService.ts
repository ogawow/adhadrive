import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrustLevelChange {
  id: string;
  oldLevel: number;
  newLevel: number;
  change: number;
  reason: string;
  timestamp: Date;
}

export interface TrustTrend {
  trend: 'increasing' | 'decreasing' | 'stable';
  averageChange: number;
  volatility: number;
  prediction: number;
}

export class TrustService {
  private static instance: TrustService;
  private trustLevel: number = 85;
  private trustHistory: TrustLevelChange[] = [];

  static getInstance(): TrustService {
    if (!TrustService.instance) {
      TrustService.instance = new TrustService();
    }
    return TrustService.instance;
  }

  // 信頼度の更新
  async updateTrustLevel(change: number, reason: string): Promise<void> {
    const oldLevel = this.trustLevel;
    this.trustLevel = Math.max(0, Math.min(100, this.trustLevel + change));
    
    const trustChange: TrustLevelChange = {
      id: Date.now().toString(),
      oldLevel,
      newLevel: this.trustLevel,
      change,
      reason,
      timestamp: new Date(),
    };
    
    this.trustHistory.push(trustChange);
    await this.saveTrustHistory();
    
    // 信頼度の変化を通知
    this.notifyTrustLevelChange(trustChange);
  }

  // 信頼度の取得
  getTrustLevel(): number {
    return this.trustLevel;
  }

  // 信頼度の履歴取得
  getTrustHistory(days: number = 30): TrustLevelChange[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.trustHistory.filter(
      change => change.timestamp >= cutoffDate
    );
  }

  // 信頼度の傾向分析
  analyzeTrustTrend(): TrustTrend {
    const recentHistory = this.getTrustHistory(7);
    const changes = recentHistory.map(change => change.change);
    
    if (changes.length === 0) {
      return {
        trend: 'stable',
        averageChange: 0,
        volatility: 0,
        prediction: this.trustLevel,
      };
    }
    
    const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const trend = averageChange > 0.5 ? 'increasing' : averageChange < -0.5 ? 'decreasing' : 'stable';
    
    return {
      trend,
      averageChange,
      volatility: this.calculateVolatility(changes),
      prediction: this.predictFutureTrustLevel(),
    };
  }

  // 信頼度の保存
  private async saveTrustHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem('trustHistory', JSON.stringify(this.trustHistory));
      await AsyncStorage.setItem('trustLevel', this.trustLevel.toString());
    } catch (error) {
      console.error('信頼度履歴の保存に失敗しました:', error);
    }
  }

  // 信頼度の読み込み
  async loadTrustLevel(): Promise<void> {
    try {
      const storedLevel = await AsyncStorage.getItem('trustLevel');
      if (storedLevel) {
        this.trustLevel = parseInt(storedLevel, 10);
      }
      
      const storedHistory = await AsyncStorage.getItem('trustHistory');
      if (storedHistory) {
        this.trustHistory = JSON.parse(storedHistory);
      }
    } catch (error) {
      console.error('信頼度の読み込みに失敗しました:', error);
    }
  }

  // ボラティリティの計算
  private calculateVolatility(changes: number[]): number {
    if (changes.length === 0) return 0;
    
    const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
    return Math.sqrt(variance);
  }

  // 将来の信頼度予測
  private predictFutureTrustLevel(): number {
    const recentHistory = this.getTrustHistory(7);
    const changes = recentHistory.map(change => change.change);
    
    if (changes.length === 0) return this.trustLevel;
    
    const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    return Math.max(0, Math.min(100, this.trustLevel + averageChange * 7));
  }

  // 信頼度の変化通知
  private notifyTrustLevelChange(change: TrustLevelChange): void {
    // ここで信頼度の変化を通知するロジックを実装
    // 例: イベント発火、コールバック呼び出しなど
    console.log('信頼度が変更されました:', change);
  }

  // 信頼度のリセット
  async resetTrustLevel(): Promise<void> {
    this.trustLevel = 85;
    this.trustHistory = [];
    await this.saveTrustHistory();
  }

  // 信頼度の統計情報
  getTrustStats(): {
    currentLevel: number;
    totalChanges: number;
    positiveChanges: number;
    negativeChanges: number;
    averageChange: number;
  } {
    const positiveChanges = this.trustHistory.filter(change => change.change > 0).length;
    const negativeChanges = this.trustHistory.filter(change => change.change < 0).length;
    const totalChanges = this.trustHistory.length;
    const averageChange = totalChanges > 0 
      ? this.trustHistory.reduce((sum, change) => sum + change.change, 0) / totalChanges 
      : 0;

    return {
      currentLevel: this.trustLevel,
      totalChanges,
      positiveChanges,
      negativeChanges,
      averageChange,
    };
  }
}
