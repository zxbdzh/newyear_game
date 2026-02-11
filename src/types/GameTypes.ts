/**
 * 游戏状态类型定义
 * Feature: new-year-fireworks-game
 */

import type { CountdownTime } from './CountdownTypes';
import type { FireworkInstance } from './FireworkTypes';
import type { ComboState } from './ComboTypes';
import type { PlayerStatistics } from './StatisticsTypes';
import type { RoomInfo } from './NetworkTypes';
import type { Theme, CountdownSkin } from './ThemeTypes';
import type { AudioConfig } from './AudioTypes';
import type { PerformanceProfile } from './PerformanceTypes';

/**
 * 游戏模式
 */
export type GameMode = 'menu' | 'single' | 'multiplayer' | 'ended';

/**
 * 游戏状态
 */
export interface GameState {
  /** 当前游戏模式 */
  mode: GameMode;
  /** 倒计时 */
  countdown: CountdownTime | null;
  /** 烟花列表 */
  fireworks: FireworkInstance[];
  /** 连击状态 */
  combo: ComboState;
  /** 统计数据 */
  statistics: PlayerStatistics;
  /** 房间信息（多人模式） */
  room: RoomInfo | null;
  /** 当前主题 */
  theme: Theme;
  /** 当前倒计时皮肤 */
  skin: CountdownSkin;
  /** 音频配置 */
  audio: AudioConfig;
  /** 性能配置 */
  performance: PerformanceProfile;
}
