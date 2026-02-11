/**
 * 启动界面组件
 * Feature: new-year-fireworks-game
 * 需求：1.1, 1.2, 1.4
 */

import { useEffect, useState } from 'react';
import './LaunchScreen.css';

interface LaunchScreenProps {
  /** 点击开始的回调 */
  onStart: () => void;
  /** 音频控制器引用（用于用户交互后播放音乐） */
  onAudioUnlock?: () => void;
}

/**
 * 启动界面组件
 * 显示新年主题背景、飘雪动画、网络状态检测
 */
export function LaunchScreen({ onStart, onAudioUnlock }: LaunchScreenProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [snowflakes] = useState(() => 
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 5 + Math.random() * 5,
    }))
  );

  useEffect(() => {
    // 监听网络状态变化
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleStart = () => {
    // 解锁音频（处理浏览器自动播放限制）
    if (onAudioUnlock) {
      onAudioUnlock();
    }
    onStart();
  };

  return (
    <div className="launch-screen">
      {/* 新年主题背景 */}
      <div className="launch-background">
        {/* 红灯笼装饰 */}
        <div className="lantern lantern-left"></div>
        <div className="lantern lantern-right"></div>
        
        {/* 对联装饰 */}
        <div className="couplet couplet-left">
          <span>爆竹声中辞旧岁</span>
        </div>
        <div className="couplet couplet-right">
          <span>烟花绽放迎新春</span>
        </div>
      </div>

      {/* 飘雪动画 */}
      <div className="snowflakes" aria-hidden="true">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="snowflake"
            style={{
              left: `${flake.left}%`,
              animationDelay: `${flake.animationDelay}s`,
              animationDuration: `${flake.animationDuration}s`,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      {/* 主要内容 */}
      <div className="launch-content">
        <h1 className="launch-title">新年烟花游戏</h1>
        <p className="launch-subtitle">点燃烟花，迎接新年</p>
        
        {/* 点击开始按钮 */}
        <button className="launch-button" onClick={handleStart}>
          <span className="button-text">点击开始</span>
          <span className="button-glow"></span>
        </button>

        {/* 网络状态指示器 */}
        <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
          <span className="status-icon">{isOnline ? '🌐' : '📡'}</span>
          <span className="status-text">
            {isOnline ? '多人模式可用' : '网络离线 - 仅单人模式'}
          </span>
        </div>
      </div>
    </div>
  );
}
