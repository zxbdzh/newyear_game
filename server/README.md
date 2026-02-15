# 新年烟花游戏 - WebSocket 服务器

这是新年烟花游戏的后端WebSocket服务器，使用Node.js + Express + Socket.io构建。

## 功能特性

- ✅ WebSocket实时通信（Socket.io）
- ✅ 心跳机制（ping/pong）
- ✅ 连接管理和超时清理
- ✅ CORS配置
- ✅ 健康检查端点
- ✅ 统计信息端点
- ✅ 优雅关闭
- ✅ 房间管理系统
  - 公共房间（自动匹配，最多20人）
  - 私人房间（4位数字房间码）
  - 房间容量限制
  - 空房间自动清理（30分钟无活动）
- ✅ 玩家会话管理
- ✅ 烟花动作实时同步
- ✅ 聊天消息广播
- ✅ 连击里程碑播报（10, 50, 100, 200连击）
- 🚧 排行榜计算（待实现）

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express 4.18.2
- **WebSocket**: Socket.io 4.8.3
- **语言**: TypeScript 5.3.3
- **开发工具**: tsx 4.7.0 (TypeScript执行器)
- **CORS**: cors 2.8.5

## 安装依赖

```bash
# 进入server目录
cd server

# 使用pnpm安装（推荐）
pnpm install

# 或使用npm
npm install
```

## 开发

```bash
# 开发模式（自动重启）
pnpm dev

# 或
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

## 构建

```bash
# 编译TypeScript
pnpm build

# 或
npm run build
```

编译后的文件将输出到 `dist/` 目录。

## 生产运行

```bash
# 先构建
pnpm build

# 运行编译后的代码
pnpm start

# 或
npm start
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

可配置的环境变量：

- `PORT`: 服务器端口（默认: 3001）
- `CORS_ORIGIN`: CORS允许的源（默认: http://localhost:5173）
- `HEARTBEAT_INTERVAL`: 心跳间隔（毫秒，默认: 25000）
- `HEARTBEAT_TIMEOUT`: 心跳超时（毫秒，默认: 30000）

## API端点

### HTTP端点

- `GET /health` - 健康检查
  ```json
  {
    "status": "ok",
    "timestamp": 1234567890,
    "uptime": 123.456
  }
  ```

- `GET /stats` - 服务器统计信息
  ```json
  {
    "totalRooms": 5,
    "publicRooms": 3,
    "privateRooms": 2,
    "totalPlayers": 15,
    "connectedClients": 15,
    "timestamp": 1234567890
  }
  ```

### WebSocket事件

#### 客户端 → 服务器

- `ping` - 心跳ping

- `join_room` - 加入房间
  ```typescript
  {
    nickname: string;        // 玩家昵称（1-8字符）
    roomType: 'public' | 'private';
    code?: string;          // 私人房间码（可选）
                            // - 提供房间码：加入或自动创建指定房间码的房间
                            // - 不提供房间码：创建新的随机房间码房间
  }
  ```

- `leave_room` - 离开房间

- `firework_action` - 烟花动作
  ```typescript
  {
    x: number;              // X坐标
    y: number;              // Y坐标
    fireworkTypeId: string; // 烟花类型ID
  }
  ```

- `chat_message` - 聊天消息
  ```typescript
  {
    message: string;        // 消息内容
  }
  ```

- `combo_milestone` - 连击里程碑播报
  ```typescript
  {
    comboCount: number;     // 连击数（10, 50, 100, 200等）
  }
  ```

#### 服务器 → 客户端

- `connected` - 连接确认
  ```json
  {
    "socketId": "abc123",
    "timestamp": 1234567890
  }
  ```

- `pong` - 心跳响应
  ```json
  {
    "timestamp": 1234567890
  }
  ```

- `room_joined` - 成功加入房间
  ```typescript
  {
    roomInfo: {
      id: string;
      type: 'public' | 'private';
      code?: string;
      players: PlayerInfo[];
      maxPlayers: number;
      createdAt: number;
    };
    playerId: string;
  }
  ```

- `join_room_error` - 加入房间失败
  ```typescript
  {
    error: 'room_not_found' | 'room_full' | 'invalid_room_type' | 'failed_to_join' | 'internal_error';
    message: string;
  }
  ```

- `player_joined` - 新玩家加入
  ```typescript
  {
    player: PlayerInfo;
    timestamp: number;
  }
  ```

- `player_left` - 玩家离开
  ```json
  {
    "socketId": "abc123",
    "nickname": "玩家昵称",
    "timestamp": 1234567890
  }
  ```

- `player_update` - 玩家列表更新
  ```typescript
  {
    players: PlayerInfo[];  // 房间内所有玩家
  }
  ```

- `firework_broadcast` - 烟花动作广播
  ```typescript
  {
    playerId: string;
    playerNickname: string;
    x: number;
    y: number;
    fireworkTypeId: string;
    timestamp: number;
  }
  ```

- `chat_broadcast` - 聊天消息广播
  ```typescript
  {
    playerId: string;
    playerNickname: string;
    message: string;
    timestamp: number;
  }
  ```

- `combo_broadcast` - 连击里程碑广播
  ```typescript
  {
    playerId: string;
    playerNickname: string;
    comboCount: number;     // 连击数
    timestamp: number;
  }
  ```

## 架构设计

### 房间管理系统

`RoomManager` 类负责管理所有游戏房间：

```typescript
interface RoomData {
  id: string;
  type: 'public' | 'private';
  code?: string;              // 私人房间的4位数字码
  players: Map<string, PlayerInfo>;
  maxPlayers: number;         // 最多20人
  createdAt: number;
  lastActivityAt: number;
}
```

**功能特性：**
- 公共房间自动匹配（查找可用房间或创建新房间）
- 私人房间通过4位数字房间码（1000-9999）
  - 提供房间码：自动加入或创建指定房间码的房间（如果不存在）
  - 不提供房间码：创建新的随机房间码房间
- 房间容量限制（最多20人）
- 空房间自动清理（30分钟无活动，每5分钟检查一次）

### 连接管理

服务器维护一个 `Map<socketId, ClientInfo>` 来跟踪所有连接的客户端：

```typescript
interface ClientInfo {
  socketId: string;
  connectedAt: number;
  lastPingAt: number;
  nickname?: string;
  roomId?: string;
}
```

### 玩家信息

```typescript
interface PlayerInfo {
  id: string;                 // Socket ID
  nickname: string;           // 玩家昵称
  fireworkCount: number;      // 烟花计数
  lastActionTime: number;     // 最后活动时间
}
```

### 心跳机制

- 服务器每25秒发送一次ping
- 客户端应在30秒内响应
- 超时连接将被自动清理

### 优雅关闭

服务器监听 `SIGTERM` 和 `SIGINT` 信号，确保优雅关闭：

1. 停止接受新连接
2. 关闭现有连接
3. 退出进程

## 开发计划

### 已完成 ✅

- [x] 基础服务器搭建
- [x] WebSocket连接处理
- [x] 心跳机制
- [x] CORS配置
- [x] 健康检查端点
- [x] 统计信息端点
- [x] 连接超时清理
- [x] 优雅关闭
- [x] 房间管理系统（RoomManager）
  - [x] 公共房间创建和匹配
  - [x] 私人房间创建和房间码生成
  - [x] 房间容量限制（最多20人）
  - [x] 空房间自动清理（30分钟无活动）
- [x] 玩家会话管理
- [x] 烟花动作实时同步
- [x] 聊天消息广播
- [x] 连击里程碑播报系统

### 待实现 🚧

- [ ] 排行榜计算和广播
- [ ] 昵称重复处理（自动后缀数字）
- [ ] Redis适配器（多服务器实例支持）
- [ ] 性能监控和日志

## 测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch
```

测试覆盖：
- ✅ RoomManager单元测试
  - 房间创建（公共/私人）
  - 房间查找（房间码/可用公共房间）
  - 玩家管理（添加/移除）
  - 房间容量限制
  - 空房间自动清理
  - 统计信息

## 部署

### Docker部署（推荐）

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### 直接部署

1. 构建项目：`pnpm build`
2. 上传 `dist/` 和 `package.json` 到服务器
3. 安装生产依赖：`npm ci --only=production`
4. 配置环境变量
5. 使用PM2或systemd运行：`node dist/index.js`

## 监控

建议使用以下工具进行监控：

- **PM2**: 进程管理和监控
- **Winston/Pino**: 日志记录
- **Sentry**: 错误追踪
- **Prometheus**: 指标收集

## 许可证

MIT
