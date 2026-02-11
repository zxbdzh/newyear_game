/**
 * 网络通信类型定义
 * Feature: new-year-fireworks-game
 */

/**
 * 房间类型
 */
export type RoomType = 'public' | 'private';

/**
 * 网络消息类型
 */
export type NetworkMessageType = 'join' | 'leave' | 'firework' | 'chat' | 'sync';

/**
 * 玩家信息
 */
export interface PlayerInfo {
  /** 玩家唯一标识 */
  id: string;
  /** 玩家昵称 */
  nickname: string;
  /** 烟花数量 */
  fireworkCount: number;
  /** 最后操作时间 */
  lastActionTime: number;
}

/**
 * 房间信息
 */
export interface RoomInfo {
  /** 房间唯一标识 */
  id: string;
  /** 房间类型 */
  type: RoomType;
  /** 房间码（私人房间） */
  code?: string;
  /** 玩家列表 */
  players: PlayerInfo[];
  /** 最大玩家数 */
  maxPlayers: number;
  /** 创建时间 */
  createdAt: number;
}

/**
 * 烟花动作
 */
export interface FireworkAction {
  /** 玩家ID */
  playerId: string;
  /** 玩家昵称 */
  playerNickname: string;
  /** X坐标 */
  x: number;
  /** Y坐标 */
  y: number;
  /** 烟花类型ID */
  fireworkTypeId: string;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 网络消息
 */
export interface NetworkMessage {
  /** 消息类型 */
  type: NetworkMessageType;
  /** 消息负载 */
  payload: any;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 房间数据（服务器端）
 */
export interface RoomData {
  /** 房间唯一标识 */
  id: string;
  /** 房间类型 */
  type: RoomType;
  /** 房间码（私人房间） */
  code?: string;
  /** 玩家映射 */
  players: Map<string, PlayerInfo>;
  /** 最大玩家数 */
  maxPlayers: number;
  /** 创建时间 */
  createdAt: number;
  /** 最后活动时间 */
  lastActivityAt: number;
}

/**
 * 玩家会话（服务器端）
 */
export interface PlayerSession {
  /** 玩家唯一标识 */
  id: string;
  /** Socket ID */
  socketId: string;
  /** 玩家昵称 */
  nickname: string;
  /** 所在房间ID */
  roomId: string | null;
  /** 连接时间 */
  connectedAt: number;
  /** 最后操作时间 */
  lastActionAt: number;
}
