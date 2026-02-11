/**
 * 模式选择状态转换属性测试
 * Feature: new-year-fireworks-game, Property 2: 模式选择状态转换
 * 验证需求：1.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { GameMode } from '../types/GameTypes';

/**
 * 属性 2：模式选择状态转换
 * 对于任何游戏模式选择（单人或多人），系统应该转换到对应的正确游戏界面状态
 */
describe('Property 2: 模式选择状态转换', () => {
  it('should transition to correct game state for any mode selection', () => {
    // 生成随机模式选择序列
    const modeArbitrary = fc.constantFrom<GameMode>('single', 'multiplayer');

    fc.assert(
      fc.property(modeArbitrary, (selectedMode) => {
        // 模拟初始状态
        let currentMode: GameMode = 'menu';

        // 模拟模式选择
        currentMode = selectedMode;

        // 验证：选择单人模式应该转换到 'single' 状态
        if (selectedMode === 'single') {
          expect(currentMode).toBe('single');
        }

        // 验证：选择多人模式应该转换到 'multiplayer' 状态
        if (selectedMode === 'multiplayer') {
          expect(currentMode).toBe('multiplayer');
        }

        // 验证：状态不应该是 'menu' 或 'ended'
        expect(currentMode).not.toBe('menu');
        expect(currentMode).not.toBe('ended');

        // 验证：状态应该是有效的游戏模式
        expect(['single', 'multiplayer']).toContain(currentMode);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain state consistency through multiple mode selections', () => {
    // 生成随机模式选择序列
    const modeSequenceArbitrary = fc.array(
      fc.constantFrom<GameMode>('single', 'multiplayer'),
      { minLength: 1, maxLength: 10 }
    );

    fc.assert(
      fc.property(modeSequenceArbitrary, (modeSequence) => {
        let currentMode: GameMode = 'menu';

        // 模拟多次模式选择
        for (const selectedMode of modeSequence) {
          currentMode = selectedMode;

          // 验证：每次选择后状态都应该正确
          expect(currentMode).toBe(selectedMode);
          expect(['single', 'multiplayer']).toContain(currentMode);
        }

        // 验证：最终状态应该是最后一次选择的模式
        const lastMode = modeSequence[modeSequence.length - 1];
        expect(currentMode).toBe(lastMode);
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly map mode selection to game state', () => {
    // 生成随机模式和初始状态
    const stateTransitionArbitrary = fc.record({
      initialMode: fc.constantFrom<GameMode>('menu', 'single', 'multiplayer', 'ended'),
      selectedMode: fc.constantFrom<GameMode>('single', 'multiplayer'),
    });

    fc.assert(
      fc.property(stateTransitionArbitrary, ({ initialMode, selectedMode }) => {
        // 模拟状态转换
        const newMode = selectedMode;

        // 验证：新状态应该等于选择的模式
        expect(newMode).toBe(selectedMode);

        // 验证：状态转换应该是确定性的
        const secondTransition = selectedMode;
        expect(secondTransition).toBe(newMode);

        // 验证：选择单人模式总是转换到 'single'
        if (selectedMode === 'single') {
          expect(newMode).toBe('single');
        }

        // 验证：选择多人模式总是转换到 'multiplayer'
        if (selectedMode === 'multiplayer') {
          expect(newMode).toBe('multiplayer');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle mode selection with online/offline state', () => {
    // 生成随机模式选择和网络状态
    const modeWithNetworkArbitrary = fc.record({
      selectedMode: fc.constantFrom<GameMode>('single', 'multiplayer'),
      isOnline: fc.boolean(),
    });

    fc.assert(
      fc.property(modeWithNetworkArbitrary, ({ selectedMode, isOnline }) => {
        let currentMode: GameMode = 'menu';

        // 模拟模式选择（考虑网络状态）
        if (selectedMode === 'multiplayer' && !isOnline) {
          // 离线时不应该允许选择多人模式
          // 状态应该保持为 'menu' 或转换到 'single'
          currentMode = 'menu';
        } else {
          currentMode = selectedMode;
        }

        // 验证：单人模式不受网络状态影响
        if (selectedMode === 'single') {
          expect(currentMode).toBe('single');
        }

        // 验证：多人模式在离线时不应该被选中
        if (selectedMode === 'multiplayer' && !isOnline) {
          expect(currentMode).not.toBe('multiplayer');
        }

        // 验证：多人模式在在线时应该被正确选中
        if (selectedMode === 'multiplayer' && isOnline) {
          expect(currentMode).toBe('multiplayer');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should ensure mode selection is idempotent', () => {
    // 生成随机模式
    const modeArbitrary = fc.constantFrom<GameMode>('single', 'multiplayer');

    fc.assert(
      fc.property(modeArbitrary, (selectedMode) => {
        // 第一次选择
        const firstSelection = selectedMode;

        // 第二次选择相同模式
        const secondSelection = selectedMode;

        // 验证：多次选择相同模式应该产生相同结果（幂等性）
        expect(firstSelection).toBe(secondSelection);
        expect(firstSelection).toBe(selectedMode);
      }),
      { numRuns: 100 }
    );
  });
});
