/**
 * 烟花收藏管理器
 * Feature: firework-collection-system
 * 
 * 管理烟花的解锁、收藏和使用统计
 */

import type { FireworkCollection, FireworkCollectionItem } from '../types/CollectionTypes';
import type { StorageService } from './StorageService';

/**
 * 烟花解锁回调
 */
export type FireworkUnlockCallback = (item: FireworkCollectionItem) => void;

/**
 * 烟花收藏管理器类
 */
export class FireworkCollectionManager {
  private collection: Map<string, FireworkCollectionItem>;
  private unlockCallbacks: Set<FireworkUnlockCallback>;
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.collection = new Map();
    this.unlockCallbacks = new Set();
    this.storageService = storageService;
    
    // 初始化默认收藏项
    this.initializeDefaultCollection();
  }

  /**
   * 初始化默认收藏项
   */
  private initializeDefaultCollection(): void {
    const defaultItems: Omit<FireworkCollectionItem, 'unlocked' | 'unlockedAt' | 'usageCount'>[] = [
      {
        id: 'peony',
        name: '牡丹型',
        rarity: 'common',
        description: '经典的球形爆炸烟花，绽放如牡丹花',
        unlockCondition: '默认解锁'
      },
      {
        id: 'meteor',
        name: '流星型',
        rarity: 'rare',
        description: '带有拖尾效果的流星烟花',
        unlockCondition: '累计点击100次'
      },
      {
        id: 'heart',
        name: '心形',
        rarity: 'rare',
        description: '浪漫的心形烟花',
        unlockCondition: '累计点击1000次'
      },
      {
        id: 'fortune',
        name: '福字型',
        rarity: 'epic',
        description: '带有福字的新年特色烟花',
        unlockCondition: '累计点击10000次'
      },
      {
        id: 'redEnvelope',
        name: '红包型',
        rarity: 'legendary',
        description: '稀有的红包烟花，象征财运',
        unlockCondition: '达成200连击'
      }
    ];

    for (const item of defaultItems) {
      this.collection.set(item.id, {
        ...item,
        unlocked: item.id === 'peony', // 牡丹型默认解锁
        unlockedAt: item.id === 'peony' ? Date.now() : undefined,
        usageCount: 0
      });
    }
  }

  /**
   * 加载收藏数据
   */
  async load(): Promise<void> {
    try {
      const data = await this.storageService.load();
      if (data?.fireworkCollection) {
        // 合并保存的收藏数据
        for (const [id, savedItem] of Object.entries(data.fireworkCollection)) {
          const item = this.collection.get(id);
          if (item) {
            item.unlocked = (savedItem as FireworkCollectionItem).unlocked;
            item.unlockedAt = (savedItem as FireworkCollectionItem).unlockedAt;
            item.usageCount = (savedItem as FireworkCollectionItem).usageCount;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load firework collection:', error);
    }
  }

  /**
   * 保存收藏数据
   */
  async save(): Promise<void> {
    try {
      const data = await this.storageService.load();
      if (!data) {
        console.warn('No data to save collection to');
        return;
      }
      
      // 转换Map为对象
      const collectionObj: Record<string, FireworkCollectionItem> = {};
      for (const [id, item] of this.collection.entries()) {
        collectionObj[id] = item;
      }
      
      data.fireworkCollection = collectionObj;
      await this.storageService.save(data);
    } catch (error) {
      console.error('Failed to save firework collection:', error);
    }
  }

  /**
   * 解锁烟花
   */
  unlockFirework(id: string): boolean {
    const item = this.collection.get(id);
    if (!item || item.unlocked) {
      return false;
    }

    item.unlocked = true;
    item.unlockedAt = Date.now();

    // 触发回调
    this.triggerUnlockCallbacks(item);

    // 保存
    this.save().catch(console.error);

    return true;
  }

  /**
   * 记录烟花使用
   */
  recordUsage(id: string): void {
    const item = this.collection.get(id);
    if (item && item.unlocked) {
      item.usageCount++;
      this.save().catch(console.error);
    }
  }

  /**
   * 触发解锁回调
   */
  private triggerUnlockCallbacks(item: FireworkCollectionItem): void {
    for (const callback of this.unlockCallbacks) {
      try {
        callback(item);
      } catch (error) {
        console.error('Error in firework unlock callback:', error);
      }
    }
  }

  /**
   * 注册解锁回调
   */
  onUnlock(callback: FireworkUnlockCallback): void {
    this.unlockCallbacks.add(callback);
  }

  /**
   * 移除解锁回调
   */
  offUnlock(callback: FireworkUnlockCallback): void {
    this.unlockCallbacks.delete(callback);
  }

  /**
   * 获取所有收藏项
   */
  getAllItems(): FireworkCollectionItem[] {
    return Array.from(this.collection.values());
  }

  /**
   * 获取已解锁项
   */
  getUnlockedItems(): FireworkCollectionItem[] {
    return this.getAllItems().filter(item => item.unlocked);
  }

  /**
   * 获取收藏数据
   */
  getCollectionData(): FireworkCollection {
    const items = this.getAllItems();
    return {
      items: this.collection,
      totalUnlocked: items.filter(item => item.unlocked).length,
      totalCount: items.length
    };
  }

  /**
   * 获取特定收藏项
   */
  getItem(id: string): FireworkCollectionItem | undefined {
    return this.collection.get(id);
  }

  /**
   * 检查是否已解锁
   */
  isUnlocked(id: string): boolean {
    const item = this.collection.get(id);
    return item?.unlocked || false;
  }
}
