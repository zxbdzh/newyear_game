/**
 * 模式选择组件
 * Feature: new-year-fireworks-game
 * 需求：1.3, 1.5, 1.6
 */

import { useState } from 'react';
import { Button } from './Button';
import type { GameMode } from '../types/GameTypes';
import './ModeSelection.css';

interface ModeSelectionProps {
  /** 选择模式的回调 */
  onSelectMode: (mode: GameMode) => void;
  /** 切换静音的回调 */
  onToggleMute: () => void;
  /** 当前静音状态 */
  isMuted: boolean;
  /** 是否在线（影响多人模式可用性） */
  isOnline?: boolean;
}

/**
 * 模式选择组件
 * 提供单人模式和多人模式选择
 */
export function ModeSelection({
  onSelectMode,
  onToggleMute,
  isMuted,
  isOnline = true,
}: ModeSelectionProps) {
  const [hoveredMode, setHoveredMode] = useState<GameMode | null>(null);

  const handleSelectSingle = () => {
    onSelectMode('single');
  };

  const handleSelectMultiplayer = () => {
    if (isOnline) {
      onSelectMode('multiplayer');
    }
  };

  const handleKeyDown = (mode: GameMode, enabled: boolean) => (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && enabled) {
      e.preventDefault();
      onSelectMode(mode);
    }
  };

  return (
    <div className="mode-selection">
      {/* 标题 */}
      <div className="mode-header">
        <h2 className="mode-title">选择游戏模式</h2>
        <p className="mode-subtitle">开始你的新年烟花之旅</p>
      </div>

      {/* 模式选择卡片 */}
      <div className="mode-cards">
        {/* 单人模式卡片 */}
        <div
          className={`mode-card single-mode ${hoveredMode === 'single' ? 'hovered' : ''}`}
          onClick={handleSelectSingle}
          onMouseEnter={() => setHoveredMode('single')}
          onMouseLeave={() => setHoveredMode(null)}
          onKeyDown={handleKeyDown('single', true)}
          role="button"
          tabIndex={0}
          aria-label="选择单人模式"
        >
          <div className="card-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor">
              <path d="M24 4l4 12h12l-10 8 4 12-10-8-10 8 4-12-10-8h12z"/>
            </svg>
          </div>
          <h3 className="card-title">单人模式</h3>
          <p className="card-description">
            独自享受烟花盛宴
            <br />
            收集样式，追踪成就
          </p>
          <div className="card-features">
            <span className="feature-tag">✨ 烟花收藏</span>
            <span className="feature-tag">🏆 成就系统</span>
            <span className="feature-tag">📊 统计追踪</span>
          </div>
          <div className="card-glow"></div>
        </div>

        {/* 多人模式卡片 */}
        <div
          className={`mode-card multiplayer-mode ${hoveredMode === 'multiplayer' ? 'hovered' : ''} ${!isOnline ? 'disabled' : ''}`}
          onClick={handleSelectMultiplayer}
          onMouseEnter={() => isOnline && setHoveredMode('multiplayer')}
          onMouseLeave={() => setHoveredMode(null)}
          onKeyDown={handleKeyDown('multiplayer', isOnline)}
          role="button"
          tabIndex={isOnline ? 0 : -1}
          aria-label={isOnline ? '选择多人模式' : '多人模式（网络离线不可用）'}
          aria-disabled={!isOnline}
        >
          <div className="card-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor">
              <circle cx="16" cy="12" r="6"/>
              <circle cx="32" cy="12" r="6"/>
              <path d="M16 20c-5 0-9 4-9 9v3h18v-3c0-5-4-9-9-9z"/>
              <path d="M32 20c-5 0-9 4-9 9v3h18v-3c0-5-4-9-9-9z"/>
            </svg>
          </div>
          <h3 className="card-title">多人模式</h3>
          <p className="card-description">
            与好友共庆新年
            <br />
            实时同步，欢乐共享
          </p>
          <div className="card-features">
            <span className="feature-tag">👥 最多20人</span>
            <span className="feature-tag">🏅 排行榜</span>
            <span className="feature-tag">💬 快速祝福</span>
          </div>
          {!isOnline && (
            <div className="card-overlay">
              <span className="offline-notice">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                  <path d="M0 8l2-2 2 2-2 2-2-2zm6-4l2-2 2 2-2 2-2-2zm4 8l2-2 2 2-2 2-2-2z"/>
                </svg>
                网络离线
              </span>
            </div>
          )}
          <div className="card-glow"></div>
        </div>
      </div>

      {/* 静音按钮 */}
      <Button
        variant="ghost"
        size="sm"
        className={`mute-button ${isMuted ? 'muted' : ''}`}
        onClick={onToggleMute}
        ariaLabel={isMuted ? '取消静音' : '静音'}
        icon={
          isMuted ? (
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
        {isMuted ? '已静音' : '音乐开启'}
      </Button>
    </div>
  );
}
