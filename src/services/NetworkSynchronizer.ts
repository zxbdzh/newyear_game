/**
 * 网络同步器 (NetworkSynchronizer)
 * Feature: new-year-fireworks-game
 *
 * 处理多人模式的实时通信，包括：
 * - WebSocket连接管理
 * - 消息队列和重试机制
 * - 网络延迟监测（ping/pong）
 * - 房间管理和玩家同步
 *
 * 验证需求：5.3, 5.8
 */

import { io, Socket } from 'socket.io-client';
import type {
  RoomInfo,
  PlayerInfo,
  FireworkAction,
  NetworkMessage,
  RoomType,
} from '../types/NetworkTypes';

/**
 * 网络同步器配置
 */
interface NetworkSynchronizerConfig {
  /** 服务器URL */
  serverUrl: string;
  /** 重连最大尝试次数 */
  maxReconnectAttempts: number;
  /** 重连间隔（毫秒） */
  reconnectInterval: number;
  /** Ping间隔（毫秒） */
  pingInterval: number;
  /** 消息队列最大长度 */
  maxQueueSize: number;
}

/**
 * 连接状态
 */
type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

/**
 * 网络延迟信息
 */
interface LatencyInfo {
  /** 当前延迟（毫秒） */
  current: number;
  /** 平均延迟（毫秒） */
  average: number;
  /** 最小延迟（毫秒） */
  min: number;
  /** 最大延迟（毫秒） */
  max: number;
}

/**
 * 网络同步器类
 */
export class NetworkSynchronizer {
  private socket: Socket | null = null;
  private config: NetworkSynchronizerConfig;
  private connectionState: ConnectionState = 'disconnected';
  private roomInfo: RoomInfo | null = null;
  private localPlayerId: string | null = null;
  private messageQueue: NetworkMessage[] = [];
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private latencyHistory: number[] = [];
  private lastPingTime: number = 0;

  // 回调函数集合
  private fireworkActionCallbacks = new Set<(action: FireworkAction) => void>();
  private playerJoinCallbacks = new Set<(player: PlayerInfo) => void>();
  private playerLeaveCallbacks = new Set<(playerId: string) => void>();
  private roomUpdateCallbacks = new Set<(room: RoomInfo) => void>();
  private chatMessageCallbacks = new Set<
    (message: {
      playerId: string;
      playerNickname: string;
      message: string;
      timestamp: number;
    }) => void
  >();
  private comboMilestoneCallbacks = new Set<
    (data: {
      playerId: string;
      playerNickname: string;
      comboCount: number;
      timestamp: number;
    }) => void
  >();
  private leaderboardUpdateCallbacks = new Set<
    (leaderboard: PlayerInfo[]) => void
  >();
  private connectionStateCallbacks = new Set<
    (state: ConnectionState) => void
  >();
  private latencyUpdateCallbacks = new Set<(latency: LatencyInfo) => void>();
  private errorCallbacks = new Set<(error: string) => void>();

  /**
   * 构造函数
   * @param serverUrl 服务器URL，默认为 ws://localhost:3001
   */
  constructor(serverUrl: string = 'http://localhost:3001') {
    this.config = {
      serverUrl,
      maxReconnectAttempts: 3,
      reconnectInterval: 5000,
      pingInterval: 25000,
      maxQueueSize: 100,
    };
  }

  /**
   * 检查服务器是否可用
   * 尝试建立连接来验证服务器可达性
   */
  async checkServerAvailability(): Promise<boolean> {
    try {
      // 尝试连接到服务器
      await this.connect();
      // 连接成功，断开连接
      this.disconnect();
      return true;
    } catch (error) {
      console.warn('[NetworkSynchronizer] 服务器不可用:', error);
      return false;
    }
  }

  /**
   * 连接到服务器
   */
  async connect(): Promise<void> {
    if (
      this.connectionState === 'connected' ||
      this.connectionState === 'connecting'
    ) {
      return;
    }

    this.setConnectionState('connecting');

    return new Promise((resolve, reject) => {
      try {
        // 创建Socket.io连接
        // Socket.io 会自动在 URL 后添加 /socket.io/
        // 配合 Nginx 转发（去除 /newyear-game/ 前缀），服务器端使用默认路径
        this.socket = io(this.config.serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: false, // 手动处理重连
          timeout: 10000,
        });

        // 连接成功
        this.socket.on(
          'connected',
          (data: { socketId: string; timestamp: number }) => {
            console.log('[NetworkSynchronizer] 连接成功:', data.socketId);
            this.localPlayerId = data.socketId;
            this.setConnectionState('connected');
            this.reconnectAttempts = 0;
            this.startPingMonitoring();
            this.processMessageQueue();
            resolve();
          }
        );

        // 连接错误
        this.socket.on('connect_error', (error: Error) => {
          console.error('[NetworkSynchronizer] 连接错误:', error);
          this.setConnectionState('disconnected');
          this.notifyError(`连接失败: ${error.message}`);
          reject(error);
        });

        // 断开连接
        this.socket.on('disconnect', (reason: string) => {
          console.log('[NetworkSynchronizer] 断开连接:', reason);
          this.handleDisconnection(reason);
        });

        // 设置事件监听器
        this.setupEventListeners();
      } catch (error) {
        console.error('[NetworkSynchronizer] 连接异常:', error);
        this.setConnectionState('disconnected');
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('[NetworkSynchronizer] 主动断开连接');

    // 停止定时器
    this.stopPingMonitoring();
    this.stopReconnectTimer();

    // 断开Socket连接
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // 重置状态
    this.setConnectionState('disconnected');
    this.roomInfo = null;
    this.localPlayerId = null;
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.latencyHistory = [];
  }

  /**
   * 创建或加入房间
   */
  async joinRoom(
    nickname: string,
    roomType: RoomType,
    code?: string
  ): Promise<RoomInfo> {
    if (!this.socket || this.connectionState !== 'connected') {
      throw new Error('未连接到服务器');
    }

    return new Promise((resolve, reject) => {
      // 监听加入成功
      const onRoomJoined = (data: { roomInfo: RoomInfo; playerId: string }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        console.log('[NetworkSynchronizer] 成功加入房间:', data.roomInfo.id);
        this.roomInfo = data.roomInfo;
        this.localPlayerId = data.playerId;
        if (this.socket) {
          this.socket.off('room_joined', onRoomJoined);
          this.socket.off('join_room_error', onJoinError);
        }
        resolve(data.roomInfo);
      };

      // 监听加入失败
      const onJoinError = (_data: { error: string; message: string }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        console.error('[NetworkSynchronizer] 加入房间失败:', _data.message);
        if (this.socket) {
          this.socket.off('room_joined', onRoomJoined);
          this.socket.off('join_room_error', onJoinError);
        }
        reject(new Error(_data.message));
      };

      if (this.socket) {
        this.socket.once('room_joined', onRoomJoined);
        this.socket.once('join_room_error', onJoinError);
      }

      // 发送加入房间请求
      if (this.socket) {
        this.socket.emit('join_room', { nickname, roomType, code });
      }
    });
  }

  /**
   * 离开房间
   */
  leaveRoom(): void {
    if (!this.socket || !this.roomInfo) {
      return;
    }

    console.log('[NetworkSynchronizer] 离开房间:', this.roomInfo.id);
    this.socket.emit('leave_room');
    this.roomInfo = null;
  }

  /**
   * 发送烟花动作
   */
  sendFireworkAction(x: number, y: number, fireworkTypeId: string): void {
    const message: NetworkMessage = {
      type: 'firework',
      payload: { x, y, fireworkTypeId },
      timestamp: Date.now(),
    };

    if (this.connectionState === 'connected' && this.socket) {
      this.socket.emit('firework_action', message.payload);
    } else {
      // 离线时加入消息队列
      this.enqueueMessage(message);
    }
  }

  /**
   * 发送聊天消息
   */
  sendChatMessage(message: string): void {
    const networkMessage: NetworkMessage = {
      type: 'chat',
      payload: { message },
      timestamp: Date.now(),
    };

    if (this.connectionState === 'connected' && this.socket) {
      this.socket.emit('chat_message', networkMessage.payload);
    } else {
      // 离线时加入消息队列
      this.enqueueMessage(networkMessage);
    }
  }

  /**
   * 发送连击里程碑播报
   */
  sendComboMilestone(comboCount: number): void {
    if (this.connectionState === 'connected' && this.socket) {
      this.socket.emit('combo_milestone', { comboCount });
    }
  }

  /**
   * 注册烟花动作回调
   */
  onFireworkAction(callback: (action: FireworkAction) => void): () => void {
    this.fireworkActionCallbacks.add(callback);
    return () => this.fireworkActionCallbacks.delete(callback);
  }

  /**
   * 注册玩家加入回调
   */
  onPlayerJoin(callback: (player: PlayerInfo) => void): () => void {
    this.playerJoinCallbacks.add(callback);
    return () => this.playerJoinCallbacks.delete(callback);
  }

  /**
   * 注册玩家离开回调
   */
  onPlayerLeave(callback: (playerId: string) => void): () => void {
    this.playerLeaveCallbacks.add(callback);
    return () => this.playerLeaveCallbacks.delete(callback);
  }

  /**
   * 注册房间更新回调
   */
  onRoomUpdate(callback: (room: RoomInfo) => void): () => void {
    this.roomUpdateCallbacks.add(callback);
    return () => this.roomUpdateCallbacks.delete(callback);
  }

  /**
   * 注册聊天消息回调
   */
  onChatMessage(
    callback: (message: {
      playerId: string;
      playerNickname: string;
      message: string;
      timestamp: number;
    }) => void
  ): () => void {
    this.chatMessageCallbacks.add(callback);
    return () => this.chatMessageCallbacks.delete(callback);
  }

  /**
   * 注册连击里程碑回调
   */
  onComboMilestone(
    callback: (data: {
      playerId: string;
      playerNickname: string;
      comboCount: number;
      timestamp: number;
    }) => void
  ): () => void {
    this.comboMilestoneCallbacks.add(callback);
    return () => this.comboMilestoneCallbacks.delete(callback);
  }

  /**
   * 注册排行榜更新回调
   */
  onLeaderboardUpdate(
    callback: (leaderboard: PlayerInfo[]) => void
  ): () => void {
    this.leaderboardUpdateCallbacks.add(callback);
    return () => this.leaderboardUpdateCallbacks.delete(callback);
  }

  /**
   * 注册连接状态变化回调
   */
  onConnectionStateChange(
    callback: (state: ConnectionState) => void
  ): () => void {
    this.connectionStateCallbacks.add(callback);
    return () => this.connectionStateCallbacks.delete(callback);
  }

  /**
   * 注册延迟更新回调
   */
  onLatencyUpdate(callback: (latency: LatencyInfo) => void): () => void {
    this.latencyUpdateCallbacks.add(callback);
    return () => this.latencyUpdateCallbacks.delete(callback);
  }

  /**
   * 注册错误回调
   */
  onError(callback: (error: string) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * 获取当前房间信息
   */
  getRoomInfo(): RoomInfo | null {
    return this.roomInfo;
  }

  /**
   * 获取排行榜（从房间信息中提取前3名）
   */
  getLeaderboard(): PlayerInfo[] {
    if (!this.roomInfo) {
      return [];
    }

    return [...this.roomInfo.players]
      .sort((a, b) => b.fireworkCount - a.fireworkCount)
      .slice(0, 3);
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * 获取延迟信息
   */
  getLatencyInfo(): LatencyInfo {
    if (this.latencyHistory.length === 0) {
      return { current: 0, average: 0, min: 0, max: 0 };
    }

    const current = this.latencyHistory[this.latencyHistory.length - 1];
    const average =
      this.latencyHistory.reduce((sum, val) => sum + val, 0) /
      this.latencyHistory.length;
    const min = Math.min(...this.latencyHistory);
    const max = Math.max(...this.latencyHistory);

    return { current, average, min, max };
  }

  /**
   * 获取本地玩家ID
   */
  getLocalPlayerId(): string | null {
    return this.localPlayerId;
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 烟花广播
    this.socket.on('firework_broadcast', (data: FireworkAction) => {
      this.fireworkActionCallbacks.forEach((callback) => callback(data));
    });

    // 玩家加入
    this.socket.on(
      'player_joined',
      (data: { player: PlayerInfo; timestamp: number }) => {
        this.playerJoinCallbacks.forEach((callback) => callback(data.player));
      }
    );

    // 玩家离开
    this.socket.on(
      'player_left',
      (data: { socketId: string; nickname?: string; timestamp: number }) => {
        this.playerLeaveCallbacks.forEach((callback) =>
          callback(data.socketId)
        );
      }
    );

    // 玩家列表更新
    this.socket.on('player_update', (data: { players: PlayerInfo[] }) => {
      if (this.roomInfo) {
        this.roomInfo.players = data.players;
        this.roomUpdateCallbacks.forEach((callback) =>
          callback(this.roomInfo!)
        );
      }
    });

    // 聊天消息广播
    this.socket.on(
      'chat_broadcast',
      (data: {
        playerId: string;
        playerNickname: string;
        message: string;
        timestamp: number;
      }) => {
        this.chatMessageCallbacks.forEach((callback) => callback(data));
      }
    );

    // 连击里程碑广播
    this.socket.on(
      'combo_broadcast',
      (data: {
        playerId: string;
        playerNickname: string;
        comboCount: number;
        timestamp: number;
      }) => {
        this.comboMilestoneCallbacks.forEach((callback) => callback(data));
      }
    );

    // 排行榜更新
    this.socket.on(
      'leaderboard_update',
      (data: { leaderboard: PlayerInfo[]; timestamp: number }) => {
        this.leaderboardUpdateCallbacks.forEach((callback) =>
          callback(data.leaderboard)
        );
      }
    );

    // Pong响应
    this.socket.on('pong', (_data: { timestamp: number }) => {
      const latency = Date.now() - this.lastPingTime;
      this.updateLatency(latency);
    });
  }

  /**
   * 开始Ping监测
   */
  private startPingMonitoring(): void {
    this.stopPingMonitoring();

    this.pingTimer = setInterval(() => {
      if (this.socket && this.connectionState === 'connected') {
        this.lastPingTime = Date.now();
        this.socket.emit('ping');
      }
    }, this.config.pingInterval);
  }

  /**
   * 停止Ping监测
   */
  private stopPingMonitoring(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * 更新延迟信息
   */
  private updateLatency(latency: number): void {
    this.latencyHistory.push(latency);

    // 保持最近20次的延迟记录
    if (this.latencyHistory.length > 20) {
      this.latencyHistory.shift();
    }

    const latencyInfo = this.getLatencyInfo();
    this.latencyUpdateCallbacks.forEach((callback) => callback(latencyInfo));

    // 如果延迟过高，发出警告
    if (latency > 3000) {
      this.notifyError(`网络延迟过高: ${latency}ms`);
    }
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(reason: string): void {
    console.log('[NetworkSynchronizer] 处理断开连接:', reason);
    this.stopPingMonitoring();

    // 如果是服务器主动断开或网络错误，尝试重连
    if (
      reason === 'io server disconnect' ||
      reason === 'transport close' ||
      reason === 'ping timeout'
    ) {
      this.attemptReconnect();
    } else {
      this.setConnectionState('disconnected');
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[NetworkSynchronizer] 重连失败，已达到最大尝试次数');
      this.setConnectionState('failed');
      this.notifyError('连接失败，请检查网络后重试');
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState('reconnecting');

    console.log(
      `[NetworkSynchronizer] 尝试重连 (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        console.log('[NetworkSynchronizer] 重连成功');
      } catch (error) {
        console.error('[NetworkSynchronizer] 重连失败:', error);
        this.attemptReconnect();
      }
    }, this.config.reconnectInterval);
  }

  /**
   * 停止重连定时器
   */
  private stopReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 将消息加入队列
   */
  private enqueueMessage(message: NetworkMessage): void {
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      console.warn('[NetworkSynchronizer] 消息队列已满，丢弃最旧的消息');
      this.messageQueue.shift();
    }

    this.messageQueue.push(message);
    console.log(
      `[NetworkSynchronizer] 消息已加入队列 (${this.messageQueue.length}/${this.config.maxQueueSize})`
    );
  }

  /**
   * 处理消息队列
   */
  private processMessageQueue(): void {
    if (!this.socket || this.connectionState !== 'connected') {
      return;
    }

    console.log(
      `[NetworkSynchronizer] 处理消息队列 (${this.messageQueue.length} 条消息)`
    );

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (!message) continue;

      try {
        switch (message.type) {
          case 'firework':
            this.socket.emit('firework_action', message.payload);
            break;
          case 'chat':
            this.socket.emit('chat_message', message.payload);
            break;
          default:
            console.warn('[NetworkSynchronizer] 未知消息类型:', message.type);
        }
      } catch (error) {
        console.error('[NetworkSynchronizer] 处理队列消息失败:', error);
      }
    }
  }

  /**
   * 设置连接状态
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      console.log('[NetworkSynchronizer] 连接状态变更:', state);
      this.connectionStateCallbacks.forEach((callback) => callback(state));
    }
  }

  /**
   * 通知错误
   */
  private notifyError(error: string): void {
    this.errorCallbacks.forEach((callback) => callback(error));
  }
}
