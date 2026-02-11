/**
 * 音频控制器
 * Feature: new-year-fireworks-game
 * 
 * 使用Web Audio API动态生成音效，无需外部音频文件
 * 需求：1.4, 3.3, 3.4, 6.2, 6.3, 6.4
 */

import type { AudioConfig } from '../types';
import { StorageService } from './StorageService';

/**
 * 音频控制器类
 * 使用Web Audio API合成所有音效
 */
export class AudioController {
  private audioContext: AudioContext | null = null;
  private config: AudioConfig;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private storageService: StorageService;
  private musicOscillators: OscillatorNode[] = [];
  private isInitialized: boolean = false;

  /**
   * 构造函数
   * 
   * @param storageService - 存储服务实例
   */
  constructor(storageService: StorageService) {
    this.storageService = storageService;
    
    // 默认配置
    this.config = {
      musicVolume: 0.3,
      sfxVolume: 0.5,
      musicMuted: false,
      sfxMuted: false
    };
  }

  /**
   * 初始化音频系统
   * 需求：1.4
   * 
   * @returns Promise
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 创建AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // 创建增益节点
      this.musicGainNode = this.audioContext.createGain();
      this.sfxGainNode = this.audioContext.createGain();

      // 连接到输出
      this.musicGainNode.connect(this.audioContext.destination);
      this.sfxGainNode.connect(this.audioContext.destination);

      // 加载保存的配置
      await this.loadConfig();

      // 应用配置
      this.applyConfig();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
      throw error;
    }
  }

  /**
   * 加载音频配置
   */
  private async loadConfig(): Promise<void> {
    try {
      const savedData = await this.storageService.load();
      if (savedData && savedData.audioConfig) {
        this.config = { ...this.config, ...savedData.audioConfig };
      }
    } catch (error) {
      console.warn('Failed to load audio config, using defaults:', error);
    }
  }

  /**
   * 应用配置到增益节点
   */
  private applyConfig(): void {
    if (!this.musicGainNode || !this.sfxGainNode) {
      return;
    }

    // 应用音乐音量
    this.musicGainNode.gain.value = this.config.musicMuted ? 0 : this.config.musicVolume;

    // 应用音效音量
    this.sfxGainNode.gain.value = this.config.sfxMuted ? 0 : this.config.sfxVolume;
  }

  /**
   * 播放背景音乐（循环）
   * 使用多个振荡器合成简单的旋律
   * 需求：6.2
   */
  playMusic(): void {
    if (!this.audioContext || !this.musicGainNode) {
      console.warn('AudioContext not initialized');
      return;
    }

    // 停止当前音乐
    this.stopMusic();

    try {
      const now = this.audioContext.currentTime;
      
      // 创建简单的新年主题旋律（使用C大调音阶）
      const melody = [
        { freq: 523.25, duration: 0.5 }, // C5
        { freq: 587.33, duration: 0.5 }, // D5
        { freq: 659.25, duration: 0.5 }, // E5
        { freq: 523.25, duration: 0.5 }, // C5
        { freq: 659.25, duration: 0.5 }, // E5
        { freq: 783.99, duration: 1.0 }, // G5
      ];

      let time = now;
      
      melody.forEach(note => {
        const osc = this.audioContext!.createOscillator();
        const noteGain = this.audioContext!.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = note.freq;
        
        // 音符包络
        noteGain.gain.setValueAtTime(0, time);
        noteGain.gain.linearRampToValueAtTime(0.3, time + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.01, time + note.duration);
        
        osc.connect(noteGain);
        noteGain.connect(this.musicGainNode!);
        
        osc.start(time);
        osc.stop(time + note.duration);
        
        this.musicOscillators.push(osc);
        time += note.duration;
      });

      // 循环播放
      const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);
      setTimeout(() => {
        if (this.musicOscillators.length > 0) {
          this.playMusic();
        }
      }, totalDuration * 1000);

    } catch (error) {
      console.error('Failed to play music:', error);
    }
  }

  /**
   * 停止背景音乐
   */
  stopMusic(): void {
    this.musicOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (error) {
        // 忽略已停止的错误
      }
    });
    this.musicOscillators = [];
  }

  /**
   * 播放烟花发射音效（"嗖"声）
   * 需求：3.3
   */
  playLaunchSFX(): void {
    if (!this.audioContext || !this.sfxGainNode) {
      return;
    }

    try {
      const now = this.audioContext.currentTime;
      
      // 创建上升的音调模拟"嗖"声
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (error) {
      console.error('Failed to play launch SFX:', error);
    }
  }

  /**
   * 播放烟花爆炸音效（"砰"声）
   * 需求：3.4
   */
  playExplosionSFX(): void {
    if (!this.audioContext || !this.sfxGainNode) {
      return;
    }

    try {
      const now = this.audioContext.currentTime;
      
      // 使用白噪声和低频振荡器模拟爆炸声
      const bufferSize = this.audioContext.sampleRate * 0.5;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      // 生成白噪声
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      
      const noiseFilter = this.audioContext.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1000, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.5);
      
      const noiseGain = this.audioContext.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGainNode);
      
      noise.start(now);
      noise.stop(now + 0.5);
      
      // 添加低频"砰"声
      const bass = this.audioContext.createOscillator();
      const bassGain = this.audioContext.createGain();
      
      bass.type = 'sine';
      bass.frequency.setValueAtTime(80, now);
      bass.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      
      bassGain.gain.setValueAtTime(0.6, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      bass.connect(bassGain);
      bassGain.connect(this.sfxGainNode);
      
      bass.start(now);
      bass.stop(now + 0.3);
    } catch (error) {
      console.error('Failed to play explosion SFX:', error);
    }
  }

  /**
   * 播放通用音效
   * 
   * @param type - 音效类型：'launch' | 'explosion' | 'click' | 'success'
   */
  playSFX(type: 'launch' | 'explosion' | 'click' | 'success'): void {
    switch (type) {
      case 'launch':
        this.playLaunchSFX();
        break;
      case 'explosion':
        this.playExplosionSFX();
        break;
      case 'click':
        this.playClickSFX();
        break;
      case 'success':
        this.playSuccessSFX();
        break;
    }
  }

  /**
   * 播放点击音效
   */
  private playClickSFX(): void {
    if (!this.audioContext || !this.sfxGainNode) {
      return;
    }

    try {
      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 800;
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (error) {
      console.error('Failed to play click SFX:', error);
    }
  }

  /**
   * 播放成功音效
   */
  private playSuccessSFX(): void {
    if (!this.audioContext || !this.sfxGainNode) {
      return;
    }

    try {
      const now = this.audioContext.currentTime;
      
      // 播放上升的和弦
      const frequencies = [523.25, 659.25, 783.99]; // C-E-G 和弦
      
      frequencies.forEach((freq, index) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const startTime = now + index * 0.1;
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.sfxGainNode!);
        
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (error) {
      console.error('Failed to play success SFX:', error);
    }
  }

  /**
   * 设置音乐音量
   * 需求：6.3
   * 
   * @param volume - 音量（0-1）
   */
  setMusicVolume(volume: number): void {
    // 限制范围
    this.config.musicVolume = Math.max(0, Math.min(1, volume));

    // 应用到增益节点
    if (this.musicGainNode && !this.config.musicMuted) {
      this.musicGainNode.gain.value = this.config.musicVolume;
    }
  }

  /**
   * 设置音效音量
   * 需求：6.3
   * 
   * @param volume - 音量（0-1）
   */
  setSFXVolume(volume: number): void {
    // 限制范围
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));

    // 应用到增益节点
    if (this.sfxGainNode && !this.config.sfxMuted) {
      this.sfxGainNode.gain.value = this.config.sfxVolume;
    }
  }

  /**
   * 切换音乐静音
   * 需求：1.5
   */
  toggleMusicMute(): void {
    this.config.musicMuted = !this.config.musicMuted;

    // 应用到增益节点
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.config.musicMuted ? 0 : this.config.musicVolume;
    }
  }

  /**
   * 切换音效静音
   */
  toggleSFXMute(): void {
    this.config.sfxMuted = !this.config.sfxMuted;

    // 应用到增益节点
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.config.sfxMuted ? 0 : this.config.sfxVolume;
    }
  }

  /**
   * 获取当前配置
   * 
   * @returns 音频配置
   */
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  /**
   * 保存配置
   * 需求：6.4
   * 
   * @returns Promise
   */
  async saveConfig(): Promise<void> {
    try {
      // 加载现有数据
      const existingData = await this.storageService.load();
      
      // 更新音频配置
      const updatedData = {
        ...existingData,
        audioConfig: this.config,
        lastPlayedAt: Date.now()
      } as any;
      
      await this.storageService.save(updatedData);
    } catch (error) {
      console.error('Failed to save audio config:', error);
      throw error;
    }
  }

  /**
   * 恢复AudioContext（处理浏览器自动播放限制）
   * 需求：1.4
   */
  async resumeContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    }
  }

  /**
   * 销毁音频控制器
   */
  destroy(): void {
    this.stopMusic();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isInitialized = false;
  }
}
