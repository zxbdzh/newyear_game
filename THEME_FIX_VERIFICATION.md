# Theme Fix Verification Guide

## Problem Fixed
Theme CSS variables were only applied in SinglePlayerGame component, not globally across all screens.

## Solution Implemented
Added a `useEffect` hook in `App.tsx` that watches for `currentTheme` changes and applies the theme globally using `ThemeManager.applyTheme()`.

## How to Verify the Fix

### 1. Check Theme on Launch Screen
1. Start the app: `pnpm dev`
2. Open browser DevTools (F12)
3. Go to Elements/Inspector tab
4. Select `<html>` element
5. Check Styles panel for CSS variables:
   - `--color-primary` should be `#D32F2F` (default theme)
   - `--color-secondary` should be `#FFD700`
   - `--color-accent` should be `#FF6B6B`

### 2. Check Theme Persists Across Screens
1. From Launch Screen, click "开始游戏"
2. You should now be on Mode Selection screen
3. Check DevTools again - CSS variables should still be present
4. Navigate to Settings (if accessible)
5. CSS variables should still be present

### 3. Check Theme Changes Apply Globally
1. Navigate to Settings screen
2. Change the theme (e.g., from "年夜饭场景" to "庙会场景")
3. Check DevTools - CSS variables should update:
   - `--color-primary` should change to `#C62828`
   - `--color-secondary` should change to `#FFA000`
   - `--color-accent` should change to `#FF8A65`
4. Navigate back to other screens
5. The new theme colors should be visible everywhere

### 4. Check Theme Loads on App Start
1. Change theme in settings
2. Refresh the page (F5)
3. Check DevTools immediately on Launch Screen
4. The saved theme should be applied (not default theme)

## Code Changes

### App.tsx
Added new `useEffect` hook after the initialization effect:

```typescript
/**
 * 应用主题变化
 * 当用户在设置中更改主题时,立即应用到所有屏幕
 */
useEffect(() => {
  if (themeManagerRef.current && currentTheme) {
    themeManagerRef.current.applyTheme(currentTheme);
    console.log('[App] 主题已更新:', currentTheme.id);
  }
}, [currentTheme]);
```

This ensures:
1. Theme is applied on initial load (in initialization effect)
2. Theme is re-applied whenever `currentTheme` changes in Redux
3. Theme applies to ALL screens, not just SinglePlayerGame

## Expected Console Output
When the app loads, you should see:
```
[App] 已恢复主题: new-year-dinner
[ThemeManager] Applied theme: new-year-dinner
```

When theme changes:
```
[App] 主题已更新: temple-fair
[ThemeManager] Applied theme: temple-fair
```
