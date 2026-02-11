/**
 * 统计数据状态切片
 * Feature: new-year-fireworks-game
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { PlayerStatistics } from '../types/StatisticsTypes';

/**
 * 统计数据状态接口
 * 注意：Set类型在Redux中需要特殊处理，使用数组存储
 */
interface StatisticsSliceState {
  /** 总点击次数 */
  totalClicks: number;
  /** 最高连击数 */
  maxCombo: number;
  /** 已解锁烟花数组 */
  unlockedFireworks: string[];
  /** 总游戏时长（秒） */
  totalPlayTime: number;
  /** 已解锁成就数组 */
  achievementsUnlocked: string[];
  /** 最后游玩时间 */
  lastPlayedAt: number;
}

/**
 * 初始状态
 */
const initialState: StatisticsSliceState = {
  totalClicks: 0,
  maxCombo: 0,
  unlockedFireworks: [],
  totalPlayTime: 0,
  achievementsUnlocked: [],
  lastPlayedAt: 0,
};

/**
 * 统计数据状态切片
 */
const statisticsSlice = createSlice({
  name: 'statistics',
  initialState,
  reducers: {
    /**
     * 记录点击
     */
    recordClick: (state) => {
      state.totalClicks += 1;
    },

    /**
     * 记录连击
     */
    recordCombo: (state, action: PayloadAction<number>) => {
      if (action.payload > state.maxCombo) {
        state.maxCombo = action.payload;
      }
    },

    /**
     * 解锁烟花
     */
    unlockFirework: (state, action: PayloadAction<string>) => {
      if (!state.unlockedFireworks.includes(action.payload)) {
        state.unlockedFireworks.push(action.payload);
      }
    },

    /**
     * 记录游戏时长
     */
    recordPlayTime: (state, action: PayloadAction<number>) => {
      state.totalPlayTime += action.payload;
    },

    /**
     * 解锁成就
     */
    unlockAchievement: (state, action: PayloadAction<string>) => {
      if (!state.achievementsUnlocked.includes(action.payload)) {
        state.achievementsUnlocked.push(action.payload);
      }
    },

    /**
     * 更新最后游玩时间
     */
    updateLastPlayedAt: (state, action: PayloadAction<number>) => {
      state.lastPlayedAt = action.payload;
    },

    /**
     * 加载统计数据
     */
    loadStatistics: (state, action: PayloadAction<PlayerStatistics>) => {
      state.totalClicks = action.payload.totalClicks;
      state.maxCombo = action.payload.maxCombo;
      state.unlockedFireworks = Array.from(action.payload.unlockedFireworks);
      state.totalPlayTime = action.payload.totalPlayTime;
      state.achievementsUnlocked = Array.from(action.payload.achievementsUnlocked);
      state.lastPlayedAt = action.payload.lastPlayedAt;
    },

    /**
     * 重置统计数据
     */
    resetStatistics: (state) => {
      state.totalClicks = 0;
      state.maxCombo = 0;
      state.unlockedFireworks = [];
      state.totalPlayTime = 0;
      state.achievementsUnlocked = [];
      state.lastPlayedAt = 0;
    },
  },
});

export const {
  recordClick,
  recordCombo,
  unlockFirework,
  recordPlayTime,
  unlockAchievement,
  updateLastPlayedAt,
  loadStatistics,
  resetStatistics,
} = statisticsSlice.actions;

export default statisticsSlice.reducer;
