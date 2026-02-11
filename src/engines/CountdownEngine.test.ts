/**
 * 倒计时引擎属性测试
 * Feature: new-year-fireworks-game
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { CountdownEngine } from './CountdownEngine';
import type { CountdownConfig } from '../types';

describe('CountdownEngine - Property-Based Tests', () => {
  let engine: CountdownEngine;

  afterEach(() => {
    if (engine) {
      engine.destroy();
    }
  });

  // Feature: new-year-fireworks-game, Property 3: 倒计时格式完整性
  describe('Property 3: 倒计时格式完整性', () => {
    it('对于任何有效的时间值，倒计时格式化输出应该包含天、小时、分钟、秒四个部分', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 365 * 24 * 3600 }), // 最多一年的秒数
          (secondsInFuture) => {
            const targetDate = new Date(Date.now() + secondsInFuture * 1000);
            const config: CountdownConfig = {
              targetDate,
              timezone: 'Asia/Shanghai',
              manualOffset: 0
            };

            engine = new CountdownEngine(config);
            const time = engine.getCurrentTime();

            // 验证所有字段都存在
            expect(time).toHaveProperty('days');
            expect(time).toHaveProperty('hours');
            expect(time).toHaveProperty('minutes');
            expect(time).toHaveProperty('seconds');
            expect(time).toHaveProperty('totalSeconds');

            // 验证所有字段都是数字
            expect(typeof time.days).toBe('number');
            expect(typeof time.hours).toBe('number');
            expect(typeof time.minutes).toBe('number');
            expect(typeof time.seconds).toBe('number');
            expect(typeof time.totalSeconds).toBe('number');

            // 验证范围
            expect(time.days).toBeGreaterThanOrEqual(0);
            expect(time.hours).toBeGreaterThanOrEqual(0);
            expect(time.hours).toBeLessThan(24);
            expect(time.minutes).toBeGreaterThanOrEqual(0);
            expect(time.minutes).toBeLessThan(60);
            expect(time.seconds).toBeGreaterThanOrEqual(0);
            expect(time.seconds).toBeLessThan(60);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: new-year-fireworks-game, Property 4: 倒计时同步精度
  describe('Property 4: 倒计时同步精度', () => {
    it('对于任何时刻，倒计时显示值与实际剩余时间的差值应该小于1秒', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 * 24 * 3600 }),
          (secondsInFuture) => {
            const now = Date.now();
            const targetDate = new Date(now + secondsInFuture * 1000);
            const config: CountdownConfig = {
              targetDate,
              timezone: 'Asia/Shanghai',
              manualOffset: 0
            };

            engine = new CountdownEngine(config);
            const time = engine.getCurrentTime();

            // 计算实际剩余秒数
            const actualRemaining = Math.floor((targetDate.getTime() - Date.now()) / 1000);
            
            // 验证误差小于1秒
            const diff = Math.abs(time.totalSeconds - actualRemaining);
            expect(diff).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('手动偏移应该正确影响倒计时', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3600, max: 365 * 24 * 3600 }),
          fc.integer({ min: -3600, max: 3600 }),
          (secondsInFuture, offset) => {
            const targetDate = new Date(Date.now() + secondsInFuture * 1000);
            const config: CountdownConfig = {
              targetDate,
              timezone: 'Asia/Shanghai',
              manualOffset: 0
            };

            engine = new CountdownEngine(config);
            const timeWithoutOffset = engine.getCurrentTime();

            // 设置偏移
            engine.setManualOffset(offset);
            const timeWithOffset = engine.getCurrentTime();

            // 验证偏移效果（偏移应该改变剩余时间）
            const expectedDiff = offset;
            const actualDiff = timeWithOffset.totalSeconds - timeWithoutOffset.totalSeconds;
            
            // 允许1秒的误差（因为获取时间有延迟）
            expect(Math.abs(actualDiff - expectedDiff)).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // 辅助测试：验证时间计算的正确性
  describe('时间计算正确性', () => {
    it('totalSeconds应该等于days*86400 + hours*3600 + minutes*60 + seconds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 * 24 * 3600 }),
          (secondsInFuture) => {
            const targetDate = new Date(Date.now() + secondsInFuture * 1000);
            const config: CountdownConfig = {
              targetDate,
              timezone: 'Asia/Shanghai',
              manualOffset: 0
            };

            engine = new CountdownEngine(config);
            const time = engine.getCurrentTime();

            const calculatedTotal = 
              time.days * 86400 + 
              time.hours * 3600 + 
              time.minutes * 60 + 
              time.seconds;

            expect(calculatedTotal).toBe(time.totalSeconds);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // 辅助测试：验证isLessThanOneHour方法
  describe('isLessThanOneHour方法', () => {
    it('当剩余时间少于1小时时应该返回true', () => {
      const targetDate = new Date(Date.now() + 3000 * 1000); // 50分钟后
      const config: CountdownConfig = {
        targetDate,
        timezone: 'Asia/Shanghai',
        manualOffset: 0
      };

      engine = new CountdownEngine(config);
      expect(engine.isLessThanOneHour()).toBe(true);
    });

    it('当剩余时间超过1小时时应该返回false', () => {
      const targetDate = new Date(Date.now() + 7200 * 1000); // 2小时后
      const config: CountdownConfig = {
        targetDate,
        timezone: 'Asia/Shanghai',
        manualOffset: 0
      };

      engine = new CountdownEngine(config);
      expect(engine.isLessThanOneHour()).toBe(false);
    });
  });

  // 辅助测试：验证isZero方法
  describe('isZero方法', () => {
    it('当倒计时到达零点时应该返回true', () => {
      const targetDate = new Date(Date.now() - 1000); // 已经过去
      const config: CountdownConfig = {
        targetDate,
        timezone: 'Asia/Shanghai',
        manualOffset: 0
      };

      engine = new CountdownEngine(config);
      expect(engine.isZero()).toBe(true);
    });

    it('当倒计时未到达零点时应该返回false', () => {
      const targetDate = new Date(Date.now() + 1000); // 1秒后
      const config: CountdownConfig = {
        targetDate,
        timezone: 'Asia/Shanghai',
        manualOffset: 0
      };

      engine = new CountdownEngine(config);
      expect(engine.isZero()).toBe(false);
    });
  });

  // 辅助测试：验证回调机制
  describe('回调机制', () => {
    it('应该在时间更新时调用注册的回调', () => {
      return new Promise<void>((resolve) => {
        const targetDate = new Date(Date.now() + 5000);
        const config: CountdownConfig = {
          targetDate,
          timezone: 'Asia/Shanghai',
          manualOffset: 0
        };

        engine = new CountdownEngine(config);
        
        let callCount = 0;
        engine.onUpdate((time) => {
          callCount++;
          expect(time).toHaveProperty('totalSeconds');
          
          if (callCount >= 2) {
            engine.stop();
            resolve();
          }
        });

        engine.start();
      });
    });
  });
});
