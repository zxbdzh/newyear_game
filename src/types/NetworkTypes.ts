// 网络和多人模式类型定义

export type RoomType = 'public' | 'private';

export interface PlayerInfo {
  id: string;
  nickname: string;
  fireworkCount: number;
  lastActionTime: number;
}

export interface RoomInfo {
  id: string;
  type: RoomType;
  code?: string;
  players: PlayerInfo[];
  maxPlayers: number;
  createdAt: number;
}

export interface FireworkAction {
  playerId: string;
  playerNickname: string;
  x: number;
  y: number;
  fireworkTypeId: string;
  timestamp: number;
}

export type NetworkMessageType =
  | 'join'
  | 'leave'
  | 'firework'
  | 'chat'
  | 'sync';

export interface NetworkMessage {
  type: NetworkMessageType;
  payload: unknown;
  timestamp: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
