/**
 * 成就管理器
 * Feature: achievement-system
 * 
 * 管理游戏成就的解锁、进度追踪和通知
 */

import type { Achievement, AchievementData, AchievementType } from '../types/AchievementTypes';
import type { StorageService } from './StorageService';

/**
 * 成就解锁回调
 */
export type AchievementUnlockCallback = (achievement: Achievement) => void;

/**
 * 成就管理器类
 */
export class AchievementManager {
  private achievements: Map<string, Achievement>;
  private unlockCallbacks: Set<AchievementUnlockCallback>;
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.achievements = new Map();
    this.unlockCallbacks = new Set();
    this.storageService = storageService;
    
    // 初始化默认成就
    this.initializeDefaultAchievements();
  }

  /**
   * 初始化默认成就
   */
  private initializeDefaultAchievements(): void {
    const defaultAchievements: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
      // 点击成就
      {
        id: 'clicks_100',
        name: '初试身手',
        description: '累计点击100次',
        type: 'clicks',
        tier: 'bronze',
        target: 100,
        icon: '👆',
        reward: '解锁流星型烟花'
      },
      {
        id: 'clicks_1000',
        name: '点击大师',
        description: '累计点击1000次',
        type: 'clicks',
        tier: 'silver',
        target: 1000,
        icon: '✨',
        reward: '解锁心形烟花'
      },
      {
        id: 'clicks_10000',
        name: '点击传说',
        description: '累计点击10000次',
        type: 'clicks',
        tier: 'gold',
        target: 10000,
        icon: '🌟',
        reward: '解锁福字型烟花'
      },
      
      // 连击成就
      {
        id: 'combo_10',
        name: '连击新手',
        description: '达成10连击',
        type: 'combo',
        tier: 'bronze',
        target: 10,
        icon: '🔥'
      },
      {
        id: 'combo_50',
        name: '连击高手',
        description: '达成50连击',
        type: 'combo',
        tier: 'silver',
        target: 50,
        icon: '💥'
      },
      {
        id: 'combo_100',
        name: '连击大师',
        description: '达成100连击',
        type: 'combo',
        tier: 'gold',
        target: 100,
        icon: '⚡'
      },
      {
        id: 'combo_200',
        name: '连击传说',
        description: '达成200连击',
        type: 'combo',
        tier: 'platinum',
        target: 200,
        icon: '👑',
        reward: '解锁红包型烟花'
      },
      
      // 收藏成就
      {
        id: 'collection_3',
        name: '收藏家',
        description: '解锁3种烟花',
        type: 'collection',
        tier: 'bronze',
        target: 3,
        icon: '📦'
      },
      {
        id: 'collection_5',
        name: '烟花爱好者',
        description: '解锁全部5种烟花',
        type: 'collection',
        tier: 'gold',
        target: 5,
        icon: '🎆'
      },
      
      // 游戏时长成就
      {
        id: 'playtime_300',
        name: '新年常客',
        description: '游戏时长达到5分钟',
        type: 'playtime',
        tier: 'bronze',
        target: 300, // 秒
        icon: '⏰'
      },
      {
        id: 'playtime_1800',
        name: '新年达人',
        description: '游戏时长达到30分钟',
        type: 'playtime',
        tier: 'silver',
        target: 1800,
        icon: '⏱️'
      },
      
      // 特殊成就
      {
        id: 'special_newyear',
        name: '新年快乐',
        description: '在新年倒计时归零时在线',
        type: 'special',
        tier: 'platinum',
        target: 1,
        icon: '🎊',
        reward: '特殊新年祝福烟花'
      }
    ];

    for (const achievement of defaultAchievements) {
      this.achievements.set(achievement.id, {
        ...achievement,
        progress: 0,
        unlocked: false
      });
    }
  }

  /**
   * 加载成就数据
   */
  async load(): Promise<void> {
    try {
      const data = await this.storageService.load();
      if (data?.achievements) {
        // 合并保存的成就数据
        for (const [id, savedAchievement] of Object.entries(data.achievements)) {
          const achievement = this.achievements.get(id);
          if (achievement) {
            achievement.progress = (savedAchievement as Achievement).progress;
            achievement.unlocked = (savedAchievement as Achievement).unlocked;
            achievement.unlockedAt = (savedAchievement as Achievement).unlockedAt;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  }

  /**
   * 保存成就数据
   */
  async save(): Promise<void> {
    try {
      const data = await this.storageService.load();
      if (!data) {
        console.warn('No data to save achievements to');
        return;
      }
      
      // 转换Map为对象
      const achievementsObj: Record<string, Achievement> = {};
      for (const [id, achievement] of this.achievements.entries()) {
        achievementsObj[id] = achievement;
      }
      
      data.achievements = achievementsObj;
      await this.storageService.save(data);
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  }

  /**
   * 更新成就进度
   */
  updateProgress(type: AchievementType, value: number): void {
    for (const achievement of this.achievements.values()) {
      if (achievement.type === type && !achievement.unlocked) {
        achievement.progress = Math.max(achievement.progress, value);
        
        // 检查是否达成
        if (achievement.progress >= achievement.target) {
          this.unlockAchievement(achievement.id);
        }
      }
    }
  }

  /**
   * 解锁成就
   */
  unlockAchievement(id: string): void {
    const achievement = this.achievements.get(id);
    if (!achievement || achievement.unlocked) {
      return;
    }

    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();
    achievement.progress = achievement.target;

    // 触发回调
    this.triggerUnlockCallbacks(achievement);

    // 保存
    this.save().catch(console.error);
  }

  /**
   * 触发解锁回调
   */
  private triggerUnlockCallbacks(achievement: Achievement): void {
    for (const callback of this.unlockCallbacks) {
      try {
        callback(achievement);
      } catch (error) {
        console.error('Error in achievement unlock callback:', error);
      }
    }
  }

  /**
   * 注册解锁回调
   */
  onUnlock(callback: AchievementUnlockCallback): void {
    this.unlockCallbacks.add(callback);
  }

  /**
   * 移除解锁回调
   */
  offUnlock(callback: AchievementUnlockCallback): void {
    this.unlockCallbacks.delete(callback);
  }

  /**
   * 获取所有成就
   */
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * 获取已解锁成就
   */
  getUnlockedAchievements(): Achievement[] {
    return this.getAllAchievements().filter(a => a.unlocked);
  }

  /**
   * 获取成就数据
   */
  getAchievementData(): AchievementData {
    const achievements = this.getAllAchievements();
    return {
      achievements: this.achievements,
      totalUnlocked: achievements.filter(a => a.unlocked).length,
      totalCount: achievements.length
    };
  }

  /**
   * 获取特定成就
   */
  getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }
}
