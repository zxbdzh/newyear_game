/**
 * 烟花类型定义
 * Feature: new-year-fireworks-game
 */

/**
 * 烟花图案类型
 */
export type FireworkPattern = 'peony' | 'meteor' | 'heart' | 'fortune' | 'redEnvelope';

/**
 * 烟花状态
 */
export type FireworkState = 'launching' | 'exploding' | 'fading' | 'complete';

/**
 * 烟花类型定义
 */
export interface FireworkType {
  /** 烟花类型唯一标识 */
  id: string;
  /** 烟花类型名称 */
  name: string;
  /** 粒子数量 */
  particleCount: number;
  /** 颜色方案 */
  colors: string[];
  /** 图案类型 */
  pattern: FireworkPattern;
  /** 持续时间（毫秒） */
  duration: number;
  /** 特殊效果（如祝福语） */
  specialEffect?: string;
}

/**
 * 粒子定义
 */
export interface Particle {
  /** X坐标 */
  x: number;
  /** Y坐标 */
  y: number;
  /** X方向速度 */
  vx: number;
  /** Y方向速度 */
  vy: number;
  /** 颜色 */
  color: string;
  /** 透明度 */
  alpha: number;
  /** 大小 */
  size: number;
}

/**
 * 烟花实例
 */
export interface FireworkInstance {
  /** 烟花实例唯一标识 */
  id: string;
  /** 烟花类型 */
  type: FireworkType;
  /** X坐标 */
  x: number;
  /** Y坐标 */
  y: number;
  /** 开始时间 */
  startTime: number;
  /** 粒子数组 */
  particles: Particle[];
  /** 当前状态 */
  state: FireworkState;
}
