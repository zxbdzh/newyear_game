// 烟花类型定义

export type FireworkPattern =
  | 'peony'
  | 'meteor'
  | 'heart'
  | 'fortune'
  | 'redEnvelope';

export interface FireworkType {
  id: string;
  name: string;
  particleCount: number;
  colors: string[];
  pattern: FireworkPattern;
  duration: number; // 毫秒
  specialEffect?: string; // 祝福语等
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export type FireworkState = 'launching' | 'exploding' | 'fading' | 'complete';

export interface FireworkInstance {
  id: string;
  type: FireworkType;
  x: number;
  y: number;
  startTime: number;
  particles: Particle[];
  state: FireworkState;
}
