import { afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Canvas API
beforeAll(() => {
  // Mock HTMLCanvasElement.getContext
  HTMLCanvasElement.prototype.getContext = function(contextId: string) {
    if (contextId === '2d') {
      return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        globalAlpha: 1,
        font: '',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        save: () => {},
        restore: () => {},
        fillText: () => {},
        strokeText: () => {},
        measureText: () => ({ width: 0 }),
      } as any;
    }
    return null;
  };
});

// 每个测试后清理
afterEach(() => {
  cleanup();
});
