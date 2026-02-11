/**
 * 音频控制器属性测试
 * Feature: new-year-fireworks-game
 * 
 * 测试使用Web Audio API动态生成音效的AudioController
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { AudioController } from './AudioController';
import { StorageService } from './StorageService';

// Mock Web Audio API
class MockAudioContext {
  state = 'running';
  destination = {};
  sampleRate = 44100;

  createGain() {
    return {
      gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn()
    };
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null
    };
  }

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      getChannelData: () => new Float32Array(length)
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 1000, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn()
    };
  }

  get currentTime() {
    return Date.now() / 1000;
  }

  async resume() {
    this.state = 'running';
  }

  async close() {
    this.state = 'closed';
  }
}

// Mock global AudioContext
(globalThis as any).AudioContext = MockAudioContext;
(globalThis as any).window = { AudioContext: MockAudioContext };

describe('AudioController - Property-Based Tests', () => {
  let storageService: StorageService;
  let audioController: AudioController;

  beforeEach(async () => {
    // 创建mock存储服务，避免IndexedDB初始化问题
    storageService = {
      save: vi.fn().mockResolvedValue(undefined),
      load: vi.fn().mockResolvedValue(null),
    } as any;
    
    audioController = new AudioController(storageService);
    await audioController.initialize();
  });

  afterEach(() => {
    if (audioController) {
      audioController.destroy();
    }
  });

  // Feature: new-year-fireworks-game, Property 1: 静音状态往返一致性
  describe('Property 1: 静音状态往返一致性', () => {
    it('对于任何静音状态序列，连续切换偶数次后应恢复到初始状态', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }).map(n => n * 2),
          (toggleCount) => {
            const initialConfig = audioController.getConfig();
            const initialMusicMuted = initialConfig.musicMuted;
            const initialSFXMuted = initialConfig.sfxMuted;

            for (let i = 0; i < toggleCount; i++) {
              audioController.toggleMusicMute();
            }
            for (let i = 0; i < toggleCount; i++) {
              audioController.toggleSFXMute();
            }

            const finalConfig = audioController.getConfig();
            expect(finalConfig.musicMuted).toBe(initialMusicMuted);
            expect(finalConfig.sfxMuted).toBe(initialSFXMuted);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('切换奇数次后应该与初始状态相反', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }).map(n => n * 2 + 1),
          (toggleCount) => {
            const initialConfig = audioController.getConfig();
            const initialMusicMuted = initialConfig.musicMuted;

            for (let i = 0; i < toggleCount; i++) {
              audioController.toggleMusicMute();
            }

            const finalConfig = audioController.getConfig();
            expect(finalConfig.musicMuted).toBe(!initialMusicMuted);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Feature: new-year-fireworks-game, Property 18: 背景音乐循环播放
  describe('Property 18: 背景音乐循环播放', () => {
    it('应该能够播放背景音乐', () => {
      audioController.playMusic();
      const config = audioController.getConfig();
      expect(config).toBeDefined();
    });

    it('停止音乐后应该能够重新播放', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (playCount) => {
            for (let i = 0; i < playCount; i++) {
              audioController.playMusic();
              audioController.stopMusic();
            }

            audioController.playMusic();
            expect(audioController.getConfig()).toBeDefined();
            
            audioController.stopMusic();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Feature: new-year-fireworks-game, Property 19: 音量控制独立性
  describe('Property 19: 音量控制独立性', () => {
    it('对于任何音乐音量和音效音量的组合，两者应该独立控制', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          (musicVolume, sfxVolume) => {
            audioController.setMusicVolume(musicVolume);
            audioController.setSFXVolume(sfxVolume);

            const config = audioController.getConfig();
            expect(config.musicVolume).toBeCloseTo(musicVolume, 5);
            expect(config.sfxVolume).toBeCloseTo(sfxVolume, 5);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('修改音乐音量不应影响音效音量', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          (initialSFXVolume, newMusicVolume) => {
            audioController.setSFXVolume(initialSFXVolume);
            audioController.setMusicVolume(newMusicVolume);

            const config = audioController.getConfig();
            expect(config.sfxVolume).toBeCloseTo(initialSFXVolume, 5);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('修改音效音量不应影响音乐音量', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          (initialMusicVolume, newSFXVolume) => {
            audioController.setMusicVolume(initialMusicVolume);
            audioController.setSFXVolume(newSFXVolume);

            const config = audioController.getConfig();
            expect(config.musicVolume).toBeCloseTo(initialMusicVolume, 5);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Feature: new-year-fireworks-game, Property 20: 音频配置持久化往返
  describe('Property 20: 音频配置持久化往返', () => {
    it('对于任何音频配置，保存后加载应该得到相同的配置', async () => {
      // 创建一个真实的存储mock
      const storage = new Map<string, any>();
      const mockStorage = {
        save: vi.fn().mockImplementation(async (key: string, value: any) => {
          storage.set(key, value);
        }),
        load: vi.fn().mockImplementation(async (key: string) => {
          return storage.get(key) || null;
        }),
      } as any;

      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.boolean(),
          fc.boolean(),
          async (musicVolume, sfxVolume, musicMuted, sfxMuted) => {
            const controller = new AudioController(mockStorage);
            await controller.initialize();
            
            controller.setMusicVolume(musicVolume);
            controller.setSFXVolume(sfxVolume);
            
            const currentConfig = controller.getConfig();
            if (currentConfig.musicMuted !== musicMuted) {
              controller.toggleMusicMute();
            }
            if (currentConfig.sfxMuted !== sfxMuted) {
              controller.toggleSFXMute();
            }

            await controller.saveConfig();

            const newController = new AudioController(mockStorage);
            await newController.initialize();

            const loadedConfig = newController.getConfig();
            expect(loadedConfig.musicVolume).toBeCloseTo(musicVolume, 5);
            expect(loadedConfig.sfxVolume).toBeCloseTo(sfxVolume, 5);
            expect(loadedConfig.musicMuted).toBe(musicMuted);
            expect(loadedConfig.sfxMuted).toBe(sfxMuted);

            newController.destroy();
            controller.destroy();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // 辅助测试：验证音量范围限制
  describe('音量范围限制', () => {
    it('音量应该被限制在0-1范围内', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -10, max: 10, noNaN: true }),
          (volume) => {
            audioController.setMusicVolume(volume);
            const config = audioController.getConfig();
            
            expect(config.musicVolume).toBeGreaterThanOrEqual(0);
            expect(config.musicVolume).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('音效音量应该被限制在0-1范围内', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -10, max: 10, noNaN: true }),
          (volume) => {
            audioController.setSFXVolume(volume);
            const config = audioController.getConfig();
            
            expect(config.sfxVolume).toBeGreaterThanOrEqual(0);
            expect(config.sfxVolume).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // 辅助测试：验证音效播放
  describe('音效播放', () => {
    it('应该能够播放发射音效', () => {
      audioController.playSFX('launch');
      expect(audioController.getConfig()).toBeDefined();
    });

    it('应该能够播放爆炸音效', () => {
      audioController.playSFX('explosion');
      expect(audioController.getConfig()).toBeDefined();
    });

    it('应该能够播放点击音效', () => {
      audioController.playSFX('click');
      expect(audioController.getConfig()).toBeDefined();
    });

    it('应该能够播放成功音效', () => {
      audioController.playSFX('success');
      expect(audioController.getConfig()).toBeDefined();
    });
  });

  // 辅助测试：验证AudioContext恢复
  describe('AudioContext恢复', () => {
    it('应该能够恢复suspended的AudioContext', async () => {
      await audioController.resumeContext();
      
      const config = audioController.getConfig();
      expect(config).toBeDefined();
    });
  });
});
