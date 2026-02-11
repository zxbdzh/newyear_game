/**
 * 主题管理器属性测试
 * Feature: new-year-fireworks-game
 * 
 * 使用fast-check进行基于属性的测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ThemeManager } from './ThemeManager';
import { StorageService } from './StorageService';
import type { Theme, CountdownSkin } from '../types';

describe('ThemeManager Property-Based Tests', () => {
  let storageService: StorageService;
  let themeManager: ThemeManager;

  beforeEach(() => {
    storageService = new StorageService();
    themeManager = new ThemeManager(storageService);
  });

  // Feature: new-year-fireworks-game, Property 21: 主题和皮肤可用性
  // **Validates: Requirements 6.5, 6.6**
  describe('Property 21: 主题和皮肤可用性', () => {
    it('should always provide at least 3 background themes', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const themes = themeManager.getThemes();
          
          // 验证至少有3种背景主题
          expect(themes.length).toBeGreaterThanOrEqual(3);
          
          // 验证每个主题都有必需的属性
          themes.forEach(theme => {
            expect(theme).toHaveProperty('id');
            expect(theme).toHaveProperty('name');
            expect(theme).toHaveProperty('backgroundImage');
            expect(theme).toHaveProperty('primaryColor');
            expect(theme).toHaveProperty('secondaryColor');
            expect(theme).toHaveProperty('accentColor');
            
            // 验证属性不为空
            expect(theme.id).toBeTruthy();
            expect(theme.name).toBeTruthy();
            expect(theme.backgroundImage).toBeTruthy();
            expect(theme.primaryColor).toBeTruthy();
            expect(theme.secondaryColor).toBeTruthy();
            expect(theme.accentColor).toBeTruthy();
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should always provide at least 2 countdown skins', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const skins = themeManager.getSkins();
          
          // 验证至少有2种倒计时皮肤（实际实现了3种）
          expect(skins.length).toBeGreaterThanOrEqual(2);
          
          // 验证每个皮肤都有必需的属性
          skins.forEach(skin => {
            expect(skin).toHaveProperty('id');
            expect(skin).toHaveProperty('name');
            expect(skin).toHaveProperty('fontFamily');
            expect(skin).toHaveProperty('glowColor');
            
            // 验证属性不为空
            expect(skin.id).toBeTruthy();
            expect(skin.name).toBeTruthy();
            expect(skin.fontFamily).toBeTruthy();
            expect(skin.glowColor).toBeTruthy();
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should have unique theme IDs', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const themes = themeManager.getThemes();
          const ids = themes.map(t => t.id);
          const uniqueIds = new Set(ids);
          
          // 验证所有主题ID都是唯一的
          expect(uniqueIds.size).toBe(ids.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should have unique skin IDs', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const skins = themeManager.getSkins();
          const ids = skins.map(s => s.id);
          const uniqueIds = new Set(ids);
          
          // 验证所有皮肤ID都是唯一的
          expect(uniqueIds.size).toBe(ids.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should include required theme names', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const themes = themeManager.getThemes();
          const names = themes.map(t => t.name);
          
          // 验证包含需求中指定的3种场景
          expect(names).toContain('年夜饭场景');
          expect(names).toContain('庙会场景');
          expect(names).toContain('雪乡场景');
        }),
        { numRuns: 100 }
      );
    });

    it('should include required skin names', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const skins = themeManager.getSkins();
          const names = skins.map(s => s.name);
          
          // 验证包含需求中指定的3种样式
          expect(names).toContain('灯笼样式');
          expect(names).toContain('对联样式');
          expect(names).toContain('生肖样式');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Theme Application', () => {
    it('should successfully apply any valid theme', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const themes = themeManager.getThemes();
          
          // 随机选择一个主题
          const randomTheme = themes[Math.floor(Math.random() * themes.length)];
          
          // 应用主题不应抛出错误
          expect(() => themeManager.applyTheme(randomTheme.id)).not.toThrow();
          
          // 验证当前主题已更新
          const currentTheme = themeManager.getCurrentTheme();
          expect(currentTheme.id).toBe(randomTheme.id);
        }),
        { numRuns: 100 }
      );
    });

    it('should throw error for invalid theme ID', () => {
      fc.assert(
        fc.property(
          fc.string().filter(id => !themeManager.getThemes().some(t => t.id === id)),
          (invalidId) => {
            // 应用无效主题ID应该抛出错误
            expect(() => themeManager.applyTheme(invalidId)).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should successfully apply any valid skin', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const skins = themeManager.getSkins();
          
          // 随机选择一个皮肤
          const randomSkin = skins[Math.floor(Math.random() * skins.length)];
          
          // 应用皮肤不应抛出错误
          expect(() => themeManager.applySkin(randomSkin.id)).not.toThrow();
          
          // 验证当前皮肤已更新
          const currentSkin = themeManager.getCurrentSkin();
          expect(currentSkin.id).toBe(randomSkin.id);
        }),
        { numRuns: 100 }
      );
    });

    it('should throw error for invalid skin ID', () => {
      fc.assert(
        fc.property(
          fc.string().filter(id => !themeManager.getSkins().some(s => s.id === id)),
          (invalidId) => {
            // 应用无效皮肤ID应该抛出错误
            expect(() => themeManager.applySkin(invalidId)).toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Theme Registration', () => {
    // 生成随机主题的arbitrary - 使用简单的颜色格式
    const hexColorArbitrary = fc.integer({ min: 0, max: 0xFFFFFF }).map(n => 
      '#' + n.toString(16).padStart(6, '0')
    );

    const themeArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      backgroundImage: fc.webUrl(),
      primaryColor: hexColorArbitrary,
      secondaryColor: hexColorArbitrary,
      accentColor: hexColorArbitrary
    });

    it('should allow registering new themes', () => {
      fc.assert(
        fc.property(themeArbitrary, (theme: Theme) => {
          const initialCount = themeManager.getThemes().length;
          
          // 注册新主题
          themeManager.registerTheme(theme);
          
          // 验证主题数量增加（如果ID不重复）
          const newCount = themeManager.getThemes().length;
          expect(newCount).toBeGreaterThanOrEqual(initialCount);
          
          // 验证可以获取注册的主题
          const themes = themeManager.getThemes();
          const registeredTheme = themes.find(t => t.id === theme.id);
          expect(registeredTheme).toBeDefined();
          expect(registeredTheme?.name).toBe(theme.name);
        }),
        { numRuns: 100 }
      );
    });

    // 生成随机皮肤的arbitrary
    const skinArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      fontFamily: fc.constantFrom(
        'serif',
        'sans-serif',
        'monospace',
        '"Arial", sans-serif',
        '"Times New Roman", serif'
      ),
      glowColor: hexColorArbitrary,
      decorationImage: fc.option(fc.webUrl(), { nil: undefined })
    });

    it('should allow registering new skins', () => {
      fc.assert(
        fc.property(skinArbitrary, (skin: CountdownSkin) => {
          const initialCount = themeManager.getSkins().length;
          
          // 注册新皮肤
          themeManager.registerSkin(skin);
          
          // 验证皮肤数量增加（如果ID不重复）
          const newCount = themeManager.getSkins().length;
          expect(newCount).toBeGreaterThanOrEqual(initialCount);
          
          // 验证可以获取注册的皮肤
          const skins = themeManager.getSkins();
          const registeredSkin = skins.find(s => s.id === skin.id);
          expect(registeredSkin).toBeDefined();
          expect(registeredSkin?.name).toBe(skin.name);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Current Theme and Skin', () => {
    it('should always have a current theme', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const currentTheme = themeManager.getCurrentTheme();
          
          // 验证当前主题存在且有效
          expect(currentTheme).toBeDefined();
          expect(currentTheme.id).toBeTruthy();
          expect(currentTheme.name).toBeTruthy();
        }),
        { numRuns: 100 }
      );
    });

    it('should always have a current skin', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const currentSkin = themeManager.getCurrentSkin();
          
          // 验证当前皮肤存在且有效
          expect(currentSkin).toBeDefined();
          expect(currentSkin.id).toBeTruthy();
          expect(currentSkin.name).toBeTruthy();
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain current theme after multiple operations', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const themes = themeManager.getThemes();
          
          // 随机应用多个主题
          for (let i = 0; i < 5; i++) {
            const randomTheme = themes[Math.floor(Math.random() * themes.length)];
            themeManager.applyTheme(randomTheme.id);
            
            // 验证当前主题正确
            const currentTheme = themeManager.getCurrentTheme();
            expect(currentTheme.id).toBe(randomTheme.id);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
