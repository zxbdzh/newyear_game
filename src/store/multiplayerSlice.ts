/**
 * 多人游戏状态切片
 * Feature: new-year-fireworks-game
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RoomInfo, PlayerInfo } from '../types/NetworkTypes';

/**
 * 多人游戏状态接口
 */
interface MultiplayerSliceState {
  /** 当前房间信息 */
  room: RoomInfo | null;
  /** 本地玩家ID */
  localPlayerId: string | null;
  /** 本地玩家昵称 */
  localPlayerNickname: string | null;
  /** 排行榜（前3名玩家） */
  leaderboard: PlayerInfo[];
  /** 连接状态 */
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  /** 网络延迟（毫秒） */
  latency: number;
}

/**
 * 初始状态
 */
const initialState: MultiplayerSliceState = {
  room: null,
  localPlayerId: null,
  localPlayerNickname: null,
  leaderboard: [],
  connectionStatus: 'disconnected',
  latency: 0,
};

/**
 * 多人游戏状态切片
 */
const multiplayerSlice = createSlice({
  name: 'multiplayer',
  initialState,
  reducers: {
    /**
     * 设置房间信息
     */
    setRoom: (state, action: PayloadAction<RoomInfo>) => {
      state.room = action.payload;
    },

    /**
     * 清除房间信息
     */
    clearRoom: (state) => {
      state.room = null;
      state.leaderboard = [];
    },

    /**
     * 设置本地玩家信息
     */
    setLocalPlayer: (
      state,
      action: PayloadAction<{ id: string; nickname: string }>
    ) => {
      state.localPlayerId = action.payload.id;
      state.localPlayerNickname = action.payload.nickname;
    },

    /**
     * 添加玩家到房间
     */
    addPlayer: (state, action: PayloadAction<PlayerInfo>) => {
      if (state.room) {
        const exists = state.room.players.some((p) => p.id === action.payload.id);
        if (!exists) {
          state.room.players.push(action.payload);
        }
      }
    },

    /**
     * 移除玩家
     */
    removePlayer: (state, action: PayloadAction<string>) => {
      if (state.room) {
        state.room.players = state.room.players.filter(
          (p) => p.id !== action.payload
        );
      }
    },

    /**
     * 更新玩家信息
     */
    updatePlayer: (state, action: PayloadAction<PlayerInfo>) => {
      if (state.room) {
        const index = state.room.players.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index !== -1) {
          state.room.players[index] = action.payload;
        }
      }
    },

    /**
     * 更新排行榜
     */
    updateLeaderboard: (state, action: PayloadAction<PlayerInfo[]>) => {
      // 按烟花数量降序排序，取前3名
      state.leaderboard = action.payload
        .sort((a, b) => b.fireworkCount - a.fireworkCount)
        .slice(0, 3);
    },

    /**
     * 设置连接状态
     */
    setConnectionStatus: (
      state,
      action: PayloadAction<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>
    ) => {
      state.connectionStatus = action.payload;
    },

    /**
     * 更新网络延迟
     */
    updateLatency: (state, action: PayloadAction<number>) => {
      state.latency = action.payload;
    },

    /**
     * 重置多人游戏状态
     */
    resetMultiplayer: (state) => {
      state.room = null;
      state.localPlayerId = null;
      state.localPlayerNickname = null;
      state.leaderboard = [];
      state.connectionStatus = 'disconnected';
      state.latency = 0;
    },
  },
});

export const {
  setRoom,
  clearRoom,
  setLocalPlayer,
  addPlayer,
  removePlayer,
  updatePlayer,
  updateLeaderboard,
  setConnectionStatus,
  updateLatency,
  resetMultiplayer,
} = multiplayerSlice.actions;

export default multiplayerSlice.reducer;
