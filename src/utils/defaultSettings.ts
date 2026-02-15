/**
 * 默认设置值
 * Feature: settings-ui-fixes
 * 
 * 提供所有设置的默认值
 */

import type { LocalStorageData } from '../types';

/**
 * 获取默认设置数据
 * @returns 默认的LocalStorageData对象
 */
export function getDefaultSettings(): LocalStorageData {
  return {
    statistics: {
      totalClicks: 0,
      totalFireworks: 0,
      maxCombo: 0,
      totalPlayTime: 0,
      gamesPlayed: 0,
      achievements: [],
      milestones: [],
    },
    audioConfig: {
      musicVolume: 0.7,
      sfxVolume: 0.8,
      musicMuted: false,
      sfxMuted: false,
    },
    themeId: 'new-year-dinner',
    skinId: 'lantern',
    performanceProfile: {
      level: 'medium',
      maxParticles: 100,
      maxFireworks: 5,
      useWebGL: false,
      particleSize: 3,
      enableGlow: true,
      enableTrails: false,
    },
    manualOffset: 0,
    lastPlayedAt: Date.now(),
  };
}

/**
 * 合并保存的设置和默认设置
 * 确保所有必需字段都存在
 * @param savedData - 从存储加载的数据（可能不完整）
 * @returns 完整的设置数据
 */
export function mergeWithDefaults(savedData: Partial<LocalStorageData> | null): LocalStorageData {
  const defaults = getDefaultSettings();
  
  if (!savedData) {
    return defaults;
  }

  return {
    statistics: savedData.statistics || defaults.statistics,
    audioConfig: {
      ...defaults.audioConfig,
      ...savedData.audioConfig,
    },
    themeId: savedData.themeId || defaults.themeId,
    skinId: savedData.skinId || defaults.skinId,
    performanceProfile: {
      ...defaults.performanceProfile,
      ...savedData.performanceProfile,
    },
    manualOffset: savedData.manualOffset ?? defaults.manualOffset,
    lastPlayedAt: savedData.lastPlayedAt || defaults.lastPlayedAt,
  };
}
