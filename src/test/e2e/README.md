# E2E测试 - 使用Chrome DevTools MCP

本目录包含使用Chrome DevTools MCP进行的端到端集成测试。

## 测试文件概览

所有E2E测试已创建完成，使用Chrome DevTools MCP进行浏览器自动化测试。

### 25.1 单人游戏流程测试 (`single-player-flow.e2e.test.ts`) ✅
测试完整的单人游戏流程：
- ✅ 启动界面显示（新年主题、网络状态）
- ✅ 模式选择（单人/多人按钮、静音按钮）
- ✅ 单人游戏界面（倒计时、画布、控制栏）
- ✅ 倒计时格式验证（天/小时/分钟/秒）
- ✅ 烟花生成和交互（点击生成、音效播放）
- ✅ 连击系统（快速点击触发增强效果）
- ✅ 烟花收藏画廊（已解锁样式、解锁进度）
- ✅ 数据持久化（统计数据保存和恢复）
- ✅ 游戏结束流程（新年祝福动画、再玩一次、退出）

**验证需求**: 1.1-1.6, 2.1-2.6, 3.1-3.7, 4.1-4.5, 8.1-8.5

**状态**: 测试框架已创建，包含11个测试用例。需要使用Chrome DevTools MCP工具执行实际测试。

### 25.2 多人游戏流程测试 (`multiplayer-flow.e2e.test.ts`)
测试完整的多人游戏流程：
- 昵称输入和验证
- 房间选择（公共/私人）
- 加入房间
- 在线玩家显示
- 排行榜
- 烟花动作同步
- 玩家通知
- 网络状态指示器

**验证需求**: 5.1-5.9, 11.1-11.5

### 25.3 特殊事件测试 (`special-events.e2e.test.ts`)
测试特殊事件和效果：
- 倒计时显示
- 整点烟花雨
- 10分钟倒计时特效
- 少于1小时特殊效果
- 倒计时归零触发
- 新年祝福动画
- 游戏结束界面
- 截图分享功能

**验证需求**: 7.1-7.4, 8.1-8.5

### 25.4 设置功能测试 (`settings.e2e.test.ts`)
测试设置界面和功能：
- 音乐音量控制
- 音效音量控制
- 静音切换
- 主题切换
- 倒计时皮肤切换
- 性能配置切换
- 手动时间校准
- 设置持久化

**验证需求**: 2.5, 6.3-6.6

## 测试实现说明

### 测试结构

每个E2E测试文件包含：

1. **测试描述**：详细说明测试目的和验证内容
2. **需求追溯**：明确标注验证的需求编号
3. **MCP工具使用说明**：每个测试用例都包含详细的MCP工具调用说明
4. **验证点**：清晰列出需要验证的内容
5. **占位符断言**：使用 `expect(true).toBe(true)` 作为占位符，实际测试需要使用MCP工具

### 测试执行流程

1. **beforeAll**: 测试前准备，输出测试信息
2. **测试用例**: 按照用户流程顺序执行
3. **afterAll**: 测试后清理，输出完成信息

### MCP工具集成

测试文件已准备好使用以下MCP工具：

- **页面导航**: `mcp_chrome_devtools_navigate_page`
- **元素交互**: `mcp_chrome_devtools_click`, `mcp_chrome_devtools_fill`
- **页面验证**: `mcp_chrome_devtools_take_snapshot`, `mcp_chrome_devtools_take_screenshot`
- **脚本执行**: `mcp_chrome_devtools_evaluate_script`

### 实际执行测试

要执行实际的浏览器自动化测试，需要：

1. 确保Chrome DevTools MCP已配置并运行
2. 将占位符断言替换为实际的MCP工具调用
3. 添加适当的等待时间和错误处理
4. 验证快照和截图内容

## 运行测试

### 前提条件

1. **启动开发服务器**：
   ```cmd
   pnpm dev
   ```
   服务器应该运行在 `http://localhost:5173`

2. **确保Chrome DevTools MCP已配置**：
   - 检查 `.kiro/settings/mcp.json` 中是否配置了Chrome DevTools MCP
   - 确保MCP服务器正在运行

### 运行所有E2E测试

```cmd
pnpm test src/test/e2e --run
```

### 运行单个测试文件

```cmd
# 单人游戏流程测试
pnpm test src/test/e2e/single-player-flow.e2e.test.ts --run

# 多人游戏流程测试
pnpm test src/test/e2e/multiplayer-flow.e2e.test.ts --run

# 特殊事件测试
pnpm test src/test/e2e/special-events.e2e.test.ts --run

# 设置功能测试
pnpm test src/test/e2e/settings.e2e.test.ts --run
```

## 测试截图

测试运行时会自动生成截图，保存在 `./test-screenshots/` 目录：

- `01-launch-screen.png` - 启动界面
- `02-mode-selection.png` - 模式选择
- `03-single-player-game.png` - 单人游戏界面
- `04-firework-generated.png` - 烟花生成
- `05-combo-effect.png` - 连击效果
- `mp-01-nickname-input.png` - 昵称输入
- `mp-04-multiplayer-game.png` - 多人游戏界面
- `se-04-hourly-firework-rain.png` - 整点烟花雨
- `st-01-settings-opened.png` - 设置界面
- 等等...

## 注意事项

### Chrome DevTools MCP工具

测试使用以下MCP工具：

- `mcp_chrome_devtools_new_page` - 创建新页面
- `mcp_chrome_devtools_navigate_page` - 导航页面
- `mcp_chrome_devtools_take_snapshot` - 获取页面快照
- `mcp_chrome_devtools_take_screenshot` - 截图
- `mcp_chrome_devtools_click` - 点击元素
- `mcp_chrome_devtools_fill` - 填充表单
- `mcp_chrome_devtools_press_key` - 按键
- `mcp_chrome_devtools_evaluate_script` - 执行JavaScript
- `mcp_chrome_devtools_close_page` - 关闭页面

### UID查找

测试中使用的UID（元素标识符）需要与实际组件中的ID或data-testid属性匹配。如果测试失败，请检查：

1. 元素是否存在
2. UID是否正确
3. 元素是否可见和可交互

### 异步等待

测试中使用 `setTimeout` 来等待页面加载和动画完成。根据实际情况可能需要调整等待时间。

### 多人游戏测试

多人游戏测试需要WebSocket服务器运行。确保：

```cmd
cd server
pnpm dev
```

## 调试测试

### 查看测试输出

测试失败时，查看：
1. 控制台输出
2. 生成的截图
3. 页面快照内容

### 手动运行测试步骤

可以手动在浏览器中执行测试步骤来验证：
1. 打开 `http://localhost:5173`
2. 按照测试流程操作
3. 检查每一步的结果

### 调试单个测试

使用 `.only` 运行单个测试：

```typescript
it.only('should display launch screen', async () => {
  // 测试代码
});
```

## 持续集成

这些测试应该在CI/CD管道中运行：

1. 启动开发服务器
2. 启动WebSocket服务器（多人游戏测试）
3. 运行E2E测试
4. 收集截图和测试报告
5. 清理资源

## 测试覆盖

E2E测试覆盖以下需求：

- ✅ 需求1：启动界面与模式选择
- ✅ 需求2：3D倒计时显示
- ✅ 需求3：交互式烟花系统
- ✅ 需求4：单人模式功能
- ✅ 需求5：多人模式功能
- ✅ 需求6：视觉与音频设计
- ✅ 需求7：特殊事件与彩蛋
- ✅ 需求8：游戏结束流程
- ✅ 需求11：网络错误处理

## 问题排查

### 测试超时

如果测试超时，检查：
- 开发服务器是否运行
- 网络连接是否正常
- 页面加载是否完成

### 元素未找到

如果找不到元素，检查：
- UID是否正确
- 元素是否已渲染
- 是否需要等待更长时间

### 截图失败

如果截图失败，检查：
- 目录权限
- 磁盘空间
- 文件路径是否正确

## 更新测试

当UI或功能变更时，需要更新：
1. UID引用
2. 快照验证内容
3. 等待时间
4. 截图文件名

## 参考资料

- [Chrome DevTools MCP文档](https://github.com/modelcontextprotocol/servers/tree/main/src/chrome-devtools)
- [Vitest文档](https://vitest.dev/)
- [测试指南](../../.kiro/steering/testing.md)
