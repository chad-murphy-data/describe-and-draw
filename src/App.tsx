import { HashRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { GamePage } from './components/GamePage';
import { MobileUploadPage } from './components/MobileUploadPage';
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
        <Route path="/upload/:gameCode/:playerId/:roundNumber" element={<MobileUploadPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
