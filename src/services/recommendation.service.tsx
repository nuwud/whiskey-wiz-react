import { db } from '../config/firebase';
import { collection, query, getDocs, where, limit, DocumentData } from 'firebase/firestore';
import { AnalyticsService } from './analytics.service';
import { WhiskeySample } from '../types/game.types';

interface WhiskeyRecommendation extends WhiskeySample {
  matchScore: number;
  similarityReason: string;
}

interface UserPreference {
  favoriteRegions: string[];
  favoriteMashbills: string[];
  preferredAgeRange: [number, number];
  tasteProfile: Record<string, number>;
}

class RecommendationService {
  private readonly whiskeyCollection = collection(db, 'whiskies');
  private readonly userPrefsCollection = collection(db, 'user_preferences');
  private readonly MAX_RECOMMENDATIONS = 5;

  async getRecommendations(userId: string): Promise<WhiskeyRecommendation[]> {
    try {
      // Get user preferences
      const userPrefs = await this.getUserPreferences(userId);

      // Get potential matches
      const whiskeyQuery = query(
        this.whiskeyCollection,
        where('age', '>=', userPrefs.preferredAgeRange[0]),
        where('age', '<=', userPrefs.preferredAgeRange[1]),
        limit(50)
      );

      const snapshot = await getDocs(whiskeyQuery);
      const allWhiskies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Score and sort whiskies
      const scoredWhiskies = allWhiskies
        .map(whiskey => this.scoreWhiskey(whiskey, userPrefs))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, this.MAX_RECOMMENDATIONS);

      AnalyticsService.trackUserEngagement('recommendations_generated', {
        userId,
        recommendationCount: scoredWhiskies.length
      });

      return scoredWhiskies;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      AnalyticsService.trackEvent('Failed to get recommendations', {
        service: 'recommendation_service',
        userId: userId
      });
      throw error;
    }
  }

  private async getUserPreferences(userId: string): Promise<UserPreference> {
    try {
      const prefDoc = await getDocs(
        query(this.userPrefsCollection, where('userId', '==', userId), limit(1))
      );

      if (prefDoc.empty) {
        return this.getDefaultPreferences();
      }

      return prefDoc.docs[0].data() as UserPreference;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  private getDefaultPreferences(): UserPreference {
    return {
      favoriteRegions: [],
      favoriteMashbills: [],
      preferredAgeRange: [0, 100],
      tasteProfile: {}
    };
  }

  private scoreWhiskey(whiskey: DocumentData, prefs: UserPreference): WhiskeyRecommendation {
    let score = 0;
    const reasons: string[] = [];

    // Region match
    if (prefs.favoriteRegions.includes(whiskey.region)) {
      score += 0.3;
      reasons.push(`From your preferred region: ${whiskey.region}`);
    }

    // Mashbill match
    if (prefs.favoriteMashbills.includes(whiskey.mashbillType)) {
      score += 0.3;
      reasons.push(`Matches your preferred mashbill type`);
    }

    // Age match
    const ageScore = this.calculateAgeScore(whiskey.age, prefs.preferredAgeRange);
    score += ageScore;
    if (ageScore > 0.2) {
      reasons.push(`Within your preferred age range`);
    }

    // Flavor profile match
    if (whiskey.flavorProfile && prefs.tasteProfile) {
      const flavorScore = this.calculateFlavorScore(whiskey.flavorProfile, prefs.tasteProfile);
      score += flavorScore;
      if (flavorScore > 0.2) {
        reasons.push(`Matches your taste preferences`);
      }
    }

    return {
      ...whiskey,
      distillery: whiskey.distillery || 'Unknown', // Add missing distillery field
      matchScore: score,
      similarityReason: reasons.join('. ')
    } as WhiskeyRecommendation;
  }

  private calculateAgeScore(age: number, [min, max]: [number, number]): number {
    if (age >= min && age <= max) {
      return 0.2;
    }
    const distance = Math.min(Math.abs(age - min), Math.abs(age - max));
    return Math.max(0, 0.2 - (distance * 0.02));
  }

  private calculateFlavorScore(
    profile: string[],
    preferences: Record<string, number>
  ): number {
    let score = 0;
    for (const flavor of profile) {
      if (preferences[flavor]) {
        score += preferences[flavor];
      }
    }
    return Math.min(0.2, score / 5);
  }
}

export const recommendationService = new RecommendationService();