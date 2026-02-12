/**
 * 网络错误处理器单元测试
 * Feature: new-year-fireworks-game
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkErrorHandler, type NetworkError, type ErrorUICallbacks } from './NetworkErrorHandler';
import { NetworkSynchronizer } from './NetworkSynchronizer';

describe('NetworkErrorHandler', () => {
  let networkSync: NetworkSynchronizer;
  let errorHandler: NetworkErrorHandler;
  let uiCallbacks: ErrorUICallbacks;

  beforeEach(() => {
    // 创建网络同步器实例
    networkSync = new NetworkSynchronizer('http://localhost:3001');

    // 创建UI回调mock
    uiCallbacks = {
      onShowDisconnectionNotice: vi.fn(),
      onHideDisconnectionNotice: vi.fn(),
      onShowReconnectProgress: vi.fn(),
      onShowReconnectFailedDialog: vi.fn(),
      onShowLatencyWarning: vi.fn(),
      onHideLatencyWarning: vi.fn(),
      onShowUnstableWarning: vi.fn(),
      onHideUnstableWarning: vi.fn(),
      onShowError: vi.fn(),
      onSuggestSinglePlayerMode: vi.fn(),
    };

    // 创建错误处理器实例
    errorHandler = new NetworkErrorHandler(networkSync, uiCallbacks);
  });

  afterEach(() => {
    errorHandler.destroy();
  });

  describe('初始化', () => {
    it('应该正确初始化状态', () => {
      const status = errorHandler.getStatus();

      expect(status.isConnected).toBe(false);
      expect(status.isReconnecting).toBe(false);
      expect(status.reconnectAttempts).toBe(0);
      expect(status.maxReconnectAttempts).toBe(3);
      expect(status.latency).toBe(0);
      expect(status.isHighLatency).toBe(false);
      expect(status.isUnstable).toBe(false);
      expect(status.lastError).toBeNull();
    });

    it('应该设置网络同步器的事件监听', () => {
      // 验证监听器已设置（通过触发事件来验证）
      const statusCallback = vi.fn();
      errorHandler.onStatusChange(statusCallback);

      // 模拟连接状态变化
      const connectionStateCallbacks = (networkSync as any).connectionStateCallbacks;
      connectionStateCallbacks.forEach((cb: any) => cb('connected'));

      expect(statusCallback).toHaveBeenCalled();
    });
  });

  describe('连接状态处理', () => {
    it('应该处理连接成功', () => {
      const statusCallback = vi.fn();
      errorHandler.onStatusChange(statusCallback);

      // 模拟连接成功
      const connectionStateCallbacks = (networkSync as any).connectionStateCallbacks;
      connectionStateCallbacks.forEach((cb: any) => cb('connected'));

      const status = errorHandler.getStatus();
      expect(status.isConnected).toBe(true);
      expect(status.isReconnecting).toBe(false);
      expect(status.reconnectAttempts).toBe(0);
      expect(uiCallbacks.onHideDisconnectionNotice).toHaveBeenCalled();
      expect(statusCallback).toHaveBeenCalled();
    });

    it('应该处理断开连接', () => {
      const statusCallback = vi.fn();
      const errorCallback = vi.fn();
      errorHandler.onStatusChange(statusCallback);
      errorHandler.onError(errorCallback);

      // 模拟断开连接
      const connectionStateCallbacks = (networkSync as any).connectionStateCallbacks;
      connectionStateCallbacks.forEach((cb: any) => cb('disconnected'));

      const status = errorHandler.getStatus();
      expect(status.isConnected).toBe(false);
      expect(status.lastError).not.toBeNull();
      expect(status.lastError?.type).toBe('disconnected');
      expect(uiCallbacks.onShowDisconnectionNotice).toHaveBeenCalled();
      expect(uiCallbacks.onShowError).toHaveBeenCalled();
      expect(statusCallback).toHaveBeenCalled();
      expect(errorCallback).toHaveBeenCalled();
    });

    it('应该处理重连中状态', () => {
      const statusCallback = vi.fn();
      errorHandler.onStatusChange(statusCallback);

      // 模拟重连中
      const connectionStateCallbacks = (networkSync as any).connectionStateCallbacks;
      connectionStateCallbacks.forEach((cb: any) => cb('reconnecting'));

      const status = errorHandler.getStatus();
      expect(status.isReconnecting).toBe(true);
      expect(status.reconnectAttempts).toBe(1);
      expect(uiCallbacks.onShowReconnectProgress).toHaveBeenCalledWith(1, 3);
      expect(statusCallback).toHaveBeenCalled();
    });

    it('应该处理重连失败', () => {
      const statusCallback = vi.fn();
      const errorCallback = vi.fn();
      errorHandler.onStatusChange(statusCallback);
      errorHandler.onError(errorCallback);

      // 模拟重连失败
      const connectionStateCallbacks = (networkSync as any).connectionStateCallbacks;
      connectionStateCallbacks.forEach((cb: any) => cb('failed'));

      const status = errorHandler.getStatus();
      expect(status.isConnected).toBe(false);
      expect(status.isReconnecting).toBe(false);
      expect(status.lastError?.type).toBe('reconnect_failed');
      expect(uiCallbacks.onShowReconnectFailedDialog).toHaveBeenCalled();
      expect(uiCallbacks.onSuggestSinglePlayerMode).toHaveBeenCalled();
      expect(statusCallback).toHaveBeenCalled();
      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('延迟处理', () => {
    it('应该检测高延迟', () => {
      const statusCallback = vi.fn();
      const errorCallback = vi.fn();
      errorHandler.onStatusChange(statusCallback);
      errorHandler.onError(errorCallback);

      // 模拟高延迟（>3000ms）
      const latencyCallbacks = (networkSync as any).latencyUpdateCallbacks;
      latencyCallbacks.forEach((cb: any) => cb({ current: 3500, average: 3500, min: 3500, max: 3500 }));

      const status = errorHandler.getStatus();
      expect(status.isHighLatency).toBe(true);
      expect(status.latency).toBe(3500);
      expect(uiCallbacks.onShowLatencyWarning).toHaveBeenCalledWith(3500);
      expect(errorCallback).toHaveBeenCalled();
    });

    it('应该在延迟恢复正常时隐藏警告', () => {
      // 先触发高延迟
      const latencyCallbacks = (networkSync as any).latencyUpdateCallbacks;
      latencyCallbacks.forEach((cb: any) => cb({ current: 3500, average: 3500, min: 3500, max: 3500 }));

      expect(errorHandler.getStatus().isHighLatency).toBe(true);

      // 然后恢复正常
      latencyCallbacks.forEach((cb: any) => cb({ current: 1000, average: 1000, min: 1000, max: 1000 }));

      const status = errorHandler.getStatus();
      expect(status.isHighLatency).toBe(false);
      expect(status.latency).toBe(1000);
      expect(uiCallbacks.onHideLatencyWarning).toHaveBeenCalled();
    });

    it('应该在高延迟时启用优雅降级', () => {
      // 模拟高延迟
      const latencyCallbacks = (networkSync as any).latencyUpdateCallbacks;
      latencyCallbacks.forEach((cb: any) => cb({ current: 4000, average: 4000, min: 4000, max: 4000 }));

      expect(errorHandler.isInGracefulDegradation()).toBe(true);
    });
  });

  describe('网络不稳定检测', () => {
    it('应该检测网络不稳定（多次断线）', () => {
      const errorCallback = vi.fn();
      errorHandler.onError(errorCallback);

      // 模拟多次断线（3次）
      const connectionStateCallbacks = (networkSync as any).connectionStateCallbacks;
      for (let i = 0; i < 3; i++) {
        connectionStateCallbacks.forEach((cb: any) => cb('disconnected'));
      }

      const status = errorHandler.getStatus();
      expect(status.isUnstable).toBe(true);
      expect(uiCallbacks.onShowUnstableWarning).toHaveBeenCalled();
      expect(errorHandler.isInGracefulDegradation()).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理网络错误消息', () => {
      const errorCallback = vi.fn();
      errorHandler.onError(errorCallback);

      // 模拟网络错误
      const errorCallbacks = (networkSync as any).errorCallbacks;
      errorCallbacks.forEach((cb: any) => cb('连接超时'));

      expect(errorCallback).toHaveBeenCalled();
      const error = errorCallback.mock.calls[0][0] as NetworkError;
      expect(error.message).toBe('连接超时');
      expect(uiCallbacks.onShowError).toHaveBeenCalled();
    });

    it('应该识别房间已满错误', () => {
      const errorCallback = vi.fn();
      errorHandler.onError(errorCallback);

      // 模拟房间已满错误
      const errorCallbacks = (networkSync as any).errorCallbacks;
      errorCallbacks.forEach((cb: any) => cb('房间已满'));

      const error = errorCallback.mock.calls[0][0] as NetworkError;
      expect(error.type).toBe('room_full');
      expect(error.canRetry).toBe(false);
    });

    it('应该识别高延迟错误', () => {
      const errorCallback = vi.fn();
      errorHandler.onError(errorCallback);

      // 模拟高延迟错误
      const errorCallbacks = (networkSync as any).errorCallbacks;
      errorCallbacks.forEach((cb: any) => cb('网络延迟过高: 3500ms'));

      const error = errorCallback.mock.calls[0][0] as NetworkError;
      expect(error.type).toBe('high_latency');
      expect(error.severity).toBe('warning');
    });
  });

  describe('手动操作', () => {
    it('应该支持手动重连', async () => {
      // Mock connect方法
      vi.spyOn(networkSync, 'connect').mockResolvedValue();

      await errorHandler.retryConnection();

      expect(networkSync.connect).toHaveBeenCalled();
      expect(errorHandler.getStatus().reconnectAttempts).toBe(0);
    });

    it('应该支持切换到单人模式', () => {
      // Mock disconnect方法
      vi.spyOn(networkSync, 'disconnect').mockImplementation(() => {});

      errorHandler.switchToSinglePlayerMode();

      expect(networkSync.disconnect).toHaveBeenCalled();
      expect(errorHandler.getStatus().isConnected).toBe(false);
      expect(errorHandler.getStatus().lastError).toBeNull();
      expect(uiCallbacks.onHideDisconnectionNotice).toHaveBeenCalled();
      expect(uiCallbacks.onHideLatencyWarning).toHaveBeenCalled();
      expect(uiCallbacks.onHideUnstableWarning).toHaveBeenCalled();
    });
  });

  describe('回调管理', () => {
    it('应该支持注册和取消状态变化回调', () => {
      const callback = vi.fn();
      const unsubscribe = errorHandler.onStatusChange(callback);

      // 触发状态变化
      const connectionStateCallbacks = (networkSync as any).connectionStateCallbacks;
      connectionStateCallbacks.forEach((cb: any) => cb('connected'));

      expect(callback).toHaveBeenCalled();

      // 取消订阅
      callback.mockClear();
      unsubscribe();

      // 再次触发状态变化
      connectionStateCallbacks.forEach((cb: any) => cb('disconnected'));

      expect(callback).not.toHaveBeenCalled();
    });

    it('应该支持注册和取消错误回调', () => {
      const callback = vi.fn();
      const unsubscribe = errorHandler.onError(callback);

      // 触发错误
      const errorCallbacks = (networkSync as any).errorCallbacks;
      errorCallbacks.forEach((cb: any) => cb('测试错误'));

      expect(callback).toHaveBeenCalled();

      // 取消订阅
      callback.mockClear();
      unsubscribe();

      // 再次触发错误
      errorCallbacks.forEach((cb: any) => cb('测试错误2'));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('资源清理', () => {
    it('应该正确清理资源', () => {
      const statusCallback = vi.fn();
      const errorCallback = vi.fn();

      errorHandler.onStatusChange(statusCallback);
      errorHandler.onError(errorCallback);

      // 清理资源
      errorHandler.destroy();

      // 触发事件，回调不应被调用
      const connectionStateCallbacks = (networkSync as any).connectionStateCallbacks;
      connectionStateCallbacks.forEach((cb: any) => cb('connected'));

      expect(statusCallback).not.toHaveBeenCalled();
      expect(errorCallback).not.toHaveBeenCalled();
    });
  });

  describe('优雅降级', () => {
    it('应该在网络不稳定时启用优雅降级', () => {
      expect(errorHandler.isInGracefulDegradation()).toBe(false);

      // 模拟多次断线触发不稳定检测
      const connectionStateCallbacks = (networkSync as any).connectionStateCallbacks;
      for (let i = 0; i < 3; i++) {
        connectionStateCallbacks.forEach((cb: any) => cb('disconnected'));
      }

      expect(errorHandler.isInGracefulDegradation()).toBe(true);
    });

    it('应该在连接恢复时禁用优雅降级', () => {
      // 先触发优雅降级
      const latencyCallbacks = (networkSync as any).latencyUpdateCallbacks;
      latencyCallbacks.forEach((cb: any) => cb({ current: 4000, average: 4000, min: 4000, max: 4000 }));

      expect(errorHandler.isInGracefulDegradation()).toBe(true);

      // 模拟连接恢复
      const connectionStateCallbacks = (networkSync as any).connectionStateCallbacks;
      connectionStateCallbacks.forEach((cb: any) => cb('connected'));

      expect(errorHandler.isInGracefulDegradation()).toBe(false);
    });
  });

  describe('状态查询', () => {
    it('应该返回当前网络状态的副本', () => {
      const status1 = errorHandler.getStatus();
      const status2 = errorHandler.getStatus();

      expect(status1).not.toBe(status2); // 不同的对象引用
      expect(status1).toEqual(status2); // 但内容相同
    });
  });
});
