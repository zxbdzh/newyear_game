# 新年烟花游戏 - 源代码结构

## 目录说明

- **components/** - React组件
  - UI组件和游戏界面组件
  
- **engines/** - 游戏引擎
  - FireworksEngine - 烟花生成和渲染
  - CountdownEngine - 倒计时计算
  - ComboSystem - 连击系统
  - SpecialEventTrigger - 特殊事件触发器

- **services/** - 服务层
  - NetworkSynchronizer - 网络同步
  - AudioController - 音频管理
  - StorageService - 本地存储
  - PerformanceOptimizer - 性能优化

- **store/** - Redux状态管理
  - Redux store配置和slices

- **types/** - TypeScript类型定义
  - 所有接口和类型定义

- **utils/** - 工具函数
  - 常量定义
  - 辅助函数
  - 验证器

- **assets/** - 静态资源
  - 图片、音频等资源文件

- **test/** - 测试配置
  - 测试设置和工具

## 开发指南

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm dev
```

### 运行测试
```bash
pnpm test:unit      # 单元测试
pnpm test:pbt       # 属性测试
```

### 代码检查
```bash
pnpm run lint       # ESLint检查
pnpm run format     # Prettier格式化
```

### 构建
```bash
pnpm run build      # 生产构建
pnpm run preview    # 预览构建结果
```
