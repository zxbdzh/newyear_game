# 启动界面和模式选择组件

## 概述

本目录包含任务16实现的启动界面和模式选择组件。

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

## 下一步

任务17将实现倒计时显示组件，包括：
- CountdownDisplay组件
- 3D文字渲染效果
- 倒计时归零触发
- 手动时间校准功能
