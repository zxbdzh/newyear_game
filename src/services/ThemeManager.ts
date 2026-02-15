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
    
    // 根据主题ID生成不同的背景渐变，确保主题差异明显
    let bgGradient: string;
    
    switch (theme.id) {
      case 'theme1':
        // 主题1: 明亮红色渐变 (传统新年红)
        bgGradient = `linear-gradient(135deg, 
          #8B0000 0%, 
          #DC143C 25%, 
          #FF0000 50%, 
          #DC143C 75%, 
          #8B0000 100%)`;
        break;
      
      case 'theme2':
        // 主题2: 深红黑渐变 (神秘夜空)
        bgGradient = `linear-gradient(135deg, 
          #0a0a0a 0%, 
          #1a0505 25%, 
          #2d0a0a 50%, 
          #1a0505 75%, 
          #0a0a0a 100%)`;
        break;
      
      case 'theme3':
        // 主题3: 深蓝紫渐变 (神秘星空) - 与其他主题明显区别
        bgGradient = `linear-gradient(135deg, 
          #1a0033 0%, 
          #2d1b69 25%, 
          #1e3a8a 50%, 
          #2d1b69 75%, 
          #1a0033 100%)`;
        break;
      
      default:
        // 默认渐变
        bgGradient = `linear-gradient(135deg, ${theme.primaryColor}15 0%, ${theme.primaryColor}30 50%, ${theme.primaryColor}50 100%)`;
    }
    
    root.style.setProperty('--color-bg-primary', bgGradient);
    
    // 如果有背景图片，应用背景
    if (theme.backgroundImage) {
      root.style.setProperty('--bg-image', `url(${theme.backgroundImage})`);
    } else {
      // 清除背景图片
      root.style.removeProperty('--bg-image');
    }
    
    console.log('[ThemeManager] Applied theme:', theme.id, 'with gradient:', bgGradient);
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
