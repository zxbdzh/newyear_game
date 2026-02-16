/**
 * 统计追踪器
 * Feature: new-year-fireworks-game
 *
 * 记录玩家的游戏数据
 * 需求：4.2, 4.3, 4.4, 4.5
 */

import type { PlayerStatistics, LocalStorageData } from '../types';
import { StorageService } from './StorageService';

/**
 * 里程碑配置
 * 定义达到特定点击数时解锁的烟花
 */
interface Milestone {
  clicks: number;
  fireworkId: string;
}

/**
 * 默认里程碑配置
 */
const DEFAULT_MILESTONES: Milestone[] = [
  { clicks: 10, fireworkId: 'meteor' },
  { clicks: 50, fireworkId: 'heart' },
  { clicks: 100, fireworkId: 'fortune' },
  { clicks: 200, fireworkId: 'redEnvelope' },
];

/**
 * 统计追踪器类
 */
export class StatisticsTracker {
  private stats: PlayerStatistics;
  private storageService: StorageService;
  private milestones: Milestone[];

  /**
   * 构造函数
   *
   * @param storageService - 存储服务实例
   * @param milestones - 自定义里程碑配置（可选）
   */
  constructor(storageService: StorageService, milestones?: Milestone[]) {
    this.storageService = storageService;
    this.milestones = milestones || DEFAULT_MILESTONES;

    // 初始化默认统计数据
    this.stats = {
      totalClicks: 0,
      maxCombo: 0,
      unlockedFireworks: new Set<string>(['peony']), // 默认解锁牡丹型
      totalPlayTime: 0,
      achievementsUnlocked: new Set<string>(),
      lastPlayedAt: Date.now(),
    };
  }

  /**
   * 加载统计数据
   *
   * @returns 加载的统计数据
   */
  async load(): Promise<PlayerStatistics> {
    try {
      const data = await this.storageService.load();

      if (data && data.statistics) {
        // 将数组转换回Set（IndexedDB不支持Set类型）
        this.stats = {
          ...data.statistics,
          unlockedFireworks: new Set(
            Array.isArray(data.statistics.unlockedFireworks)
              ? data.statistics.unlockedFireworks
              : Array.from(data.statistics.unlockedFireworks as any)
          ),
          achievementsUnlocked: new Set(
            Array.isArray(data.statistics.achievementsUnlocked)
              ? data.statistics.achievementsUnlocked
              : Array.from(data.statistics.achievementsUnlocked as any)
          ),
        };
      }

      return this.stats;
    } catch (error) {
      console.error('Failed to load statistics:', error);
      return this.stats;
    }
  }

  /**
   * 保存统计数据
   */
  async save(): Promise<void> {
    try {
      // 获取当前存储的数据
      const existingData = await this.storageService.load();

      // 将Set转换为数组以便存储（IndexedDB不支持Set类型）
      const statsToSave = {
        ...this.stats,
        unlockedFireworks: Array.from(this.stats.unlockedFireworks),
        achievementsUnlocked: Array.from(this.stats.achievementsUnlocked),
      } as any;

      // 合并数据
      const dataToSave: LocalStorageData = {
        statistics: statsToSave,
        audioConfig: existingData?.audioConfig || {
          musicVolume: 0.7,
          sfxVolume: 0.8,
          musicMuted: false,
          sfxMuted: false,
        },
        manualOffset: existingData?.manualOffset || 0,
        themeId: existingData?.themeId || 'default',
        skinId: existingData?.skinId || 'default',
        performanceProfile: existingData?.performanceProfile || {
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

      await this.storageService.save(dataToSave);
    } catch (error) {
      console.error('Failed to save statistics:', error);
      throw error;
    }
  }

  /**
   * 记录点击
   *
   * 增加总点击次数，并检查是否达到里程碑
   */
  recordClick(): void {
    this.stats.totalClicks++;
    this.stats.lastPlayedAt = Date.now();

    // 检查里程碑
    this.checkMilestones();
  }

  /**
   * 记录连击
   *
   * @param count - 连击次数
   */
  recordCombo(count: number): void {
    if (count > this.stats.maxCombo) {
      this.stats.maxCombo = count;
    }
    this.stats.lastPlayedAt = Date.now();
  }

  /**
   * 解锁烟花
   *
   * @param fireworkId - 烟花ID
   */
  unlockFirework(fireworkId: string): void {
    this.stats.unlockedFireworks.add(fireworkId);
    this.stats.lastPlayedAt = Date.now();
  }

  /**
   * 记录游戏时间
   *
   * @param seconds - 游戏时长（秒）
   */
  recordPlayTime(seconds: number): void {
    this.stats.totalPlayTime += seconds;
    this.stats.lastPlayedAt = Date.now();
  }

  /**
   * 解锁成就
   *
   * @param achievementId - 成就ID
   */
  unlockAchievement(achievementId: string): void {
    this.stats.achievementsUnlocked.add(achievementId);
    this.stats.lastPlayedAt = Date.now();
  }

  /**
   * 获取统计数据
   *
   * @returns 当前统计数据
   */
  getStatistics(): PlayerStatistics {
    return { ...this.stats };
  }

  /**
   * 重置统计数据
   */
  reset(): void {
    this.stats = {
      totalClicks: 0,
      maxCombo: 0,
      unlockedFireworks: new Set<string>(['peony']), // 保留默认烟花
      totalPlayTime: 0,
      achievementsUnlocked: new Set<string>(),
      lastPlayedAt: Date.now(),
    };
  }

  /**
   * 检查里程碑
   *
   * 检查是否达到任何里程碑，如果是则解锁对应的烟花
   */
  private checkMilestones(): void {
    for (const milestone of this.milestones) {
      if (
        this.stats.totalClicks >= milestone.clicks &&
        !this.stats.unlockedFireworks.has(milestone.fireworkId)
      ) {
        this.unlockFirework(milestone.fireworkId);
        console.log(
          `Milestone reached! Unlocked firework: ${milestone.fireworkId}`
        );
      }
    }
  }
}
