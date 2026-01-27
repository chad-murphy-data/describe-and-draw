import { GameState, Player } from '../types';

interface LobbyPageProps {
  gameState: GameState;
  currentPlayer: Player;
  onStartGame: () => void;
  onLeave: () => void;
}

export const LobbyPage = ({ gameState, currentPlayer, onStartGame, onLeave }: LobbyPageProps) => {
  const isHost = currentPlayer.isHost;
  const playerCount = gameState.players.length;
  const canStart = playerCount >= 2;

  const getModeDescription = () => {
    switch (gameState.config.gameMode) {
      case 'simple':
        return 'Simple Mode - Draw on paper, hold up to webcam';
      case 'canvas':
        return 'Canvas Mode - Draw directly in the browser';
      case 'upload':
        return 'Photo Upload Mode - Draw on paper, upload via phone';
    }
  };

  return (
    <div className="container-narrow flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="card text-center fade-in" style={{ width: '100%' }}>
        <p className="text-muted mb-1">Game Code</p>
        <div className="game-code mb-3">{gameState.gameCode}</div>

        <div className="card card-dark mb-3">
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            {getModeDescription()}
          </p>
          {gameState.config.scoringEnabled && (
            <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>
              Scoring On
            </span>
          )}
          {gameState.config.votingEnabled && (
            <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>
              Voting On
            </span>
          )}
        </div>

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
              ⏳
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
