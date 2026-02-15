/**
 * 文本对比度检查工具
 * 用于验证颜色组合是否符合WCAG AA标准（4.5:1对比度）
 */

/**
 * 将十六进制颜色转换为RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * 计算相对亮度
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 计算对比度
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format');
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 检查对比度是否符合WCAG AA标准
 */
export function meetsWCAGAA(color1: string, color2: string): boolean {
  const ratio = getContrastRatio(color1, color2);
  return ratio >= 4.5;
}

/**
 * 检查对比度是否符合WCAG AAA标准
 */
export function meetsWCAGAAA(color1: string, color2: string): boolean {
  const ratio = getContrastRatio(color1, color2);
  return ratio >= 7;
}

/**
 * 设计令牌中的颜色定义
 */
export const DESIGN_COLORS = {
  // 主色
  primary: '#DC143C',
  primaryLight: '#FF6B6B',
  primaryDark: '#8B0000',

  // 次色
  secondary: '#FFD700',
  secondaryLight: '#FFED4E',
  secondaryDark: '#B8860B',

  // 强调色
  accent: '#FF6347',

  // 中性色
  neutral100: '#FFFFFF',
  neutral200: '#F5F5F5',
  neutral300: '#E0E0E0',
  neutral400: '#BDBDBD',
  neutral500: '#9E9E9E',
  neutral600: '#757575',
  neutral700: '#616161',
  neutral800: '#424242',
  neutral900: '#212121',

  // 语义色 (WCAG AA compliant)
  success: '#2E7D32',
  warning: '#BF360C',
  error: '#C62828',
  info: '#1565C0',
};

/**
 * 关键的文本/背景组合
 */
export const CRITICAL_COMBINATIONS = [
  // 按钮文本
  { name: 'Primary Button Text', text: DESIGN_COLORS.neutral100, bg: DESIGN_COLORS.primary },
  { name: 'Secondary Button Text', text: DESIGN_COLORS.neutral900, bg: DESIGN_COLORS.secondary },
  { name: 'Ghost Button Text', text: DESIGN_COLORS.neutral100, bg: '#1a0a0a' }, // 深色背景

  // 一般文本
  { name: 'White on Dark Background', text: DESIGN_COLORS.neutral100, bg: DESIGN_COLORS.neutral900 },
  { name: 'Dark on Light Background', text: DESIGN_COLORS.neutral900, bg: DESIGN_COLORS.neutral100 },

  // 状态文本
  { name: 'Success Text', text: DESIGN_COLORS.success, bg: DESIGN_COLORS.neutral100 },
  { name: 'Warning Text', text: DESIGN_COLORS.warning, bg: DESIGN_COLORS.neutral100 },
  { name: 'Error Text', text: DESIGN_COLORS.error, bg: DESIGN_COLORS.neutral100 },
  { name: 'Info Text', text: DESIGN_COLORS.info, bg: DESIGN_COLORS.neutral100 },
];

/**
 * 验证所有关键组合
 */
export function validateAllCombinations(): {
  passed: Array<{ name: string; ratio: number }>;
  failed: Array<{ name: string; ratio: number; required: number }>;
} {
  const passed: Array<{ name: string; ratio: number }> = [];
  const failed: Array<{ name: string; ratio: number; required: number }> = [];

  CRITICAL_COMBINATIONS.forEach((combo) => {
    const ratio = getContrastRatio(combo.text, combo.bg);
    if (ratio >= 4.5) {
      passed.push({ name: combo.name, ratio });
    } else {
      failed.push({ name: combo.name, ratio, required: 4.5 });
    }
  });

  return { passed, failed };
}
