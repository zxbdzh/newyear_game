/**
 * SpecialEventTrigger 单元测试
 * Feature: new-year-fireworks-game
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SpecialEventTrigger,
  createHourlyFireworkRainEvent,
  createTenMinuteCountdownEvent,
  type SpecialEvent,
} from './SpecialEventTrigger';
import type { CountdownTime } from '../types/CountdownTypes';
import type { CountdownEngine } from './CountdownEngine';

describe('SpecialEventTrigger', () => {
  let trigger: SpecialEventTrigger;
  let mockCountdownEngine: CountdownEngine;

  beforeEach(() => {
    mockCountdownEngine = {} as CountdownEngine;
    trigger = new SpecialEventTrigger(mockCountdownEngine);
  });

  describe('registerEvent', () => {
    it('应该成功注册事件', () => {
      const event: SpecialEvent = {
        id: 'test_event',
        name: '测试事件',
        triggerCondition: () => true,
        effect: vi.fn(),
        triggered: false,
      };

      trigger.registerEvent(event);
      const allEvents = trigger.getAllEvents();

      expect(allEvents).toHaveLength(1);
      expect(allEvents[0].id).toBe('test_event');
    });

    it('应该允许注册多个事件', () => {
      const event1: SpecialEvent = {
        id: 'event1',
        name: '事件1',
        triggerCondition: () => true,
        effect: vi.fn(),
        triggered: false,
      };

      const event2: SpecialEvent = {
        id: 'event2',
        name: '事件2',
        triggerCondition: () => false,
        effect: vi.fn(),
        triggered: false,
      };

      trigger.registerEvent(event1);
      trigger.registerEvent(event2);

      expect(trigger.getAllEvents()).toHaveLength(2);
    });
  });

  describe('checkAndTrigger', () => {
    it('应该在满足条件时触发事件', () => {
      const effectFn = vi.fn();
      const event: SpecialEvent = {
        id: 'test_event',
        name: '测试事件',
        triggerCondition: (time: CountdownTime) => time.totalSeconds === 600,
        effect: effectFn,
        triggered: false,
      };

      trigger.registerEvent(event);

      const time: CountdownTime = {
        days: 0,
        hours: 0,
        minutes: 10,
        seconds: 0,
        totalSeconds: 600,
      };

      trigger.checkAndTrigger(time);

      expect(effectFn).toHaveBeenCalledTimes(1);
      expect(trigger.getTriggeredEvents()).toHaveLength(1);
    });

    it('应该在不满足条件时不触发事件', () => {
      const effectFn = vi.fn();
      const event: SpecialEvent = {
        id: 'test_event',
        name: '测试事件',
        triggerCondition: (time: CountdownTime) => time.totalSeconds === 600,
        effect: effectFn,
        triggered: false,
      };

      trigger.registerEvent(event);

      const time: CountdownTime = {
        days: 0,
        hours: 0,
        minutes: 5,
        seconds: 0,
        totalSeconds: 300,
      };

      trigger.checkAndTrigger(time);

      expect(effectFn).not.toHaveBeenCalled();
      expect(trigger.getTriggeredEvents()).toHaveLength(0);
    });

    it('应该只触发事件一次', () => {
      const effectFn = vi.fn();
      const event: SpecialEvent = {
        id: 'test_event',
        name: '测试事件',
        triggerCondition: () => true,
        effect: effectFn,
        triggered: false,
      };

      trigger.registerEvent(event);

      const time: CountdownTime = {
        days: 0,
        hours: 0,
        minutes: 10,
        seconds: 0,
        totalSeconds: 600,
      };

      trigger.checkAndTrigger(time);
      trigger.checkAndTrigger(time);
      trigger.checkAndTrigger(time);

      expect(effectFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset', () => {
    it('应该重置所有事件的触发状态', () => {
      const event: SpecialEvent = {
        id: 'test_event',
        name: '测试事件',
        triggerCondition: () => true,
        effect: vi.fn(),
        triggered: false,
      };

      trigger.registerEvent(event);

      const time: CountdownTime = {
        days: 0,
        hours: 0,
        minutes: 10,
        seconds: 0,
        totalSeconds: 600,
      };

      trigger.checkAndTrigger(time);
      expect(trigger.getTriggeredEvents()).toHaveLength(1);

      trigger.reset();
      expect(trigger.getTriggeredEvents()).toHaveLength(0);
    });
  });

  describe('getTriggeredEvents', () => {
    it('应该返回已触发的事件列表', () => {
      const event1: SpecialEvent = {
        id: 'event1',
        name: '事件1',
        triggerCondition: () => true,
        effect: vi.fn(),
        triggered: false,
      };

      const event2: SpecialEvent = {
        id: 'event2',
        name: '事件2',
        triggerCondition: () => false,
        effect: vi.fn(),
        triggered: false,
      };

      trigger.registerEvent(event1);
      trigger.registerEvent(event2);

      const time: CountdownTime = {
        days: 0,
        hours: 0,
        minutes: 10,
        seconds: 0,
        totalSeconds: 600,
      };

      trigger.checkAndTrigger(time);

      const triggeredEvents = trigger.getTriggeredEvents();
      expect(triggeredEvents).toHaveLength(1);
      expect(triggeredEvents[0].id).toBe('event1');
    });
  });

  describe('removeEvent', () => {
    it('应该移除指定的事件', () => {
      const event: SpecialEvent = {
        id: 'test_event',
        name: '测试事件',
        triggerCondition: () => true,
        effect: vi.fn(),
        triggered: false,
      };

      trigger.registerEvent(event);
      expect(trigger.getAllEvents()).toHaveLength(1);

      trigger.removeEvent('test_event');
      expect(trigger.getAllEvents()).toHaveLength(0);
    });
  });

  describe('clearEvents', () => {
    it('应该清空所有事件', () => {
      const event1: SpecialEvent = {
        id: 'event1',
        name: '事件1',
        triggerCondition: () => true,
        effect: vi.fn(),
        triggered: false,
      };

      const event2: SpecialEvent = {
        id: 'event2',
        name: '事件2',
        triggerCondition: () => false,
        effect: vi.fn(),
        triggered: false,
      };

      trigger.registerEvent(event1);
      trigger.registerEvent(event2);
      expect(trigger.getAllEvents()).toHaveLength(2);

      trigger.clearEvents();
      expect(trigger.getAllEvents()).toHaveLength(0);
    });
  });
});

describe('createHourlyFireworkRainEvent', () => {
  it('应该创建整点烟花雨事件', () => {
    const mockFireworksEngine = {
      canvas: { width: 1920, height: 1080 },
      launchFirework: vi.fn(),
    };

    const event = createHourlyFireworkRainEvent(mockFireworksEngine);

    expect(event.id).toBe('hourly_rain');
    expect(event.name).toBe('整点烟花雨');
    expect(event.triggered).toBe(false);
  });

  it('应该在整点时满足触发条件', () => {
    const mockFireworksEngine = {
      canvas: { width: 1920, height: 1080 },
      launchFirework: vi.fn(),
    };

    const event = createHourlyFireworkRainEvent(mockFireworksEngine);

    // Mock Date to return exact hour
    const originalDate = Date;
    globalThis.Date = class extends originalDate {
      getMinutes() {
        return 0;
      }
      getSeconds() {
        return 0;
      }
    } as any;

    const time: CountdownTime = {
      days: 0,
      hours: 1,
      minutes: 0,
      seconds: 0,
      totalSeconds: 3600,
    };

    expect(event.triggerCondition(time)).toBe(true);

    globalThis.Date = originalDate;
  });

  it('应该在非整点时不满足触发条件', () => {
    const mockFireworksEngine = {
      canvas: { width: 1920, height: 1080 },
      launchFirework: vi.fn(),
    };

    const event = createHourlyFireworkRainEvent(mockFireworksEngine);

    const originalDate = Date;
    globalThis.Date = class extends originalDate {
      getMinutes() {
        return 30;
      }
      getSeconds() {
        return 15;
      }
    } as any;

    const time: CountdownTime = {
      days: 0,
      hours: 1,
      minutes: 30,
        seconds: 15,
      totalSeconds: 5415,
    };

    expect(event.triggerCondition(time)).toBe(false);

    globalThis.Date = originalDate;
  });
});

describe('createTenMinuteCountdownEvent', () => {
  it('应该创建10分钟倒计时事件', () => {
    const event = createTenMinuteCountdownEvent();

    expect(event.id).toBe('ten_minute_countdown');
    expect(event.name).toBe('10分钟倒计时');
    expect(event.triggered).toBe(false);
  });

  it('应该在剩余600秒时满足触发条件', () => {
    const event = createTenMinuteCountdownEvent();

    const time: CountdownTime = {
      days: 0,
      hours: 0,
      minutes: 10,
      seconds: 0,
      totalSeconds: 600,
    };

    expect(event.triggerCondition(time)).toBe(true);
  });

  it('应该在非600秒时不满足触发条件', () => {
    const event = createTenMinuteCountdownEvent();

    const time: CountdownTime = {
      days: 0,
      hours: 0,
      minutes: 5,
      seconds: 0,
      totalSeconds: 300,
    };

    expect(event.triggerCondition(time)).toBe(false);
  });

  it('应该调用倒计时显示的特殊效果', () => {
    const mockCountdownDisplay = {
      enableSpecialEffect: vi.fn(),
    };

    const event = createTenMinuteCountdownEvent(mockCountdownDisplay);
    event.effect();

    expect(mockCountdownDisplay.enableSpecialEffect).toHaveBeenCalledTimes(1);
  });

  it('应该调用音频控制器播放音效', () => {
    const mockAudioController = {
      playSFX: vi.fn(),
    };

    const event = createTenMinuteCountdownEvent(undefined, mockAudioController);
    event.effect();

    expect(mockAudioController.playSFX).toHaveBeenCalledWith('click');
  });
});
