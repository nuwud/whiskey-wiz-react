import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { analyticsService } from 'src/services/analytics.service';

interface MLTrainingData {
  userId: string;
  quarterId: string;
  challengeType: string;
  userPerformance: {
    totalScore: number;
    timeTaken: number;
    questionsAttempted: number;
    correctAnswers: number;
  };
  whiskeySampleDetails: {
    age: number;
    proof: number;
    mashbillType: string;
  };
}

interface UserLearningProfile {
  userId: string;
  strengths: string[];
  weaknesses: string[];
  preferredChallengeTypes: string[];
  averagePerformance: number;
}

export class MachineLearningService {
  private trainingDataCollection = collection(db, 'ml_training_data');
  private learningProfileCollection = collection(db, 'user_learning_profiles');

  async recordTrainingData(data: MLTrainingData): Promise<void> {
    try {
      await addDoc(this.trainingDataCollection, data);

      analyticsService.trackUserEngagement('ml_training_data_recorded', {
        userId: data.userId,
        quarterId: data.quarterId,
        challengeType: data.challengeType
      });
    } catch (error) {
      console.error('Failed to record ML training data', error);
    }
  }

  async generateLearningProfile(userId: string): Promise<UserLearningProfile> {
    try {
      // Fetch user's training data
      const q = query(this.trainingDataCollection, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const trainingData = snapshot.docs.map(doc => doc.data() as MLTrainingData);

      if (trainingData.length === 0) {
        return this.createDefaultLearningProfile(userId);
      }

      // Analyze performance across different dimensions
      const strengths = this.identifyStrengths(trainingData);
      const weaknesses = this.identifyWeaknesses(trainingData);
      const preferredChallengeTypes = this.determinePreferredChallengeTypes(trainingData);
      const averagePerformance = this.calculateAveragePerformance(trainingData);

      const learningProfile: UserLearningProfile = {
        userId,
        strengths,
        weaknesses,
        preferredChallengeTypes,
        averagePerformance
      };

      // Save or update learning profile
      await this.saveLearningProfile(learningProfile);

      return learningProfile;
    } catch (error) {
      console.error('Failed to generate learning profile', error);
      return this.createDefaultLearningProfile(userId);
    }
  }

  private createDefaultLearningProfile(userId: string): UserLearningProfile {
    return {
      userId,
      strengths: [],
      weaknesses: [],
      preferredChallengeTypes: ['tasting'],
      averagePerformance: 50
    };
  }

  private identifyStrengths(trainingData: MLTrainingData[]): string[] {
    const strengthAnalysis: Record<string, number> = {};

    trainingData.forEach(data => {
      if (data.userPerformance.correctAnswers / data.userPerformance.questionsAttempted > 0.8) {
        strengthAnalysis[data.challengeType] =
          (strengthAnalysis[data.challengeType] || 0) + 1;
      }
    });

    return Object.entries(strengthAnalysis)
      .filter(([_, count]) => count > 1)
      .map(([type]) => type);
  }

  private identifyWeaknesses(trainingData: MLTrainingData[]): string[] {
    const weaknessAnalysis: Record<string, number> = {};

    trainingData.forEach(data => {
      if (data.userPerformance.correctAnswers / data.userPerformance.questionsAttempted < 0.5) {
        weaknessAnalysis[data.challengeType] =
          (weaknessAnalysis[data.challengeType] || 0) + 1;
      }
    });

    return Object.entries(weaknessAnalysis)
      .filter(([_, count]) => count > 1)
      .map(([type]) => type);
  }

  private determinePreferredChallengeTypes(trainingData: MLTrainingData[]): string[] {
    const challengeTypeScores: Record<string, number> = {};

    trainingData.forEach(data => {
      challengeTypeScores[data.challengeType] =
        (challengeTypeScores[data.challengeType] || 0) + data.userPerformance.totalScore;
    });

    return Object.entries(challengeTypeScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([type]) => type);
  }

  private calculateAveragePerformance(trainingData: MLTrainingData[]): number {
    const totalPerformance = trainingData.reduce(
      (sum, data) => sum + data.userPerformance.totalScore,
      0
    );
    return totalPerformance / trainingData.length || 50;
  }

  private async saveLearningProfile(profile: UserLearningProfile): Promise<void> {
    try {
      const q = query(this.learningProfileCollection, where('userId', '==', profile.userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Create new profile
        await addDoc(this.learningProfileCollection, profile);
      } else {
        // Update existing profile (simplified for this example)
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, profile);
      }

      AnalyticsService.trackUserEngagement('learning_profile_updated', {
        userId: profile.userId,
        averagePerformance: profile.averagePerformance
      });
    } catch (error) {
      console.error('Failed to save learning profile', error);
    }
  }

  // Advanced recommendation system
  async recommendNextChallenge(userId: string): Promise<string> {
    try {
      const learningProfile = await this.generateLearningProfile(userId);

      // Complex recommendation logic
      const recommendationStrategy = [
        ...learningProfile.weaknesses,
        ...learningProfile.preferredChallengeTypes
      ];

      // Return most suitable challenge type
      return recommendationStrategy[0] || 'tasting';
    } catch (error) {
      console.error('Challenge recommendation failed', error);
      return 'tasting';
    }
  }
}