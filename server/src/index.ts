import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './RoomManager.js';
import { PlayerSessionManager } from './PlayerSession.js';
import type {
  ClientInfo,
  ServerConfig,
  ConnectedMessage,
  PongMessage,
  PlayerLeftMessage,
  HealthCheckResponse,
  RoomInfo,
  PlayerInfo,
} from './types.js';

// 配置
const config: ServerConfig = {
  port: Number(process.env.PORT) || 3001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  heartbeatInterval: Number(process.env.HEARTBEAT_INTERVAL) || 25000,
  heartbeatTimeout: Number(process.env.HEARTBEAT_TIMEOUT) || 30000,
};

// 创建Express应用
const app: express.Express = express();

// 配置CORS
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// 健康检查端点
app.get('/health', (_req, res) => {
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
  };
  res.json(response);
});

// 统计信息端点
app.get('/stats', (_req, res) => {
  const roomStats = roomManager.getStats();
  const sessionStats = sessionManager.getStats();
  res.json({
    ...roomStats,
    ...sessionStats,
    connectedClients: connectedClients.size,
    timestamp: Date.now(),
  });
});

// 创建HTTP服务器
const httpServer = createServer(app);

// 创建Socket.io服务器
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    credentials: true,
  },
  // 配置心跳
  pingInterval: config.heartbeatInterval,
  pingTimeout: config.heartbeatTimeout,
  // 配置传输方式
  transports: ['websocket', 'polling'],
  // 允许升级
  allowUpgrades: true,
});

// 连接的客户端映射
const connectedClients = new Map<string, ClientInfo>();

// 创建房间管理器
const roomManager = new RoomManager();

// 创建玩家会话管理器
const sessionManager = new PlayerSessionManager();

// Socket.io连接处理
io.on('connection', (socket: Socket) => {
  console.log(`[连接] 客户端已连接: ${socket.id}`);

  // 记录客户端信息
  const clientInfo: ClientInfo = {
    socketId: socket.id,
    connectedAt: Date.now(),
    lastPingAt: Date.now(),
  };
  connectedClients.set(socket.id, clientInfo);

  // 发送连接确认
  const connectedMsg: ConnectedMessage = {
    socketId: socket.id,
    timestamp: Date.now(),
  };
  socket.emit('connected', connectedMsg);

  // 处理心跳ping
  socket.on('ping', () => {
    const client = connectedClients.get(socket.id);
    if (client) {
      client.lastPingAt = Date.now();
    }
    const pongMsg: PongMessage = { timestamp: Date.now() };
    socket.emit('pong', pongMsg);
  });

  // 处理加入房间请求
  socket.on(
    'join_room',
    (data: { nickname: string; roomType: 'public' | 'private'; code?: string }) => {
      try {
        const { nickname, roomType, code } = data;

        console.log(
          `[房间] 玩家 ${nickname} (${socket.id}) 请求加入${roomType === 'public' ? '公共' : '私人'}房间${
            code ? ` (房间码: ${code})` : ''
          }`
        );

        // 创建玩家会话（处理昵称重复）
        const session = sessionManager.createSession(socket.id, nickname);
        const uniqueNickname = session.nickname;

        let room;

        if (roomType === 'public') {
          // 公共房间：查找可用房间或创建新房间
          room = roomManager.findAvailablePublicRoom();
          if (!room) {
            room = roomManager.createRoom('public');
          }
        } else if (roomType === 'private') {
          // 私人房间：通过房间码查找或创建新房间
          if (code) {
            // 查找现有私人房间，如果不存在则自动创建
            room = roomManager.findRoomByCode(code);
            if (!room) {
              // 自动创建指定房间码的私人房间
              room = roomManager.createRoomWithCode(code);
              console.log(`[房间] 自动创建私人房间，房间码: ${code}`);
            }
          } else {
            // 创建新私人房间（随机房间码）
            room = roomManager.createRoom('private');
          }
        } else {
          sessionManager.deleteSession(socket.id);
          socket.emit('join_room_error', {
            error: 'invalid_room_type',
            message: '无效的房间类型',
          });
          return;
        }

        // 检查房间是否已满
        if (roomManager.isRoomFull(room.id)) {
          sessionManager.deleteSession(socket.id);
          socket.emit('join_room_error', {
            error: 'room_full',
            message: '房间已满，无法加入',
          });
          return;
        }

        // 创建玩家信息（使用唯一昵称）
        const player: PlayerInfo = {
          id: socket.id,
          nickname: uniqueNickname,
          fireworkCount: 0,
          lastActionTime: Date.now(),
        };

        // 添加玩家到房间
        const success = roomManager.addPlayerToRoom(room.id, player);
        if (!success) {
          sessionManager.deleteSession(socket.id);
          socket.emit('join_room_error', {
            error: 'failed_to_join',
            message: '加入房间失败，请重试',
          });
          return;
        }

        // 更新会话房间信息
        sessionManager.updateSessionRoom(socket.id, room.id);

        // 更新客户端信息
        const client = connectedClients.get(socket.id);
        if (client) {
          client.nickname = uniqueNickname;
          client.roomId = room.id;
        }

        // 加入Socket.io房间
        socket.join(room.id);

        // 构造房间信息（转换Map为数组）
        const roomInfo: RoomInfo = {
          id: room.id,
          type: room.type,
          code: room.code,
          players: Array.from(room.players.values()),
          maxPlayers: room.maxPlayers,
          createdAt: room.createdAt,
        };

        // 发送加入成功消息给当前玩家
        socket.emit('room_joined', {
          roomInfo,
          playerId: socket.id,
        });

        // 通知房间内其他玩家
        socket.to(room.id).emit('player_joined', {
          player,
          timestamp: Date.now(),
        });

        // 广播更新后的玩家列表
        io.to(room.id).emit('player_update', {
          players: Array.from(room.players.values()),
        });

        // 计算并广播排行榜（TOP3玩家）
        const leaderboard = roomManager.getLeaderboard(room.id);
        io.to(room.id).emit('leaderboard_update', {
          leaderboard,
          timestamp: Date.now(),
        });

        console.log(
          `[房间] 玩家 ${uniqueNickname} (${socket.id}) 成功加入房间 ${room.id} (${room.players.size}/${room.maxPlayers})`
        );
      } catch (error) {
        console.error(`[房间] 加入房间错误:`, error);
        sessionManager.deleteSession(socket.id);
        socket.emit('join_room_error', {
          error: 'internal_error',
          message: '服务器内部错误，请重试',
        });
      }
    }
  );

  // 处理离开房间请求
  socket.on('leave_room', () => {
    const client = connectedClients.get(socket.id);
    const session = sessionManager.getSession(socket.id);
    
    if (!client || !client.roomId) {
      return;
    }

    const roomId = client.roomId;
    const room = roomManager.getRoom(roomId);

    // 从房间移除玩家
    roomManager.removePlayerFromRoom(roomId, socket.id);

    // 更新会话房间信息
    sessionManager.updateSessionRoom(socket.id, null);

    // 离开Socket.io房间
    socket.leave(roomId);

    // 清除客户端房间信息
    client.roomId = undefined;

    // 通知房间内其他玩家
    socket.to(roomId).emit('player_left', {
      socketId: socket.id,
      nickname: session?.nickname || client.nickname,
      timestamp: Date.now(),
    });

    // 广播更新后的玩家列表
    if (room) {
      io.to(roomId).emit('player_update', {
        players: Array.from(room.players.values()),
      });

      // 计算并广播排行榜（TOP3玩家）
      const leaderboard = roomManager.getLeaderboard(roomId);
      io.to(roomId).emit('leaderboard_update', {
        leaderboard,
        timestamp: Date.now(),
      });
    }

    console.log(`[房间] 玩家 ${session?.nickname || client.nickname} (${socket.id}) 离开房间 ${roomId}`);
  });

  // 处理烟花动作
  socket.on(
    'firework_action',
    (data: { x: number; y: number; fireworkTypeId: string }) => {
      const client = connectedClients.get(socket.id);
      const session = sessionManager.getSession(socket.id);
      
      if (!client || !client.roomId) {
        return;
      }

      const room = roomManager.getRoom(client.roomId);
      if (!room) {
        return;
      }

      // 更新玩家烟花计数
      const player = room.players.get(socket.id);
      if (player) {
        player.fireworkCount++;
        player.lastActionTime = Date.now();
      }

      // 更新会话活动时间
      sessionManager.updateSessionActivity(socket.id);

      // 更新房间活动时间
      roomManager.updateRoomActivity(client.roomId);

      // 广播烟花动作到房间内所有玩家
      io.to(client.roomId).emit('firework_broadcast', {
        playerId: socket.id,
        playerNickname: session?.nickname || client.nickname || 'Unknown',
        x: data.x,
        y: data.y,
        fireworkTypeId: data.fireworkTypeId,
        timestamp: Date.now(),
      });

      // 广播更新后的玩家列表（包含新的烟花计数）
      io.to(client.roomId).emit('player_update', {
        players: Array.from(room.players.values()),
      });

      // 计算并广播排行榜（TOP3玩家）
      const leaderboard = roomManager.getLeaderboard(client.roomId);
      io.to(client.roomId).emit('leaderboard_update', {
        leaderboard,
        timestamp: Date.now(),
      });
    }
  );

  // 处理聊天消息
  socket.on('chat_message', (data: { message: string }) => {
    const client = connectedClients.get(socket.id);
    const session = sessionManager.getSession(socket.id);
    
    if (!client || !client.roomId) {
      return;
    }

    // 更新会话活动时间
    sessionManager.updateSessionActivity(socket.id);

    // 广播聊天消息到房间内所有玩家
    io.to(client.roomId).emit('chat_broadcast', {
      playerId: socket.id,
      playerNickname: session?.nickname || client.nickname || 'Unknown',
      message: data.message,
      timestamp: Date.now(),
    });

    console.log(`[聊天] ${session?.nickname || client.nickname} (${socket.id}): ${data.message}`);
  });

  // 处理连击播报
  socket.on('combo_milestone', (data: { comboCount: number }) => {
    const client = connectedClients.get(socket.id);
    const session = sessionManager.getSession(socket.id);
    
    if (!client || !client.roomId) {
      return;
    }

    // 广播连击播报到房间内所有玩家
    io.to(client.roomId).emit('combo_broadcast', {
      playerId: socket.id,
      playerNickname: session?.nickname || client.nickname || 'Unknown',
      comboCount: data.comboCount,
      timestamp: Date.now(),
    });

    console.log(`[连击] ${session?.nickname || client.nickname} (${socket.id}) 达成 ${data.comboCount} 连击`);
  });

  // 处理断开连接
  socket.on('disconnect', (reason: string) => {
    console.log(`[断开] 客户端已断开: ${socket.id}, 原因: ${reason}`);

    const client = connectedClients.get(socket.id);
    const session = sessionManager.getSession(socket.id);
    
    if (client) {
      // 如果客户端在房间中，需要通知其他玩家并清理
      if (client.roomId) {
        const room = roomManager.getRoom(client.roomId);
        
        // 从房间移除玩家
        roomManager.removePlayerFromRoom(client.roomId, socket.id);

        const leftMsg: PlayerLeftMessage = {
          socketId: socket.id,
          nickname: session?.nickname || client.nickname,
          timestamp: Date.now(),
        };
        socket.to(client.roomId).emit('player_left', leftMsg);

        // 广播更新后的玩家列表
        if (room) {
          io.to(client.roomId).emit('player_update', {
            players: Array.from(room.players.values()),
          });

          // 计算并广播排行榜（TOP3玩家）
          const leaderboard = roomManager.getLeaderboard(client.roomId);
          io.to(client.roomId).emit('leaderboard_update', {
            leaderboard,
            timestamp: Date.now(),
          });
        }
      }

      // 移除客户端信息
      connectedClients.delete(socket.id);
    }

    // 删除会话
    sessionManager.deleteSession(socket.id);

    console.log(`[统计] 当前连接数: ${connectedClients.size}`);
  });

  // 处理连接错误
  socket.on('error', (error) => {
    console.error(`[错误] Socket错误 (${socket.id}):`, error);
  });

  // 统计信息
  console.log(`[统计] 当前连接数: ${connectedClients.size}`);
});

// 定期清理超时的连接
setInterval(() => {
  const now = Date.now();
  const timeout = config.heartbeatTimeout + 5000; // 额外5秒容错

  for (const [socketId, client] of connectedClients.entries()) {
    if (now - client.lastPingAt > timeout) {
      console.log(`[清理] 清理超时连接: ${socketId}`);
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
      connectedClients.delete(socketId);
    }
  }
}, config.heartbeatInterval);

// 启动服务器
httpServer.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎆 新年烟花游戏 WebSocket 服务器                          ║
║                                                            ║
║   服务器地址: http://localhost:${config.port}                      ║
║   WebSocket: ws://localhost:${config.port}                        ║
║   CORS允许: ${config.corsOrigin}                                  ║
║                                                            ║
║   心跳间隔: ${config.heartbeatInterval}ms                         ║
║   心跳超时: ${config.heartbeatTimeout}ms                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('[关闭] 收到SIGTERM信号，开始优雅关闭...');
  sessionManager.destroy();
  roomManager.destroy();
  httpServer.close(() => {
    console.log('[关闭] HTTP服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[关闭] 收到SIGINT信号，开始优雅关闭...');
  sessionManager.destroy();
  roomManager.destroy();
  httpServer.close(() => {
    console.log('[关闭] HTTP服务器已关闭');
    process.exit(0);
  });
});

// 导出服务器实例（用于测试）
export { io, httpServer, app, roomManager, sessionManager };
