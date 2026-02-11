// 音频系统类型定义

export type AudioAssetType = 'music' | 'sfx';

export interface AudioConfig {
  musicVolume: number; // 0-1
  sfxVolume: number; // 0-1
  musicMuted: boolean;
  sfxMuted: boolean;
}

export interface AudioAsset {
  id: string;
  url: string;
  type: AudioAssetType;
  buffer?: AudioBuffer;
}
