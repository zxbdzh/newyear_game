/**
 * 倒计时引擎
 * Feature: new-year-fireworks-game
 * 
 * 计算并显示距离农历新年的剩余时间
 * 需求：2.1, 2.2, 2.4, 2.5
 */

import { Lunar } from 'lunar-javascript';
import type { CountdownTime, CountdownConfig } from '../types';

/**
 * 倒计时引擎类
 */
export class CountdownEngine {
  private config: CountdownConfig;
  private intervalId: number | null = null;
  private callbacks: Set<(time: CountdownTime) => void> = new Set();

  /**
   * 构造函数
   * 
   * @param config - 倒计时配置
   */
  constructor(config: CountdownConfig) {
    // 如果目标日期是当前日期或已过期，自动设置为下一个农历新年
    const targetDate = new Date(config.targetDate);
    const now = new Date();
    
    if (targetDate <= now) {
      config.targetDate = CountdownEngine.getNextLunarNewYear();
    }
    
    this.config = config;
  }

  /**
   * 获取下一个农历新年日期
   * 
   * @returns 下一个农历新年的Date对象
   */
  static getNextLunarNewYear(): Date {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // 获取当前年份的农历正月初一
    const lunar = Lunar.fromYmd(currentYear, 1, 1);
    const solar = lunar.getSolar();
    let lunarNewYear = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
    
    // 如果今年的农历新年已经过去，获取下一年的
    if (lunarNewYear <= now) {
      const nextLunar = Lunar.fromYmd(currentYear + 1, 1, 1);
      const nextSolar = nextLunar.getSolar();
      lunarNewYear = new Date(nextSolar.getYear(), nextSolar.getMonth() - 1, nextSolar.getDay());
    }
    
    return lunarNewYear;
  }

  /**
   * 开始倒计时
   * 每秒更新一次
   */
  start(): void {
    if (this.intervalId !== null) {
      return; // 已经在运行
    }

    // 立即执行一次
    this.updateAndNotify();

    // 每秒更新
    this.intervalId = window.setInterval(() => {
      this.updateAndNotify();
    }, 1000);
  }

  /**
   * 停止倒计时
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 更新并通知所有回调
   */
  private updateAndNotify(): void {
    const time = this.getCurrentTime();
    this.callbacks.forEach(callback => callback(time));
  }

  /**
   * 获取当前剩余时间
   * 
   * @returns 倒计时时间对象
   */
  getCurrentTime(): CountdownTime {
    const now = new Date();
    const target = new Date(this.config.targetDate);
    
    // 应用手动偏移
    const adjustedNow = new Date(now.getTime() - this.config.manualOffset * 1000);
    
    // 计算时间差（毫秒）
    const diff = target.getTime() - adjustedNow.getTime();
    
    // 如果已经到达或超过目标时间
    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0
      };
    }
    
    // 计算各个时间单位
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds
    };
  }

  /**
   * 设置手动时间偏移
   * 
   * @param seconds - 偏移秒数（正数表示提前，负数表示延后）
   */
  setManualOffset(seconds: number): void {
    this.config.manualOffset = seconds;
    // 立即更新
    if (this.intervalId !== null) {
      this.updateAndNotify();
    }
  }

  /**
   * 注册时间更新回调
   * 
   * @param callback - 回调函数
   */
  onUpdate(callback: (time: CountdownTime) => void): void {
    this.callbacks.add(callback);
  }

  /**
   * 移除时间更新回调
   * 
   * @param callback - 回调函数
   */
  offUpdate(callback: (time: CountdownTime) => void): void {
    this.callbacks.delete(callback);
  }

  /**
   * 检查是否少于1小时
   * 
   * @returns 是否少于1小时
   */
  isLessThanOneHour(): boolean {
    const time = this.getCurrentTime();
    return time.totalSeconds < 3600 && time.totalSeconds > 0;
  }

  /**
   * 检查是否到达零点
   * 
   * @returns 是否到达零点
   */
  isZero(): boolean {
    const time = this.getCurrentTime();
    return time.totalSeconds === 0;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stop();
    this.callbacks.clear();
  }
}
