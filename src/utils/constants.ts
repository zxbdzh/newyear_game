// 游戏常量定义

// 房间配置
export const MAX_PLAYERS = 20;
export const ROOM_CODE_LENGTH = 4;

// 连击配置
export const COMBO_TIME_WINDOW = 3000; // 3秒
export const MIN_COMBO_CLICKS = 2;

// 烟花配置
export const DEFAULT_FIREWORK_DURATION = 2500; // 2.5秒
export const MIN_FIREWORK_DURATION = 2000; // 2秒
export const MAX_FIREWORK_DURATION = 3000; // 3秒

// 网络配置
export const MAX_RECONNECT_ATTEMPTS = 3;
export const RECONNECT_INTERVAL = 5000; // 5秒
export const HIGH_LATENCY_THRESHOLD = 3000; // 3秒

// 性能配置
export const TARGET_FPS_LOW = 30;
export const TARGET_FPS_HIGH = 60;
export const FPS_CHECK_INTERVAL = 5000; // 5秒

// 昵称验证
export const MIN_NICKNAME_LENGTH = 1;
export const MAX_NICKNAME_LENGTH = 8;

// 特殊事件
export const TEN_MINUTE_COUNTDOWN = 600; // 10分钟（秒）
