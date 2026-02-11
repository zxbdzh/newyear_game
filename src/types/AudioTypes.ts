/**
 * 音频类型定义
 * Feature: new-year-fireworks-game
 */

/**
 * 音频资源类型
 */
export type AudioAssetType = 'music' | 'sfx';

/**
 * 音频配置
 */
export interface AudioConfig {
  /** 音乐音量 (0-1) */
  musicVolume: number;
  /** 音效音量 (0-1) */
  sfxVolume: number;
  /** 音乐是否静音 */
  musicMuted: boolean;
  /** 音效是否静音 */
  sfxMuted: boolean;
}

/**
 * 音频资源
 */
export interface AudioAsset {
  /** 资源唯一标识 */
  id: string;
  /** 资源URL */
  url: string;
  /** 资源类型 */
  type: AudioAssetType;
  /** 音频缓冲区 */
  buffer?: AudioBuffer;
}
