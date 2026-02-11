/**
 * 连击系统类型定义
 * Feature: new-year-fireworks-game
 */

/**
 * 连击配置
 */
export interface ComboConfig {
  /** 连击时间窗口（毫秒） */
  timeWindow: number;
  /** 最小连击次数 */
  minClicks: number;
  /** 连击倍数映射 */
  comboMultipliers: Map<number, number>;
}

/**
 * 连击状态
 */
export interface ComboState {
  /** 连击次数 */
  count: number;
  /** 最后一次点击时间 */
  lastClickTime: number;
  /** 是否激活 */
  isActive: boolean;
  /** 当前倍数 */
  multiplier: number;
}
