/**
 * 主应用组件
 * Feature: new-year-fireworks-game
 * 需求：1.6, 8.4, 8.5
 * 
 * 实现完整的游戏流程：
 * 启动界面 → 模式选择 → 游戏界面 → 结束界面
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setMode } from './store/gameSlice';
import { toggleMusicMute, updateAudioConfig } from './store/audioSlice';
import { setTheme, setSkin } from './store/themeSlice';
import { LaunchScreen } from './components/LaunchScreen';
import { ModeSelection } from './components/ModeSelection';
import { SinglePlayerGame } from './components/SinglePlayerGame';
import { MultiplayerSetup } from './components/MultiplayerSetup';
import { MultiplayerGame } from './components/MultiplayerGame';
import { GameEndScreen } from './components/GameEndScreen';
import { NetworkSynchronizer } from './services/NetworkSynchronizer';
import { AudioController } from './services/AudioController';
import { StorageService } from './services/StorageService';
import { ThemeManager } from './services/ThemeManager';
import { getDefaultSettings, mergeWithDefaults } from './utils/defaultSettings';
import type { GameMode } from './types/GameTypes';
import './App.css';

/**
 * 主应用组件
 */
function App() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.game.mode);
  const isMusicMuted = useAppSelector((state) => state.audio.config.musicMuted);
  const availableThemes = useAppSelector((state) => state.theme.availableThemes);
  const availableSkins = useAppSelector((state) => state.theme.availableSkins);
  const currentTheme = useAppSelector((state) => state.theme.currentTheme);
  
  // 应用状态
  const [hasStarted, setHasStarted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isServerAvailable, setIsServerAvailable] = useState(false);
  const [isMultiplayerConnected, setIsMultiplayerConnected] = useState(false);
  
  // 服务实例引用
  const audioControllerRef = useRef<AudioController | null>(null);
  const networkSynchronizerRef = useRef<NetworkSynchronizer | null>(null);
  const storageServiceRef = useRef<StorageService | null>(null);
  const themeManagerRef = useRef<ThemeManager | null>(null);

  /**
   * 初始化服务
   */
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // 创建存储服务
        const storageService = new StorageService();
        storageServiceRef.current = storageService;

        // 创建主题管理器
        const themeManager = new ThemeManager();
        themeManagerRef.current = themeManager;

        // 加载保存的设置并恢复主题和皮肤
        try {
          const savedData = await storageService.load();
          // 合并保存的数据和默认值，确保所有字段都存在
          const settings = mergeWithDefaults(savedData);
          
          // 恢复主题
          if (settings.themeId) {
            const theme = availableThemes.find(t => t.id === settings.themeId);
            if (theme) {
              dispatch(setTheme(settings.themeId));
              themeManager.applyTheme(theme);
              console.log('[App] 已恢复主题:', settings.themeId);
            } else {
              console.warn(`[App] 主题 ${settings.themeId} 不存在，使用默认主题`);
              themeManager.applyTheme(currentTheme);
            }
          } else {
            // 应用默认主题
            themeManager.applyTheme(currentTheme);
          }

          // 恢复皮肤
          if (settings.skinId) {
            const skin = availableSkins.find(s => s.id === settings.skinId);
            if (skin) {
              dispatch(setSkin(settings.skinId));
              console.log('[App] 已恢复皮肤:', settings.skinId);
            } else {
              console.warn(`[App] 皮肤 ${settings.skinId} 不存在，使用默认皮肤`);
            }
          }

          // 恢复音频配置
          if (settings.audioConfig) {
            dispatch(updateAudioConfig(settings.audioConfig));
            console.log('[App] 已恢复音频配置');
          }
          
          console.log('[App] 设置加载完成，手动偏移:', settings.manualOffset);
        } catch (error) {
          console.error('[App] 加载设置失败，使用默认设置:', error);
          // 使用默认设置
          const defaults = getDefaultSettings();
          themeManager.applyTheme(currentTheme);
          dispatch(updateAudioConfig(defaults.audioConfig));
        }

        // 创建音频控制器
        const audioController = new AudioController(storageService);
        await audioController.initialize();
        audioControllerRef.current = audioController;

        // 创建网络同步器（使用环境变量或默认值）
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
        const networkSynchronizer = new NetworkSynchronizer(serverUrl);
        networkSynchronizerRef.current = networkSynchronizer;

        // 检查服务器可用性
        const serverAvailable = await networkSynchronizer.checkServerAvailability();
        setIsServerAvailable(serverAvailable);

        console.log('[App] 服务初始化完成, 服务器可用:', serverAvailable);
      } catch (error) {
        console.error('[App] 服务初始化失败:', error);
      }
    };

    initializeServices();

    // 清理函数
    return () => {
      if (audioControllerRef.current) {
        audioControllerRef.current.destroy();
      }
      if (networkSynchronizerRef.current) {
        networkSynchronizerRef.current.disconnect();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 应用主题变化
   * 当用户在设置中更改主题时，立即应用到所有屏幕
   */
  useEffect(() => {
    if (themeManagerRef.current && currentTheme) {
      themeManagerRef.current.applyTheme(currentTheme);
      console.log('[App] 主题已更新:', currentTheme.id);
    }
  }, [currentTheme]);

  /**
   * 处理页面卸载前保存
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 如果正在游戏中，提示用户
      if (mode === 'single' || mode === 'multiplayer') {
        e.preventDefault();
        e.returnValue = '确定要离开吗？游戏进度将会丢失。';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [mode]);

  /**
   * 处理启动
   */
  const handleStart = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setHasStarted(true);
      dispatch(setMode('menu'));
      setIsTransitioning(false);
    }, 300);
  }, [dispatch]);

  /**
   * 处理音频解锁
   */
  const handleAudioUnlock = useCallback(async () => {
    if (audioControllerRef.current) {
      try {
        await audioControllerRef.current.resumeContext();
        console.log('[App] 音频已解锁');
      } catch (error) {
        console.error('[App] 音频解锁失败:', error);
      }
    }
  }, []);

  /**
   * 处理模式选择
   */
  const handleSelectMode = useCallback((selectedMode: GameMode) => {
    setIsTransitioning(true);
    setTimeout(() => {
      dispatch(setMode(selectedMode));
      setIsTransitioning(false);
    }, 300);
  }, [dispatch]);

  /**
   * 处理静音切换
   */
  const handleToggleMute = useCallback(() => {
    // 先更新Redux状态
    dispatch(toggleMusicMute());
    
    if (audioControllerRef.current) {
      // 切换AudioController的静音状态
      audioControllerRef.current.toggleMusicMute();
      
      // 根据切换后的状态决定播放或停止
      // isMusicMuted是切换前的状态，所以逻辑相反
      if (isMusicMuted) {
        // 之前是静音，现在取消静音，播放音乐
        audioControllerRef.current.playMusic();
      } else {
        // 之前是未静音，现在静音了，停止音乐
        audioControllerRef.current.stopMusic();
      }
    }
  }, [dispatch, isMusicMuted]);

  /**
   * 处理游戏结束
   */
  const handleGameEnd = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      dispatch(setMode('ended'));
      setIsTransitioning(false);
    }, 300);
  }, [dispatch]);

  /**
   * 处理多人模式连接成功
   */
  const handleMultiplayerConnected = useCallback(() => {
    setIsMultiplayerConnected(true);
  }, []);

  /**
   * 处理从多人设置返回
   */
  const handleBackFromMultiplayerSetup = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      dispatch(setMode('menu'));
      setIsTransitioning(false);
    }, 300);
  }, [dispatch]);

  /**
   * 处理退出游戏
   */
  const handleExitGame = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  /**
   * 确认退出
   */
  const handleConfirmExit = useCallback(() => {
    setShowExitConfirm(false);
    setIsTransitioning(true);
    setIsMultiplayerConnected(false);
    
    // 断开网络连接
    if (networkSynchronizerRef.current) {
      networkSynchronizerRef.current.leaveRoom();
    }
    
    setTimeout(() => {
      dispatch(setMode('menu'));
      setIsTransitioning(false);
    }, 300);
  }, [dispatch]);

  /**
   * 取消退出
   */
  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  /**
   * 处理"再玩一次"
   */
  const handlePlayAgain = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      dispatch(setMode('menu'));
      setIsTransitioning(false);
    }, 300);
  }, [dispatch]);

  /**
   * 处理从结束界面退出
   */
  const handleExitToMenu = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setHasStarted(false);
      dispatch(setMode('menu'));
      setIsTransitioning(false);
    }, 300);
  }, [dispatch]);

  // 显示启动界面
  if (!hasStarted) {
    return (
      <div className={`app-container ${isTransitioning ? 'transitioning' : ''}`}>
        <LaunchScreen 
          onStart={handleStart} 
          onAudioUnlock={handleAudioUnlock}
        />
      </div>
    );
  }

  // 显示模式选择界面
  if (mode === 'menu') {
    return (
      <div className={`app-container ${isTransitioning ? 'transitioning' : ''}`}>
        <ModeSelection
          onSelectMode={handleSelectMode}
          isOnline={isServerAvailable}
        />
      </div>
    );
  }

  // 显示单人游戏界面
  if (mode === 'single') {
    return (
      <div className={`app-container ${isTransitioning ? 'transitioning' : ''}`}>
        <SinglePlayerGame
          onExit={handleExitGame}
          onGameEnd={handleGameEnd}
        />
        
        {/* 退出确认对话框 */}
        {showExitConfirm && (
          <div className="exit-confirm-overlay" onClick={handleCancelExit}>
            <div className="exit-confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>确定要退出吗？</h3>
              <p>当前游戏进度将会保存</p>
              <div className="exit-confirm-buttons">
                <button className="confirm-button" onClick={handleConfirmExit}>
                  确定退出
                </button>
                <button className="cancel-button" onClick={handleCancelExit}>
                  继续游戏
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 显示多人游戏界面
  if (mode === 'multiplayer') {
    if (!networkSynchronizerRef.current) {
      return (
        <div className="app-container">
          <div className="error-screen">
            <h2>网络服务未就绪</h2>
            <p>请稍后再试</p>
            <button onClick={() => dispatch(setMode('menu'))}>
              返回菜单
            </button>
          </div>
        </div>
      );
    }

    // 如果还没连接，显示设置界面
    if (!isMultiplayerConnected) {
      return (
        <div className={`app-container ${isTransitioning ? 'transitioning' : ''}`}>
          <MultiplayerSetup
            networkSynchronizer={networkSynchronizerRef.current}
            onConnected={handleMultiplayerConnected}
            onBack={handleBackFromMultiplayerSetup}
          />
        </div>
      );
    }

    // 已连接，显示游戏界面
    return (
      <div className={`app-container ${isTransitioning ? 'transitioning' : ''}`}>
        <MultiplayerGame
          networkSynchronizer={networkSynchronizerRef.current}
          audioController={audioControllerRef.current}
          onExit={handleExitGame}
        />
        
        {/* 退出确认对话框 */}
        {showExitConfirm && (
          <div className="exit-confirm-overlay" onClick={handleCancelExit}>
            <div className="exit-confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>确定要退出房间吗？</h3>
              <p>你将离开当前房间</p>
              <div className="exit-confirm-buttons">
                <button className="confirm-button" onClick={handleConfirmExit}>
                  确定退出
                </button>
                <button className="cancel-button" onClick={handleCancelExit}>
                  继续游戏
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 显示游戏结束界面
  if (mode === 'ended') {
    return (
      <div className={`app-container ${isTransitioning ? 'transitioning' : ''}`}>
        <GameEndScreen
          show={true}
          onPlayAgain={handlePlayAgain}
          onExit={handleExitToMenu}
        />
      </div>
    );
  }

  // 默认返回菜单
  return (
    <div className="app-container">
      <div className="error-screen">
        <h2>未知状态</h2>
        <button onClick={() => dispatch(setMode('menu'))}>
          返回菜单
        </button>
      </div>
    </div>
  );
}

export default App;
