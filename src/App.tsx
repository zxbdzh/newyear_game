import { useAppDispatch, useAppSelector } from './store/hooks';
import { setMode } from './store/gameSlice';
import { recordClick } from './store/statisticsSlice';
import './App.css';

function App() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.game.mode);
  const totalClicks = useAppSelector((state) => state.statistics.totalClicks);

  const handleClick = () => {
    dispatch(recordClick());
  };

  const handleModeChange = () => {
    const nextMode = mode === 'menu' ? 'single' : 'menu';
    dispatch(setMode(nextMode));
  };

  return (
    <>
      <div>
        <h1>新年烟花游戏</h1>
        <p>当前模式: {mode}</p>
        <p>总点击次数: {totalClicks}</p>
      </div>
      <div className="card">
        <button onClick={handleClick}>点击燃放烟花</button>
        <button onClick={handleModeChange}>切换模式</button>
      </div>
      <p className="read-the-docs">
        Redux状态管理已集成 - 使用useAppSelector和useAppDispatch hooks
      </p>
    </>
  );
}

export default App;
