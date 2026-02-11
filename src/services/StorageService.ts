/**
 * 本地存储服务
 * Feature: new-year-fireworks-game
 * 
 * 使用IndexedDB实现数据持久化
 * 需求：4.4, 4.5
 */

import type { LocalStorageData } from '../types';

/**
 * 数据库名称
 */
const DB_NAME = 'NewYearFireworksGame';

/**
 * 数据库版本
 */
const DB_VERSION = 1;

/**
 * 对象存储名称
 */
const STORE_NAME = 'gameData';

/**
 * 数据键
 */
const DATA_KEY = 'localStorageData';

/**
 * 本地存储服务类
 */
export class StorageService {
  private db: IDBDatabase | null = null;

  /**
   * 初始化数据库
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建对象存储（如果不存在）
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  /**
   * 保存数据到本地存储
   * 
   * @param data - 要保存的数据
   */
  async save(data: LocalStorageData): Promise<void> {
    try {
      const db = await this.initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data, DATA_KEY);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error('Failed to save data'));
        };

        transaction.onerror = () => {
          // 检查是否是配额超限错误
          if (transaction.error?.name === 'QuotaExceededError') {
            reject(new Error('QuotaExceededError'));
          } else {
            reject(new Error('Transaction failed'));
          }
        };
      });
    } catch (error) {
      // 如果是配额超限错误，尝试清理旧数据后重试
      if (error instanceof Error && error.message === 'QuotaExceededError') {
        await this.clearOldData();
        // 重试一次
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.put(data, DATA_KEY);

          request.onsuccess = () => {
            resolve();
          };

          request.onerror = () => {
            reject(new Error('Failed to save data after retry'));
          };
        });
      }
      throw error;
    }
  }

  /**
   * 从本地存储加载数据
   * 
   * @returns 加载的数据，如果不存在则返回null
   */
  async load(): Promise<LocalStorageData | null> {
    try {
      const db = await this.initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(DATA_KEY);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          reject(new Error('Failed to load data'));
        };
      });
    } catch (error) {
      console.error('Failed to load data from IndexedDB:', error);
      return null;
    }
  }

  /**
   * 清理旧数据
   * 
   * 删除所有存储的数据以释放空间
   */
  async clearOldData(): Promise<void> {
    try {
      const db = await this.initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('Old data cleared successfully');
          resolve();
        };

        request.onerror = () => {
          reject(new Error('Failed to clear old data'));
        };
      });
    } catch (error) {
      console.error('Failed to clear old data:', error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
