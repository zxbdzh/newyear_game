/**
 * 玩家通知组件 (PlayerNotification)
 * Feature: new-year-fireworks-game
 * 
 * 显示玩家燃放烟花的通知消息
 * 
 * 验证需求：5.4
 */

import React, { useEffect, useState } from 'react';
import './PlayerNotification.css';

interface PlayerNotificationProps {
  /** 玩家昵称 */
  playerNickname: string;
  /** 通知时间戳 */
  timestamp: number;
  /** 显示持续时间（毫秒），默认1秒 */
  duration?: number;
  /** 通知消失回调 */
  onDismiss?: () => void;
}

/**
 * 玩家通知组件
 * 显示"[昵称] 燃放了烟花！"消息，持续1秒后自动消失
 */
export const PlayerNotification: React.FC<PlayerNotificationProps> = ({
  playerNickname,
  timestamp,
  duration = 1000,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // 设置自动消失定时器
    const timer = setTimeout(() => {
      setVisible(false);
      if (onDismiss) {
        onDismiss();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, timestamp]); // 使用 timestamp 而不是 onDismiss

  if (!visible) {
    return null;
  }

  return (
    <div className="player-notification" data-testid="player-notification">
      <span className="player-notification-text">
        [{playerNickname}] 燃放了烟花！
      </span>
    </div>
  );
};
