import { GameState, Round } from '../types';
import { DrawingDisplay } from './DrawingDisplay';

interface SpeakerViewProps {
  gameState: GameState;
  currentRound: Round;
  onStartReveal: () => void;
}

export const SpeakerView = ({ gameState, currentRound, onStartReveal }: SpeakerViewProps) => {
  const totalDrawers = gameState.players.length - 1;
  const submissionCount = currentRound.submissions.length;
  const allSubmitted = submissionCount >= totalDrawers;

  return (
    <div className="container flex flex-col items-center" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="text-center mb-3">
        <span className="badge badge-accent mb-2">Round {currentRound.roundNumber}</span>
        <h2 className="mb-1">You are the Speaker!</h2>
        <p className="text-muted">Describe this image to your team - but don't say what it is!</p>
      </div>

      <div className="card mb-3" style={{ maxWidth: '500px', width: '100%' }}>
        <DrawingDisplay imageId={currentRound.imageId} size="large" />
      </div>

      <div className="card text-center mb-3" style={{ maxWidth: '400px', width: '100%' }}>
        <h3 className="mb-1">Tips for describing:</h3>
        <ul style={{ textAlign: 'left', listStyle: 'disc', paddingLeft: '1.5rem' }}>
          <li>Describe the lines and shapes you see</li>
          <li>Start with the overall shape/position</li>
          <li>Use directions: "top left", "center", etc.</li>
          <li>Don't name the object itself!</li>
        </ul>
      </div>

      {gameState.config.gameMode === 'simple' ? (
        <div className="card text-center" style={{ maxWidth: '400px', width: '100%' }}>
          <p className="text-muted mb-3">
            When everyone is done drawing, click the button below to reveal!
          </p>
          <button
            className="btn btn-primary btn-large btn-full"
            onClick={onStartReveal}
          >
            Pencils Down! 🎨
          </button>
        </div>
      ) : (
        <div className="card text-center" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span style={{ fontSize: '1.5rem' }}>
              {submissionCount} / {totalDrawers}
            </span>
            <span className="text-muted">drawings received</span>
          </div>

          {allSubmitted ? (
            <div className="mb-2">
              <span className="badge badge-success">All drawings submitted!</span>
            </div>
          ) : (
            <div className="mb-2">
              <span className="badge badge-warning">Waiting for drawings...</span>
            </div>
          )}

          <button
            className="btn btn-primary btn-large btn-full"
            onClick={onStartReveal}
            disabled={submissionCount === 0}
          >
            {submissionCount === 0 ? 'Waiting for first drawing...' : 'Reveal Drawings'}
          </button>

          {!allSubmitted && submissionCount > 0 && (
            <p className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>
              You can reveal now or wait for more submissions
            </p>
          )}
        </div>
      )}
    </div>
  );
};
