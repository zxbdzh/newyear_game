# 游戏界面组件

## 概述

本目录包含游戏的核心界面组件，包括启动界面、模式选择和倒计时显示。

## 组件列表

### LaunchScreen（启动界面）
**文件**: `LaunchScreen.tsx`, `LaunchScreen.css`

**功能**:
- 新年主题背景（红灯笼、对联装饰）
- 飘雪动画效果（50个雪花）
- "点击开始"按钮
- 网络状态检测显示
- 音频解锁支持（处理浏览器自动播放限制）

**Props**:
- `onStart: () => void` - 点击开始的回调
- `onAudioUnlock?: () => void` - 音频解锁回调（可选）

**需求**: 1.1, 1.2, 1.4

### ModeSelection（模式选择）
**文件**: `ModeSelection.tsx`, `ModeSelection.css`

**功能**:
- 单人模式和多人模式选择卡片
- 模式选择动画和交互效果
- 静音按钮（切换音乐播放状态）
- 网络状态感知（离线时禁用多人模式）

**Props**:
- `onSelectMode: (mode: GameMode) => void` - 选择模式的回调
- `onToggleMute: () => void` - 切换静音的回调
- `isMuted: boolean` - 当前静音状态
- `isOnline?: boolean` - 是否在线（默认true）

**需求**: 1.3, 1.5, 1.6

## 属性测试

### Property 2: 模式选择状态转换
**文件**: `ModeSelection.pbt.test.ts`

**测试内容**:
- 模式选择状态转换正确性
- 多次模式选择的状态一致性
- 模式选择到游戏状态的映射
- 在线/离线状态下的模式选择
- 模式选择的幂等性

**测试结果**: ✅ 5个测试全部通过（100次迭代）

## 使用示例

```tsx
import { LaunchScreen } from './components/LaunchScreen';
import { ModeSelection } from './components/ModeSelection';
import { CountdownDisplay } from './components/CountdownDisplay';
import { CountdownEngine } from './engines/CountdownEngine';

// 启动界面
<LaunchScreen 
  onStart={() => setHasStarted(true)} 
  onAudioUnlock={() => audioController.resumeContext()}
/>

// 模式选择
<ModeSelection
  onSelectMode={(mode) => dispatch(setMode(mode))}
  onToggleMute={() => dispatch(toggleMusicMute())}
  isMuted={isMusicMuted}
  isOnline={navigator.onLine}
/>

// 倒计时显示
const countdownEngine = new CountdownEngine({
  targetDate: CountdownEngine.getNextLunarNewYear(),
  timezone: 'Asia/Shanghai',
  manualOffset: 0
});

<CountdownDisplay 
  engine={countdownEngine}
  onCountdownZero={() => handleNewYearCelebration()}
/>
```

## 集成说明

这些组件已集成到 `App.tsx` 中，展示了完整的用户流程：
1. 启动界面 → 2. 模式选择 → 3. 游戏界面（占位符）

## 响应式设计

两个组件都支持响应式设计：
- **桌面**: 完整的装饰元素和动画
- **平板** (≤768px): 简化的装饰，调整字体大小
- **手机** (≤480px): 最小化装饰，优化触摸交互

## 测试命令

```bash
# 运行属性测试
pnpm test ModeSelection.pbt --run

# 运行所有测试
pnpm test --run
```

### CountdownDisplay（倒计时显示）
**文件**: `CountdownDisplay.tsx`, `CountdownDisplay.css`

**功能**:
- 3D文字渲染效果（使用CSS transform和text-shadow）
- 实时显示距离农历新年的剩余时间（天/小时/分钟/秒）
- 少于1小时时的特殊效果（闪烁、红色光晕）
- 手动时间校准功能（偏移调整）
- 倒计时归零触发回调

**Props**:
- `engine: CountdownEngine` - 倒计时引擎实例
- `onCountdownZero?: () => void` - 倒计时归零时的回调（可选）

**需求**: 2.1, 2.3, 2.5

**特性**:
- 3D浮动动画效果
- 紧急状态视觉反馈（红色闪烁）
- 响应式设计（适配移动设备）
- 校准对话框（支持正负偏移）

**使用示例**:
```tsx
import { CountdownDisplay } from './components/CountdownDisplay';
import { CountdownEngine } from './engines/CountdownEngine';

// 创建倒计时引擎实例
const countdownEngine = useMemo(() => {
  const targetDate = CountdownEngine.getNextLunarNewYear();
  return new CountdownEngine({
    targetDate,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    manualOffset: 0,
  });
}, []);

// 使用组件
<CountdownDisplay 
  engine={countdownEngine}
  onCountdownZero={() => {
    console.log('新年到了！');
    dispatch(setMode('ended'));
  }}
/>
```

**音频控制器增强**:

AudioController现在包含音频播放状态追踪和并发音效限制：
- `isMusicPlaying` - 追踪背景音乐播放状态
- `activeSoundEffects` - 追踪当前活动音效数量
- `maxConcurrentSounds` - 限制最大并发音效数（默认8个）

这些改进有助于：
- 防止音频资源过度使用
- 优化移动设备性能
- 避免音效重叠导致的音频失真

**重复播放修复** (需求 4.1, 4.2):
- `playMusic()` 方法在开始时检查 `isMusicPlaying` 标志
- 如果音乐已在播放，立即返回并记录日志
- 在创建振荡器前设置 `isMusicPlaying = true`
- 防止多次调用导致的音频重叠问题

**静音控制改进**:
- `toggleMusicMute()` 现在不会自动播放音乐
- 取消静音时只恢复音量，由调用者决定是否播放
- 这提供了更精细的音频控制，避免意外播放

**状态管理**:
- 使用`useState`管理倒计时时间、校准对话框状态
- 使用`useCallback`优化回调函数
- 使用`useEffect`注册/注销引擎回调

**样式特性**:
- 3D浮动动画（`time-3d`类）
- 紧急状态样式（`urgent`类，红色闪烁）
- 校准对话框（模态覆盖层）
- 响应式字体大小

### SettingsScreen（设置界面）
**文件**: `SettingsScreen.tsx`, `SettingsScreen.css`

**功能**:
- 音频设置（音乐/音效音量、独立静音控制）
- 主题设置（背景主题、倒计时皮肤选择）
- 性能设置（低/中/高画质配置）
- 倒计时校准（手动时间偏移）
- 实时预览（音量调整立即生效）
- 设置持久化（保存到本地存储）

**Props**:
- `isOpen: boolean` - 是否显示设置界面
- `onClose: () => void` - 关闭回调
- `onSave: (settings: SettingsData) => void` - 保存回调

**SettingsData接口**:
```typescript
interface SettingsData {
  musicVolume: number;           // 音乐音量 (0-1)
  sfxVolume: number;             // 音效音量 (0-1)
  musicMuted: boolean;           // 音乐静音状态
  sfxMuted: boolean;             // 音效静音状态
  themeId: string;               // 主题ID
  skinId: string;                // 皮肤ID
  performanceLevel: 'low' | 'medium' | 'high';  // 性能级别
  manualOffset: number;          // 手动时间偏移（秒）
}
```

**需求**: 2.5, 6.3, 6.5, 6.6

**特性**:
- 模态对话框设计（点击遮罩层关闭）
- Redux集成（实时同步状态）
- 本地状态管理（支持取消操作）
- 响应式布局（适配移动设备）
- 音量滑块（0-100%显示）
- 主题预览（颜色块显示）

**使用示例**:
```tsx
import { SettingsScreen } from './components/SettingsScreen';

const [showSettings, setShowSettings] = useState(false);

const handleSaveSettings = async (settings: SettingsData) => {
  // 应用音频设置
  if (audioController) {
    audioController.setMusicVolume(settings.musicVolume);
    audioController.setSFXVolume(settings.sfxVolume);
    await audioController.saveConfig();
  }

  // 应用倒计时偏移
  if (countdownEngine) {
    countdownEngine.setManualOffset(settings.manualOffset);
  }

  // 应用性能设置
  if (performanceOptimizer && fireworksEngine) {
    const profile = performanceOptimizer.getProfile();
    profile.level = settings.performanceLevel;
    performanceOptimizer.setProfile(profile);
    fireworksEngine.updatePerformanceProfile(profile);
  }

  // 保存到本地存储
  if (storageService) {
    const data = await storageService.load();
    if (data) {
      data.themeId = settings.themeId;
      data.skinId = settings.skinId;
      data.performanceProfile = { level: settings.performanceLevel, ... };
      await storageService.save(data);
    }
  }
};

<SettingsScreen
  isOpen={showSettings}
  onClose={() => setShowSettings(false)}
  onSave={handleSaveSettings}
/>
```

**状态管理**:
- 使用Redux Selector获取当前配置
- 使用Redux Dispatch更新全局状态
- 本地状态用于实时预览和取消操作
- 取消时恢复原始Redux状态

**样式特性**:
- 模态遮罩层（半透明黑色背景）
- 渐变背景（深色主题）
- 分组设置区域（音频、主题、性能、校准）
- 音量控制（滑块+静音按钮）
- 主题选择器（颜色预览+名称）
- 性能选择器（三档配置+描述）
- 响应式设计（移动端优化）

**集成说明**:
- 已集成到`SinglePlayerGame`和`MultiplayerGame`组件
- 通过设置按钮（⚙️图标）打开
- 保存后立即应用所有设置
- 取消时恢复原始状态

### SinglePlayerGame（单人游戏）
**文件**: `SinglePlayerGame.tsx`, `SinglePlayerGame.css`

**功能**:
- 全屏烟花Canvas渲染
- 倒计时显示集成
- 连击系统和视觉反馈
- 音频控制（静音切换）
- 设置界面集成
- 统计数据追踪
- 游戏控制（重新开始、退出）

**Props**:
- `onExit: () => void` - 退出游戏回调
- `onGameEnd?: () => void` - 游戏结束回调（可选）

**需求**: 3.1, 3.6, 4.2

**特性**:
- 引擎就绪状态管理（`enginesReady`）- 确保所有引擎初始化完成后再渲染UI
- 多引擎协调（倒计时、烟花、连击、音频、统计、性能）
- 触摸和鼠标事件支持（支持移动端触摸交互）
- 响应式Canvas尺寸调整（自动适配窗口大小）
- 游戏时间追踪和持久化
- 连击状态实时显示
- 持续动画循环 - FireworksEngine保持动画循环运行，确保Canvas始终清空并准备接收新烟花
- 音频配置同步 - 从StorageService加载配置并同步到Redux store

**状态管理**:
- Redux集成（音频配置、连击状态、统计数据）
- 本地状态（连击显示、设置界面、引擎就绪）
- 引擎实例引用（useRef管理生命周期）
- 音频配置双向同步（AudioController ↔ Redux store）

**引擎初始化流程**:
1. 创建存储服务和性能优化器
2. 初始化音频控制器（异步）
3. 从存储加载音频配置并同步到Redux
4. 加载统计追踪器数据
5. 创建倒计时引擎（自动计算农历新年）
6. 创建烟花引擎并启动动画循环
7. 创建连击系统并注册回调
8. 播放背景音乐（根据加载的配置决定）
9. 设置`enginesReady = true`触发UI渲染

**交互处理**:
- 鼠标点击：`handleMouseClick` - 计算相对Canvas的坐标
- 触摸事件：`handleTouchStart` - 支持移动设备触摸，阻止默认行为
- 连击检测：每次交互注册到ComboSystem，根据连击倍数触发不同效果
- 统计记录：每次点击记录到StatisticsTracker和Redux store

**设置集成**:
- 音频设置：音量控制、静音状态
- 倒计时设置：手动时间偏移
- 性能设置：低/中/高画质配置
- 主题设置：背景主题、倒计时皮肤
- 设置持久化：保存到IndexedDB

**使用示例**:
```tsx
import { SinglePlayerGame } from './components/SinglePlayerGame';

<SinglePlayerGame
  onExit={() => dispatch(setMode('selection'))}
  onGameEnd={() => dispatch(setMode('ended'))}
/>
```

**清理机制**:
- 保存游戏时间和统计数据
- 停止所有引擎和服务
- 清理事件监听器和回调
- 释放Canvas资源
- 停止背景音乐和音频上下文

## 触摸事件处理

### TouchHandler（触摸处理器）
**文件**: `../utils/TouchHandler.ts`

**功能**:
- 触摸防抖（避免过度触发，默认100ms间隔）
- 多点触摸支持（同时处理多个触摸点）
- 触摸反馈效果（涟漪动画）
- 触摸点追踪和管理

**接口**:
```typescript
interface TouchPoint {
  x: number;              // 相对容器的X坐标
  y: number;              // 相对容器的Y坐标
  identifier: number;     // 触摸点唯一标识符
  timestamp: number;      // 触摸时间戳
}

interface TouchHandlerConfig {
  minInterval?: number;         // 最小触摸间隔（毫秒）
  enableMultiTouch?: boolean;   // 是否启用多点触摸
  showFeedback?: boolean;       // 是否显示触摸反馈
  feedbackDuration?: number;    // 触摸反馈持续时间（毫秒）
}
```

**需求**: 10.3

**特性**:
- 自动计算相对容器的坐标
- 防抖机制避免过度触发
- 可配置的多点触摸支持
- 视觉反馈（涟漪效果）
- 活动触摸点追踪

**使用示例**:
```typescript
import { TouchHandler, injectTouchFeedbackStyles } from '@/utils/TouchHandler';

// 在应用启动时注入CSS样式（只需调用一次）
injectTouchFeedbackStyles();

// 创建触摸处理器
const canvasElement = document.getElementById('game-canvas');
const touchHandler = new TouchHandler(canvasElement, {
  minInterval: 100,        // 100ms防抖
  enableMultiTouch: true,  // 启用多点触摸
  showFeedback: true,      // 显示触摸反馈
  feedbackDuration: 800,   // 反馈持续800ms
});

// 处理触摸开始
canvasElement.addEventListener('touchstart', (e) => {
  touchHandler.handleTouchStart(e, (point) => {
    // 在触摸位置生成烟花
    fireworksEngine.launchFirework(point.x, point.y);
  });
});

// 处理触摸移动（可选）
canvasElement.addEventListener('touchmove', (e) => {
  touchHandler.handleTouchMove(e, (point) => {
    // 处理拖动
  });
});

// 处理触摸结束
canvasElement.addEventListener('touchend', (e) => {
  touchHandler.handleTouchEnd(e);
});

// 获取活动触摸点
const activeTouches = touchHandler.getActiveTouches();
const touchCount = touchHandler.getActiveTouchCount();

// 清理
touchHandler.destroy();
```

**方法**:
- `handleTouchStart(event, callback)` - 处理触摸开始事件
- `handleTouchMove(event, callback?)` - 处理触摸移动事件
- `handleTouchEnd(event)` - 处理触摸结束事件
- `getActiveTouchCount()` - 获取当前活动触摸点数量
- `getActiveTouches()` - 获取所有活动触摸点
- `clear()` - 清除所有触摸状态
- `updateConfig(config)` - 更新配置
- `destroy()` - 销毁处理器

**React集成**:
```typescript
// 在React组件中使用
const SinglePlayerGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchHandlerRef = useRef<TouchHandler | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建触摸处理器
    touchHandlerRef.current = new TouchHandler(canvasRef.current, {
      minInterval: 100,
      enableMultiTouch: true,
      showFeedback: true,
    });

    return () => {
      touchHandlerRef.current?.destroy();
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchHandlerRef.current?.handleTouchStart(e, (point) => {
      fireworksEngine?.launchFirework(point.x, point.y);
    });
  };

  return (
    <canvas
      ref={canvasRef}
      onTouchStart={handleTouchStart}
      onTouchMove={(e) => touchHandlerRef.current?.handleTouchMove(e)}
      onTouchEnd={(e) => touchHandlerRef.current?.handleTouchEnd(e)}
    />
  );
};
```

## 服务层集成

### ThemeManager（主题管理器）
**文件**: `../services/ThemeManager.ts`

**功能**:
- 应用主题到DOM（通过CSS变量）
- 读取当前应用的主题颜色

**接口**:
```typescript
interface Theme {
  id: string;
  name: string;
  backgroundImage?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}
```

**需求**: 1.1, 1.2（settings-ui-fixes spec）

**特性**:
- 轻量级设计（无状态管理）
- 直接操作CSS自定义属性
- 支持背景图片（可选）
- 提供颜色读取功能

**使用示例**:
```typescript
import { ThemeManager } from '@/services/ThemeManager';

// 创建主题管理器实例
const themeManager = new ThemeManager();

// 应用主题
const theme = {
  id: 'new-year-dinner',
  name: '年夜饭场景',
  primaryColor: '#D32F2F',
  secondaryColor: '#FFD700',
  accentColor: '#FF6B6B',
  backgroundImage: '/themes/new-year-dinner.jpg'
};

themeManager.applyTheme(theme);

// 读取当前主题颜色
const colors = themeManager.getCurrentThemeColors();
console.log(colors.primary); // '#D32F2F'
```

**CSS变量**:
ThemeManager设置以下CSS自定义属性：
- `--color-primary`: 主色
- `--color-secondary`: 次色
- `--color-accent`: 强调色
- `--bg-image`: 背景图片（可选）

**在组件中使用**:
```typescript
// 在SinglePlayerGame中应用主题
useEffect(() => {
  if (themeManagerRef.current && currentTheme) {
    themeManagerRef.current.applyTheme(currentTheme);
  }
}, [currentTheme]);
```

**CSS中使用主题变量**:
```css
.single-player-game {
  background: linear-gradient(
    to bottom,
    var(--color-primary, #0a0e27) 0%,
    var(--color-secondary, #1a1a2e) 50%,
    var(--color-accent, #16213e) 100%
  );
}

.button-primary {
  background-color: var(--color-primary);
  border-color: var(--color-accent);
}
```

**设计说明**:
- ThemeManager现在是一个简单的工具类，不管理主题列表或持久化
- 主题数据由Redux store管理（themeSlice）
- 持久化由StorageService处理
- 这种设计遵循单一职责原则，使代码更易维护

## 下一步

任务26（移动端优化和测试）已完成。ThemeManager已简化为轻量级服务，专注于CSS变量应用。
