/**
 * 主题管理器服务
 * Feature: settings-ui-fixes
 * 
 * 负责将主题配置应用为CSS变量
 * 需求：1.1, 1.2
 */

import type { Theme } from '../types/ThemeTypes';

/**
 * 主题管理器类
 * 负责应用主题到DOM并读取当前主题颜色
 */
export class ThemeManager {
  /**
   * 应用主题到DOM
   * 将主题的颜色值设置为CSS自定义属性
   * 
   * @param theme - 主题配置对象
   */
  applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    // 应用主题颜色到CSS变量
    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--color-secondary', theme.secondaryColor);
    root.style.setProperty('--color-accent', theme.accentColor);
    
    // 根据主题生成背景渐变
    const bgGradient = `linear-gradient(135deg, ${theme.primaryColor}15 0%, ${theme.primaryColor}30 50%, ${theme.primaryColor}50 100%)`;
    root.style.setProperty('--color-bg-primary', bgGradient);
    
    // 如果有背景图片，应用背景
    if (theme.backgroundImage) {
      root.style.setProperty('--bg-image', `url(${theme.backgroundImage})`);
    } else {
      // 清除背景图片
      root.style.removeProperty('--bg-image');
    }
    
    console.log('[ThemeManager] Applied theme:', theme.id);
  }
  
  /**
   * 获取当前应用的主题颜色
   * 从CSS变量中读取当前的主题颜色值
   * 
   * @returns 主题颜色对象，包含primary、secondary和accent颜色
   */
  getCurrentThemeColors(): { primary: string; secondary: string; accent: string } {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    return {
      primary: computedStyle.getPropertyValue('--color-primary').trim(),
      secondary: computedStyle.getPropertyValue('--color-secondary').trim(),
      accent: computedStyle.getPropertyValue('--color-accent').trim(),
    };
  }
}
