/**
 * 本地存储类型定义
 * Feature: new-year-fireworks-game
 */

import type { PlayerStatistics } from './StatisticsTypes';
import type { AudioConfig } from './AudioTypes';
import type { PerformanceProfile } from './PerformanceTypes';

/**
 * 本地存储数据
 */
export interface LocalStorageData {
  /** 统计数据 */
  statistics: PlayerStatistics;
  /** 音频配置 */
  audioConfig: AudioConfig;
  /** 主题ID */
  themeId: string;
  /** 皮肤ID */
  skinId: string;
  /** 性能配置 */
  performanceProfile: PerformanceProfile;
  /** 手动时间偏移（秒） */
  manualOffset: number;
  /** 最后游玩时间 */
  lastPlayedAt: number;
}
