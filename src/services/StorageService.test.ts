/**
 * StorageService 单元测试
 * Feature: settings-ui-fixes
 * 
 * 测试皮肤持久化功能
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageService } from './StorageService';
import type { LocalStorageData } from '../types';

describe('StorageService - 皮肤持久化', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
  });

  afterEach(async () => {
    // 清理测试数据
    await storageService.clearOldData();
    storageService.close();
  });

  it('should save and load skinId', async () => {
    // Arrange
    const testData: LocalStorageData = {
      statistics: {
        totalClicks: 100,
        totalFireworks: 50,
        maxCombo: 10,
        totalPlayTime: 3600,
        achievements: [],
        milestones: [],
      },
      audioConfig: {
        musicVolume: 0.5,
        sfxVolume: 0.7,
        musicMuted: false,
        sfxMuted: false,
      },
      themeId: 'new-year-dinner',
      skinId: 'couplet', // 测试对联皮肤
      performanceProfile: {
        level: 'medium',
        maxParticles: 100,
        maxFireworks: 5,
        useWebGL: false,
        particleSize: 3,
        enableGlow: true,
        enableTrails: false,
      },
      lastPlayedAt: Date.now(),
    };

    // Act
    await storageService.save(testData);
    const loadedData = await storageService.load();

    // Assert
    expect(loadedData).not.toBeNull();
    expect(loadedData?.skinId).toBe('couplet');
  });

  it('should persist different skin IDs', async () => {
    // Arrange
    const skinIds = ['lantern', 'couplet', 'zodiac'];

    for (const skinId of skinIds) {
      const testData: LocalStorageData = {
        statistics: {
          totalClicks: 0,
          totalFireworks: 0,
          maxCombo: 0,
          totalPlayTime: 0,
          achievements: [],
          milestones: [],
        },
        audioConfig: {
          musicVolume: 0.5,
          sfxVolume: 0.5,
          musicMuted: false,
          sfxMuted: false,
        },
        themeId: 'new-year-dinner',
        skinId: skinId,
        performanceProfile: {
          level: 'medium',
          maxParticles: 100,
          maxFireworks: 5,
          useWebGL: false,
          particleSize: 3,
          enableGlow: true,
          enableTrails: false,
        },
        lastPlayedAt: Date.now(),
      };

      // Act
      await storageService.save(testData);
      const loadedData = await storageService.load();

      // Assert
      expect(loadedData?.skinId).toBe(skinId);
    }
  });

  it('should return null when no data is saved', async () => {
    // Act
    const loadedData = await storageService.load();

    // Assert
    expect(loadedData).toBeNull();
  });

  it('should update skinId when saving multiple times', async () => {
    // Arrange
    const initialData: LocalStorageData = {
      statistics: {
        totalClicks: 0,
        totalFireworks: 0,
        maxCombo: 0,
        totalPlayTime: 0,
        achievements: [],
        milestones: [],
      },
      audioConfig: {
        musicVolume: 0.5,
        sfxVolume: 0.5,
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
      lastPlayedAt: Date.now(),
    };

    // Act - 保存初始数据
    await storageService.save(initialData);
    let loadedData = await storageService.load();
    expect(loadedData?.skinId).toBe('lantern');

    // Act - 更新皮肤ID
    const updatedData = { ...initialData, skinId: 'zodiac' };
    await storageService.save(updatedData);
    loadedData = await storageService.load();

    // Assert
    expect(loadedData?.skinId).toBe('zodiac');
  });
});
