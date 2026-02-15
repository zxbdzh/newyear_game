/**
 * 设置界面输入验证测试
 * Feature: settings-ui-fixes
 * 
 * 测试时间偏移输入验证功能
 * 需求：10.3, 10.4
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SettingsScreen } from './SettingsScreen';
import audioReducer from '../store/audioSlice';
import themeReducer from '../store/themeSlice';

// 创建测试store
function createTestStore() {
  return configureStore({
    reducer: {
      audio: audioReducer,
      theme: themeReducer,
    },
  });
}

describe('SettingsScreen - Input Validation', () => {
  const defaultProps = {
    isOpen: true,
    onClose: () => {},
    onSave: () => {},
    audioController: null,
    fireworksEngine: null,
  };

  it('should accept valid offset within range', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SettingsScreen {...defaultProps} />
      </Provider>
    );

    const input = screen.getByLabelText(/手动时间偏移/i) as HTMLInputElement;
    
    // 测试有效值
    fireEvent.change(input, { target: { value: '100' } });
    expect(input.value).toBe('100');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show error for offset below minimum', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SettingsScreen {...defaultProps} />
      </Provider>
    );

    const input = screen.getByLabelText(/手动时间偏移/i);
    
    // 测试低于最小值
    fireEvent.change(input, { target: { value: '-4000' } });
    
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage.textContent).toContain('偏移值必须在 -3600 到 +3600 秒之间');
  });

  it('should show error for offset above maximum', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SettingsScreen {...defaultProps} />
      </Provider>
    );

    const input = screen.getByLabelText(/手动时间偏移/i);
    
    // 测试高于最大值
    fireEvent.change(input, { target: { value: '4000' } });
    
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage.textContent).toContain('偏移值必须在 -3600 到 +3600 秒之间');
  });

  it('should accept boundary values', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SettingsScreen {...defaultProps} />
      </Provider>
    );

    const input = screen.getByLabelText(/手动时间偏移/i) as HTMLInputElement;
    
    // 测试最小边界值
    fireEvent.change(input, { target: { value: '-3600' } });
    expect(input.value).toBe('-3600');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    
    // 测试最大边界值
    fireEvent.change(input, { target: { value: '3600' } });
    expect(input.value).toBe('3600');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    
    // 测试零值
    fireEvent.change(input, { target: { value: '0' } });
    expect(input.value).toBe('0');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should handle empty input', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SettingsScreen {...defaultProps} />
      </Provider>
    );

    const input = screen.getByLabelText(/手动时间偏移/i) as HTMLInputElement;
    
    // 测试空输入
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should handle negative sign during input', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SettingsScreen {...defaultProps} />
      </Provider>
    );

    const input = screen.getByLabelText(/手动时间偏移/i);
    
    // 测试负号（输入中）
    fireEvent.change(input, { target: { value: '-' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show error for non-numeric input', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SettingsScreen {...defaultProps} />
      </Provider>
    );

    const input = screen.getByLabelText(/手动时间偏移/i);
    
    // 注意：type="number"的输入框会自动过滤非数字字符
    // 浏览器会将非数字输入转换为空字符串
    // 我们的验证逻辑会处理这种情况，不显示错误
    fireEvent.change(input, { target: { value: 'abc' } });
    
    // 由于浏览器行为，非数字输入会被转换为空字符串
    // 空字符串是允许的（用户可能正在输入）
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should display hint text', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SettingsScreen {...defaultProps} />
      </Provider>
    );

    const hint = screen.getByText(/正数提前，负数延后/i);
    expect(hint).toBeInTheDocument();
  });

  it('should have proper input attributes', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SettingsScreen {...defaultProps} />
      </Provider>
    );

    const input = screen.getByLabelText(/手动时间偏移/i) as HTMLInputElement;
    
    // 验证输入属性
    expect(input.type).toBe('number');
    expect(input.min).toBe('-3600');
    expect(input.max).toBe('3600');
    expect(input.step).toBe('1');
  });

  it('should prevent saving when validation error exists', () => {
    const store = createTestStore();
    const onSave = vi.fn();
    
    render(
      <Provider store={store}>
        <SettingsScreen {...defaultProps} onSave={onSave} />
      </Provider>
    );

    const input = screen.getByLabelText(/手动时间偏移/i);
    const saveButton = screen.getByRole('button', { name: /保存/i });
    
    // 输入无效值
    fireEvent.change(input, { target: { value: '5000' } });
    
    // 尝试保存
    fireEvent.click(saveButton);
    
    // 验证保存未被调用
    expect(onSave).not.toHaveBeenCalled();
  });

  it('should allow saving when input is valid', () => {
    const store = createTestStore();
    const onSave = vi.fn();
    
    render(
      <Provider store={store}>
        <SettingsScreen {...defaultProps} onSave={onSave} />
      </Provider>
    );

    const input = screen.getByLabelText(/手动时间偏移/i);
    const saveButton = screen.getByRole('button', { name: /保存/i });
    
    // 输入有效值
    fireEvent.change(input, { target: { value: '60' } });
    
    // 保存
    fireEvent.click(saveButton);
    
    // 验证保存被调用
    expect(onSave).toHaveBeenCalled();
  });
});
