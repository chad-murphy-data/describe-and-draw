import { HashRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { GamePage } from './components/GamePage';
import { useEffect } from 'react';
import { cleanupOldGames } from './utils/storage';

function App() {
  // Cleanup old games on app load
  useEffect(() => {
    cleanupOldGames();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:gameCode" element={<GamePage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
