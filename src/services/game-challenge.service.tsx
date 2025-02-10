import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AnalyticsService } from './analytics.service';
import { retryOperation } from '../utils/retry.utils';

export interface GameChallenge {
  id: string;
  quarterId: string;
  whiskeySampleId: string;
  challengeType: 'tasting' | 'knowledge' | 'pairing';
  difficulty: 'easy' | 'medium' | 'hard';
  questions: ChallengeQuestion[];
  metadata: Record<string, any>;
  version: number;
  timestamp?: number;
}

export interface ChallengeQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'open_ended';
  options?: string[];
  correctAnswer: string;
  points: number;
  hint?: string;
}

export interface QuestionAttempt {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  type: 'multiple_choice' | 'true_false' | 'open_ended';
}

export interface UserChallengeAttempt {
  userId: string;
  challengeId: string;
  questions: QuestionAttempt[];
  totalScore: number;
  completed: boolean;
  timestamp: Date;
}

export class GameChallengeService {
  private readonly challengeCollection = collection(db, 'game_challenges');
  private readonly userAttemptsCollection = collection(db, 'user_challenge_attempts');
  private readonly challengeCache = new Map<string, GameChallenge>();
  private readonly MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Clear cache periodically
    setInterval(() => this.cleanCache(), this.MAX_CACHE_AGE);
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.challengeCache.entries()) {
        if (value && value.timestamp && now - value.timestamp > this.MAX_CACHE_AGE) {
            this.challengeCache.delete(key);
        }
    }
}

  async createChallenge(challenge: Omit<GameChallenge, 'id'>): Promise<string> {
    return retryOperation(async () => {
      try {
        const docRef = await addDoc(this.challengeCollection, {
          ...challenge,
          version: 1,
          createdAt: new Date()
        });

        // Add to cache
        this.challengeCache.set(docRef.id, {
          id: docRef.id,
          ...challenge,
          version: 1,
          timestamp: Date.now()
        } as GameChallenge);

        AnalyticsService.trackUserEngagement('challenge_created', {
          challengeId: docRef.id,
          type: challenge.challengeType,
          difficulty: challenge.difficulty
        });

        return docRef.id;
      } catch (error) {
        console.error('Failed to create challenge', error);
        throw new Error('Failed to create challenge');
      }
    });
  }

  async getChallengesByQuarter(quarterId: string): Promise<GameChallenge[]> {
    try {
      // Check cache first
      const cachedChallenges = Array.from(this.challengeCache.values())
        .filter(challenge => challenge.quarterId === quarterId);

      if (cachedChallenges.length > 0) {
        return cachedChallenges;
      }

      const q = query(this.challengeCollection, where('quarterId', '==', quarterId));
      const snapshot = await getDocs(q);

      const challenges = snapshot.docs.map(doc => {
        const challenge = {
          id: doc.id,
          ...doc.data(),
          timestamp: Date.now()
        } as GameChallenge;

        // Update cache
        this.challengeCache.set(doc.id, challenge);
        return challenge;
      });

      return challenges;
    } catch (error) {
      console.error('Failed to fetch challenges', error);
      return [];
    }
  }

  async submitChallengeAttempt(attempt: UserChallengeAttempt): Promise<void> {
    return retryOperation(async () => {
      try {
        // Validate attempt
        this.validateAttempt(attempt);

        await addDoc(this.userAttemptsCollection, {
          ...attempt,
          submittedAt: new Date()
        });

        // Calculate and track performance
        AnalyticsService.trackUserEngagement('challenge_completed', {
          challengeId: attempt.challengeId,
          totalScore: attempt.totalScore,
          completed: attempt.completed,
          questionsAttempted: attempt.questions.length,
          correctAnswers: attempt.questions.filter(q => q.isCorrect).length
        });
      } catch (error) {
        console.error('Failed to submit challenge attempt', error);
        throw new Error('Failed to submit challenge attempt');
      }
    });
  }

  private validateAttempt(attempt: UserChallengeAttempt): void {
    if (!attempt.userId || !attempt.challengeId) {
      throw new Error('Invalid attempt: missing required fields');
    }

    if (!Array.isArray(attempt.questions) || attempt.questions.length === 0) {
      throw new Error('Invalid attempt: no questions answered');
    }

    attempt.questions.forEach(question => {
      if (!question.questionId || question.userAnswer === undefined) {
        throw new Error('Invalid attempt: invalid question data');
      }

      // Use levenshteinDistance for open-ended answers
      const challenge = this.challengeCache.get(attempt.challengeId);
      const correctAnswer = challenge?.questions.find(q => q.id === question.questionId)?.correctAnswer;
      
      if (correctAnswer && question.type === 'open_ended') {
        const similarity = this.calculateAnswerSimilarity(
          question.userAnswer.toLowerCase(), 
          correctAnswer.toLowerCase()
        );
        question.isCorrect = similarity >= 0.8; // 80% similarity threshold
      }
    });
  }

  private calculateAnswerSimilarity(userAnswer: string, correctAnswer: string): number {
    const distance = this.levenshteinDistance(userAnswer, correctAnswer);
    const maxLength = Math.max(userAnswer.length, correctAnswer.length);
    return 1 - (distance / maxLength);
  }

  async generateAdaptiveChallenges(userId: string, quarterId: string): Promise<GameChallenge[]> {
    try {
      // Fetch user's previous performance
      const userPreviousAttempts = await this.getUserPerformanceHistory(userId, quarterId);
      const recommendedDifficulty = this.calculateRecommendedDifficulty(userPreviousAttempts);

      // Check cache first
      const cachedChallenges = Array.from(this.challengeCache.values())
        .filter(challenge => 
          challenge.quarterId === quarterId && 
          challenge.difficulty === recommendedDifficulty
        );

      if (cachedChallenges.length > 0) {
        return this.shuffleAndSelectChallenges(cachedChallenges);
      }

      // Fetch from database if not in cache
      const q = query(
        this.challengeCollection,
        where('quarterId', '==', quarterId),
        where('difficulty', '==', recommendedDifficulty)
      );

      const snapshot = await getDocs(q);
      const challenges = snapshot.docs.map(doc => {
        const challenge = {
          id: doc.id,
          ...doc.data(),
          timestamp: Date.now()
        } as GameChallenge;

        // Update cache
        this.challengeCache.set(doc.id, challenge);
        return challenge;
      });

      return this.shuffleAndSelectChallenges(challenges);
    } catch (error) {
      console.error('Failed to generate adaptive challenges', error);
      return [];
    }
  }

  private shuffleAndSelectChallenges(challenges: GameChallenge[], count: number = 5): GameChallenge[] {
    const shuffled = [...challenges].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private async getUserPerformanceHistory(userId: string, quarterId: string): Promise<UserChallengeAttempt[]> {
    const q = query(
      this.userAttemptsCollection,
      where('userId', '==', userId),
      where('challengeId', '==', quarterId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserChallengeAttempt);
  }

  private calculateRecommendedDifficulty(attempts: UserChallengeAttempt[]): 'easy' | 'medium' | 'hard' {
    if (attempts.length === 0) return 'easy';

    const averageScore = attempts.reduce((sum, attempt) => 
      sum + (attempt.totalScore / attempt.questions.length), 0) / attempts.length;

    if (averageScore > 80) return 'hard';
    if (averageScore > 50) return 'medium';
    return 'easy';
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}