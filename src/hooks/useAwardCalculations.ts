import { useMemo } from 'react';
import { GameState } from '../types';

export interface Award {
  id: string;
  emoji: string;
  name: string;
  description: string;
  winnerId: string;
  winnerName: string;
  value?: string; // e.g., "42%" or "Chad + Mochi"
}

export interface PlayOfTheGame {
  roundNumber: number;
  drawerId: string;
  drawerName: string;
  describerId: string;
  describerName: string;
  score: number;
  imageId: string;
  imageData: string;
}

export interface PodiumPlayer {
  place: 1 | 2 | 3;
  playerId: string;
  playerName: string;
  totalScore: number;
  avgScore: number;
}

export interface AwardResults {
  quickFireAwards: Award[];
  playOfTheGame: PlayOfTheGame | null;
  podium: PodiumPlayer[];
}


interface PlayerStats {
  playerId: string;
  playerName: string;
  totalScore: number;
  avgScore: number;
  scores: number[];
  roundsAsDrawer: number;
  roundsAsDescriber: number;
  avgScoreAsDescriber: number;
  bestScore: number;
  worstScore: number;
  variance: number;
}

export const useAwardCalculations = (gameState: GameState): AwardResults => {
  return useMemo(() => {
    const { players, rounds } = gameState;

    if (rounds.length === 0 || players.length < 2) {
      return { quickFireAwards: [], playOfTheGame: null, podium: [] };
    }

    const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

    // Build player stats
    const playerStatsMap = new Map<string, PlayerStats>();

    // Initialize all players
    players.forEach(player => {
      playerStatsMap.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        totalScore: 0,
        avgScore: 0,
        scores: [],
        roundsAsDrawer: 0,
        roundsAsDescriber: 0,
        avgScoreAsDescriber: 0,
        bestScore: -Infinity,
        worstScore: Infinity,
        variance: 0,
      });
    });

    // Track describer scores separately
    const describerScores = new Map<string, number[]>();
    players.forEach(p => describerScores.set(p.id, []));

    // Track pair scores for Dynamic Duo
    const pairScores = new Map<string, { total: number; count: number }>();

    // Process all rounds
    rounds.forEach(round => {
      if (round.status !== 'completed') return;

      const describerId = round.speakerId;

      round.submissions.forEach(submission => {
        const score = submission.score ?? 0;
        const drawerId = submission.playerId;

        // Update drawer stats
        const drawerStats = playerStatsMap.get(drawerId);
        if (drawerStats) {
          drawerStats.scores.push(score);
          drawerStats.totalScore += score;
          drawerStats.roundsAsDrawer++;
          drawerStats.bestScore = Math.max(drawerStats.bestScore, score);
          drawerStats.worstScore = Math.min(drawerStats.worstScore, score);
        }

        // Track describer performance
        const dScores = describerScores.get(describerId);
        if (dScores) {
          dScores.push(score);
        }

        // Track pair performance
        const pairKey = [describerId, drawerId].sort().join('-');
        const pair = pairScores.get(pairKey) || { total: 0, count: 0 };
        pair.total += score;
        pair.count++;
        pairScores.set(pairKey, pair);
      });
    });

    // Calculate final stats
    playerStatsMap.forEach((stats, playerId) => {
      if (stats.scores.length > 0) {
        stats.avgScore = stats.totalScore / stats.scores.length;

        // Calculate variance
        const mean = stats.avgScore;
        const squaredDiffs = stats.scores.map(s => Math.pow(s - mean, 2));
        stats.variance = squaredDiffs.reduce((a, b) => a + b, 0) / stats.scores.length;
      }

      // Calculate describer average
      const dScores = describerScores.get(playerId) || [];
      if (dScores.length > 0) {
        stats.avgScoreAsDescriber = dScores.reduce((a, b) => a + b, 0) / dScores.length;
        stats.roundsAsDescriber = dScores.length;
      }
    });

    const allStats = Array.from(playerStatsMap.values()).filter(s => s.scores.length > 0);

    // === Calculate Podium (Top 3) ===
    const sortedByScore = [...allStats].sort((a, b) => b.avgScore - a.avgScore);
    const podium: PodiumPlayer[] = sortedByScore.slice(0, 3).map((stats, index) => ({
      place: (index + 1) as 1 | 2 | 3,
      playerId: stats.playerId,
      playerName: stats.playerName,
      totalScore: stats.totalScore,
      avgScore: stats.avgScore,
    }));

    const podiumIds = new Set(podium.map(p => p.playerId));

    // === Calculate Quick-Fire Awards ===
    // Prioritize players NOT in top 3 for individual awards
    const nonPodiumStats = allStats.filter(s => !podiumIds.has(s.playerId));
    const hasEnoughNonPodium = nonPodiumStats.length >= 2;

    const awards: Award[] = [];
    const awardedPlayerIds = new Set<string>();

    // Helper to find best candidate, preferring non-podium players
    const findWinner = (
      compareFn: (a: PlayerStats, b: PlayerStats) => number,
      filter?: (s: PlayerStats) => boolean
    ): PlayerStats | null => {
      let candidates = allStats.filter(s => !awardedPlayerIds.has(s.playerId));
      if (filter) candidates = candidates.filter(filter);
      if (candidates.length === 0) return null;

      // Prefer non-podium players if we have enough of them
      const nonPodiumCandidates = candidates.filter(s => !podiumIds.has(s.playerId));
      if (nonPodiumCandidates.length > 0 && hasEnoughNonPodium) {
        candidates = nonPodiumCandidates;
      }

      return candidates.sort(compareFn)[0] || null;
    };

    // 1. Abstract Expressionist - Lowest average score
    const abstract = findWinner((a, b) => a.avgScore - b.avgScore);
    if (abstract) {
      awards.push({
        id: 'abstract',
        emoji: '🎨',
        name: 'Abstract Expressionist',
        description: 'Most creative interpretation',
        winnerId: abstract.playerId,
        winnerName: abstract.playerName,
        value: `${Math.round(abstract.avgScore)}% avg`,
      });
      awardedPlayerIds.add(abstract.playerId);
    }

    // 2. Communication Champion - Best describer
    // Note: Don't use findWinner here since describing skill is independent of drawing skill
    // We want the actual best describer, not just the best among non-podium players
    const describerCandidates = allStats
      .filter(s => s.roundsAsDescriber > 0 && !awardedPlayerIds.has(s.playerId))
      .sort((a, b) => b.avgScoreAsDescriber - a.avgScoreAsDescriber);
    const communicator = describerCandidates[0] || null;
    if (communicator && communicator.avgScoreAsDescriber > 0) {
      awards.push({
        id: 'communicator',
        emoji: '🗣️',
        name: 'Communication Champion',
        description: 'Best at describing',
        winnerId: communicator.playerId,
        winnerName: communicator.playerName,
        value: `${Math.round(communicator.avgScoreAsDescriber)}% when describing`,
      });
      awardedPlayerIds.add(communicator.playerId);
    }

    // 3. Redemption Arc - Biggest improvement (best - worst)
    const redemption = findWinner(
      (a, b) => (b.bestScore - b.worstScore) - (a.bestScore - a.worstScore),
      s => s.scores.length >= 2
    );
    if (redemption && redemption.bestScore > redemption.worstScore) {
      awards.push({
        id: 'redemption',
        emoji: '📈',
        name: 'Redemption Arc',
        description: 'Biggest improvement',
        winnerId: redemption.playerId,
        winnerName: redemption.playerName,
        value: `${Math.round(redemption.worstScore)}% → ${Math.round(redemption.bestScore)}%`,
      });
      awardedPlayerIds.add(redemption.playerId);
    }

    // 4. Precision Artist - Highest single score
    const precision = findWinner((a, b) => b.bestScore - a.bestScore);
    if (precision && precision.bestScore > 0) {
      awards.push({
        id: 'precision',
        emoji: '🎯',
        name: 'Precision Artist',
        description: 'Highest single score',
        winnerId: precision.playerId,
        winnerName: precision.playerName,
        value: `${Math.round(precision.bestScore)}%`,
      });
      awardedPlayerIds.add(precision.playerId);
    }

    // 5. Dynamic Duo - Best pair (don't add to awardedPlayerIds since it's a pair)
    const pairEntries = Array.from(pairScores.entries());
    if (pairEntries.length > 0) {
      const bestPair = pairEntries.reduce((best, [key, data]) => {
        const avg = data.total / data.count;
        if (avg > best.avg) {
          return { key, avg };
        }
        return best;
      }, { key: pairEntries[0][0], avg: pairEntries[0][1].total / pairEntries[0][1].count });

      const [id1, id2] = bestPair.key.split('-');
      awards.push({
        id: 'duo',
        emoji: '🤝',
        name: 'Dynamic Duo',
        description: 'Best team combination',
        winnerId: id1, // Primary winner for tracking
        winnerName: `${getPlayerName(id1)} & ${getPlayerName(id2)}`,
        value: `${Math.round(bestPair.avg)}% together`,
      });
    }

    // 6. Haters are my Motivators - Lowest scorer who completed all rounds
    const maxRounds = Math.max(...allStats.map(s => s.scores.length));
    const persistence = findWinner(
      (a, b) => a.avgScore - b.avgScore,
      s => s.scores.length === maxRounds && s.avgScore < 50
    );
    if (persistence) {
      awards.push({
        id: 'persistence',
        emoji: '💪',
        name: 'Haters are my Motivators',
        description: 'Kept going despite the odds',
        winnerId: persistence.playerId,
        winnerName: persistence.playerName,
        value: `${persistence.scores.length} rounds completed`,
      });
      awardedPlayerIds.add(persistence.playerId);
    }

    // 7. Chaos Agent - Highest variance
    const chaos = findWinner(
      (a, b) => b.variance - a.variance,
      s => s.scores.length >= 2
    );
    if (chaos && chaos.variance > 100) { // Only award if variance is notable
      awards.push({
        id: 'chaos',
        emoji: '🎢',
        name: 'Chaos Agent',
        description: 'Most unpredictable scores',
        winnerId: chaos.playerId,
        winnerName: chaos.playerName,
        value: `${Math.round(chaos.worstScore)}%-${Math.round(chaos.bestScore)}% range`,
      });
      awardedPlayerIds.add(chaos.playerId);
    }

    // 8. Slow and Steady - Lowest variance
    const steady = findWinner(
      (a, b) => a.variance - b.variance,
      s => s.scores.length >= 3
    );
    if (steady && steady.variance < 200) { // Only award if actually consistent
      awards.push({
        id: 'steady',
        emoji: '🐢',
        name: 'Slow and Steady',
        description: 'Most consistent performer',
        winnerId: steady.playerId,
        winnerName: steady.playerName,
        value: `±${Math.round(Math.sqrt(steady.variance))}% variance`,
      });
      awardedPlayerIds.add(steady.playerId);
    }

    // Limit awards to player count (excluding podium consideration)
    // We want at most (playerCount - 3) individual awards, minimum 2
    const maxIndividualAwards = Math.max(2, Math.min(6, players.length - 3));
    const limitedAwards = awards.slice(0, maxIndividualAwards);

    // === Play of the Game ===
    let playOfTheGame: PlayOfTheGame | null = null;
    let highestScore = 0;

    rounds.forEach(round => {
      if (round.status !== 'completed') return;

      round.submissions.forEach(submission => {
        const score = submission.score ?? 0;
        if (score > highestScore) {
          highestScore = score;
          playOfTheGame = {
            roundNumber: round.roundNumber,
            drawerId: submission.playerId,
            drawerName: getPlayerName(submission.playerId),
            describerId: round.speakerId,
            describerName: getPlayerName(round.speakerId),
            score,
            imageId: round.imageId,
            imageData: submission.imageData,
          };
        }
      });
    });

    return {
      quickFireAwards: limitedAwards,
      playOfTheGame,
      podium,
    };
  }, [gameState]);
};
