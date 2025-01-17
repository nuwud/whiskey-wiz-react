interface MockPlayerMetrics {
  totalGames: number;
  averageScore: number;
  bestScore: number;
  hintsUsed: number;
  correctAnswers: number;
  perfectScores: number;
  totalChallengesCompleted: number;
  quarterHistory: Array<{
    quarterId: string;
    score: number;
    date: Date;
  }>;
  favoriteWhiskey?: string;
  lastPlayed?: Date;
}

interface MockGameData {
  currentQuarter: string;
  playerProgress: {
    completed: number;
    total: number;
  };
  challenges: Array<{
    id: string;
    type: string;
    difficulty: number;
    completed: boolean;
  }>;
}

class MockDataService {
  private playerMetrics: MockPlayerMetrics = {
    totalGames: 15,
    averageScore: 82.5,
    bestScore: 95,
    hintsUsed: 12,
    correctAnswers: 42,
    perfectScores: 3,
    totalChallengesCompleted: 45,
    quarterHistory: [
      { quarterId: 'Q4 2024', score: 88, date: new Date('2024-12-15') },
      { quarterId: 'Q3 2024', score: 92, date: new Date('2024-09-20') },
      { quarterId: 'Q2 2024', score: 78, date: new Date('2024-06-10') }
    ],
    favoriteWhiskey: 'Buffalo Trace',
    lastPlayed: new Date('2024-12-15')
  };

  private gameData: MockGameData = {
    currentQuarter: 'Q1 2025',
    playerProgress: {
      completed: 3,
      total: 5
    },
    challenges: [
      { id: 'ch1', type: 'age', difficulty: 2, completed: true },
      { id: 'ch2', type: 'mashbill', difficulty: 3, completed: true },
      { id: 'ch3', type: 'proof', difficulty: 1, completed: true },
      { id: 'ch4', type: 'distillery', difficulty: 4, completed: false },
      { id: 'ch5', type: 'region', difficulty: 2, completed: false }
    ]
  };

  getPlayerMetrics(): MockPlayerMetrics {
    return this.playerMetrics;
  }

  getGameData(): MockGameData {
    return this.gameData;
  }

  // Helper method to simulate async behavior
  private async simulateDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Async methods to better mimic real service behavior
  async fetchPlayerMetrics(): Promise<MockPlayerMetrics> {
    await this.simulateDelay();
    return this.playerMetrics;
  }

  async fetchGameData(): Promise<MockGameData> {
    await this.simulateDelay();
    return this.gameData;
  }

  // Method to update game progress
  async updateGameProgress(challengeId: string, completed: boolean): Promise<void> {
    await this.simulateDelay();
    const challenge = this.gameData.challenges.find(c => c.id === challengeId);
    if (challenge) {
      challenge.completed = completed;
      this.gameData.playerProgress.completed = this.gameData.challenges.filter(c => c.completed).length;
    }
  }

  // Method to simulate errors for testing
  async simulateError(): Promise<never> {
    await this.simulateDelay();
    throw new Error('Simulated service error');
  }
}

export const mockDataService = new MockDataService();