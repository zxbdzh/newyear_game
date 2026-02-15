/**
 * 房间管理器
 * 负责创建、管理和清理游戏房间
 */

/**
 * 玩家信息接口
 */
export interface PlayerInfo {
  id: string;
  nickname: string;
  fireworkCount: number;
  lastActionTime: number;
}

/**
 * 房间数据接口
 */
export interface RoomData {
  id: string;
  type: 'public' | 'private';
  code?: string;
  players: Map<string, PlayerInfo>;
  maxPlayers: number;
  createdAt: number;
  lastActivityAt: number;
}

/**
 * 房间管理器类
 */
export class RoomManager {
  private rooms: Map<string, RoomData> = new Map();
  private roomCodeToId: Map<string, string> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_TIMEOUT = 30 * 60 * 1000; // 30分钟
  private readonly MAX_PLAYERS = 20;

  constructor() {
    // 启动自动清理定时器
    this.startCleanupTimer();
  }

  /**
   * 创建房间
   * @param type 房间类型（公共或私人）
   * @returns 创建的房间数据
   */
  createRoom(type: 'public' | 'private'): RoomData {
    const room: RoomData = {
      id: this.generateRoomId(),
      type,
      code: type === 'private' ? this.generateRoomCode() : undefined,
      players: new Map(),
      maxPlayers: this.MAX_PLAYERS,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };

    this.rooms.set(room.id, room);

    // 如果是私人房间，建立房间码到房间ID的映射
    if (room.code) {
      this.roomCodeToId.set(room.code, room.id);
    }

    console.log(
      `[房间管理] 创建${type === 'public' ? '公共' : '私人'}房间: ${room.id}${
        room.code ? ` (房间码: ${room.code})` : ''
      }`
    );

    return room;
  }

  /**
   * 创建指定房间码的私人房间
   * @param code 4位数字房间码
   * @returns 创建的房间数据
   */
  createRoomWithCode(code: string): RoomData {
    const room: RoomData = {
      id: this.generateRoomId(),
      type: 'private',
      code,
      players: new Map(),
      maxPlayers: this.MAX_PLAYERS,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };

    this.rooms.set(room.id, room);
    this.roomCodeToId.set(code, room.id);

    console.log(
      `[房间管理] 创建私人房间: ${room.id} (房间码: ${room.code})`
    );

    return room;
  }

  /**
   * 通过房间码查找房间
   * @param code 4位数字房间码
   * @returns 房间数据或null
   */
  findRoomByCode(code: string): RoomData | null {
    const roomId = this.roomCodeToId.get(code);
    if (!roomId) {
      return null;
    }
    return this.rooms.get(roomId) || null;
  }

  /**
   * 查找可用的公共房间（未满且有空位）
   * @returns 房间数据或null
   */
  findAvailablePublicRoom(): RoomData | null {
    for (const room of this.rooms.values()) {
      if (room.type === 'public' && room.players.size < room.maxPlayers) {
        return room;
      }
    }
    return null;
  }

  /**
   * 获取房间
   * @param roomId 房间ID
   * @returns 房间数据或null
   */
  getRoom(roomId: string): RoomData | null {
    return this.rooms.get(roomId) || null;
  }

  /**
   * 添加玩家到房间
   * @param roomId 房间ID
   * @param player 玩家信息
   * @returns 是否成功添加
   */
  addPlayerToRoom(roomId: string, player: PlayerInfo): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      console.error(`[房间管理] 房间不存在: ${roomId}`);
      return false;
    }

    // 检查房间是否已满
    if (room.players.size >= room.maxPlayers) {
      console.warn(`[房间管理] 房间已满: ${roomId} (${room.players.size}/${room.maxPlayers})`);
      return false;
    }

    // 添加玩家
    room.players.set(player.id, player);
    room.lastActivityAt = Date.now();

    console.log(
      `[房间管理] 玩家 ${player.nickname} (${player.id}) 加入房间 ${roomId} (${room.players.size}/${room.maxPlayers})`
    );

    return true;
  }

  /**
   * 从房间移除玩家
   * @param roomId 房间ID
   * @param playerId 玩家ID
   * @returns 是否成功移除
   */
  removePlayerFromRoom(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    const removed = room.players.delete(playerId);
    if (removed) {
      room.lastActivityAt = Date.now();
      console.log(
        `[房间管理] 玩家 ${playerId} 离开房间 ${roomId} (剩余: ${room.players.size}/${room.maxPlayers})`
      );
    }

    return removed;
  }

  /**
   * 更新房间活动时间
   * @param roomId 房间ID
   */
  updateRoomActivity(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.lastActivityAt = Date.now();
    }
  }

  /**
   * 检查房间是否已满
   * @param roomId 房间ID
   * @returns 是否已满
   */
  isRoomFull(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return true; // 房间不存在视为已满
    }
    return room.players.size >= room.maxPlayers;
  }

  /**
   * 获取房间玩家列表
   * @param roomId 房间ID
   * @returns 玩家信息数组
   */
  getRoomPlayers(roomId: string): PlayerInfo[] {
    const room = this.rooms.get(roomId);
    if (!room) {
      return [];
    }
    return Array.from(room.players.values());
  }

  /**
   * 删除房间
   * @param roomId 房间ID
   */
  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    // 如果是私人房间，删除房间码映射
    if (room.code) {
      this.roomCodeToId.delete(room.code);
    }

    this.rooms.delete(roomId);
    console.log(`[房间管理] 删除房间: ${roomId}`);
  }

  /**
   * 清理空房间（30分钟无活动）
   */
  cleanupEmptyRooms(): void {
    const now = Date.now();
    const roomsToDelete: string[] = [];

    for (const [roomId, room] of this.rooms) {
      // 如果房间为空且超过30分钟无活动，标记为删除
      if (room.players.size === 0 && now - room.lastActivityAt > this.CLEANUP_TIMEOUT) {
        roomsToDelete.push(roomId);
      }
    }

    // 删除标记的房间
    for (const roomId of roomsToDelete) {
      this.deleteRoom(roomId);
    }

    if (roomsToDelete.length > 0) {
      console.log(`[房间管理] 清理了 ${roomsToDelete.length} 个空房间`);
    }
  }

  /**
   * 启动自动清理定时器
   */
  private startCleanupTimer(): void {
    // 每5分钟检查一次
    this.cleanupInterval = setInterval(() => {
      this.cleanupEmptyRooms();
    }, 5 * 60 * 1000);

    console.log('[房间管理] 自动清理定时器已启动（每5分钟检查一次）');
  }

  /**
   * 停止自动清理定时器
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[房间管理] 自动清理定时器已停止');
    }
  }

  /**
   * 生成唯一的房间ID
   * @returns 房间ID
   */
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 生成4位数字房间码
   * @returns 房间码
   */
  private generateRoomCode(): string {
    let code: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      // 生成1000-9999之间的随机数
      code = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;

      // 防止无限循环
      if (attempts >= maxAttempts) {
        throw new Error('无法生成唯一的房间码，请稍后重试');
      }
    } while (this.roomCodeToId.has(code));

    return code;
  }

  /**
   * 获取房间排行榜（TOP3玩家）
   * @param roomId 房间ID
   * @returns TOP3玩家数组，按烟花数量降序排列
   */
  getLeaderboard(roomId: string): PlayerInfo[] {
    const room = this.rooms.get(roomId);
    if (!room) {
      return [];
    }

    // 将玩家转换为数组并按烟花数量降序排序
    const sortedPlayers = Array.from(room.players.values()).sort(
      (a, b) => b.fireworkCount - a.fireworkCount
    );

    // 返回前3名
    return sortedPlayers.slice(0, 3);
  }

  /**
   * 获取统计信息
   * @returns 统计信息对象
   */
  getStats(): {
    totalRooms: number;
    publicRooms: number;
    privateRooms: number;
    totalPlayers: number;
  } {
    let publicRooms = 0;
    let privateRooms = 0;
    let totalPlayers = 0;

    for (const room of this.rooms.values()) {
      if (room.type === 'public') {
        publicRooms++;
      } else {
        privateRooms++;
      }
      totalPlayers += room.players.size;
    }

    return {
      totalRooms: this.rooms.size,
      publicRooms,
      privateRooms,
      totalPlayers,
    };
  }

  /**
   * 销毁房间管理器
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.rooms.clear();
    this.roomCodeToId.clear();
    console.log('[房间管理] 房间管理器已销毁');
  }
}
