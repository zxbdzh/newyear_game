/**
 * 统计数据类型定义
 * Feature: new-year-fireworks-game
 */

/**
 * 玩家统计数据
 */
export interface PlayerStatistics {
  /** 总点击次数 */
  totalClicks: number;
  /** 最高连击数 */
  maxCombo: number;
  /** 已解锁烟花集合 */
  unlockedFireworks: Set<string>;
  /** 总游戏时长（秒） */
  totalPlayTime: number;
  /** 已解锁成就集合 */
  achievementsUnlocked: Set<string>;
  /** 最后游玩时间 */
  lastPlayedAt: number;
}
