import { GameState, Player, Round } from '../types';
import { DrawingCanvas } from './DrawingCanvas';
import { QRUpload } from './QRUpload';

interface DrawerViewProps {
  gameState: GameState;
  currentRound: Round;
  currentPlayer: Player;
  onSubmitDrawing: (imageData: string) => void;
}

export const DrawerView = ({ gameState, currentRound, currentPlayer, onSubmitDrawing }: DrawerViewProps) => {
  const speaker = gameState.players.find(p => p.id === currentRound.speakerId);
  const speakerName = speaker?.name || 'Speaker';

  const hasSubmitted = currentRound.submissions.some(s => s.playerId === currentPlayer.id);
  const submissionCount = currentRound.submissions.length;
  const totalDrawers = gameState.players.length - 1;

  if (hasSubmitted) {
    return (
      <div className="container-narrow flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="card text-center fade-in">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
          <h2 className="mb-2 text-success">Drawing Submitted!</h2>
          <p className="text-muted mb-3">
            Waiting for other players to finish...
          </p>
          <div className="flex items-center justify-center gap-2">
            <span style={{ fontSize: '1.25rem' }}>
              {submissionCount} / {totalDrawers}
            </span>
            <span className="text-muted">drawings received</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="text-center mb-3">
        <span className="badge badge-accent mb-2">Round {currentRound.roundNumber}</span>
        <h2 className="mb-1">Listen to {speakerName}!</h2>
        <p className="text-muted">
          {gameState.config.gameMode === 'canvas'
            ? 'Draw what you hear in the canvas below'
            : gameState.config.gameMode === 'upload'
              ? 'Draw on paper, then upload a photo'
              : 'Draw on paper and hold up to your webcam'}
        </p>
      </div>

      {gameState.config.gameMode === 'canvas' && (
        <div className="card" style={{ maxWidth: '520px', width: '100%' }}>
          <DrawingCanvas onSubmit={onSubmitDrawing} />
        </div>
      )}

      {gameState.config.gameMode === 'upload' && (
        <div className="card text-center" style={{ maxWidth: '400px', width: '100%' }}>
          <h3 className="mb-3">Upload your drawing</h3>
          <QRUpload
            gameCode={gameState.gameCode}
            playerId={currentPlayer.id}
            roundNumber={currentRound.roundNumber}
          />
          <div className="mt-4">
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Or drag & drop an image below:
            </p>
            <div
              className="card card-dark mt-2"
              style={{
                border: '2px dashed var(--border)',
                padding: '2rem',
                cursor: 'pointer',
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const imageData = e.target?.result as string;
                      onSubmitDrawing(imageData);
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--border)';
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const imageData = e.target?.result as string;
                    onSubmitDrawing(imageData);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            >
              <p className="text-muted">Click or drag image here</p>
            </div>
          </div>
        </div>
      )}

      {gameState.config.gameMode === 'simple' && (
        <div className="card text-center" style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✏️</div>
          <h3 className="mb-2">Draw on paper!</h3>
          <p className="text-muted mb-3">
            When {speakerName} says "pencils down", hold your drawing up to your webcam!
          </p>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            In Simple Mode, there's no digital submission - just share your drawing on camera.
          </p>
        </div>
      )}

      <div className="card text-center mt-3" style={{ maxWidth: '300px' }}>
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>
          {submissionCount} / {totalDrawers} drawings submitted
        </span>
      </div>
    </div>
  );
};
