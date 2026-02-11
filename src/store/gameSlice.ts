/**
 * 游戏状态切片
 * Feature: new-year-fireworks-game
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GameMode } from '../types/GameTypes';
import type { CountdownTime } from '../types/CountdownTypes';
import type { FireworkInstance } from '../types/FireworkTypes';
import type { ComboState } from '../types/ComboTypes';

/**
 * 游戏状态接口
 */
interface GameSliceState {
  /** 当前游戏模式 */
  mode: GameMode;
  /** 倒计时 */
  countdown: CountdownTime | null;
  /** 烟花列表 */
  fireworks: FireworkInstance[];
  /** 连击状态 */
  combo: ComboState;
}

/**
 * 初始状态
 */
const initialState: GameSliceState = {
  mode: 'menu',
  countdown: null,
  fireworks: [],
  combo: {
    count: 0,
    lastClickTime: 0,
    isActive: false,
    multiplier: 1,
  },
};

/**
 * 游戏状态切片
 */
const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    /**
     * 设置游戏模式
     */
    setMode: (state, action: PayloadAction<GameMode>) => {
      state.mode = action.payload;
    },

    /**
     * 更新倒计时
     */
    updateCountdown: (state, action: PayloadAction<CountdownTime>) => {
      state.countdown = action.payload;
    },

    /**
     * 添加烟花
     */
    addFirework: (state, action: PayloadAction<FireworkInstance>) => {
      state.fireworks.push(action.payload);
    },

    /**
     * 移除烟花
     */
    removeFirework: (state, action: PayloadAction<string>) => {
      state.fireworks = state.fireworks.filter((f) => f.id !== action.payload);
    },

    /**
     * 清除所有烟花
     */
    clearFireworks: (state) => {
      state.fireworks = [];
    },

    /**
     * 更新连击状态
     */
    updateCombo: (state, action: PayloadAction<ComboState>) => {
      state.combo = action.payload;
    },

    /**
     * 重置连击
     */
    resetCombo: (state) => {
      state.combo = {
        count: 0,
        lastClickTime: 0,
        isActive: false,
        multiplier: 1,
      };
    },

    /**
     * 重置游戏状态
     */
    resetGame: (state) => {
      state.mode = 'menu';
      state.countdown = null;
      state.fireworks = [];
      state.combo = {
        count: 0,
        lastClickTime: 0,
        isActive: false,
        multiplier: 1,
      };
    },
  },
});

export const {
  setMode,
  updateCountdown,
  addFirework,
  removeFirework,
  clearFireworks,
  updateCombo,
  resetCombo,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
