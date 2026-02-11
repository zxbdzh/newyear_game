/**
 * 倒计时类型定义
 * Feature: new-year-fireworks-game
 */

/**
 * 倒计时时间
 */
export interface CountdownTime {
  /** 剩余天数 */
  days: number;
  /** 剩余小时数 */
  hours: number;
  /** 剩余分钟数 */
  minutes: number;
  /** 剩余秒数 */
  seconds: number;
  /** 总剩余秒数 */
  totalSeconds: number;
}

/**
 * 倒计时配置
 */
export interface CountdownConfig {
  /** 目标日期（农历新年） */
  targetDate: Date;
  /** 时区 */
  timezone: string;
  /** 手动校准偏移（秒） */
  manualOffset: number;
}
