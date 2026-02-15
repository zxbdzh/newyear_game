# 服务层

## 概述

服务层提供跨组件的共享服务，包括音频控制、存储管理、主题管理、网络同步等核心功能。

## 服务列表

### ThemeManager（主题管理器）
**文件**: `ThemeManager.ts`

**功能**:
- 应用主题到DOM（通过CSS变量）
- 读取当前应用的主题颜色
- 动态生成主题背景渐变

**API**:
```typescript
class ThemeManager {
  /**
   * 应用主题到DOM
   * @param theme - 主题配置对象
   */
  applyTheme(theme: Theme): void;
  
  /**
   * 获取当前应用的主题颜色
   * @returns 主题颜色对象
   */
  getCurrentThemeColors(): { 
    primary: string; 
    secondary: string; 
    accent: string 
  };
}
```

**需求**: 1.1, 1.2（settings-ui-fixes spec）

**设计原则**:
- 轻量级：无状态管理，只负责CSS变量操作
- 单一职责：专注于主题应用，不处理主题列表或持久化
- 简单直接：直接操作DOM，无复杂逻辑
- 动态渐变：根据主题主色自动生成背景渐变

**使用示例**:
```typescript
import { ThemeManager } from '@/services/ThemeManager';

const themeManager = new ThemeManager();

// 应用主题
themeManager.applyTheme({
  id: 'new-year-dinner',
  name: '年夜饭场景',
  primaryColor: '#D32F2F',
  secondaryColor: '#FFD700',
  accentColor: '#FF6B6B',
  backgroundImage: '/themes/new-year-dinner.jpg'
});

// 读取当前颜色
const colors = themeManager.getCurrentThemeColors();
```

**CSS变量**:
- `--color-primary`: 主色
- `--color-secondary`: 次色
- `--color-accent`: 强调色
- `--color-bg-primary`: 主题背景渐变（自动生成）
- `--bg-image`: 背景图片（可选）

**背景渐变生成**:
ThemeManager会根据主题的主色自动生成背景渐变：
```typescript
// 生成135度对角线渐变，透明度从15%到50%
const bgGradient = `linear-gradient(135deg, ${theme.primaryColor}15 0%, ${theme.primaryColor}30 50%, ${theme.primaryColor}50 100%)`;
```

这个渐变可以在任何组件中使用：
```css
.my-component {
  background: var(--color-bg-primary);
}
```

### AudioController（音频控制器）
**文件**: `AudioController.ts`

**功能**:
- 背景音乐播放和控制
- 音效管理
- 音量控制
- 静音切换
- 配置持久化

**需求**: 1.4, 3.3, 3.4, 6.2, 6.3, 6.4

**特性**:
- 使用Web Audio API
- 独立的音乐和音效增益节点
- 防止重复播放（isMusicPlaying标志）
- 浏览器自动播放限制处理
- 合成音效（发射音、爆炸音）

### StorageService（存储服务）
**文件**: `StorageService.ts`

**功能**:
- IndexedDB数据持久化
- 用户数据保存和加载
- 存储配额错误处理
- 旧数据清理

**需求**: 4.4, 4.5

### NetworkSynchronizer（网络同步器）
**文件**: `NetworkSynchronizer.ts`

**功能**:
- WebSocket连接管理
- 房间操作（加入/离开）
- 烟花动作同步
- 排行榜功能
- 消息队列和重试机制

**需求**: 5.2, 5.3, 5.4, 5.6, 5.8

### PerformanceOptimizer（性能优化器）
**文件**: `PerformanceOptimizer.ts`

**功能**:
- 设备性能检测
- 性能配置管理（低/中/高）
- FPS监控
- 动态质量调整

**需求**: 10.1, 10.5

### StatisticsTracker（统计追踪器）
**文件**: `StatisticsTracker.ts`

**功能**:
- 游戏数据记录
- 里程碑检测
- 成就解锁
- 数据持久化

**需求**: 4.2, 4.3, 4.4, 4.5

### NetworkErrorHandler（网络错误处理器）
**文件**: `NetworkErrorHandler.ts`

**功能**:
- 断线检测和提示
- 自动重连逻辑
- 高延迟警告
- 优雅降级

**需求**: 5.8, 11.1, 11.2, 11.3, 11.4, 11.5

## 架构设计

### 服务层职责
1. **业务逻辑封装**：将复杂的业务逻辑封装在服务中
2. **状态管理分离**：服务不直接管理应用状态，通过Redux集成
3. **可复用性**：服务可在多个组件中复用
4. **单一职责**：每个服务专注于一个特定领域

### 服务与Redux集成
```typescript
// 服务提供功能，Redux管理状态
const audioController = new AudioController();

// 在组件中使用
const isMuted = useAppSelector(state => state.audio.musicMuted);

const handleToggleMute = () => {
  audioController.setMusicMuted(!isMuted);
  dispatch(toggleMusicMute());
};
```

### 服务生命周期
```typescript
// 在组件中创建和清理服务
useEffect(() => {
  const service = new SomeService();
  
  // 初始化
  service.initialize();
  
  return () => {
    // 清理
    service.destroy();
  };
}, []);
```

## 测试策略

### 单元测试
每个服务都应有对应的单元测试：
- `ThemeManager.test.ts`
- `AudioController.test.ts`
- `StorageService.test.ts`
- 等等

### 测试重点
1. **核心功能**：测试主要API方法
2. **错误处理**：测试异常情况
3. **边界条件**：测试边界值
4. **集成点**：测试与其他模块的集成

## 最佳实践

### 1. 依赖注入
```typescript
// 通过构造函数注入依赖
class ThemeManager {
  constructor(private storageService?: StorageService) {}
}
```

### 2. 错误处理
```typescript
async loadData(): Promise<Data> {
  try {
    return await this.storage.load();
  } catch (error) {
    console.error('Failed to load:', error);
    return this.getDefaultData();
  }
}
```

### 3. 资源清理
```typescript
destroy(): void {
  // 清理所有资源
  this.stopAllSounds();
  this.closeConnections();
  this.clearTimers();
}
```

### 4. 日志记录
```typescript
applyTheme(theme: Theme): void {
  console.log('[ThemeManager] Applied theme:', theme.id);
  // 实现
}
```

## 未来改进

### 短期
1. 为所有服务添加完整的单元测试
2. 统一错误处理机制
3. 添加服务健康检查

### 长期
1. 实现服务依赖注入容器
2. 添加服务监控和日志系统
3. 支持服务热重载
