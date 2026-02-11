/**
 * 主题管理器
 * Feature: new-year-fireworks-game
 * 
 * 处理视觉主题和倒计时皮肤的管理
 * 需求：6.1, 6.5, 6.6
 */

import type { Theme, CountdownSkin } from '../types';
import type { StorageService } from './StorageService';

/**
 * 主题管理器类
 */
export class ThemeManager {
  private themes: Map<string, Theme>;
  private skins: Map<string, CountdownSkin>;
  private currentTheme: Theme;
  private currentSkin: CountdownSkin;
  private storageService: StorageService;

  /**
   * 构造函数
   * 
   * @param storageService - 存储服务实例
   */
  constructor(storageService: StorageService) {
    this.themes = new Map();
    this.skins = new Map();
    this.storageService = storageService;

    // 注册默认主题
    this.registerDefaultThemes();
    // 注册默认皮肤
    this.registerDefaultSkins();

    // 设置默认主题和皮肤
    this.currentTheme = this.themes.get('new-year-dinner')!;
    this.currentSkin = this.skins.get('lantern')!;
  }

  /**
   * 注册默认主题
   */
  private registerDefaultThemes(): void {
    // 年夜饭场景
    this.registerTheme({
      id: 'new-year-dinner',
      name: '年夜饭场景',
      backgroundImage: '/themes/new-year-dinner.jpg',
      primaryColor: '#D32F2F',
      secondaryColor: '#FFD700',
      accentColor: '#FF6B6B'
    });

    // 庙会场景
    this.registerTheme({
      id: 'temple-fair',
      name: '庙会场景',
      backgroundImage: '/themes/temple-fair.jpg',
      primaryColor: '#C62828',
      secondaryColor: '#FFA726',
      accentColor: '#FF8A65'
    });

    // 雪乡场景
    this.registerTheme({
      id: 'snow-village',
      name: '雪乡场景',
      backgroundImage: '/themes/snow-village.jpg',
      primaryColor: '#1976D2',
      secondaryColor: '#E3F2FD',
      accentColor: '#64B5F6'
    });
  }

  /**
   * 注册默认皮肤
   */
  private registerDefaultSkins(): void {
    // 灯笼样式
    this.registerSkin({
      id: 'lantern',
      name: '灯笼样式',
      fontFamily: '"KaiTi", "楷体", serif',
      glowColor: '#FF6B6B',
      decorationImage: '/skins/lantern.png'
    });

    // 对联样式
    this.registerSkin({
      id: 'couplet',
      name: '对联样式',
      fontFamily: '"SimSun", "宋体", serif',
      glowColor: '#FFD700',
      decorationImage: '/skins/couplet.png'
    });

    // 生肖样式
    this.registerSkin({
      id: 'zodiac',
      name: '生肖样式',
      fontFamily: '"Microsoft YaHei", "微软雅黑", sans-serif',
      glowColor: '#FFA726',
      decorationImage: '/skins/zodiac.png'
    });
  }

  /**
   * 加载主题配置
   * 从本地存储加载用户选择的主题和皮肤
   */
  async load(): Promise<void> {
    try {
      const data = await this.storageService.load();
      
      if (data) {
        // 加载主题
        if (data.themeId && this.themes.has(data.themeId)) {
          this.currentTheme = this.themes.get(data.themeId)!;
        }
        
        // 加载皮肤
        if (data.skinId && this.skins.has(data.skinId)) {
          this.currentSkin = this.skins.get(data.skinId)!;
        }
      }
    } catch (error) {
      console.error('Failed to load theme configuration:', error);
      // 使用默认主题和皮肤
    }
  }

  /**
   * 注册主题
   * 
   * @param theme - 主题对象
   */
  registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
  }

  /**
   * 注册倒计时皮肤
   * 
   * @param skin - 皮肤对象
   */
  registerSkin(skin: CountdownSkin): void {
    this.skins.set(skin.id, skin);
  }

  /**
   * 应用主题
   * 
   * @param themeId - 主题ID
   */
  applyTheme(themeId: string): void {
    const theme = this.themes.get(themeId);
    
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }
    
    this.currentTheme = theme;
    
    // 应用主题到DOM
    this.applyThemeToDOM(theme);
    
    // 保存到本地存储
    this.saveConfiguration();
  }

  /**
   * 应用倒计时皮肤
   * 
   * @param skinId - 皮肤ID
   */
  applySkin(skinId: string): void {
    const skin = this.skins.get(skinId);
    
    if (!skin) {
      throw new Error(`Skin not found: ${skinId}`);
    }
    
    this.currentSkin = skin;
    
    // 保存到本地存储
    this.saveConfiguration();
  }

  /**
   * 应用主题到DOM
   * 
   * @param theme - 主题对象
   */
  private applyThemeToDOM(theme: Theme): void {
    const root = document.documentElement;
    
    // 设置CSS变量
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--background-image', `url(${theme.backgroundImage})`);
  }

  /**
   * 保存配置到本地存储
   */
  private async saveConfiguration(): Promise<void> {
    try {
      const data = await this.storageService.load();
      
      if (data) {
        data.themeId = this.currentTheme.id;
        data.skinId = this.currentSkin.id;
        await this.storageService.save(data);
      }
    } catch (error) {
      console.error('Failed to save theme configuration:', error);
    }
  }

  /**
   * 获取所有主题
   * 
   * @returns 主题数组
   */
  getThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  /**
   * 获取所有皮肤
   * 
   * @returns 皮肤数组
   */
  getSkins(): CountdownSkin[] {
    return Array.from(this.skins.values());
  }

  /**
   * 获取当前主题
   * 
   * @returns 当前主题
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * 获取当前皮肤
   * 
   * @returns 当前皮肤
   */
  getCurrentSkin(): CountdownSkin {
    return this.currentSkin;
  }
}
