/**
 * 移动端优化工具
 * Feature: new-year-fireworks-game
 * 需求：10.1, 10.5
 *
 * 提供移动端专用的性能优化功能：
 * - 自动使用低性能配置
 * - 禁用某些特效
 * - 优化Canvas渲染
 * - 移动端专用UI布局
 */

import type { PerformanceProfile } from '../types/PerformanceTypes';

/**
 * 移动端优化配置
 */
export interface MobileOptimizationConfig {
  /** 是否禁用光晕效果 */
  disableGlow?: boolean;
  /** 是否禁用拖尾效果 */
  disableTrails?: boolean;
  /** Canvas分辨率缩放比例（0-1） */
  canvasScale?: number;
  /** 是否使用简化UI */
  useSimplifiedUI?: boolean;
  /** 最大粒子数量 */
  maxParticles?: number;
  /** 最大同时烟花数量 */
  maxFireworks?: number;
}

/**
 * 移动端优化器类
 */
export class MobileOptimizer {
  private isMobile: boolean;
  private isTablet: boolean;
  private config: Required<MobileOptimizationConfig>;

  constructor() {
    this.isMobile = this.detectMobile();
    this.isTablet = this.detectTablet();
    this.config = this.getDefaultConfig();
  }

  /**
   * 检测是否为移动设备
   */
  private detectMobile(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'android',
      'iphone',
      'ipod',
      'blackberry',
      'windows phone',
      'mobile',
    ];

    return mobileKeywords.some((keyword) => userAgent.includes(keyword));
  }

  /**
   * 检测是否为平板设备
   */
  private detectTablet(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const tabletKeywords = ['ipad', 'tablet', 'kindle'];

    return tabletKeywords.some((keyword) => userAgent.includes(keyword));
  }

  /**
   * 获取默认移动端优化配置
   */
  private getDefaultConfig(): Required<MobileOptimizationConfig> {
    if (this.isMobile && !this.isTablet) {
      // 手机：最激进的优化
      return {
        disableGlow: true,
        disableTrails: true,
        canvasScale: 0.75, // 75%分辨率
        useSimplifiedUI: true,
        maxParticles: 30,
        maxFireworks: 2,
      };
    } else if (this.isTablet) {
      // 平板：中等优化
      return {
        disableGlow: false,
        disableTrails: true,
        canvasScale: 0.85, // 85%分辨率
        useSimplifiedUI: false,
        maxParticles: 50,
        maxFireworks: 3,
      };
    } else {
      // 桌面：不优化
      return {
        disableGlow: false,
        disableTrails: false,
        canvasScale: 1.0,
        useSimplifiedUI: false,
        maxParticles: 100,
        maxFireworks: 5,
      };
    }
  }

  /**
   * 检查是否为移动设备
   */
  isMobileDevice(): boolean {
    return this.isMobile;
  }

  /**
   * 检查是否为平板设备
   */
  isTabletDevice(): boolean {
    return this.isTablet;
  }

  /**
   * 获取优化后的性能配置
   *
   * @param baseProfile - 基础性能配置
   * @returns 优化后的性能配置
   */
  getOptimizedProfile(baseProfile: PerformanceProfile): PerformanceProfile {
    if (!this.isMobile) {
      return baseProfile; // 桌面设备不需要额外优化
    }

    return {
      ...baseProfile,
      level: 'low', // 强制使用低性能配置
      maxParticles: Math.min(
        baseProfile.maxParticles,
        this.config.maxParticles
      ),
      maxFireworks: Math.min(
        baseProfile.maxFireworks,
        this.config.maxFireworks
      ),
      enableGlow: this.config.disableGlow ? false : baseProfile.enableGlow,
      enableTrails: this.config.disableTrails
        ? false
        : baseProfile.enableTrails,
      useWebGL: false, // 移动设备禁用WebGL以提高兼容性
      particleSize: Math.max(2, baseProfile.particleSize - 1), // 减小粒子尺寸
    };
  }

  /**
   * 优化Canvas尺寸
   *
   * @param canvas - Canvas元素
   */
  optimizeCanvasSize(canvas: HTMLCanvasElement): void {
    if (!this.isMobile) {
      // 桌面设备使用全分辨率
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      return;
    }

    // 移动设备使用缩放分辨率
    const scale = this.config.canvasScale;
    canvas.width = Math.floor(canvas.clientWidth * scale);
    canvas.height = Math.floor(canvas.clientHeight * scale);

    // 使用CSS缩放回原始大小
    canvas.style.width = `${canvas.clientWidth}px`;
    canvas.style.height = `${canvas.clientHeight}px`;
  }

  /**
   * 获取移动端优化配置
   */
  getConfig(): Required<MobileOptimizationConfig> {
    return { ...this.config };
  }

  /**
   * 更新移动端优化配置
   *
   * @param config - 新配置
   */
  updateConfig(config: Partial<MobileOptimizationConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * 检查是否应该使用简化UI
   */
  shouldUseSimplifiedUI(): boolean {
    return this.config.useSimplifiedUI;
  }

  /**
   * 获取推荐的触摸目标最小尺寸（像素）
   *
   * 根据WCAG 2.1标准，触摸目标应至少为44x44像素
   */
  getMinTouchTargetSize(): number {
    return this.isMobile ? 44 : 32;
  }

  /**
   * 检查设备是否支持触摸
   */
  supportsTouchEvents(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }

  /**
   * 获取设备像素比
   */
  getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  /**
   * 检查是否为高DPI屏幕
   */
  isHighDPI(): boolean {
    return this.getDevicePixelRatio() > 1;
  }

  /**
   * 获取推荐的Canvas缩放比例
   *
   * 考虑设备像素比和性能
   */
  getRecommendedCanvasScale(): number {
    if (!this.isMobile) {
      return 1.0;
    }

    const dpr = this.getDevicePixelRatio();

    if (dpr > 2) {
      // 高DPI设备（如Retina屏幕）
      return 0.5; // 使用50%分辨率以保持性能
    } else if (dpr > 1) {
      return 0.75; // 使用75%分辨率
    } else {
      return 1.0; // 标准分辨率
    }
  }

  /**
   * 禁用移动端的某些浏览器默认行为
   *
   * - 禁用双击缩放
   * - 禁用长按菜单
   * - 禁用拖拽选择
   */
  disableMobileBrowserDefaults(element: HTMLElement): void {
    if (!this.isMobile) {
      return;
    }

    // 禁用双击缩放
    element.style.touchAction = 'none';

    // 禁用长按菜单
    // @ts-expect-error TS2339 - webkitTouchCallout is a non-standard CSS property
    element.style.webkitTouchCallout = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.userSelect = 'none';

    // 禁用拖拽
    element.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );
  }

  /**
   * 获取移动端专用CSS类名
   */
  getMobileCSSClass(): string {
    if (this.isTablet) {
      return 'device-tablet';
    } else if (this.isMobile) {
      return 'device-mobile';
    } else {
      return 'device-desktop';
    }
  }

  /**
   * 检查是否为横屏模式
   */
  isLandscape(): boolean {
    return window.innerWidth > window.innerHeight;
  }

  /**
   * 检查是否为竖屏模式
   */
  isPortrait(): boolean {
    return window.innerHeight > window.innerWidth;
  }

  /**
   * 获取安全区域内边距（用于处理刘海屏等）
   */
  getSafeAreaInsets(): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    const style = getComputedStyle(document.documentElement);

    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(
        style.getPropertyValue('env(safe-area-inset-right)') || '0'
      ),
      bottom: parseInt(
        style.getPropertyValue('env(safe-area-inset-bottom)') || '0'
      ),
      left: parseInt(
        style.getPropertyValue('env(safe-area-inset-left)') || '0'
      ),
    };
  }
}

/**
 * 全局移动端优化器实例
 */
export const mobileOptimizer = new MobileOptimizer();
