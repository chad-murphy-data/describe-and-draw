import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getGameState, saveGameState } from '../utils/storage';
import { Submission } from '../types';

export const MobileUploadPage = () => {
  const { gameCode, playerId, roundNumber } = useParams<{
    gameCode: string;
    playerId: string;
    roundNumber: string;
  }>();

  const [imageData, setImageData] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate game exists and player is in it
  const gameState = gameCode ? getGameState(gameCode) : null;
  const player = gameState?.players.find(p => p.id === playerId);
  const currentRound = gameState?.rounds.find(r => r.roundNumber === parseInt(roundNumber || '0'));

  if (!gameState || !player || !currentRound) {
    return (
      <div className="mobile-page items-center justify-center">
        <div className="card text-center">
          <h2 className="text-accent mb-2">Invalid Link</h2>
          <p className="text-muted">
            This upload link is no longer valid. Please scan a new QR code from the game.
          </p>
        </div>
      </div>
    );
  }

  // Check if already submitted
  const alreadySubmitted = currentRound.submissions.some(s => s.playerId === playerId);

  if (submitted || alreadySubmitted) {
    return (
      <div className="mobile-page items-center justify-center">
        <div className="card text-center fade-in">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
          <h2 className="text-success mb-2">Uploaded!</h2>
          <p className="text-muted">
            Your drawing has been submitted. You can close this page and return to your laptop.
          </p>
        </div>
      </div>
    );
  }

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      setImageData(data);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!imageData || !gameCode || !playerId) return;

    const currentState = getGameState(gameCode);
    if (!currentState) {
      setError('Game not found');
      return;
    }

    const submission: Submission = {
      playerId,
      imageData,
    };

    const updatedState = {
      ...currentState,
      rounds: currentState.rounds.map((r) =>
        r.roundNumber === parseInt(roundNumber || '0')
          ? { ...r, submissions: [...r.submissions, submission] }
          : r
      ),
      lastUpdated: Date.now(),
    };

    saveGameState(updatedState);
    setSubmitted(true);
  };

  const handleRetake = () => {
    setImageData(null);
    setError(null);
  };

  return (
    <div className="mobile-page">
      <div className="text-center mb-4">
        <h2>Upload Drawing</h2>
        <p className="text-muted">
          {player.name} • Round {roundNumber}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {!imageData ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <button
            className="camera-button mb-4"
            onClick={handleCapture}
            type="button"
          >
            📷
          </button>
          <p className="text-muted text-center">
            Tap to take a photo of your paper drawing
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center flex-1">
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              maxWidth: '300px',
              width: '100%',
              marginBottom: '1rem',
            }}
          >
            <img
              src={imageData}
              alt="Your drawing"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>

          {error && (
            <p className="text-accent mb-2">{error}</p>
          )}

          <div className="flex gap-2 mt-auto" style={{ width: '100%', maxWidth: '300px' }}>
            <button
              className="btn btn-secondary flex-1"
              onClick={handleRetake}
              type="button"
            >
              Retake
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={handleSubmit}
              type="button"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
