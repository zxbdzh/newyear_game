@echo off
REM E2E测试运行脚本
REM 使用Chrome DevTools MCP进行端到端测试

echo ========================================
echo 新年烟花游戏 - E2E测试
echo ========================================
echo.

REM 检查开发服务器是否运行
echo [1/4] 检查开发服务器...
curl -s http://localhost:5173 > nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 开发服务器未运行
    echo 请先运行: pnpm dev
    exit /b 1
)
echo ✓ 开发服务器正在运行

echo.
echo [2/4] 创建截图目录...
if not exist "test-screenshots" mkdir test-screenshots
echo ✓ 截图目录已准备

echo.
echo [3/4] 运行E2E测试...
echo.

REM 运行所有E2E测试
pnpm test src/test/e2e --run

if %errorlevel% neq 0 (
    echo.
    echo ✗ 测试失败
    echo 请查看上面的错误信息和截图
    exit /b 1
)

echo.
echo [4/4] 测试完成
echo ✓ 所有E2E测试通过
echo.
echo 截图保存在: test-screenshots/
echo.

exit /b 0
