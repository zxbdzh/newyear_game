/**
 * 单人游戏组件
 * Feature: new-year-fireworks-game
 * 需求：3.1, 3.6, 4.2
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { CountdownDisplay } from './CountdownDisplay';
import { SettingsScreen, type SettingsData } from './SettingsScreen';
import { Button } from './Button';
import { CountdownEngine } from '../engines/CountdownEngine';
import { FireworksEngine } from '../engines/FireworksEngine';
import { ComboSystem } from '../engines/ComboSystem';
import { AudioController } from '../services/AudioController';
import { StatisticsTracker } from '../services/StatisticsTracker';
import { StorageService } from '../services/StorageService';
import { PerformanceOptimizer } from '../services/PerformanceOptimizer';
import { ThemeManager } from '../services/ThemeManager';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateCombo, resetCombo } from '../store/gameSlice';
import { recordClick, recordCombo } from '../store/statisticsSlice';
import { toggleMusicMute, updateAudioConfig } from '../store/audioSlice';
import type { ComboState } from '../types';
import './SinglePlayerGame.css';

interface SinglePlayerGameProps {
  /** 退出游戏回调 */
  onExit: () => void;
  /** 游戏结束回调 */
  onGameEnd?: () => void;
}

/**
 * 单人游戏组件
 * 整合倒计时、烟花引擎、连击系统和统计追踪
 */
export function SinglePlayerGame({ onExit, onGameEnd }: SinglePlayerGameProps) {
  const dispatch = useAppDispatch();
  const audioConfig = useAppSelector((state) => state.audio.config);
  const currentTheme = useAppSelector((state) => state.theme.currentTheme);
  const currentSkin = useAppSelector((state) => state.theme.currentSkin);
  
  // Canvas引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 引擎实例引用
  const countdownEngineRef = useRef<CountdownEngine | null>(null);
  const fireworksEngineRef = useRef<FireworksEngine | null>(null);
  const comboSystemRef = useRef<ComboSystem | null>(null);
  const audioControllerRef = useRef<AudioController | null>(null);
  const statisticsTrackerRef = useRef<StatisticsTracker | null>(null);
  const performanceOptimizerRef = useRef<PerformanceOptimizer | null>(null);
  const storageServiceRef = useRef<StorageService | null>(null);
  const themeManagerRef = useRef<ThemeManager | null>(null);
  
  // 游戏时间追踪
  const gameStartTimeRef = useRef<number>(Date.now());
  
  // 连击状态
  const [comboState, setComboState] = useState<ComboState>({
    count: 0,
    lastClickTime: 0,
    isActive: false,
    multiplier: 1,
  });
  
  // 设置按钮状态
  const [showSettings, setShowSettings] = useState(false);
  
  // 新功能面板状态
  const [showGallery, setShowGallery] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  
  // 成就通知
  const [achievementNotification, setAchievementNotification] = useState<Achievement | null>(null);
  
  // 管理器引用
  const achievementManagerRef = useRef<AchievementManager | null>(null);
  const collectionManagerRef = useRef<FireworkCollectionManager | null>(null);
  
  // 数据状态
  const [collectionItems, setCollectionItems] = useState<FireworkCollectionItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [statistics, setStatistics] = useState({
    totalClicks: 0,
    maxCombo: 0,
    totalPlayTime: 0,
    fireworksLaunched: 0,
    gamesPlayed: 0
  });
  
  // 引擎就绪状态
  const [enginesReady, setEnginesReady] = useState(false);

  // 初始化所有引擎和服务
  useEffect(() => {
    const initializeGame = async () => {
      try {
        // 创建存储服务
        const storageService = new StorageService();
        storageServiceRef.current = storageService;
        
        // 创建性能优化器
        const performanceOptimizer = new PerformanceOptimizer();
        performanceOptimizerRef.current = performanceOptimizer;
        
        // 创建主题管理器
        const themeManager = new ThemeManager();
        themeManagerRef.current = themeManager;
        
        // 创建音频控制器
        const audioController = new AudioController(storageService);
        await audioController.initialize();
        await audioController.resumeContext();
        audioControllerRef.current = audioController;
        
        // 同步 AudioController 的配置到 Redux store
        const loadedConfig = audioController.getConfig();
        dispatch(updateAudioConfig(loadedConfig));
        
        // 创建统计追踪器
        const statisticsTracker = new StatisticsTracker(storageService);
        await statisticsTracker.load();
        statisticsTrackerRef.current = statisticsTracker;
        
        // 创建成就管理器
        const achievementManager = new AchievementManager(storageService);
        await achievementManager.load();
        achievementManagerRef.current = achievementManager;
        
        // 注册成就解锁回调
        achievementManager.onUnlock((achievement) => {
          setAchievementNotification(achievement);
          // 播放解锁音效
          if (audioController) {
            audioController.playExplosionSFX();
          }
        });
        
        // 创建烟花收藏管理器
        const collectionManager = new FireworkCollectionManager(storageService);
        await collectionManager.load();
        collectionManagerRef.current = collectionManager;
        
        // 注册烟花解锁回调
        collectionManager.onUnlock((item) => {
          console.log('Firework unlocked:', item.name);
        });
        
        // 加载初始数据
        setAchievements(achievementManager.getAllAchievements());
        setCollectionItems(collectionManager.getAllItems());
        
        // 加载统计数据
        const stats = await statisticsTracker.getStatistics();
        setStatistics({
          totalClicks: stats.totalClicks || 0,
          maxCombo: stats.maxCombo || 0,
          totalPlayTime: stats.totalPlayTime || 0,
          fireworksLaunched: stats.fireworksLaunched || 0,
          gamesPlayed: (stats.gamesPlayed || 0) + 1
        });
        
        // 记录新游戏开始
        statisticsTracker.recordGamePlayed();
        
        // 倒计时归零成就
        if (stats.totalPlayTime && stats.totalPlayTime > 0) {
          achievementManager.updateProgress('playtime', stats.totalPlayTime);
        }
        
        // 创建倒计时引擎
        const countdownEngine = new CountdownEngine({
          targetDate: CountdownEngine.getNextLunarNewYear(), // 自动计算下一个农历新年
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          manualOffset: 0,
        });
        countdownEngineRef.current = countdownEngine;
        
        // 创建烟花引擎
        if (canvasRef.current) {
          const fireworksEngine = new FireworksEngine(canvasRef.current, audioController);
          fireworksEngineRef.current = fireworksEngine;
          // 启动动画循环（即使没有烟花也保持canvas清空）
          fireworksEngine.startAnimation();
        }
        
        // 创建连击系统
        const comboSystem = new ComboSystem({
          timeWindow: 3000, // 3秒时间窗口
          minClicks: 2, // 最少2次点击触发连击
          comboMultipliers: new Map([
            [2, 2], // 2-3次：2倍
            [4, 3], // 4-5次：3倍
            [6, 5], // 6次以上：5倍（烟花雨）
          ]),
        });
        
        // 注册连击回调
        comboSystem.onCombo((state) => {
          setComboState(state);
          dispatch(updateCombo(state));
          
          // 记录最高连击
          if (statisticsTrackerRef.current) {
            statisticsTrackerRef.current.recordCombo(state.count);
          }
          dispatch(recordCombo(state.count));
        });
        
        comboSystemRef.current = comboSystem;
        
        // 播放背景音乐（使用从存储加载的配置）
        if (!loadedConfig.musicMuted) {
          audioController.playMusic();
        }
        
        // 标记引擎已就绪
        setEnginesReady(true);
        
      } catch (error) {
        console.error('Failed to initialize game:', error);
      }
    };

    initializeGame();

    // 清理函数
    return () => {
      // 保存游戏时间
      const playTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
      if (statisticsTrackerRef.current) {
        statisticsTrackerRef.current.recordPlayTime(playTime);
        statisticsTrackerRef.current.save().catch(console.error);
      }
      
      // 更新游戏时长成就
      if (achievementManagerRef.current) {
        achievementManagerRef.current.updateProgress('playtime', playTime);
        achievementManagerRef.current.save().catch(console.error);
      }
      
      // 保存收藏管理器
      if (collectionManagerRef.current) {
        collectionManagerRef.current.save().catch(console.error);
      }
      
      // 清理引擎
      if (countdownEngineRef.current) {
        countdownEngineRef.current.stop();
      }
      if (fireworksEngineRef.current) {
        fireworksEngineRef.current.destroy();
      }
      if (audioControllerRef.current) {
        audioControllerRef.current.stopMusic();
        audioControllerRef.current.destroy();
      }
      if (comboSystemRef.current) {
        comboSystemRef.current.clearCallbacks();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 应用主题
  useEffect(() => {
    if (themeManagerRef.current && currentTheme) {
      themeManagerRef.current.applyTheme(currentTheme);
    }
  }, [currentTheme]);

  // 处理Canvas尺寸调整
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 处理点击/触摸事件
  const handleCanvasInteraction = useCallback((x: number, y: number) => {
    if (!fireworksEngineRef.current || !comboSystemRef.current) {
      return;
    }

    const now = Date.now();
    
    // 注册点击到连击系统
    const newComboState = comboSystemRef.current.registerClick(now);
    setComboState(newComboState);
    dispatch(updateCombo(newComboState));
    
    // 记录点击到统计
    if (statisticsTrackerRef.current) {
      statisticsTrackerRef.current.recordClick();
    }
    dispatch(recordClick());
    
    // 更新统计数据
    const newTotalClicks = statistics.totalClicks + 1;
    const newMaxCombo = Math.max(statistics.maxCombo, newComboState.count);
    const newFireworksLaunched = statistics.fireworksLaunched + 1;
    
    setStatistics(prev => ({
      ...prev,
      totalClicks: newTotalClicks,
      maxCombo: newMaxCombo,
      fireworksLaunched: newFireworksLaunched
    }));
    
    // 更新成就进度
    if (achievementManagerRef.current) {
      achievementManagerRef.current.updateProgress('clicks', newTotalClicks);
      
      // 更新连击成就
      if (newComboState.count > statistics.maxCombo) {
        achievementManagerRef.current.updateProgress('combo', newComboState.count);
      }
      
      // 更新收藏成就
      if (collectionManagerRef.current) {
        const unlockedCount = collectionManagerRef.current.getUnlockedItems().length;
        achievementManagerRef.current.updateProgress('collection', unlockedCount);
      }
      
      // 刷新成就列表
      setAchievements(achievementManagerRef.current.getAllAchievements());
    }
    
    // 检查烟花解锁
    if (collectionManagerRef.current) {
      // 解锁条件检查
      if (newTotalClicks >= 100 && !collectionManagerRef.current.isUnlocked('meteor')) {
        collectionManagerRef.current.unlockFirework('meteor');
        setCollectionItems(collectionManagerRef.current.getAllItems());
      }
      if (newTotalClicks >= 1000 && !collectionManagerRef.current.isUnlocked('heart')) {
        collectionManagerRef.current.unlockFirework('heart');
        setCollectionItems(collectionManagerRef.current.getAllItems());
      }
      if (newTotalClicks >= 10000 && !collectionManagerRef.current.isUnlocked('fortune')) {
        collectionManagerRef.current.unlockFirework('fortune');
        setCollectionItems(collectionManagerRef.current.getAllItems());
      }
      
      // 200连击解锁红包
      if (newComboState.count >= 200 && !collectionManagerRef.current.isUnlocked('redEnvelope')) {
        collectionManagerRef.current.unlockFirework('redEnvelope');
        setCollectionItems(collectionManagerRef.current.getAllItems());
      }
    }
    
    // 根据连击状态发射烟花
    if (newComboState.isActive && newComboState.multiplier >= 2) {
      // 连击增强烟花
      fireworksEngineRef.current.launchComboFireworks(x, y, newComboState.multiplier);
    } else {
      // 普通烟花
      fireworksEngineRef.current.launchFirework(x, y);
    }
  }, [dispatch, statistics]);

  // 鼠标点击事件
  const handleMouseClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleCanvasInteraction(x, y);
  }, [handleCanvasInteraction]);

  // 触摸事件
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || e.touches.length === 0) return;
    
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    handleCanvasInteraction(x, y);
  }, [handleCanvasInteraction]);

  // 倒计时归零处理
  const handleCountdownZero = useCallback(() => {
    if (onGameEnd) {
      onGameEnd();
    }
  }, [onGameEnd]);

  // 切换静音
  const handleToggleMute = useCallback(() => {
    dispatch(toggleMusicMute());
    
    if (audioControllerRef.current) {
      // 切换静音状态
      audioControllerRef.current.toggleMusicMute();
      
      // 获取更新后的配置
      const updatedConfig = audioControllerRef.current.getConfig();
      
      // 如果取消静音，播放音乐
      if (!updatedConfig.musicMuted) {
        audioControllerRef.current.playMusic();
      }
    }
  }, [dispatch]);

  // 打开设置
  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  // 关闭设置
  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  // 保存设置
  const handleSaveSettings = useCallback(async (settings: SettingsData) => {
    try {
      // 应用音频设置
      if (audioControllerRef.current) {
        audioControllerRef.current.setMusicVolume(settings.musicVolume);
        audioControllerRef.current.setSFXVolume(settings.sfxVolume);
        await audioControllerRef.current.saveConfig();
      }

      // 应用倒计时偏移
      if (countdownEngineRef.current) {
        countdownEngineRef.current.setManualOffset(settings.manualOffset);
      }

      // 应用性能设置
      if (performanceOptimizerRef.current && fireworksEngineRef.current) {
        const profile = performanceOptimizerRef.current.getProfile();
        profile.level = settings.performanceLevel;
        performanceOptimizerRef.current.setProfile(profile);
        
        // 更新烟花引擎的性能配置
        fireworksEngineRef.current.updatePerformanceProfile(profile);
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
          console.log('[SinglePlayerGame] 设置已保存');
        } catch (saveError) {
          console.error('[SinglePlayerGame] 保存设置失败:', saveError);
        }
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, []);

  // 重新开始游戏
  const handleRestart = useCallback(() => {
    // 清除烟花并停止动画
    if (fireworksEngineRef.current) {
      fireworksEngineRef.current.stopAnimation();
      fireworksEngineRef.current.clear();
      // 重新启动动画循环
      fireworksEngineRef.current.startAnimation();
    }
    
    // 重置连击
    if (comboSystemRef.current) {
      comboSystemRef.current.reset();
    }
    dispatch(resetCombo());
    
    setComboState({
      count: 0,
      lastClickTime: 0,
      isActive: false,
      multiplier: 1,
    });
    
    // 重置游戏开始时间
    gameStartTimeRef.current = Date.now();
    
    // 重新启动倒计时引擎
    if (countdownEngineRef.current) {
      countdownEngineRef.current.stop();
      countdownEngineRef.current = new CountdownEngine({
        targetDate: CountdownEngine.getNextLunarNewYear(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        manualOffset: 0,
      });
    }
  }, [dispatch]);

  // 退出游戏
  const handleExit = useCallback(() => {
    // 保存统计数据
    const playTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    if (statisticsTrackerRef.current) {
      statisticsTrackerRef.current.recordPlayTime(playTime);
      statisticsTrackerRef.current.save().catch(console.error);
    }
    
    onExit();
  }, [onExit]);

  return (
    <div className="single-player-game">
      {/* 烟花Canvas - 全屏背景 */}
      <canvas
        ref={canvasRef}
        className="fireworks-canvas"
        onClick={handleMouseClick}
        onTouchStart={handleTouchStart}
        aria-label="点击屏幕燃放烟花"
      />

      {/* 顶部控制栏 */}
      <div className="top-control-bar">
        {/* 倒计时显示 */}
        <div className="countdown-wrapper">
          {enginesReady && countdownEngineRef.current && (
            <CountdownDisplay
              engine={countdownEngineRef.current}
              onCountdownZero={handleCountdownZero}
              skinId={currentSkin.id}
            />
          )}
        </div>

        {/* 控制按钮 */}
        <div className="control-buttons">
          <Button
            variant="ghost"
            size="sm"
            className="control-button-with-label"
            onClick={() => setShowGallery(true)}
            ariaLabel="烟花收藏"
            icon={<span>✨</span>}
          >
            收藏
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="control-button-with-label"
            onClick={() => setShowAchievements(true)}
            ariaLabel="成就"
            icon={<span>🏆</span>}
          >
            成就
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="control-button-with-label"
            onClick={() => setShowStatistics(true)}
            ariaLabel="统计"
            icon={<span>📊</span>}
          >
            统计
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="control-button-with-label mute-button"
            onClick={handleToggleMute}
            ariaLabel={audioConfig.musicMuted ? '取消静音' : '静音'}
            icon={
              audioConfig.musicMuted ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 4L6 8H2v4h4l4 4V4zm6 2l-2 2 2 2-2 2 2 2 2-2-2-2 2-2-2-2z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 4L6 8H2v4h4l4 4V4zm4 6c0-1.5-1-3-2-3.5v7c1-.5 2-2 2-3.5zm2 0c0-2.5-1.5-4.5-3.5-5.5v11c2-.5 3.5-3 3.5-5.5z"/>
                </svg>
              )
            }
          >
            {audioConfig.musicMuted ? '已静音' : '音乐'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="control-button-with-label settings-button"
            onClick={handleOpenSettings}
            ariaLabel="设置"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm8-1l-2-1-1-2-2 1-2-1-2 1-1 2-2 1v2l2 1 1 2 2-1 2 1 2-1 1-2 2-1V5z"/>
              </svg>
            }
          >
            设置
          </Button>
        </div>
      </div>

      {/* 连击显示 */}
      {comboState.isActive && (
        <div className={`combo-display ${comboState.count >= 5 ? 'combo-milestone' : ''} ${comboState.count >= 10 ? 'combo-milestone-10' : ''} ${comboState.count >= 20 ? 'combo-milestone-20' : ''} ${comboState.count >= 50 ? 'combo-milestone-50' : ''} ${comboState.count >= 100 ? 'combo-milestone-100' : ''} ${comboState.count >= 200 ? 'combo-milestone-200' : ''}`}>
          <div className="combo-count">{comboState.count}x</div>
          <div className="combo-label">
            {comboState.count >= 200 ? '传说连击!' : 
             comboState.count >= 100 ? '史诗连击!' : 
             comboState.count >= 50 ? '超级连击!' : 
             comboState.count >= 20 ? '疯狂连击!' : 
             comboState.count >= 10 ? '极限连击!' : 
             comboState.count >= 5 ? '完美连击!' : 
             '连击!'}
          </div>
          {comboState.count >= 5 && (
            <div className="combo-particles" aria-hidden="true">
              {Array.from({ length: Math.min(comboState.count, 20) }).map((_, i) => (
                <div key={i} className="combo-particle" style={{
                  '--delay': `${i * 0.05}s`,
                  '--angle': `${(360 / Math.min(comboState.count, 20)) * i}deg`
                } as React.CSSProperties} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 底部按钮 */}
      <div className="bottom-buttons">
        <Button
          variant="secondary"
          className="game-button restart-button"
          onClick={handleRestart}
          ariaLabel="重新开始"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a6 6 0 1 0 6 6h-2a4 4 0 1 1-4-4V2zm0-2v4l4-4-4-4z"/>
            </svg>
          }
        >
          重新开始
        </Button>
        
        <Button
          variant="ghost"
          className="game-button exit-button"
          onClick={handleExit}
          ariaLabel="退出游戏"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 2v2H2v8h4v2H0V2h6zm4 0l6 6-6 6v-4H6V6h4V2z"/>
            </svg>
          }
        >
          退出
        </Button>
      </div>

      {/* 设置界面 */}
      <SettingsScreen
        isOpen={showSettings}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        audioController={audioControllerRef.current}
        fireworksEngine={fireworksEngineRef.current}
      />

      {/* 烟花收藏画廊 */}
      <FireworkGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        items={collectionItems}
      />

      {/* 成就面板 */}
      <AchievementPanel
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
        achievements={achievements}
      />

      {/* 统计面板 */}
      <StatisticsPanel
        isOpen={showStatistics}
        onClose={() => setShowStatistics(false)}
        statistics={statistics}
      />

      {/* 成就解锁通知 */}
      <AchievementNotification
        achievement={achievementNotification}
        onClose={() => setAchievementNotification(null)}
      />
    </div>
  );
}
