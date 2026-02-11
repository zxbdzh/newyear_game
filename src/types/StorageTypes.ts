// 本地存储类型定义

import type { PlayerStatistics, PerformanceProfile } from './GameTypes';
import type { AudioConfig } from './AudioTypes';

export interface LocalStorageData {
  statistics: PlayerStatistics;
  audioConfig: AudioConfig;
  themeId: string;
  skinId: string;
  performanceProfile: PerformanceProfile;
  lastPlayedAt: number;
}
