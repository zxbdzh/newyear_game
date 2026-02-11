import { useState } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setMode } from './store/gameSlice';
import { toggleMusicMute } from './store/audioSlice';
import { LaunchScreen } from './components/LaunchScreen';
import { ModeSelection } from './components/ModeSelection';
import type { GameMode } from './types/GameTypes';
import './App.css';

function App() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.game.mode);
  const isMusicMuted = useAppSelector((state) => state.audio.config.musicMuted);
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = () => {
    setHasStarted(true);
  };

  const handleAudioUnlock = () => {
    // 这里将来会调用 AudioController.resumeContext()
    console.log('Audio unlocked - ready to play music');
  };

  const handleSelectMode = (selectedMode: GameMode) => {
    dispatch(setMode(selectedMode));
  };

  const handleToggleMute = () => {
    dispatch(toggleMusicMute());
  };

  // 显示启动界面
  if (!hasStarted) {
    return (
      <LaunchScreen 
        onStart={handleStart} 
        onAudioUnlock={handleAudioUnlock}
      />
    );
  }

  // 显示模式选择界面
  if (mode === 'menu') {
    return (
      <ModeSelection
        onSelectMode={handleSelectMode}
        onToggleMute={handleToggleMute}
        isMuted={isMusicMuted}
        isOnline={navigator.onLine}
      />
    );
  }

  // 游戏界面占位符（将在后续任务中实现）
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a0a0a 0%, #4a0e0e 50%, #8b0000 100%)',
      color: '#ffd700',
      fontSize: '24px',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div>
        <h1>游戏模式: {mode === 'single' ? '单人模式' : '多人模式'}</h1>
        <p>游戏界面将在后续任务中实现</p>
        <button 
          onClick={() => dispatch(setMode('menu'))}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            fontSize: '18px',
            background: '#dc143c',
            color: '#fff',
            border: '2px solid #ffd700',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          返回模式选择
        </button>
      </div>
    </div>
  );
}

export default App;
