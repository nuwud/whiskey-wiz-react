import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { AnalyticsService } from './AnalyticsService';

export interface GameChallenge {
  id: string;
  quarterId: string;
  whiskeySampleId: string;
  challengeType: 'tasting' | 'knowledge' | 'pairing';
  difficulty: 'easy' | 'medium' | 'hard';
  questions: ChallengeQuestion[];
  metadata: Record<string, any>;
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

export interface UserChallengeAttempt {
  userId: string;
  challengeId: string;
  questions: QuestionAttempt[];
  totalScore: number;
  completed: boolean;
  timestamp: Date;
}

export interface QuestionAttempt {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
}

export class GameChallengeService {
  private challengeCollection = collection(db, 'game_challenges');
  private userAttemptsCollection = collection(db, 'user_challenge_attempts');

  async createChallenge(challenge: GameChallenge): Promise<string> {
    try {
      const docRef = await addDoc(this.challengeCollection, challenge);
      
      AnalyticsService.trackUserEngagement('challenge_created', {
        challengeId: docRef.id,
        type: challenge.challengeType,
        difficulty: challenge.difficulty
      });

      return docRef.id;
    } catch (error) {
      console.error('Failed to create challenge', error);
      throw error;
    }
  }

  async getChallengesByQuarter(quarterId: string): Promise<GameChallenge[]> {
    try {
      const q = query(this.challengeCollection, where('quarterId', '==', quarterId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GameChallenge));
    } catch (error) {
      console.error('Failed to fetch challenges', error);
      return [];
    }
  }

  async submitChallengeAttempt(attempt: UserChallengeAttempt): Promise<void> {
    try {
      await addDoc(this.userAttemptsCollection, attempt);

      // Calculate and track performance
      AnalyticsService.trackUserEngagement('challenge_completed', {
        challengeId: attempt.challengeId,
        totalScore: attempt.totalScore,
        completed: attempt.completed
      });
    } catch (error) {
      console.error('Failed to submit challenge attempt', error);
      throw error;
    }
  }

  calculateQuestionScore(question: ChallengeQuestion, userAnswer: string): number {
    switch (question.type) {
      case 'multiple_choice':
      case 'true_false':
        return userAnswer === question.correctAnswer ? question.points : 0;
      
      case 'open_ended':
        // More complex scoring for open-ended questions
        const similarity = this.calculateStringSimilarity(userAnswer, question.correctAnswer);
        return Math.round(question.points * similarity);
      
      default:
        return 0;
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Basic Levenshtein distance-based similarity
    const len1 = str1.length;
    const len2 = str2.length;
    const editDistance = this.levenshteinDistance(str1, str2);
    
    // Calculate similarity as a percentage
    const maxLen = Math.max(len1, len2);
    return 1 - editDistance / maxLen;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    // Increment along the first column of each row
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    // Increment each column in the first row
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  async generateAdaptiveChallenges(userId: string, quarterId: string): Promise<GameChallenge[]> {
    try {
      // Fetch user's previous performance
      const userPreviousAttempts = await this.getUserPerformanceHistory(userId, quarterId);
      
      // Determine appropriate difficulty
      const recommendedDifficulty = this.calculateRecommendedDifficulty(userPreviousAttempts);

      // Fetch challenges matching the recommended difficulty
      const q = query(
        this.challengeCollection, 
        where('quarterId', '==', quarterId),
        where('difficulty', '==', recommendedDifficulty)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GameChallenge));
    } catch (error) {
      console.error('Failed to generate adaptive challenges', error);
      return [];
    }
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

    const averageScore = attempts.reduce((sum, attempt) => sum + attempt.totalScore, 0) / attempts.length;
    
    if (averageScore > 80) return 'hard';
    if (averageScore > 50) return 'medium';
    return 'easy';
  }
}