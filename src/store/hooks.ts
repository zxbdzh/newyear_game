/**
 * Redux Hooks
 * Feature: new-year-fireworks-game
 * 
 * 提供类型安全的useSelector和useDispatch hooks
 */

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * 类型安全的useDispatch hook
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/**
 * 类型安全的useSelector hook
 */
export const useAppSelector = useSelector.withTypes<RootState>();
