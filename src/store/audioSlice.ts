/**
 * 音频状态切片
 * Feature: new-year-fireworks-game
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AudioConfig } from '../types/AudioTypes';

/**
 * 音频状态接口
 */
interface AudioSliceState {
  /** 音频配置 */
  config: AudioConfig;
}

/**
 * 初始状态
 */
const initialState: AudioSliceState = {
  config: {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    musicMuted: false,
    sfxMuted: false,
  },
};

/**
 * 音频状态切片
 */
const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    /**
     * 设置音乐音量
     */
    setMusicVolume: (state, action: PayloadAction<number>) => {
      state.config.musicVolume = Math.max(0, Math.min(1, action.payload));
    },

    /**
     * 设置音效音量
     */
    setSFXVolume: (state, action: PayloadAction<number>) => {
      state.config.sfxVolume = Math.max(0, Math.min(1, action.payload));
    },

    /**
     * 切换音乐静音
     */
    toggleMusicMute: (state) => {
      state.config.musicMuted = !state.config.musicMuted;
    },

    /**
     * 切换音效静音
     */
    toggleSFXMute: (state) => {
      state.config.sfxMuted = !state.config.sfxMuted;
    },

    /**
     * 设置音乐静音状态
     */
    setMusicMuted: (state, action: PayloadAction<boolean>) => {
      state.config.musicMuted = action.payload;
    },

    /**
     * 设置音效静音状态
     */
    setSFXMuted: (state, action: PayloadAction<boolean>) => {
      state.config.sfxMuted = action.payload;
    },

    /**
     * 更新音频配置
     */
    updateAudioConfig: (state, action: PayloadAction<AudioConfig>) => {
      state.config = action.payload;
    },

    /**
     * 重置音频配置
     */
    resetAudioConfig: (state) => {
      state.config = {
        musicVolume: 0.7,
        sfxVolume: 0.8,
        musicMuted: false,
        sfxMuted: false,
      };
    },
  },
});

export const {
  setMusicVolume,
  setSFXVolume,
  toggleMusicMute,
  toggleSFXMute,
  setMusicMuted,
  setSFXMuted,
  updateAudioConfig,
  resetAudioConfig,
} = audioSlice.actions;

export default audioSlice.reducer;
