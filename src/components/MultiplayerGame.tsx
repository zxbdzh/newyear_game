/**
 * 多人游戏组件 (MultiplayerGame)
 * Feature: new-year-fireworks-game
 * 
 * 多人模式主界面，集成：
 * - 倒计时显示
 * - 烟花引擎（本地和远程烟花）
 * - 网络同步器（实时同步烟花动作）
 * - 玩家通知（显示其他玩家的烟花动作）
 * - 在线人数显示
 * - 排行榜显示
 * 
 * 验证需求：5.3, 5.4, 5.5, 5.6
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Users, Settings, Trophy, LogOut } from 'lucide-react';
import { CountdownDisplay } from './CountdownDisplay';
import { PlayerNotification } from './PlayerNotification';
import { SettingsScreen, type SettingsData } from './SettingsScreen';
import { FireworksEngine } from '../engines/FireworksEngine';
import { ComboSystem } from '../engines/ComboSystem';
import { NetworkSynchronizer } from '../services/NetworkSynchronizer';
import { StorageService } from '../services/StorageService';
import { PerformanceOptimizer } from '../services/PerformanceOptimizer';
import { CountdownEngine } from '../engines/CountdownEngine';
import { useAppSelector } from '../store/hooks';
import type { FireworkAction, RoomInfo, PlayerInfo } from '../types/NetworkTypes';
import type { ComboState } from '../types';
import './MultiplayerGame.css';

/**
 * 通知项类型
 */
interface NotificationItem {
  id: string;
  playerNickname: string;
  timestamp: number;
  message?: string; // 可选的自定义消息
  isCombo?: boolean; // 是否是连击通知
  comboCount?: number; // 连击数
}

/**
 * 组件属性
 */
interface MultiplayerGameProps {
  /** 网络同步器实例 */
  networkSynchronizer: NetworkSynchronizer;
  /** 音频控制器（可选） */
  audioController?: any;
  /** 退出回调 */
  onExit?: () => void;
}

/**
 * 多人游戏组件
 */
export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({
  networkSynchronizer,
  audioController,
  onExit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FireworksEngine | null>(null);
  const countdownEngineRef = useRef<CountdownEngine | null>(null);
  const comboSystemRef = useRef<ComboSystem | null>(null);
  const performanceOptimizerRef = useRef<PerformanceOptimizer | null>(null);
  const storageServiceRef = useRef<StorageService | null>(null);
  const audioControllerRef = useRef<any>(audioController);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<PlayerInfo[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [countdownReady, setCountdownReady] = useState(false);
  const [comboState, setComboState] = useState<ComboState>({
    count: 0,
    lastClickTime: 0,
    isActive: false,
    multiplier: 1,
  });
  const initializingRef = useRef(false);
  
  // Get current skin from Redux store
  const currentSkin = useAppSelector((state) => state.theme.currentSkin);

  /**
   * 初始化烟花引擎
   */
  useEffect(() => {
    console.log('[MultiplayerGame] useEffect 运行', {
      hasCanvas: !!canvasRef.current,
      isInitializing: initializingRef.current
    });
    
    if (!canvasRef.current || initializingRef.current) {
      console.log('[MultiplayerGame] 跳过初始化');
      return;
    }
    
    initializingRef.current = true;

    try {
      console.log('[MultiplayerGame] 开始初始化引擎...');
      
      // 创建存储服务
      const storageService = new StorageService();
      storageServiceRef.current = storageService;

      // 创建性能优化器
      const performanceOptimizer = new PerformanceOptimizer();
      performanceOptimizerRef.current = performanceOptimizer;

      // 创建倒计时引擎
      const countdownEngine = new CountdownEngine({
        targetDate: CountdownEngine.getNextLunarNewYear(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        manualOffset: 0,
      });
      countdownEngineRef.current = countdownEngine;
      setCountdownReady(true);
      console.log('[MultiplayerGame] 倒计时引擎初始化成功');

      // 创建烟花引擎
      const engine = new FireworksEngine(canvasRef.current, audioController);
      engineRef.current = engine;
      console.log('[MultiplayerGame] engineRef.current 已设置:', engineRef.current);
      
      // 启动动画循环
      engine.startAnimation();
      
      // 创建连击系统
      const comboSystem = new ComboSystem({
        timeWindow: 3000,
        minClicks: 2,
        comboMultipliers: new Map([
          [2, 2],
          [4, 3],
          [6, 5],
        ]),
      });
      
      // 注册连击回调
      comboSystem.onCombo((state) => {
        setComboState(state);
        
        // 连击里程碑播报
        if (state.count === 10 || state.count === 50 || state.count === 100 || state.count === 200) {
          const notification: NotificationItem = {
            id: `combo-${Date.now()}`,
            playerNickname: '你',
            timestamp: Date.now(),
            isCombo: true,
            comboCount: state.count,
            message: `达成${state.count}连击！`,
          };
          setNotifications((prev) => [...prev, notification]);
        }
      });
      
      comboSystemRef.current = comboSystem;
      
      setIsInitialized(true);

      console.log('[MultiplayerGame] 烟花引擎初始化成功');
    } catch (error) {
      console.error('[MultiplayerGame] 烟花引擎初始化失败:', error);
      initializingRef.current = false;
    }

    return () => {
      console.log('[MultiplayerGame] 清理函数运行');
      if (engineRef.current) {
        console.log('[MultiplayerGame] 销毁引擎');
        engineRef.current.destroy();
        engineRef.current = null;
      }
      if (countdownEngineRef.current) {
        countdownEngineRef.current.destroy();
        countdownEngineRef.current = null;
      }
      if (comboSystemRef.current) {
        comboSystemRef.current.clearCallbacks();
        comboSystemRef.current = null;
      }
      // 重置初始化标志，允许重新初始化
      initializingRef.current = false;
      setIsInitialized(false);
      setCountdownReady(false);
    };
  }, [audioController]); // 移除 isInitialized 依赖

  /**
   * 处理本地点击 - 发射烟花并同步到其他玩家
   */
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      console.log('[MultiplayerGame] Canvas clicked!', event);
      console.log('[MultiplayerGame] engineRef.current:', engineRef.current);
      console.log('[MultiplayerGame] canvasRef.current:', canvasRef.current);
      
      if (!engineRef.current || !canvasRef.current) {
        console.log('[MultiplayerGame] Engine or canvas not ready', {
          engine: !!engineRef.current,
          canvas: !!canvasRef.current
        });
        return;
      }

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const now = Date.now();
      
      // 注册点击到连击系统
      if (comboSystemRef.current) {
        const newComboState = comboSystemRef.current.registerClick(now);
        setComboState(newComboState);
        
        // 根据连击状态发射烟花
        if (newComboState.isActive && newComboState.multiplier >= 2) {
          engineRef.current.launchComboFireworks(x, y, newComboState.multiplier);
        } else {
          engineRef.current.launchFirework(x, y);
        }
      } else {
        // 没有连击系统时，发射普通烟花
        engineRef.current.launchFirework(x, y);
      }

      // 本地发射烟花
      const fireworkId = engineRef.current.launchFirework(x, y);
      console.log('[MultiplayerGame] 本地发射烟花:', fireworkId, { x, y });

      // 同步到其他玩家
      try {
        networkSynchronizer.sendFireworkAction(x, y, fireworkId);
      } catch (error) {
        console.error('[MultiplayerGame] 发送烟花动作失败:', error);
      }
    },
    [networkSynchronizer]
  );

  /**
   * 处理触摸事件（移动端）
   */
  const handleCanvasTouch = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      if (!engineRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // 处理多点触摸
      Array.from(event.touches).forEach((touch) => {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // 本地发射烟花
        const fireworkId = engineRef.current!.launchFirework(x, y);
        console.log('[MultiplayerGame] 触摸发射烟花:', fireworkId, { x, y });

        // 同步到其他玩家
        try {
          networkSynchronizer.sendFireworkAction(x, y, fireworkId);
        } catch (error) {
          console.error('[MultiplayerGame] 发送烟花动作失败:', error);
        }
      });
    },
    [networkSynchronizer]
  );

  /**
   * 处理接收到的烟花动作 - 在本地回放其他玩家的烟花
   */
  const handleFireworkAction = useCallback((action: FireworkAction) => {
    if (!engineRef.current) return;

    console.log('[MultiplayerGame] 接收到烟花动作:', action);

    // 在本地回放烟花
    try {
      engineRef.current.launchFirework(action.x, action.y, action.fireworkTypeId);
    } catch (error) {
      console.error('[MultiplayerGame] 回放烟花失败:', error);
    }

    // 添加玩家通知
    const notification: NotificationItem = {
      id: `${action.playerId}-${action.timestamp}`,
      playerNickname: action.playerNickname,
      timestamp: action.timestamp,
    };

    setNotifications((prev) => [...prev, notification]);
  }, []);

  /**
   * 设置网络同步器回调
   */
  useEffect(() => {
    // 注册烟花动作回调
    const unsubscribeFirework = networkSynchronizer.onFireworkAction(handleFireworkAction);

    // 注册房间更新回调
    const unsubscribeRoom = networkSynchronizer.onRoomUpdate((room) => {
      console.log('[MultiplayerGame] 房间信息更新:', room);
      setRoomInfo(room);
    });

    // 注册排行榜更新回调
    const unsubscribeLeaderboard = networkSynchronizer.onLeaderboardUpdate((leaderboard) => {
      console.log('[MultiplayerGame] 排行榜更新:', leaderboard);
      setLeaderboard(leaderboard);
    });

    // 获取初始房间信息
    const initialRoom = networkSynchronizer.getRoomInfo();
    if (initialRoom) {
      setRoomInfo(initialRoom);
      setLeaderboard(networkSynchronizer.getLeaderboard());
    }

    return () => {
      unsubscribeFirework();
      unsubscribeRoom();
      unsubscribeLeaderboard();
    };
  }, [networkSynchronizer, handleFireworkAction]);

  /**
   * 处理退出
   */
  const handleExit = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.clear();
    }
    networkSynchronizer.leaveRoom();
    onExit?.();
  }, [networkSynchronizer, onExit]);

  /**
   * 打开设置
   */
  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  /**
   * 关闭设置
   */
  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  /**
   * 保存设置
   */
  const handleSaveSettings = useCallback(async (settings: SettingsData) => {
    try {
      // 应用音频设置
      if (audioController) {
        audioController.setMusicVolume(settings.musicVolume);
        audioController.setSFXVolume(settings.sfxVolume);
        await audioController.saveConfig();
      }

      // 应用倒计时偏移
      if (countdownEngineRef.current) {
        countdownEngineRef.current.setManualOffset(settings.manualOffset);
      }

      // 应用性能设置
      if (performanceOptimizerRef.current && engineRef.current) {
        const profile = performanceOptimizerRef.current.getProfile();
        profile.level = settings.performanceLevel;
        performanceOptimizerRef.current.setProfile(profile);
        
        // 更新烟花引擎的性能配置
        engineRef.current.updatePerformanceProfile(profile);
      }

      // 保存到本地存储
      if (storageServiceRef.current) {
        try {
          let data = await storageServiceRef.current.load();
          
          // 如果没有数据，使用默认值
          if (!data) {
            const { getDefaultSettings } = await import('../utils/defaultSettings');
            data = getDefaultSettings();
          }
          
          // 更新所有设置字段
          data.themeId = settings.themeId;
          data.skinId = settings.skinId;
          data.audioConfig = {
            musicVolume: settings.musicVolume,
            sfxVolume: settings.sfxVolume,
            musicMuted: settings.musicMuted,
            sfxMuted: settings.sfxMuted,
          };
          data.performanceProfile = {
            level: settings.performanceLevel,
            maxParticles: settings.performanceLevel === 'low' ? 50 : settings.performanceLevel === 'high' ? 150 : 100,
            maxFireworks: 5,
            useWebGL: false,
            particleSize: 3,
            enableGlow: settings.performanceLevel !== 'low',
            enableTrails: settings.performanceLevel === 'high',
          };
          data.manualOffset = settings.manualOffset;
          data.lastPlayedAt = Date.now();
          
          await storageServiceRef.current.save(data);
          console.log('[MultiplayerGame] 设置已保存');
        } catch (saveError) {
          console.error('[MultiplayerGame] 保存设置失败:', saveError);
        }
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [audioController]);

  /**
   * 调整Canvas尺寸
   */
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="multiplayer-game">
      {/* 烟花Canvas - 全屏背景 */}
      <canvas
        ref={canvasRef}
        className="fireworks-canvas"
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasTouch}
        aria-label="点击屏幕燃放烟花"
      />

      {/* 顶部控制栏 */}
      <div className="top-control-bar">
        {/* 顶部行：控制按钮和在线人数 */}
        <div className="top-row">
          {/* 控制按钮 */}
          <div className="control-buttons">
            <button
              className="control-button"
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              aria-label="排行榜"
              title="排行榜"
            >
              <Trophy size={20} />
            </button>
            
            <button
              className="control-button settings-button"
              onClick={handleOpenSettings}
              aria-label="设置"
              title="设置"
            >
              <Settings size={20} />
            </button>
          </div>
          
          {/* 在线人数 */}
          <div className="online-count-badge">
            <Users size={18} />
            <span>{roomInfo?.players.length || 0}/{roomInfo?.maxPlayers || 20}</span>
          </div>
        </div>
        
        {/* 倒计时显示 */}
        <div className="countdown-wrapper">
          {countdownReady && countdownEngineRef.current && (
            <CountdownDisplay
              engine={countdownEngineRef.current}
              skinId={currentSkin.id}
            />
          )}
        </div>
      </div>

      {/* 排行榜面板 */}
      {showLeaderboard && leaderboard.length > 0 && (
        <div className="leaderboard-panel">
          <div className="leaderboard-header">
            <h3>排行榜</h3>
            <button 
              className="close-button"
              onClick={() => setShowLeaderboard(false)}
              aria-label="关闭"
            >
              ×
            </button>
          </div>
          <div className="leaderboard-list">
            {leaderboard.map((player, index) => (
              <div key={player.id} className="leaderboard-item">
                <span className="leaderboard-rank">#{index + 1}</span>
                <span className="leaderboard-nickname">{player.nickname}</span>
                <span className="leaderboard-count">{player.fireworkCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 连击显示 */}
      {comboState.isActive && (
        <div className={`combo-display ${comboState.count >= 10 ? 'combo-milestone' : ''} ${comboState.count >= 50 ? 'combo-milestone-50' : ''} ${comboState.count >= 100 ? 'combo-milestone-100' : ''}`}>
          <div className="combo-count">{comboState.count}x</div>
          <div className="combo-label">
            {comboState.count >= 200 ? '传说连击!' : 
             comboState.count >= 100 ? '史诗连击!' : 
             comboState.count >= 50 ? '超级连击!' : 
             comboState.count >= 10 ? '完美连击!' : 
             '连击!'}
          </div>
        </div>
      )}

      {/* 玩家通知 */}
      <div className="player-notifications-container">
        {notifications.map((notification) => (
          <PlayerNotification
            key={notification.id}
            playerNickname={notification.playerNickname}
            timestamp={notification.timestamp}
            message={notification.message}
            isCombo={notification.isCombo}
            comboCount={notification.comboCount}
            onDismiss={() => {
              setNotifications((prev) => 
                prev.filter((n) => n.id !== notification.id)
              );
            }}
          />
        ))}
      </div>

      {/* 底部按钮 */}
      <div className="bottom-buttons">
        <button
          className="game-button exit-button"
          onClick={handleExit}
          aria-label="退出房间"
          title="退出房间"
        >
          <LogOut size={18} />
          <span>退出房间</span>
        </button>
      </div>

      {/* 设置界面 */}
      <SettingsScreen
        isOpen={showSettings}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        audioController={audioControllerRef.current}
        fireworksEngine={engineRef.current}
      />
    </div>
  );
};
