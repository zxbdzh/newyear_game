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
- 触摸和鼠标事件支持
- 响应式Canvas尺寸调整
- 游戏时间追踪和持久化
- 连击状态实时显示
- 持续动画循环 - FireworksEngine保持动画循环运行，确保Canvas始终清空并准备接收新烟花

**状态管理**:
- Redux集成（音频配置、连击状态、统计数据）
- 本地状态（连击显示、设置界面、引擎就绪）
- 引擎实例引用（useRef管理生命周期）

**引擎初始化流程**:
1. 创建存储服务和性能优化器
2. 初始化音频控制器（异步）
3. 加载统计追踪器数据
4. 创建倒计时引擎（自动计算农历新年）
5. 创建烟花引擎并启动动画循环
6. 创建连击系统并注册回调
7. 播放背景音乐（如果未静音）
8. 设置`enginesReady = true`触发UI渲染

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

## 下一步

任务24已完成UI/UX完善和设置界面集成。接下来将进行完整流程集成测试（任务25）。
