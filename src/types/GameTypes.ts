// 游戏状态类型定义

export type GameMode = 'menu' | 'single' | 'multiplayer' | 'ended';

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export interface CountdownConfig {
  targetDate: Date; // 农历新年日期
  timezone: string;
  manualOffset: number; // 手动校准偏移（秒）
}

export interface ComboState {
  count: number;
  lastClickTime: number;
  isActive: boolean;
  multiplier: number;
}

export interface ComboConfig {
  timeWindow: number; // 连击时间窗口（毫秒）
  minClicks: number; // 最小连击次数
  comboMultipliers: Map<number, number>; // 连击倍数映射
}

export interface PlayerStatistics {
  totalClicks: number;
  maxCombo: number;
  unlockedFireworks: Set<string>;
  totalPlayTime: number; // 秒
  achievementsUnlocked: Set<string>;
  lastPlayedAt: number;
}

export interface Theme {
  id: string;
  name: string;
  backgroundImage: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface CountdownSkin {
  id: string;
  name: string;
  fontFamily: string;
  glowColor: string;
  decorationImage?: string;
}

export type PerformanceLevel = 'low' | 'medium' | 'high';

export interface PerformanceProfile {
  level: PerformanceLevel;
  maxParticles: number;
  maxFireworks: number;
  useWebGL: boolean;
  particleSize: number;
  enableGlow: boolean;
  enableTrails: boolean;
}
