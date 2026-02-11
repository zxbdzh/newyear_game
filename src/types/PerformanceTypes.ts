/**
 * 性能优化类型定义
 * Feature: new-year-fireworks-game
 */

/**
 * 性能等级
 */
export type PerformanceLevel = 'low' | 'medium' | 'high';

/**
 * 性能配置
 */
export interface PerformanceProfile {
  /** 性能等级 */
  level: PerformanceLevel;
  /** 最大粒子数 */
  maxParticles: number;
  /** 最大烟花数 */
  maxFireworks: number;
  /** 是否使用WebGL */
  useWebGL: boolean;
  /** 粒子大小 */
  particleSize: number;
  /** 是否启用光晕效果 */
  enableGlow: boolean;
  /** 是否启用拖尾效果 */
  enableTrails: boolean;
}
