/**
 * Redux Store配置
 * Feature: new-year-fireworks-game
 */

import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice';
import audioReducer from './audioSlice';
import themeReducer from './themeSlice';
import statisticsReducer from './statisticsSlice';
import multiplayerReducer from './multiplayerSlice';

/**
 * 配置Redux Store
 */
export const store = configureStore({
  reducer: {
    game: gameReducer,
    audio: audioReducer,
    theme: themeReducer,
    statistics: statisticsReducer,
    multiplayer: multiplayerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略某些不可序列化的值（如Date对象）
        ignoredActions: ['game/updateCountdown'],
        ignoredPaths: ['game.countdown'],
      },
    }),
});

/**
 * 推断RootState和AppDispatch类型
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
