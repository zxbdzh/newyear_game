/**
 * ScreenshotSharer 单元测试
 * Feature: new-year-fireworks-game
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScreenshotSharer, createScreenshotSharer } from './ScreenshotSharer';

describe('ScreenshotSharer', () => {
  let canvas: HTMLCanvasElement;
  let sharer: ScreenshotSharer;

  beforeEach(() => {
    // 创建模拟Canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // 绘制一些内容
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 100, 100);
    }

    sharer = new ScreenshotSharer(canvas);
  });

  describe('captureAsDataURL', () => {
    it('应该返回DataURL字符串', () => {
      const dataURL = sharer.captureAsDataURL();

      expect(dataURL).toBeTypeOf('string');
      expect(dataURL).toMatch(/^data:image\/(png|jpeg|webp);base64,/);
    });

    it('应该支持PNG格式', () => {
      const dataURL = sharer.captureAsDataURL({ format: 'image/png' });

      expect(dataURL).toMatch(/^data:image\/png;base64,/);
    });

    it('应该支持JPEG格式', () => {
      const dataURL = sharer.captureAsDataURL({ format: 'image/jpeg' });

      expect(dataURL).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('应该支持WebP格式', () => {
      const dataURL = sharer.captureAsDataURL({ format: 'image/webp' });

      expect(dataURL).toMatch(/^data:image\/webp;base64,/);
    });
  });

  describe('captureAsBlob', () => {
    it('应该返回Blob对象', async () => {
      const blob = await sharer.captureAsBlob();

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toMatch(/^image\/(png|jpeg|webp)$/);
    });

    it('应该支持PNG格式', async () => {
      const blob = await sharer.captureAsBlob({ format: 'image/png' });

      expect(blob.type).toBe('image/png');
    });

    it('应该支持JPEG格式', async () => {
      const blob = await sharer.captureAsBlob({ format: 'image/jpeg' });

      expect(blob.type).toBe('image/jpeg');
    });

    it('应该支持WebP格式', async () => {
      const blob = await sharer.captureAsBlob({ format: 'image/webp' });

      expect(blob.type).toBe('image/webp');
    });

    it('应该在toBlob失败时抛出错误', async () => {
      // Mock toBlob to return null
      const originalToBlob = canvas.toBlob;
      canvas.toBlob = vi.fn((callback) => {
        callback(null);
      }) as any;

      await expect(sharer.captureAsBlob()).rejects.toThrow(
        'Failed to create blob from canvas'
      );

      canvas.toBlob = originalToBlob;
    });
  });

  describe('download', () => {
    let createElementSpy: any;
    let appendChildSpy: any;
    let removeChildSpy: any;
    let createObjectURLSpy: any;
    let revokeObjectURLSpy: any;

    beforeEach(() => {
      // Mock DOM methods
      createElementSpy = vi.spyOn(document, 'createElement');
      appendChildSpy = vi.spyOn(document.body, 'appendChild');
      removeChildSpy = vi.spyOn(document.body, 'removeChild');
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('应该创建下载链接并触发下载', async () => {
      await sharer.download();

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('应该使用自定义文件名', async () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
      };

      createElementSpy.mockReturnValue(mockLink);

      await sharer.download({ filename: 'custom-name.png' });

      expect(mockLink.download).toBe('custom-name.png');
    });

    it('应该使用默认文件名（包含时间戳）', async () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
      };

      createElementSpy.mockReturnValue(mockLink);

      await sharer.download();

      expect(mockLink.download).toMatch(/^fireworks-\d+\.png$/);
    });

    it('应该根据格式使用正确的文件扩展名', async () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
      };

      createElementSpy.mockReturnValue(mockLink);

      await sharer.download({ format: 'image/jpeg' });
      expect(mockLink.download).toMatch(/\.jpg$/);

      await sharer.download({ format: 'image/webp' });
      expect(mockLink.download).toMatch(/\.webp$/);
    });
  });

  describe('share', () => {
    it('应该在不支持Web Share API时抛出错误', async () => {
      // Mock navigator.share to be undefined
      const originalShare = navigator.share;
      (navigator as any).share = undefined;

      await expect(
        sharer.share()
      ).rejects.toThrow('Web Share API is not supported in this browser');

      (navigator as any).share = originalShare;
    });

    it('应该在支持时调用navigator.share', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      const mockCanShare = vi.fn().mockReturnValue(true);

      (navigator as any).share = mockShare;
      (navigator as any).canShare = mockCanShare;

      await sharer.share({
        title: '测试标题',
        text: '测试文本',
      });

      expect(mockShare).toHaveBeenCalled();
      expect(mockShare.mock.calls[0][0]).toMatchObject({
        title: '测试标题',
        text: '测试文本',
      });
    });

    it('应该在用户取消分享时不抛出错误', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';

      const mockShare = vi.fn().mockRejectedValue(abortError);
      const mockCanShare = vi.fn().mockReturnValue(true);

      (navigator as any).share = mockShare;
      (navigator as any).canShare = mockCanShare;

      await expect(sharer.share()).resolves.toBeUndefined();
    });
  });

  describe('isShareSupported', () => {
    it('应该在支持Web Share API时返回true', () => {
      const originalShare = navigator.share;
      const originalCanShare = (navigator as any).canShare;

      (navigator as any).share = vi.fn();
      (navigator as any).canShare = vi.fn();

      expect(sharer.isShareSupported()).toBe(true);

      (navigator as any).share = originalShare;
      (navigator as any).canShare = originalCanShare;
    });

    it('应该在不支持Web Share API时返回false', () => {
      const originalShare = navigator.share;
      const originalCanShare = (navigator as any).canShare;

      (navigator as any).share = undefined;
      (navigator as any).canShare = undefined;

      expect(sharer.isShareSupported()).toBe(false);

      (navigator as any).share = originalShare;
      (navigator as any).canShare = originalCanShare;
    });
  });

  describe('canShareFiles', () => {
    it('应该在支持文件分享时返回true', () => {
      const mockCanShare = vi.fn().mockReturnValue(true);

      (navigator as any).share = vi.fn();
      (navigator as any).canShare = mockCanShare;

      expect(sharer.canShareFiles()).toBe(true);
    });

    it('应该在不支持文件分享时返回false', () => {
      const mockCanShare = vi.fn().mockReturnValue(false);

      (navigator as any).share = vi.fn();
      (navigator as any).canShare = mockCanShare;

      expect(sharer.canShareFiles()).toBe(false);
    });

    it('应该在不支持Web Share API时返回false', () => {
      const originalShare = navigator.share;
      const originalCanShare = (navigator as any).canShare;

      (navigator as any).share = undefined;
      (navigator as any).canShare = undefined;

      expect(sharer.canShareFiles()).toBe(false);

      (navigator as any).share = originalShare;
      (navigator as any).canShare = originalCanShare;
    });
  });

  describe('copyToClipboard', () => {
    it('应该在不支持Clipboard API时抛出错误', async () => {
      const originalClipboard = navigator.clipboard;
      (navigator as any).clipboard = undefined;

      await expect(
        sharer.copyToClipboard()
      ).rejects.toThrow('Clipboard API is not supported in this browser');

      (navigator as any).clipboard = originalClipboard;
    });

    it('应该在支持时调用clipboard.write', async () => {
      const mockWrite = vi.fn().mockResolvedValue(undefined);

      (navigator as any).clipboard = {
        write: mockWrite,
      };

      await sharer.copyToClipboard();

      expect(mockWrite).toHaveBeenCalled();
    });
  });

  describe('setCanvas and getCanvas', () => {
    it('应该更新Canvas引用', () => {
      const newCanvas = document.createElement('canvas');
      sharer.setCanvas(newCanvas);

      expect(sharer.getCanvas()).toBe(newCanvas);
    });
  });
});

describe('createScreenshotSharer', () => {
  it('应该创建ScreenshotSharer实例', () => {
    const canvas = document.createElement('canvas');
    const sharer = createScreenshotSharer(canvas);

    expect(sharer).toBeInstanceOf(ScreenshotSharer);
    expect(sharer.getCanvas()).toBe(canvas);
  });
});
