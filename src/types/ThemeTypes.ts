/**
 * 主题类型定义
 * Feature: new-year-fireworks-game
 */

/**
 * 主题定义
 */
export interface Theme {
  /** 主题唯一标识 */
  id: string;
  /** 主题名称 */
  name: string;
  /** 背景图片URL */
  backgroundImage: string;
  /** 主色调 */
  primaryColor: string;
  /** 次要颜色 */
  secondaryColor: string;
  /** 强调色 */
  accentColor: string;
}

/**
 * 倒计时皮肤
 */
export interface CountdownSkin {
  /** 皮肤唯一标识 */
  id: string;
  /** 皮肤名称 */
  name: string;
  /** 字体族 */
  fontFamily: string;
  /** 光晕颜色 */
  glowColor: string;
  /** 装饰图片URL */
  decorationImage?: string;
}
