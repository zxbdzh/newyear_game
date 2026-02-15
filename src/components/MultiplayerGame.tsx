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
import { NetworkSynchronizer } from '../services/NetworkSynchronizer';
import { StorageService } from '../services/StorageService';
import { PerformanceOptimizer } from '../services/PerformanceOptimizer';
import { CountdownEngine } from '../engines/CountdownEngine';
import { useAppSelector } from '../store/hooks';
import type { FireworkAction, RoomInfo, PlayerInfo } from '../types/NetworkTypes';
import './MultiplayerGame.css';

/**
 * 通知项类型
 */
interface NotificationItem {
  id: string;
  playerNickname: string;
  timestamp: number;
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
  const performanceOptimizerRef = useRef<PerformanceOptimizer | null>(null);
  const storageServiceRef = useRef<StorageService | null>(null);
  const audioControllerRef = useRef<any>(audioController);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<PlayerInfo[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const initializingRef = useRef(false);
  
  // Get current skin from Redux store
  const currentSkin = useAppSelector((state) => state.theme.currentSkin);

  /**
   * 初始化烟花引擎
   */
  useEffect(() => {
    if (!canvasRef.current || isInitialized || initializingRef.current) return;
    
    initializingRef.current = true;

    try {
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

      // 创建烟花引擎
      const engine = new FireworksEngine(canvasRef.current, audioController);
      engineRef.current = engine;
      
      // 启动动画循环
      engine.startAnimation();
      
      setIsInitialized(true);

      console.log('[MultiplayerGame] 烟花引擎初始化成功');
    } catch (error) {
      console.error('[MultiplayerGame] 烟花引擎初始化失败:', error);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      if (countdownEngineRef.current) {
        countdownEngineRef.current.destroy();
        countdownEngineRef.current = null;
      }
    };
  }, [audioController, isInitialized]);

  /**
   * 处理本地点击 - 发射烟花并同步到其他玩家
   */
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!engineRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

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
        
        {/* 倒计时显示 */}
        <div className="countdown-wrapper">
          {countdownEngineRef.current && (
            <CountdownDisplay
              engine={countdownEngineRef.current}
              skinId={currentSkin.id}
            />
          )}
        </div>
        
        {/* 在线人数 */}
        <div className="online-count-badge">
          <Users size={18} />
          <span>{roomInfo?.players.length || 0}/{roomInfo?.maxPlayers || 20}</span>
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

      {/* 玩家通知 */}
      <div className="player-notifications-container">
        {notifications.map((notification) => (
          <PlayerNotification
            key={notification.id}
            playerNickname={notification.playerNickname}
            timestamp={notification.timestamp}
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
