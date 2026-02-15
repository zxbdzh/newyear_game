import { describe, it, expect } from 'vitest';
import {
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  validateAllCombinations,
  DESIGN_COLORS,
  CRITICAL_COMBINATIONS,
} from './contrastChecker';

describe('Contrast Checker', () => {
  describe('getContrastRatio', () => {
    it('should calculate correct contrast ratio for black and white', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeCloseTo(21, 1); // 最大对比度
    });

    it('should calculate correct contrast ratio for same colors', () => {
      const ratio = getContrastRatio('#FFFFFF', '#FFFFFF');
      expect(ratio).toBeCloseTo(1, 1); // 最小对比度
    });

    it('should handle colors in any order', () => {
      const ratio1 = getContrastRatio('#000000', '#FFFFFF');
      const ratio2 = getContrastRatio('#FFFFFF', '#000000');
      expect(ratio1).toBe(ratio2);
    });
  });

  describe('meetsWCAGAA', () => {
    it('should return true for sufficient contrast (4.5:1)', () => {
      // 白色文本在深红色背景上
      expect(meetsWCAGAA('#FFFFFF', '#8B0000')).toBe(true);
    });

    it('should return false for insufficient contrast', () => {
      // 浅灰色文本在白色背景上
      expect(meetsWCAGAA('#E0E0E0', '#FFFFFF')).toBe(false);
    });
  });

  describe('meetsWCAGAAA', () => {
    it('should return true for excellent contrast (7:1)', () => {
      expect(meetsWCAGAAA('#000000', '#FFFFFF')).toBe(true);
    });

    it('should return false for good but not excellent contrast', () => {
      // 4.5:1 对比度，符合AA但不符合AAA
      expect(meetsWCAGAAA('#767676', '#FFFFFF')).toBe(false);
    });
  });

  describe('Design Token Colors', () => {
    it('should have all required color definitions', () => {
      expect(DESIGN_COLORS.primary).toBeDefined();
      expect(DESIGN_COLORS.secondary).toBeDefined();
      expect(DESIGN_COLORS.neutral100).toBeDefined();
      expect(DESIGN_COLORS.neutral900).toBeDefined();
    });
  });

  describe('Critical Combinations Validation', () => {
    it('should validate all critical text/background combinations', () => {
      const results = validateAllCombinations();

      console.log('\n=== 文本对比度验证报告 ===\n');

      console.log('✅ 通过的组合 (符合WCAG AA标准 ≥4.5:1):');
      results.passed.forEach((item) => {
        console.log(`  - ${item.name}: ${item.ratio.toFixed(2)}:1`);
      });

      if (results.failed.length > 0) {
        console.log('\n❌ 未通过的组合 (不符合WCAG AA标准):');
        results.failed.forEach((item) => {
          console.log(
            `  - ${item.name}: ${item.ratio.toFixed(2)}:1 (需要 ≥${item.required}:1)`
          );
        });
      }

      console.log(`\n总计: ${results.passed.length} 通过, ${results.failed.length} 失败\n`);

      // 断言：所有关键组合都应该通过
      expect(results.failed.length).toBe(0);
    });

    it('should verify primary button text contrast', () => {
      const combo = CRITICAL_COMBINATIONS.find((c) => c.name === 'Primary Button Text');
      expect(combo).toBeDefined();

      const ratio = getContrastRatio(combo!.text, combo!.bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should verify secondary button text contrast', () => {
      const combo = CRITICAL_COMBINATIONS.find((c) => c.name === 'Secondary Button Text');
      expect(combo).toBeDefined();

      const ratio = getContrastRatio(combo!.text, combo!.bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should verify ghost button text contrast', () => {
      const combo = CRITICAL_COMBINATIONS.find((c) => c.name === 'Ghost Button Text');
      expect(combo).toBeDefined();

      const ratio = getContrastRatio(combo!.text, combo!.bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should verify white text on dark background', () => {
      const combo = CRITICAL_COMBINATIONS.find((c) => c.name === 'White on Dark Background');
      expect(combo).toBeDefined();

      const ratio = getContrastRatio(combo!.text, combo!.bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should verify semantic color contrasts', () => {
      const semanticCombos = CRITICAL_COMBINATIONS.filter((c) =>
        ['Success Text', 'Warning Text', 'Error Text', 'Info Text'].includes(c.name)
      );

      semanticCombos.forEach((combo) => {
        const ratio = getContrastRatio(combo.text, combo.bg);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('Individual Color Pair Tests', () => {
    it('should verify primary color on white background', () => {
      const ratio = getContrastRatio(DESIGN_COLORS.primary, DESIGN_COLORS.neutral100);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should verify secondary color on dark background', () => {
      const ratio = getContrastRatio(DESIGN_COLORS.secondary, DESIGN_COLORS.neutral900);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should verify neutral colors have sufficient contrast', () => {
      // 浅色文本在深色背景
      const ratio1 = getContrastRatio(DESIGN_COLORS.neutral200, DESIGN_COLORS.neutral900);
      expect(ratio1).toBeGreaterThanOrEqual(4.5);

      // 深色文本在浅色背景
      const ratio2 = getContrastRatio(DESIGN_COLORS.neutral800, DESIGN_COLORS.neutral100);
      expect(ratio2).toBeGreaterThanOrEqual(4.5);
    });
  });
});
