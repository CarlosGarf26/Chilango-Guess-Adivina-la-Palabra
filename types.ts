export interface WordCard {
  word: string;
  meaning: string;
}

export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  INSTRUCTIONS = 'INSTRUCTIONS',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export enum TurnStatus {
  NEUTRAL = 'NEUTRAL',
  CORRECT = 'CORRECT',
  PASS = 'PASS'
}

export interface RoundResult {
  word: string;
  status: TurnStatus;
}