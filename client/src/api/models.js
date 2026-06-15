export const INITIAL_COINS = 20;
export const MEDALS = ['🥇', '🥈', '🥉'];

export class GameStart {
  // Transforms server response into typed game start state: gameId, start/destination stations, coins
  constructor(raw) {
    this.gameId = raw.gameId;
    this.start = raw.start;           // { id, name }
    this.destination = raw.destination; // { id, name }
    this.coins = raw.coins ?? INITIAL_COINS;
  }
}

export class GameResult {
  // Transforms execution result into game score metadata: validity, steps, final score, improvement flag
  constructor(raw) {
    this.valid = raw.valid;
    this.steps = raw.steps ?? [];
    this.finalScore = raw.finalScore ?? 0;
    this.previousBest = raw.previousBest ?? null;
    this.improved = !!raw.improved;
    this.isInvalidRoute = !this.valid;
    this.hasPreviousBest = this.previousBest !== null;
    this.isPerfectScore = this.finalScore >= INITIAL_COINS;
  }
}
