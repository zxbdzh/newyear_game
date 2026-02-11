import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock IndexedDB with persistent storage
const mockStorage = new Map<string, any>();

class MockIDBDatabase {
  objectStoreNames = { contains: () => false };
  createObjectStore() {
    return {
      createIndex: vi.fn()
    };
  }
  transaction() {
    return {
      objectStore: () => ({
        get: (key: string) => {
          const request = { onsuccess: null, onerror: null, result: mockStorage.get(key) || null } as any;
          Promise.resolve().then(() => {
            if (request.onsuccess) {
              request.onsuccess({ target: { result: request.result } });
            }
          });
          return request;
        },
        put: (data: any, key: string) => {
          mockStorage.set(key, data);
          const request = { onsuccess: null, onerror: null } as any;
          Promise.resolve().then(() => {
            if (request.onsuccess) {
              request.onsuccess({ target: { result: undefined } });
            }
          });
          return request;
        },
        clear: () => {
          mockStorage.clear();
          const request = { onsuccess: null, onerror: null } as any;
          Promise.resolve().then(() => {
            if (request.onsuccess) {
              request.onsuccess({ target: { result: undefined } });
            }
          });
          return request;
        },
        delete: (key: string) => {
          mockStorage.delete(key);
          const request = { onsuccess: null, onerror: null } as any;
          Promise.resolve().then(() => {
            if (request.onsuccess) {
              request.onsuccess({ target: { result: undefined } });
            }
          });
          return request;
        },
        openCursor: () => ({ onsuccess: null, onerror: null })
      }),
      error: null,
      onerror: null
    };
  }
  close() {}
}

class MockIDBOpenDBRequest {
  onsuccess: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onupgradeneeded: ((event: any) => void) | null = null;
  result: any = new MockIDBDatabase();

  constructor() {
    // 立即触发成功回调
    Promise.resolve().then(() => {
      if (this.onupgradeneeded) {
        this.onupgradeneeded({ target: { result: this.result } });
      }
      if (this.onsuccess) {
        this.onsuccess({ target: { result: this.result } });
      }
    });
  }
}

beforeAll(() => {
  // Mock IndexedDB
  (global as any).indexedDB = {
    open: () => new MockIDBOpenDBRequest(),
    deleteDatabase: () => new MockIDBOpenDBRequest()
  };

  // Mock Canvas API
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
