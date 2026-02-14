/**
 * CountdownDisplay皮肤系统测试
 * Feature: settings-ui-fixes
 * 验证需求：2.1, 2.2, 2.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { CountdownDisplay } from './CountdownDisplay';
import { CountdownEngine } from '../engines/CountdownEngine';
import type { CountdownConfig } from '../types';

describe('CountdownDisplay - 皮肤系统', () => {
  let engine: CountdownEngine;
  let config: CountdownConfig;

  beforeEach(() => {
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + 2);
    
    config = {
      targetDate,
      timezone: 'Asia/Shanghai',
      manualOffset: 0
    };
    
    engine = new CountdownEngine(config);
  });

  afterEach(() => {
    engine.destroy();
  });

  it('应该接受skinId prop并应用默认皮肤', () => {
    const { container } = render(<CountdownDisplay engine={engine} />);
    
    // 默认应该是灯笼皮肤
    const displayElement = container.querySelector('.countdown-display');
    expect(displayElement).toHaveClass('countdown-display--lantern');
  });

  it('应该应用灯笼皮肤样式', () => {
    const { container } = render(<CountdownDisplay engine={engine} skinId="lantern" />);
    
    const displayElement = container.querySelector('.countdown-display');
    expect(displayElement).toHaveClass('countdown-display--lantern');
  });

  it('应该应用对联皮肤样式', () => {
    const { container } = render(<CountdownDisplay engine={engine} skinId="couplet" />);
    
    const displayElement = container.querySelector('.countdown-display');
    expect(displayElement).toHaveClass('countdown-display--couplet');
  });

  it('应该应用生肖皮肤样式', () => {
    const { container } = render(<CountdownDisplay engine={engine} skinId="zodiac" />);
    
    const displayElement = container.querySelector('.countdown-display');
    expect(displayElement).toHaveClass('countdown-display--zodiac');
  });

  it('应该在皮肤更改时更新CSS类名', () => {
    const { container, rerender } = render(
      <CountdownDisplay engine={engine} skinId="lantern" />
    );
    
    let displayElement = container.querySelector('.countdown-display');
    expect(displayElement).toHaveClass('countdown-display--lantern');
    
    // 更改皮肤
    rerender(<CountdownDisplay engine={engine} skinId="couplet" />);
    
    displayElement = container.querySelector('.countdown-display');
    expect(displayElement).toHaveClass('countdown-display--couplet');
    expect(displayElement).not.toHaveClass('countdown-display--lantern');
  });

  it('应该为所有皮肤保持基础countdown-display类', () => {
    const skins = ['lantern', 'couplet', 'zodiac'];
    
    skins.forEach(skinId => {
      const { container } = render(<CountdownDisplay engine={engine} skinId={skinId} />);
      const displayElement = container.querySelector('.countdown-display');
      
      expect(displayElement).toHaveClass('countdown-display');
      expect(displayElement).toHaveClass(`countdown-display--${skinId}`);
    });
  });
});
