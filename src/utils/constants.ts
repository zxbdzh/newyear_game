// 游戏常量定义

// 房间配置
export const MAX_PLAYERS = 20;
export const ROOM_CODE_LENGTH = 4;

// 连击配置
export const COMBO_TIME_WINDOW = 3000; // 3秒
export const MIN_COMBO_CLICKS = 2;

// 烟花配置
export const DEFAULT_FIREWORK_DURATION = 2500; // 2.5秒
export const MIN_FIREWORK_DURATION = 2000; // 2秒
export const MAX_FIREWORK_DURATION = 3000; // 3秒

// 网络配置
export const MAX_RECONNECT_ATTEMPTS = 3;
export const RECONNECT_INTERVAL = 5000; // 5秒
export const HIGH_LATENCY_THRESHOLD = 3000; // 3秒

// 性能配置
export const TARGET_FPS_LOW = 30;
export const TARGET_FPS_HIGH = 60;
export const FPS_CHECK_INTERVAL = 5000; // 5秒

// 昵称验证
export const MIN_NICKNAME_LENGTH = 1;
export const MAX_NICKNAME_LENGTH = 8;

// 特殊事件
export const TEN_MINUTE_COUNTDOWN = 600; // 10分钟（秒）

/**
 * 响应式断点配置
 * 定义不同设备类型的屏幕宽度范围
 * 
 * @example
 * ```ts
 * if (width >= BREAKPOINTS.tablet.min && width <= BREAKPOINTS.tablet.max) {
 *   // 平板设备逻辑
 * }
 * ```
 */
export const BREAKPOINTS = {
  mobile: {
    min: 320,
    max: 767,
  },
  tablet: {
    min: 768,
    max: 1023,
  },
  desktop: {
    min: 1024,
    max: Infinity,
  },
} as const;

/**
 * 断点类型
 */
export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * 媒体查询字符串
 * 用于CSS-in-JS或styled-components
 * 
 * @example
 * ```ts
 * const styles = {
 *   [MEDIA_QUERIES.mobile]: {
 *     fontSize: '14px'
 *   }
 * }
 * ```
 */
export const MEDIA_QUERIES = {
  mobile: `@media (max-width: ${BREAKPOINTS.mobile.max}px)`,
  tablet: `@media (min-width: ${BREAKPOINTS.tablet.min}px) and (max-width: ${BREAKPOINTS.tablet.max}px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.desktop.min}px)`,
  touchDevice: '@media (hover: none) and (pointer: coarse)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  highContrast: '@media (prefers-contrast: high)',
} as const;

/**
 * 获取当前窗口宽度对应的断点
 * 
 * @param width - 窗口宽度（默认使用window.innerWidth）
 * @returns 当前断点类型
 * 
 * @example
 * ```ts
 * const currentBreakpoint = getCurrentBreakpoint();
 * if (currentBreakpoint === 'mobile') {
 *   // 移动端特定逻辑
 * }
 * ```
 */
export function getCurrentBreakpoint(width: number = typeof window !== 'undefined' ? window.innerWidth : 1024): Breakpoint {
  if (width >= BREAKPOINTS.desktop.min) return 'desktop';
  if (width >= BREAKPOINTS.tablet.min) return 'tablet';
  return 'mobile';
}

/**
 * 检查当前是否为移动设备
 * 
 * @returns 是否为移动设备
 */
export function isMobileDevice(): boolean {
  return getCurrentBreakpoint() === 'mobile';
}

/**
 * 检查是否支持触摸
 * 
 * @returns 是否支持触摸
 */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
}
