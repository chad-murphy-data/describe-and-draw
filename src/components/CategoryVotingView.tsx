import { useState } from 'react';
import { GameState, Player, AwardCategory, CategoryVotes } from '../types';
import { AWARD_CATEGORIES } from '../data/awards';
import { getDrawingById } from '../data/drawings';

interface CategoryVotingViewProps {
  gameState: GameState;
  currentPlayer: Player;
  onSubmitVotes: (votes: CategoryVotes) => void;
  onStartCeremony: () => void;
}

export const CategoryVotingView = ({
  gameState,
  currentPlayer,
  onSubmitVotes,
  onStartCeremony,
}: CategoryVotingViewProps) => {
  const [votes, setVotes] = useState<Partial<CategoryVotes>>({});

  // Get list of players to vote for (everyone except self)
  const votablePlayers = gameState.players.filter(p => p.id !== currentPlayer.id);

  // Check if already submitted
  const hasSubmitted = gameState.categoryVotes?.[currentPlayer.id] !== undefined;

  // Count how many people have voted
  const voteCount = Object.keys(gameState.categoryVotes || {}).length;
  const totalVoters = gameState.players.length;

  const handleVoteChange = (category: AwardCategory, value: string) => {
    setVotes(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleSubmit = () => {
    // Validate all categories have votes
    const allVoted = AWARD_CATEGORIES.every(cat => votes[cat.id]);
    if (!allVoted) return;

    onSubmitVotes(votes as CategoryVotes);
  };

  const allCategoriesVoted = AWARD_CATEGORIES.every(cat => votes[cat.id]);

  const allVoted = voteCount >= totalVoters;

  if (hasSubmitted) {
    return (
      <div className="container flex flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
        <div className="card text-center" style={{ maxWidth: '500px' }}>
          {allVoted ? (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
              <h2 className="mb-2">All Votes Are In!</h2>
              {currentPlayer.isHost ? (
                <>
                  <p className="text-muted mb-3">
                    Share your screen for the ceremony!
                  </p>
                  <button
                    className="btn btn-primary btn-large"
                    onClick={onStartCeremony}
                  >
                    Start Awards Ceremony
                  </button>
                </>
              ) : (
                <p className="text-muted">
                  Waiting for host to start the ceremony...
                </p>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 className="mb-2">Votes Submitted!</h2>
              <p className="text-muted mb-3">
                Waiting for everyone else to vote...
              </p>
              <div className="flex items-center justify-center gap-2">
                <span style={{ fontSize: '1.25rem' }}>
                  {voteCount} / {totalVoters}
                </span>
                <span className="text-muted">votes received</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="text-center mb-4">
        <h1 className="mb-2">Time to Vote!</h1>
        <p className="text-muted">
          Pick one person (or round) per category. You can't vote for yourself!
        </p>
      </div>

      <div className="flex flex-col gap-3" style={{ maxWidth: '500px', margin: '0 auto' }}>
        {AWARD_CATEGORIES.map((award) => (
          <div key={award.id} className="card">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: '1.5rem' }}>{award.emoji}</span>
              <div>
                <h3 style={{ margin: 0 }}>{award.name}</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                  {award.description}
                </p>
              </div>
            </div>

            <select
              className="form-input"
              value={votes[award.id] || ''}
              onChange={(e) => handleVoteChange(award.id, e.target.value)}
            >
              <option value="">Select...</option>
              {award.votesFor === 'player' ? (
                votablePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))
              ) : (
                gameState.rounds.map((round) => {
                  const drawing = getDrawingById(round.imageId);
                  return (
                    <option key={round.roundNumber} value={String(round.roundNumber)}>
                      Round {round.roundNumber}: {drawing?.name || 'Unknown'}
                    </option>
                  );
                })
              )}
            </select>
          </div>
        ))}

        <button
          className="btn btn-primary btn-large btn-full mt-2"
          onClick={handleSubmit}
          disabled={!allCategoriesVoted}
        >
          {allCategoriesVoted ? 'Submit Votes' : 'Select all categories to continue'}
        </button>

        <p className="text-muted text-center" style={{ fontSize: '0.8rem' }}>
          {voteCount} / {totalVoters} players have voted
        </p>
      </div>
    </div>
  );
};
