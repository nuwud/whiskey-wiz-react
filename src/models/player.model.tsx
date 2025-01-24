export interface PlayerScore {
  playerId: string;
  quarterId: string;
  score: number;
  guesses: {
    sampleId: string;
    age: number;
    proof: number;
    mashbill: string;
  }[];
  createdAt: Date;
}

export interface Player {
  id: string;
  email: string;
  displayName?: string;
  scores: PlayerScore[];
}
