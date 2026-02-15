/**
 * 烟花引擎
 * Feature: new-year-fireworks-game
 * 
 * 负责烟花的生成、动画和渲染
 * 需求：3.1, 3.2, 3.5, 3.7
 */

import type { FireworkType, FireworkInstance, Particle, FireworkPattern } from '../types';

/**
 * 粒子对象池
 * 用于优化性能，减少GC压力
 */
class ParticlePool {
  private pool: Particle[] = [];
  private maxSize: number = 1000;

  /**
   * 获取一个粒子
   */
  acquire(): Particle {
    return this.pool.pop() || this.createParticle();
  }

  /**
   * 释放一个粒子
   */
  release(particle: Particle): void {
    if (this.pool.length < this.maxSize) {
      this.resetParticle(particle);
      this.pool.push(particle);
    }
  }

  /**
   * 创建新粒子
   */
  private createParticle(): Particle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      color: '',
      alpha: 1,
      size: 1
    };
  }

  /**
   * 重置粒子
   */
  private resetParticle(particle: Particle): void {
    particle.x = 0;
    particle.y = 0;
    particle.vx = 0;
    particle.vy = 0;
    particle.alpha = 1;
    particle.size = 1;
  }
}

/**
 * 烟花引擎类
 */
export class FireworksEngine {
  private static readonly ACCELERATION_REMAINING_TIME_MS = 100;
  
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fireworks: FireworkInstance[] = [];
  private fireworkTypes: Map<string, FireworkType> = new Map();
  private particlePool: ParticlePool = new ParticlePool();
  private animationId: number | null = null;
  private lastUpdateTime: number = 0;
  private audioController: any | null = null; // AudioController类型
  private performanceProfile: {
    maxParticles: number;
    enableGlow: boolean;
    enableTrails: boolean;
  } = {
    maxParticles: 100,
    enableGlow: true,
    enableTrails: false,
  };
  private maxActiveFireworks: number = 15; // 限制同时存在的烟花数量

  /**
   * 构造函数
   *
   * @param canvas - Canvas元素
   * @param audioController - 音频控制器（可选）
   */
  constructor(canvas: HTMLCanvasElement, audioController?: any) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    this.audioController = audioController || null;

    // 注册默认烟花类型
    this.registerDefaultFireworkTypes();
  }

  /**
   * 设置音频控制器
   *
   * @param audioController - 音频控制器实例
   */
  setAudioController(audioController: any): void {
    this.audioController = audioController;
  }

  /**
   * 注册默认烟花类型
   */
  private registerDefaultFireworkTypes(): void {
    // 牡丹型 - 球形爆炸
    this.registerFireworkType({
      id: 'peony',
      name: '牡丹型',
      particleCount: 100,
      colors: ['#ff0000', '#ff6600', '#ffcc00', '#ff3366'],
      pattern: 'peony',
      duration: 2500,
      specialEffect: undefined // 祝福语在发射时动态决定
    });

    // 流星型 - 拖尾效果
    this.registerFireworkType({
      id: 'meteor',
      name: '流星型',
      particleCount: 50,
      colors: ['#00ffff', '#0099ff', '#ffffff'],
      pattern: 'meteor',
      duration: 3000,
      specialEffect: undefined
    });

    // 心形
    this.registerFireworkType({
      id: 'heart',
      name: '心形',
      particleCount: 80,
      colors: ['#ff1493', '#ff69b4', '#ffb6c1'],
      pattern: 'heart',
      duration: 2800,
      specialEffect: undefined
    });

    // 福字型
    this.registerFireworkType({
      id: 'fortune',
      name: '福字型',
      particleCount: 120,
      colors: ['#ff0000', '#ffd700', '#ff4500'],
      pattern: 'fortune',
      duration: 3000,
      specialEffect: undefined
    });

    // 红包型
    this.registerFireworkType({
      id: 'redEnvelope',
      name: '红包型',
      particleCount: 60,
      colors: ['#ff0000', '#ffd700', '#ff6347'],
      pattern: 'redEnvelope',
      duration: 2500,
      specialEffect: undefined
    });
  }

  /**
   * 注册烟花类型
   *
   * @param type - 烟花类型
   */
  registerFireworkType(type: FireworkType): void {
    this.fireworkTypes.set(type.id, type);
  }

  /**
   * 获取所有可用烟花类型
   *
   * @returns 烟花类型数组
   */
  getAvailableTypes(): FireworkType[] {
    return Array.from(this.fireworkTypes.values());
  }

  /**
   * 发射连击增强烟花
   * 需求：3.6
   *
   * @param x - X坐标
   * @param y - Y坐标
   * @param multiplier - 连击倍数
   * @returns 烟花实例ID数组
   */
  launchComboFireworks(x: number, y: number, multiplier: number): string[] {
    const ids: string[] = [];

    if (multiplier >= 5) {
      // 6次以上：烟花雨效果（最高优先级）
      this.launchFireworkRain(x, y);
    } else if (multiplier >= 3) {
      // 4-5次点击：三倍烟花 + 彩色光环
      ids.push(this.launchFirework(x, y - 40));
      ids.push(this.launchFirework(x - 35, y + 20));
      ids.push(this.launchFirework(x + 35, y + 20));
      this.renderColorfulHalo(x, y);
    } else if (multiplier >= 2) {
      // 2-3次点击：双倍烟花
      ids.push(this.launchFirework(x - 30, y));
      ids.push(this.launchFirework(x + 30, y));
    }

    return ids;
  }

  /**
   * 发射烟花雨效果
   * 需求：3.6
   *
   * @param centerX - 中心X坐标
   * @param centerY - 中心Y坐标
   */
  launchFireworkRain(centerX: number, centerY: number): void {
    const rainCount = 20;
    const spreadRadius = 200;

    for (let i = 0; i < rainCount; i++) {
      setTimeout(() => {
        // 在中心点周围随机位置发射烟花
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * spreadRadius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance * 0.5; // Y轴压缩，更自然

        this.launchFirework(x, y);
      }, i * 200); // 每200ms发射一个
    }
  }

  /**
   * 渲染彩色光环效果
   * 需求：3.6
   *
   * @param x - 中心X坐标
   * @param y - 中心Y坐标
   */
  private renderColorfulHalo(x: number, y: number): void {
    const startTime = Date.now();
    const duration = 1000; // 1秒

    const animateHalo = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) return;

      const progress = elapsed / duration;
      const radius = 50 + progress * 100;
      const alpha = 1 - progress;

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      
      // 绘制多层彩色光环
      const colors = ['#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#0099ff', '#9933ff'];
      for (let i = 0; i < colors.length; i++) {
        const r = radius + i * 10;
        this.ctx.strokeStyle = colors[i];
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      this.ctx.restore();

      requestAnimationFrame(animateHalo);
    };

    animateHalo();
  }

  /**
   * 在指定位置发射烟花
   * 
   * 当达到最大烟花数量限制时，会加速最旧的烟花以腾出空间，
   * 确保用户的每次点击都能看到烟花效果。
   * 
   * 需求：3.1, 3.3
   *
   * @param x - X坐标
   * @param y - Y坐标
   * @param typeId - 烟花类型ID（可选，随机选择）
   * @returns 烟花实例ID
   */
  launchFirework(x: number, y: number, typeId?: string): string {
    // 检查是否超过最大烟花数量限制
    if (this.fireworks.length >= this.maxActiveFireworks) {
      console.log('[FireworksEngine] Max fireworks limit reached, accelerating oldest firework');
      this.accelerateOldestFirework();
    }
    
    // 播放发射音效
    if (this.audioController) {
      try {
        this.audioController.playLaunchSFX();
      } catch (error) {
        console.warn('Failed to play launch SFX:', error);
      }
    }

    // 选择烟花类型
    let type: FireworkType;
    if (typeId && this.fireworkTypes.has(typeId)) {
      type = this.fireworkTypes.get(typeId)!;
    } else {
      // 随机选择
      const types = Array.from(this.fireworkTypes.values());
      type = types[Math.floor(Math.random() * types.length)];
    }

    // 动态添加祝福语（10%概率）
    const blessings = ['新年快乐', '恭喜发财', '万事如意', '福星高照', '财源广进'];
    const typeWithBlessing = {
      ...type,
      specialEffect: Math.random() < 0.1 ? blessings[Math.floor(Math.random() * blessings.length)] : undefined
    };

    // 创建烟花实例
    const id = `firework_${Date.now()}_${Math.random()}`;
    const particles = this.createParticles(x, y, typeWithBlessing);

    const firework: FireworkInstance = {
      id,
      type: typeWithBlessing,
      x,
      y,
      startTime: Date.now(),
      particles,
      state: 'launching'
    };

    this.fireworks.push(firework);

    return id;
  }


  /**
   * 加速最旧的烟花以腾出空间
   * 通过缩短其剩余持续时间来加速完成
   * 
   * 策略：将剩余时间缩短到100ms，让烟花快速进入消失阶段
   */
  private accelerateOldestFirework(): void {
    if (this.fireworks.length === 0) return;
    
    // 找到最旧且还在活跃状态的烟花
    let oldestActiveFirework: FireworkInstance | null = null;
    for (const firework of this.fireworks) {
      if (firework.state !== 'fading' && firework.state !== 'complete') {
        oldestActiveFirework = firework;
        break; // 数组已按时间排序，第一个就是最旧的
      }
    }
    
    if (!oldestActiveFirework) {
      console.log('[FireworksEngine] No active firework to accelerate');
      return;
    }
    
    const elapsed = Date.now() - oldestActiveFirework.startTime;
    const remaining = oldestActiveFirework.type.duration - elapsed;
    
    // 如果还有剩余时间，将其缩短到100ms
    if (remaining > FireworksEngine.ACCELERATION_REMAINING_TIME_MS) {
      oldestActiveFirework.startTime = Date.now() - (oldestActiveFirework.type.duration - FireworksEngine.ACCELERATION_REMAINING_TIME_MS);
      console.log(`[FireworksEngine] Accelerated firework ${oldestActiveFirework.id}, remaining: ${remaining}ms -> ${FireworksEngine.ACCELERATION_REMAINING_TIME_MS}ms`);
    }
  }

  /**
   * 创建粒子
   *
   * @param x - 中心X坐标
   * @param y - 中心Y坐标
   * @param type - 烟花类型
   * @returns 粒子数组
   */
  private createParticles(x: number, y: number, type: FireworkType): Particle[] {
    const particles: Particle[] = [];
    // 应用性能配置限制粒子数量
    const baseCount = type.particleCount;
    const count = Math.floor((baseCount * this.performanceProfile.maxParticles) / 100);

    for (let i = 0; i < count; i++) {
      const particle = this.particlePool.acquire();
      particle.x = x;
      particle.y = y;
      particle.color = type.colors[Math.floor(Math.random() * type.colors.length)];
      particle.size = Math.random() * 3 + 1;

      // 根据图案类型设置速度
      this.setParticleVelocity(particle, i, count, type.pattern);

      particles.push(particle);
    }

    return particles;
  }

  /**
   * 设置粒子速度（根据图案类型）
   *
   * @param particle - 粒子
   * @param index - 粒子索引
   * @param total - 总粒子数
   * @param pattern - 图案类型
   */
  private setParticleVelocity(
    particle: Particle,
    index: number,
    total: number,
    pattern: FireworkPattern
  ): void {
    const speed = Math.random() * 3 + 2;

    switch (pattern) {
      case 'peony': {
        // 球形爆炸 - 均匀分布
        const angle = (index / total) * Math.PI * 2;
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        break;
      }
      case 'meteor': {
        // 流星型 - 向下拖尾
        const angle = Math.random() * Math.PI - Math.PI / 2;
        particle.vx = Math.cos(angle) * speed * 0.5;
        particle.vy = Math.sin(angle) * speed + 2;
        break;
      }
      case 'heart': {
        // 心形 - 心形曲线
        const t = (index / total) * Math.PI * 2;
        const heartX = 16 * Math.pow(Math.sin(t), 3);
        const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        particle.vx = heartX * 0.1;
        particle.vy = heartY * 0.1;
        break;
      }
      case 'fortune': {
        // 福字型 - 随机但集中
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * speed * 0.8;
        particle.vx = Math.cos(angle) * r;
        particle.vy = Math.sin(angle) * r;
        break;
      }
      case 'redEnvelope': {
        // 红包型 - 向下散落
        particle.vx = (Math.random() - 0.5) * speed;
        particle.vy = Math.random() * speed * 0.5 + 1;
        break;
      }
    }
  }

  /**
   * 启动动画循环
   */
  startAnimation(): void {
    if (this.animationId !== null) {
      return; // 已经在运行
    }
    this.lastUpdateTime = Date.now();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * 停止动画循环
   */
  stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 动画循环
   */
  private animate(): void {
    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    this.update(deltaTime);
    this.render();

    // 持续运行动画循环，即使没有烟花也要保持清空画布
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * 更新所有烟花状态
   * 需求：3.4
   *
   * @param deltaTime - 时间增量（毫秒）
   */
  update(deltaTime: number): void {
    const dt = deltaTime / 1000; // 转换为秒

    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const firework = this.fireworks[i];
      const elapsed = Date.now() - firework.startTime;
      const previousState = firework.state;

      // 更新状态
      if (elapsed < 200) {
        firework.state = 'launching';
      } else if (elapsed < firework.type.duration * 0.7) {
        firework.state = 'exploding';

        // 播放爆炸音效（仅在状态转换时播放一次）
        if (previousState === 'launching' && this.audioController) {
          try {
            this.audioController.playExplosionSFX();
          } catch (error) {
            console.warn('Failed to play explosion SFX:', error);
          }
        }
      } else if (elapsed < firework.type.duration) {
        firework.state = 'fading';
      } else {
        firework.state = 'complete';
      }

      // 更新粒子
      for (const particle of firework.particles) {
        // 更新位置
        particle.x += particle.vx * dt * 60;
        particle.y += particle.vy * dt * 60;

        // 应用重力
        particle.vy += 0.2 * dt * 60;

        // 更新透明度
        if (firework.state === 'fading') {
          particle.alpha -= dt * 2;
        }
      }

      // 移除完成的烟花
      if (firework.state === 'complete' || elapsed > firework.type.duration) {
        // 释放粒子回对象池
        for (const particle of firework.particles) {
          this.particlePool.release(particle);
        }
        this.fireworks.splice(i, 1);
      }
    }
  }

  /**
   * 渲染所有烟花
   */
  render(): void {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 渲染所有烟花
    for (const firework of this.fireworks) {
      for (const particle of firework.particles) {
        if (particle.alpha <= 0) continue;

        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha;
        
        // 应用光晕效果（如果启用）
        if (this.performanceProfile.enableGlow) {
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = particle.color;
        }
        
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 应用拖尾效果（如果启用）
        if (this.performanceProfile.enableTrails && (particle.vx !== 0 || particle.vy !== 0)) {
          const trailLength = 10;
          const trailX = particle.x - particle.vx * 0.5;
          const trailY = particle.y - particle.vy * 0.5;
          
          this.ctx.globalAlpha = particle.alpha * 0.3;
          this.ctx.strokeStyle = particle.color;
          this.ctx.lineWidth = particle.size * 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(trailX, trailY);
          this.ctx.stroke();
        }
        
        this.ctx.restore();
      }

      // 渲染特殊效果文字
      if (firework.type.specialEffect && firework.state === 'exploding') {
        this.ctx.save();
        
        // 计算文字透明度（根据烟花状态）
        const elapsed = Date.now() - firework.startTime;
        const fadeStart = firework.type.duration * 0.5;
        const fadeEnd = firework.type.duration * 0.7;
        let textAlpha = 1;
        
        if (elapsed > fadeStart) {
          textAlpha = 1 - ((elapsed - fadeStart) / (fadeEnd - fadeStart));
          textAlpha = Math.max(0, Math.min(1, textAlpha));
        }
        
        this.ctx.globalAlpha = textAlpha;
        this.ctx.font = 'bold 32px "Noto Sans SC", "Microsoft YaHei", sans-serif';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 添加发光效果
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#ffd700';
        
        this.ctx.strokeText(firework.type.specialEffect, firework.x, firework.y - 60);
        this.ctx.fillText(firework.type.specialEffect, firework.x, firework.y - 60);
        this.ctx.restore();
      }
    }
  }

  /**
   * 清除所有烟花
   */
  clear(): void {
    // 释放所有粒子
    for (const firework of this.fireworks) {
      for (const particle of firework.particles) {
        this.particlePool.release(particle);
      }
    }
    this.fireworks = [];

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    console.log('[FireworksEngine] Cleared all fireworks');
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    this.stopAnimation();
    this.clear();
  }
  /**
   * 更新性能配置
   * 需求：3.1, 3.2, 3.3, 3.4
   *
   * @param profile - 性能配置
   */
  updatePerformanceProfile(profile: any): void {
    // 根据性能级别设置配置
    // 注意：性能越高，限制越少（允许更多粒子和烟花）
    switch (profile.level) {
      case 'low':
        // 低性能：限制最严格，50%粒子，禁用光晕和拖尾
        this.performanceProfile = {
          maxParticles: 50,
          enableGlow: false,
          enableTrails: false,
        };
        this.maxActiveFireworks = 16; // 最少烟花（翻倍）
        break;
      case 'medium':
        // 中性能：100%粒子，启用光晕，禁用拖尾
        this.performanceProfile = {
          maxParticles: 100,
          enableGlow: true,
          enableTrails: false,
        };
        this.maxActiveFireworks = 30; // 中等烟花（翻倍）
        break;
      case 'high':
        // 高性能：限制最少，150%粒子，启用所有效果
        this.performanceProfile = {
          maxParticles: 150,
          enableGlow: true,
          enableTrails: true,
        };
        this.maxActiveFireworks = 50; // 最多烟花（翻倍）
        break;
      default:
        // 默认使用中性能
        this.performanceProfile = {
          maxParticles: 100,
          enableGlow: true,
          enableTrails: false,
        };
        this.maxActiveFireworks = 30;
    }
    
    console.log('[FireworksEngine] Performance profile updated:', this.performanceProfile, 'Max fireworks:', this.maxActiveFireworks);
  }
}

