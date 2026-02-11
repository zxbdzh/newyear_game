/**
 * 主题状态切片
 * Feature: new-year-fireworks-game
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Theme, CountdownSkin } from '../types/ThemeTypes';

/**
 * 主题状态接口
 */
interface ThemeSliceState {
  /** 当前主题 */
  currentTheme: Theme;
  /** 当前倒计时皮肤 */
  currentSkin: CountdownSkin;
  /** 可用主题列表 */
  availableThemes: Theme[];
  /** 可用皮肤列表 */
  availableSkins: CountdownSkin[];
}

/**
 * 默认主题
 */
const defaultTheme: Theme = {
  id: 'new-year-dinner',
  name: '年夜饭场景',
  backgroundImage: '',
  primaryColor: '#D32F2F',
  secondaryColor: '#FFD700',
  accentColor: '#FF6B6B',
};

/**
 * 默认皮肤
 */
const defaultSkin: CountdownSkin = {
  id: 'lantern',
  name: '灯笼样式',
  fontFamily: 'Arial, sans-serif',
  glowColor: '#FFD700',
};

/**
 * 初始状态
 */
const initialState: ThemeSliceState = {
  currentTheme: defaultTheme,
  currentSkin: defaultSkin,
  availableThemes: [
    defaultTheme,
    {
      id: 'temple-fair',
      name: '庙会场景',
      backgroundImage: '',
      primaryColor: '#C62828',
      secondaryColor: '#FFA000',
      accentColor: '#FF8A65',
    },
    {
      id: 'snow-village',
      name: '雪乡场景',
      backgroundImage: '',
      primaryColor: '#1565C0',
      secondaryColor: '#FFFFFF',
      accentColor: '#64B5F6',
    },
  ],
  availableSkins: [
    defaultSkin,
    {
      id: 'couplet',
      name: '对联样式',
      fontFamily: 'serif',
      glowColor: '#FF0000',
    },
    {
      id: 'zodiac',
      name: '生肖样式',
      fontFamily: 'cursive',
      glowColor: '#FFC107',
    },
  ],
};

/**
 * 主题状态切片
 */
const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    /**
     * 设置当前主题
     */
    setTheme: (state, action: PayloadAction<string>) => {
      const theme = state.availableThemes.find((t) => t.id === action.payload);
      if (theme) {
        state.currentTheme = theme;
      }
    },

    /**
     * 设置当前皮肤
     */
    setSkin: (state, action: PayloadAction<string>) => {
      const skin = state.availableSkins.find((s) => s.id === action.payload);
      if (skin) {
        state.currentSkin = skin;
      }
    },

    /**
     * 添加主题
     */
    addTheme: (state, action: PayloadAction<Theme>) => {
      const exists = state.availableThemes.some((t) => t.id === action.payload.id);
      if (!exists) {
        state.availableThemes.push(action.payload);
      }
    },

    /**
     * 添加皮肤
     */
    addSkin: (state, action: PayloadAction<CountdownSkin>) => {
      const exists = state.availableSkins.some((s) => s.id === action.payload.id);
      if (!exists) {
        state.availableSkins.push(action.payload);
      }
    },

    /**
     * 重置主题配置
     */
    resetTheme: (state) => {
      state.currentTheme = defaultTheme;
      state.currentSkin = defaultSkin;
    },
  },
});

export const { setTheme, setSkin, addTheme, addSkin, resetTheme } = themeSlice.actions;

export default themeSlice.reducer;
