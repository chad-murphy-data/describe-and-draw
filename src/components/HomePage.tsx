import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameConfig, GameMode, Difficulty } from '../types';
import { useGame } from '../hooks/useGame';

export const HomePage = () => {
  const navigate = useNavigate();
  const { createGame, joinGame, error } = useGame();

  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [hostName, setHostName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Game configuration
  const [gameMode, setGameMode] = useState<GameMode>('canvas');
  const [totalRounds, setTotalRounds] = useState<number | 'all'>('all');
  const [scoringEnabled, setScoringEnabled] = useState(true);
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('all');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim() || isLoading) return;

    setIsLoading(true);
    const config: GameConfig = {
      totalRounds,
      gameMode,
      scoringEnabled: gameMode !== 'simple' && scoringEnabled,
      votingEnabled,
      difficulty,
    };

    try {
      const code = await createGame(hostName.trim(), config);
      navigate(`/game/${code}`);
    } catch (err) {
      console.error('Failed to create game:', err);
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !joinName.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const success = await joinGame(joinCode.trim().toUpperCase(), joinName.trim());
      if (success) {
        navigate(`/game/${joinCode.trim().toUpperCase()}`);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to join game:', err);
      setIsLoading(false);
    }
  };

  if (mode === 'menu') {
    return (
      <div className="container-narrow flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="card text-center fade-in" style={{ width: '100%' }}>
          <h1 className="mb-2">Blind Draw</h1>
          <p className="text-muted mb-4">
            The team drawing game where one person describes, everyone else draws!
          </p>

          <div className="flex flex-col gap-2">
            <button
              className="btn btn-primary btn-large btn-full"
              onClick={() => setMode('create')}
            >
              Host a Game
            </button>
            <button
              className="btn btn-secondary btn-large btn-full"
              onClick={() => setMode('join')}
            >
              Join a Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="container-narrow flex flex-col justify-center" style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="card fade-in">
          <button
            className="btn btn-secondary btn-small mb-3"
            onClick={() => setMode('menu')}
          >
            ← Back
          </button>

          <h2 className="mb-3">Host a Game</h2>

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                type="text"
                className="form-input"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Game Mode</label>
              <div className="mode-selector">
                <div
                  className={`mode-option ${gameMode === 'simple' ? 'selected' : ''}`}
                  onClick={() => setGameMode('simple')}
                >
                  <h4>Simple</h4>
                  <p>Draw on paper, hold up to webcam</p>
                </div>
                <div
                  className={`mode-option ${gameMode === 'canvas' ? 'selected' : ''}`}
                  onClick={() => setGameMode('canvas')}
                >
                  <h4>Canvas</h4>
                  <p>Draw in browser (Recommended)</p>
                </div>
                <div
                  className={`mode-option ${gameMode === 'upload' ? 'selected' : ''}`}
                  onClick={() => setGameMode('upload')}
                >
                  <h4>Photo Upload</h4>
                  <p>Draw on paper, photo via phone</p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Rounds</label>
              <select
                className="form-input"
                value={totalRounds === 'all' ? 'all' : totalRounds}
                onChange={(e) => setTotalRounds(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              >
                <option value="all">Everyone gets a turn</option>
                <option value="3">3 rounds</option>
                <option value="5">5 rounds</option>
                <option value="7">7 rounds</option>
                <option value="10">10 rounds</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select
                className="form-input"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                <option value="all">Mixed (All difficulties)</option>
                <option value="easy">Easy - Simple shapes</option>
                <option value="medium">Medium - Recognizable objects</option>
                <option value="hard">Hard - Detailed drawings</option>
              </select>
            </div>

            {gameMode !== 'simple' && (
              <div className="form-group">
                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={scoringEnabled}
                    onChange={(e) => setScoringEnabled(e.target.checked)}
                  />
                  <div>
                    <strong>Enable Scoring</strong>
                    <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                      Compare drawings to original with similarity scores
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="form-group">
              <label className="toggle-option">
                <input
                  type="checkbox"
                  checked={votingEnabled}
                  onChange={(e) => setVotingEnabled(e.target.checked)}
                />
                <div>
                  <strong>Enable Voting</strong>
                  <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                    Vote for People's Choice after reveal
                  </p>
                </div>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large btn-full mt-3"
              disabled={!hostName.trim() || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Game'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="card fade-in" style={{ width: '100%' }}>
        <button
          className="btn btn-secondary btn-small mb-3"
          onClick={() => setMode('menu')}
        >
          ← Back
        </button>

        <h2 className="mb-3">Join a Game</h2>

        <form onSubmit={handleJoin}>
          <div className="form-group">
            <label className="form-label">Game Code</label>
            <input
              type="text"
              className="form-input"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-letter code"
              maxLength={6}
              style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input
              type="text"
              className="form-input"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>

          {error && (
            <p className="text-accent mb-2">{error}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-large btn-full"
            disabled={!joinCode.trim() || !joinName.trim() || isLoading}
          >
            {isLoading ? 'Joining...' : 'Join Game'}
          </button>
        </form>
      </div>
    </div>
  );
};
