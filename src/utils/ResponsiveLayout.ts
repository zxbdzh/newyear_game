/**
 * 响应式布局工具
 * Feature: ui-ux-redesign
 *
 * 负责处理屏幕尺寸变化和Canvas自动缩放
 */

import type { Breakpoint } from './constants';
import { BREAKPOINTS } from './constants';
import { useState, useEffect } from 'react';

/**
 * 屏幕尺寸信息
 */
export interface ScreenSize {
  width: number;
  height: number;
  aspectRatio: number;
  devicePixelRatio: number;
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

/**
 * Canvas缩放信息
 */
export interface CanvasScale {
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

/**
 * 响应式布局管理器
 */
export class ResponsiveLayout {
  private canvas: HTMLCanvasElement | null = null;
  private resizeCallbacks: Set<(size: ScreenSize) => void> = new Set();
  private resizeObserver: ResizeObserver | null = null;
  private currentSize: ScreenSize;

  constructor() {
    this.currentSize = this.getCurrentScreenSize();
    this.setupResizeListener();
  }

  /**
   * 获取当前屏幕尺寸
   */
  getCurrentScreenSize(): ScreenSize {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    const devicePixelRatio = window.devicePixelRatio || 1;

    return {
      width,
      height,
      aspectRatio,
      devicePixelRatio,
    };
  }

  /**
   * 设置Canvas元素并启用自动缩放
   */
  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.updateCanvasSize();
  }

  /**
   * 更新Canvas尺寸以适应屏幕
   */
  updateCanvasSize(): void {
    if (!this.canvas) return;

    const size = this.getCurrentScreenSize();
    const scale = this.calculateCanvasScale(size);

    // 设置Canvas的显示尺寸（CSS像素）
    this.canvas.style.width = `${scale.width}px`;
    this.canvas.style.height = `${scale.height}px`;

    // 设置Canvas的实际分辨率（考虑设备像素比）
    this.canvas.width = scale.width * size.devicePixelRatio;
    this.canvas.height = scale.height * size.devicePixelRatio;

    // 缩放Canvas上下文以匹配设备像素比
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.scale(size.devicePixelRatio, size.devicePixelRatio);
    }

    // 居中Canvas
    if (scale.offsetX > 0 || scale.offsetY > 0) {
      this.canvas.style.position = 'absolute';
      this.canvas.style.left = `${scale.offsetX}px`;
      this.canvas.style.top = `${scale.offsetY}px`;
    }
  }

  /**
   * 计算Canvas缩放信息
   */
  calculateCanvasScale(size: ScreenSize): CanvasScale {
    // 目标宽高比（16:9）
    const targetAspectRatio = 16 / 9;

    let width = size.width;
    let height = size.height;
    let scaleX = 1;
    let scaleY = 1;
    let offsetX = 0;
    let offsetY = 0;

    // 根据屏幕宽高比调整Canvas尺寸
    if (size.aspectRatio > targetAspectRatio) {
      // 屏幕更宽，以高度为基准
      width = height * targetAspectRatio;
      offsetX = (size.width - width) / 2;
    } else if (size.aspectRatio < targetAspectRatio) {
      // 屏幕更高，以宽度为基准
      height = width / targetAspectRatio;
      offsetY = (size.height - height) / 2;
    }

    scaleX = width / size.width;
    scaleY = height / size.height;

    return {
      width,
      height,
      scaleX,
      scaleY,
      offsetX,
      offsetY,
    };
  }

  /**
   * 设置屏幕尺寸变化监听
   */
  private setupResizeListener(): void {
    // 使用防抖处理resize事件
    let resizeTimeout: number | null = null;

    const handleResize = () => {
      if (resizeTimeout !== null) {
        window.clearTimeout(resizeTimeout);
      }

      resizeTimeout = window.setTimeout(() => {
        this.currentSize = this.getCurrentScreenSize();
        this.updateCanvasSize();
        this.notifyResizeCallbacks();
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 使用ResizeObserver监听容器尺寸变化
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        handleResize();
      });

      // 监听document.body
      this.resizeObserver.observe(document.body);
    }
  }

  /**
   * 注册屏幕尺寸变化回调
   */
  onResize(callback: (size: ScreenSize) => void): () => void {
    this.resizeCallbacks.add(callback);

    // 返回取消注册函数
    return () => {
      this.resizeCallbacks.delete(callback);
    };
  }

  /**
   * 通知所有回调函数
   */
  private notifyResizeCallbacks(): void {
    this.resizeCallbacks.forEach((callback) => {
      callback(this.currentSize);
    });
  }

  /**
   * 将屏幕坐标转换为Canvas坐标
   */
  screenToCanvasCoordinates(
    screenX: number,
    screenY: number
  ): { x: number; y: number } {
    if (!this.canvas) {
      return { x: screenX, y: screenY };
    }

    const rect = this.canvas.getBoundingClientRect();
    const scale = this.calculateCanvasScale(this.currentSize);

    const x = ((screenX - rect.left) / scale.width) * this.canvas.width;
    const y = ((screenY - rect.top) / scale.height) * this.canvas.height;

    return { x, y };
  }

  /**
   * 检查坐标是否在Canvas可见区域内
   */
  isInVisibleArea(x: number, y: number): boolean {
    if (!this.canvas) return false;

    return (
      x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height
    );
  }

  /**
   * 获取当前屏幕尺寸
   */
  getScreenSize(): ScreenSize {
    return { ...this.currentSize };
  }

  /**
   * 检查是否为移动设备
   */
  isMobile(): boolean {
    return (
      this.currentSize.width >= BREAKPOINTS.mobile.min &&
      this.currentSize.width <= BREAKPOINTS.mobile.max
    );
  }

  /**
   * 检查是否为平板设备
   */
  isTablet(): boolean {
    return (
      this.currentSize.width >= BREAKPOINTS.tablet.min &&
      this.currentSize.width <= BREAKPOINTS.tablet.max
    );
  }

  /**
   * 检查是否为桌面设备
   */
  isDesktop(): boolean {
    return this.currentSize.width >= BREAKPOINTS.desktop.min;
  }

  /**
   * 获取当前断点
   */
  getCurrentBreakpoint(): Breakpoint {
    const width = this.currentSize.width;

    if (width >= BREAKPOINTS.mobile.min && width <= BREAKPOINTS.mobile.max) {
      return 'mobile';
    }

    if (width >= BREAKPOINTS.tablet.min && width <= BREAKPOINTS.tablet.max) {
      return 'tablet';
    }

    return 'desktop';
  }

  /**
   * 获取响应式字体大小
   */
  getResponsiveFontSize(baseFontSize: number): number {
    const scale = Math.min(this.currentSize.width / 1920, 1);
    return Math.max(baseFontSize * scale, baseFontSize * 0.5);
  }

  /**
   * 获取响应式间距
   */
  getResponsiveSpacing(baseSpacing: number): number {
    const scale = Math.min(this.currentSize.width / 1920, 1);
    return Math.max(baseSpacing * scale, baseSpacing * 0.5);
  }

  /**
   * 销毁响应式布局管理器
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.resizeCallbacks.clear();
    this.canvas = null;
  }
}

/**
 * 创建全局响应式布局实例
 */
export const responsiveLayout = new ResponsiveLayout();

/**
 * 获取当前断点的工具函数
 * 可在非React环境中使用
 */
export function getCurrentBreakpoint(): Breakpoint {
  return responsiveLayout.getCurrentBreakpoint();
}

/**
 * React Hook: 监听当前断点变化
 *
 * @returns 当前断点 ('mobile' | 'tablet' | 'desktop')
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const breakpoint = useBreakpoint();
 *
 *   return (
 *     <div>
 *       {breakpoint === 'mobile' && <MobileLayout />}
 *       {breakpoint === 'tablet' && <TabletLayout />}
 *       {breakpoint === 'desktop' && <DesktopLayout />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    responsiveLayout.getCurrentBreakpoint()
  );

  useEffect(() => {
    // 初始化时设置当前断点
    setBreakpoint(responsiveLayout.getCurrentBreakpoint());

    // 监听屏幕尺寸变化
    const unsubscribe = responsiveLayout.onResize(() => {
      const newBreakpoint = responsiveLayout.getCurrentBreakpoint();
      setBreakpoint(newBreakpoint);
    });

    // 清理监听器
    return unsubscribe;
  }, []);

  return breakpoint;
}

/**
 * React Hook: 监听视口尺寸变化
 *
 * @returns 当前视口尺寸信息
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const viewport = useViewportSize();
 *
 *   return (
 *     <div>
 *       Width: {viewport.width}px, Height: {viewport.height}px
 *     </div>
 *   );
 * }
 * ```
 */
export function useViewportSize(): ScreenSize {
  const [size, setSize] = useState<ScreenSize>(() =>
    responsiveLayout.getScreenSize()
  );

  useEffect(() => {
    // 初始化时设置当前尺寸
    setSize(responsiveLayout.getScreenSize());

    // 监听屏幕尺寸变化
    const unsubscribe = responsiveLayout.onResize((newSize) => {
      setSize(newSize);
    });

    // 清理监听器
    return unsubscribe;
  }, []);

  return size;
}

/**
 * 媒体查询辅助函数：检查是否匹配指定断点
 *
 * @param breakpoint - 断点名称
 * @returns 是否匹配该断点
 */
export function matchesBreakpoint(breakpoint: Breakpoint): boolean {
  const width = window.innerWidth;
  const bp = BREAKPOINTS[breakpoint];
  return width >= bp.min && width <= bp.max;
}

/**
 * 媒体查询辅助函数：检查是否为触摸设备
 */
export function isTouchDevice(): boolean {
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

/**
 * 媒体查询辅助函数：检查是否启用了减少动画
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 媒体查询辅助函数：检查是否启用了高对比度
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}
