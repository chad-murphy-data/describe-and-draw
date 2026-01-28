import { useState, useEffect } from 'react';
import { GameState, Player, VotingStyle, Difficulty } from '../types';

interface LobbyPageProps {
  gameState: GameState;
  currentPlayer: Player;
  onStartGame: () => void;
  onLeave: () => void;
  onUpdateConfig?: (updates: { votingStyle?: VotingStyle; difficulty?: Difficulty; votingEnabled?: boolean }) => void;
}

// Smart defaults based on player count and game mode
const getRecommendedVotingStyle = (playerCount: number, gameMode: 'simple' | 'canvas'): VotingStyle => {
  // 2 players: no voting (can't vote for yourself)
  if (playerCount <= 2) return 'none';
  // 3 players: no voting recommended
  if (playerCount <= 3) return 'none';
  // 4+ players in paper mode: category voting
  if (gameMode === 'simple') return 'categories';
  // 4-5 players in canvas mode: top 2
  if (playerCount <= 5) return 'top2';
  // 6+ players in canvas mode: top 3
  return 'top3';
};

const getPlayerCountMessage = (playerCount: number): string => {
  if (playerCount === 2) return 'Just the two of you!';
  if (playerCount <= 3) return `Cozy group of ${playerCount}!`;
  if (playerCount <= 5) return `Nice group of ${playerCount}!`;
  if (playerCount <= 7) return `You have ${playerCount} players - nice!`;
  return `Big group of ${playerCount}! This'll be fun!`;
};

const getVotingDescription = (style: VotingStyle, playerCount: number, _gameMode: 'simple' | 'canvas'): string => {
  if (style === 'none') {
    if (playerCount <= 2) {
      return 'No voting with 2 players - just enjoy the game!';
    }
    return 'No scoring - just enjoy the chaos!';
  }
  if (style === 'categories') {
    return 'Fun award categories at the end!';
  }
  if (style === 'top2') {
    return `Top 2 voting (2 pts / 1 pt) - perfect for ${playerCount} players`;
  }
  return `Top 3 voting (3 pts / 2 pts / 1 pt) - great for larger groups`;
};

export const LobbyPage = ({ gameState, currentPlayer, onStartGame, onLeave, onUpdateConfig }: LobbyPageProps) => {
  const isHost = currentPlayer.isHost;
  const playerCount = gameState.players.length;
  const canStart = playerCount >= 2;

  // Track current voting style and whether user has overridden defaults
  const [hasOverriddenVoting, setHasOverriddenVoting] = useState(false);
  const gameMode = gameState.config.gameMode;
  const recommendedStyle = getRecommendedVotingStyle(playerCount, gameMode);
  const currentVotingStyle = gameState.config.votingStyle || 'top3';
  const currentDifficulty = gameState.config.difficulty || 'medium';
  const isSimpleMode = gameMode === 'simple';

  // Auto-update voting style when player count changes (unless user overrode)
  useEffect(() => {
    if (isHost && onUpdateConfig && !hasOverriddenVoting) {
      const recommended = getRecommendedVotingStyle(playerCount, gameMode);
      if (recommended !== currentVotingStyle) {
        onUpdateConfig({
          votingStyle: recommended,
          votingEnabled: recommended !== 'none',
        });
      }
    }
  }, [playerCount, isHost, onUpdateConfig, hasOverriddenVoting, currentVotingStyle, gameMode]);

  const getModeDescription = () => {
    switch (gameState.config.gameMode) {
      case 'simple':
        return 'Paper Mode - Draw on paper, hold up to webcam';
      case 'canvas':
        return 'Canvas Mode - Draw directly in the browser';
    }
  };

  // Handle voting style override by host
  const handleVotingStyleChange = (style: VotingStyle) => {
    setHasOverriddenVoting(true);
    onUpdateConfig?.({
      votingStyle: style,
      votingEnabled: style !== 'none',
    });
  };

  // Handle difficulty change
  const handleDifficultyChange = (diff: Difficulty) => {
    onUpdateConfig?.({ difficulty: diff });
  };

  return (
    <div className="container-narrow flex flex-col items-center justify-center" style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card text-center fade-in" style={{ width: '100%' }}>
        <p className="text-muted mb-1">Game Code</p>
        <div className="game-code mb-3">{gameState.gameCode}</div>

        <div className="mb-3">
          <h3 className="mb-2">Players ({playerCount})</h3>
          <ul className="player-list justify-center">
            {gameState.players.map((player) => (
              <li
                key={player.id}
                className={`player-tag ${player.isHost ? 'host' : ''} ${player.id === currentPlayer.id ? 'you' : ''}`}
              >
                {player.name}
                {player.id === currentPlayer.id && ' (you)'}
              </li>
            ))}
          </ul>
        </div>

        {isHost && canStart && (
          <div className="card card-dark mb-3" style={{ textAlign: 'left' }}>
            <p className="text-center mb-2" style={{ fontWeight: 'bold' }}>
              {getPlayerCountMessage(playerCount)}
            </p>

            {/* Difficulty selector */}
            <div className="mb-2">
              <label className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                Difficulty
              </label>
              <div className="flex gap-1 flex-wrap justify-center">
                {(['easy', 'medium', 'hard', 'all'] as Difficulty[]).map((diff) => (
                  <button
                    key={diff}
                    className={`btn btn-small ${currentDifficulty === diff ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleDifficultyChange(diff)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {diff === 'all' ? 'Mixed' : diff}
                    {diff === 'medium' && ' *'}
                  </button>
                ))}
              </div>
              {currentDifficulty === 'medium' && (
                <p className="text-muted text-center" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  * Recommended
                </p>
              )}
            </div>

            {/* Voting style - different UI based on player count and mode */}
            <div className="mb-2">
              <label className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                Awards & Voting
              </label>

              {playerCount <= 2 ? (
                // 2 players: No voting possible
                <div className="text-center">
                  <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                    With just 2 players, there's no voting - just enjoy the game!
                  </p>
                </div>
              ) : playerCount <= 3 ? (
                // 3 players: Recommend no voting
                <div className="text-center">
                  <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                    With this size, we recommend skipping the scoring and just enjoying the chaos.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      className={`btn ${currentVotingStyle === 'none' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleVotingStyleChange('none')}
                    >
                      No Awards
                    </button>
                    <button
                      className={`btn btn-small ${currentVotingStyle !== 'none' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleVotingStyleChange(isSimpleMode ? 'categories' : 'top2')}
                      style={{ opacity: 0.8 }}
                    >
                      Add Awards Anyway
                    </button>
                  </div>
                </div>
              ) : isSimpleMode ? (
                // 4+ players in Paper Mode: Category voting
                <div className="text-center">
                  <div className="flex gap-2 justify-center mb-2">
                    <button
                      className={`btn ${currentVotingStyle === 'none' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleVotingStyleChange('none')}
                    >
                      No Awards
                    </button>
                    <button
                      className={`btn ${currentVotingStyle === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleVotingStyleChange('categories')}
                    >
                      Fun Awards *
                    </button>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {currentVotingStyle === 'categories'
                      ? '5 fun award categories at the end! (recommended)'
                      : 'No awards - just play for fun'}
                  </p>
                </div>
              ) : (
                // 4+ players in Canvas Mode: Ranked voting
                <div>
                  <div className="flex gap-1 flex-wrap justify-center">
                    <button
                      className={`btn btn-small ${currentVotingStyle === 'none' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleVotingStyleChange('none')}
                    >
                      None
                    </button>
                    <button
                      className={`btn btn-small ${currentVotingStyle === 'top2' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleVotingStyleChange('top2')}
                    >
                      Top 2 {recommendedStyle === 'top2' && '*'}
                    </button>
                    <button
                      className={`btn btn-small ${currentVotingStyle === 'top3' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleVotingStyleChange('top3')}
                    >
                      Top 3 {recommendedStyle === 'top3' && '*'}
                    </button>
                  </div>
                  <p className="text-muted text-center" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    {getVotingDescription(currentVotingStyle, playerCount, gameMode)}
                    {currentVotingStyle === recommendedStyle && ' (recommended)'}
                  </p>
                </div>
              )}
            </div>

            {/* Mode display */}
            <p className="text-muted text-center" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {getModeDescription()}
            </p>
          </div>
        )}

        {!isHost && (
          <div className="card card-dark mb-3">
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              {getModeDescription()}
            </p>
            {gameState.config.votingEnabled && gameState.config.votingStyle !== 'none' && (
              <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>
                {gameState.config.votingStyle === 'categories'
                  ? 'Fun Awards'
                  : gameState.config.votingStyle === 'top2'
                    ? 'Top 2 Voting'
                    : 'Top 3 Voting'}
              </span>
            )}
          </div>
        )}

        {isHost ? (
          <div className="flex flex-col gap-2">
            <button
              className="btn btn-primary btn-large btn-full pulse"
              onClick={onStartGame}
              disabled={!canStart}
            >
              {canStart ? 'Start Game' : 'Need at least 2 players'}
            </button>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>
              Share the code above with your team!
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-muted">Waiting for host to start the game...</p>
            <div className="pulse" style={{ fontSize: '1.5rem', marginTop: '1rem' }}>
              ...
            </div>
          </div>
        )}

        <button
          className="btn btn-secondary btn-small mt-4"
          onClick={onLeave}
        >
          Leave Game
        </button>
      </div>
    </div>
  );
};
