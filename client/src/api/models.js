export const INITIAL_COINS = 20;
export const MEDALS = ['🥇', '🥈', '🥉'];

export function GameStart(raw) {
  this.gameId = raw.gameId;
  this.start = raw.start;           // { id, name }
  this.destination = raw.destination; // { id, name }
  this.coins = raw.coins ?? INITIAL_COINS;
}

export function GameResult(raw) {
  this.valid = raw.valid;
  this.steps = raw.steps ?? [];
  this.finalScore = raw.finalScore ?? 0;
  this.previousBest = raw.previousBest ?? null;
  this.improved = !!raw.improved;
  // derived
  this.isInvalidRoute = !this.valid;
  this.hasPreviousBest = this.previousBest !== null;
  this.isPerfectScore = this.finalScore >= INITIAL_COINS;
}
