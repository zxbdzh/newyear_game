@echo off
REM 运行单个E2E测试脚本

if "%1"=="" (
    echo 用法: run-single-e2e-test.cmd [test-name]
    echo.
    echo 可用的测试:
    echo   single-player  - 单人游戏流程测试
    echo   multiplayer    - 多人游戏流程测试
    echo   special-events - 特殊事件测试
    echo   settings       - 设置功能测试
    echo.
    exit /b 1
)

REM 检查开发服务器
curl -s http://localhost:5173 > nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 开发服务器未运行
    echo 请先运行: pnpm dev
    exit /b 1
)

REM 创建截图目录
if not exist "test-screenshots" mkdir test-screenshots

REM 根据参数运行对应的测试
if "%1"=="single-player" (
    echo 运行单人游戏流程测试...
    pnpm test src/test/e2e/single-player-flow.e2e.test.ts --run
) else if "%1"=="multiplayer" (
    echo 运行多人游戏流程测试...
    pnpm test src/test/e2e/multiplayer-flow.e2e.test.ts --run
) else if "%1"=="special-events" (
    echo 运行特殊事件测试...
    pnpm test src/test/e2e/special-events.e2e.test.ts --run
) else if "%1"=="settings" (
    echo 运行设置功能测试...
    pnpm test src/test/e2e/settings.e2e.test.ts --run
) else (
    echo 未知的测试名称: %1
    echo 请使用: single-player, multiplayer, special-events, 或 settings
    exit /b 1
)

exit /b %errorlevel%
