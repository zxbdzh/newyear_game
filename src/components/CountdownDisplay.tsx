/**
 * 倒计时显示组件
 * Feature: new-year-fireworks-game
 * 需求：2.1, 2.3, 2.5
 */

import { useEffect, useState, useCallback } from 'react';
import { CountdownEngine } from '../engines/CountdownEngine';
import type { CountdownTime } from '../types';
import './CountdownDisplay.css';

interface CountdownDisplayProps {
  /** 倒计时引擎实例 */
  engine: CountdownEngine;
  /** 倒计时归零时的回调 */
  onCountdownZero?: () => void;
}

/**
 * 倒计时显示组件
 * 以3D渲染方式显示距离农历新年的剩余时间
 */
export function CountdownDisplay({ engine, onCountdownZero }: CountdownDisplayProps) {
  const [time, setTime] = useState<CountdownTime>(engine.getCurrentTime());
  const [showCalibration, setShowCalibration] = useState(false);
  const [offsetInput, setOffsetInput] = useState('0');
  const [isLessThanOneHour, setIsLessThanOneHour] = useState(false);

  // 更新倒计时显示
  const handleTimeUpdate = useCallback((newTime: CountdownTime) => {
    setTime(newTime);
    
    // 检查是否少于1小时
    const lessThanHour = newTime.totalSeconds < 3600 && newTime.totalSeconds > 0;
    setIsLessThanOneHour(lessThanHour);
    
    // 检查是否归零
    if (newTime.totalSeconds === 0 && onCountdownZero) {
      onCountdownZero();
    }
  }, [onCountdownZero]);

  useEffect(() => {
    // 注册更新回调
    engine.onUpdate(handleTimeUpdate);
    
    // 启动倒计时
    engine.start();
    
    // 清理
    return () => {
      engine.offUpdate(handleTimeUpdate);
      engine.stop();
    };
  }, [engine, handleTimeUpdate]);

  // 打开校准对话框
  const handleOpenCalibration = () => {
    setShowCalibration(true);
  };

  // 关闭校准对话框
  const handleCloseCalibration = () => {
    setShowCalibration(false);
    setOffsetInput('0');
  };

  // 应用时间校准
  const handleApplyCalibration = () => {
    const offset = parseInt(offsetInput, 10);
    if (!isNaN(offset)) {
      engine.setManualOffset(offset);
    }
    handleCloseCalibration();
  };

  // 格式化数字为两位数
  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  return (
    <div className="countdown-display">
      {/* 倒计时标题 */}
      <div className="countdown-title">新年倒计时：</div>
      
      {/* 3D倒计时文本 */}
      <div className={`countdown-container ${isLessThanOneHour ? 'urgent' : ''}`}>
        {/* 天数 */}
        <div className="time-unit">
          <div className="time-value time-3d">{formatNumber(time.days)}</div>
          <div className="time-label">天</div>
        </div>
        
        <div className="time-separator">:</div>
        
        {/* 小时 */}
        <div className="time-unit">
          <div className="time-value time-3d">{formatNumber(time.hours)}</div>
          <div className="time-label">小时</div>
        </div>
        
        <div className="time-separator">:</div>
        
        {/* 分钟 */}
        <div className="time-unit">
          <div className="time-value time-3d">{formatNumber(time.minutes)}</div>
          <div className="time-label">分钟</div>
        </div>
        
        <div className="time-separator">:</div>
        
        {/* 秒 */}
        <div className="time-unit">
          <div className="time-value time-3d">{formatNumber(time.seconds)}</div>
          <div className="time-label">秒</div>
        </div>
      </div>

      {/* 校准按钮 */}
      <button 
        className="calibration-button" 
        onClick={handleOpenCalibration}
        aria-label="时间校准"
      >
        ⚙️ 校准
      </button>

      {/* 校准对话框 */}
      {showCalibration && (
        <div className="calibration-dialog-overlay" onClick={handleCloseCalibration}>
          <div className="calibration-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">时间校准</h3>
            <p className="dialog-description">
              输入偏移秒数（正数提前，负数延后）
            </p>
            
            <input
              type="number"
              className="calibration-input"
              value={offsetInput}
              onChange={(e) => setOffsetInput(e.target.value)}
              placeholder="0"
              autoFocus
            />
            
            <div className="dialog-actions">
              <button 
                className="dialog-button dialog-button-cancel" 
                onClick={handleCloseCalibration}
              >
                取消
              </button>
              <button 
                className="dialog-button dialog-button-confirm" 
                onClick={handleApplyCalibration}
              >
                应用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
