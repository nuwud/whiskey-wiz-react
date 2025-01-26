import { db } from '@/config/firebase';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { AnalyticsService } from '@/services/analytics.service';

export interface SeasonalTrend {
  id: string;
  season: string;
  year: number;
  topFlavors: string[];
  popularWhiskeyTypes: string[];
  averagePrice: number;
  trending: boolean;
}

class SeasonalTrendsService {
  private trendsCollection = collection(db, 'seasonal_trends');

  async getCurrentTrends(): Promise<SeasonalTrend[]> {
    try {
      const currentYear = new Date().getFullYear();
      const q = query(
        this.trendsCollection,
        where('year', '==', currentYear),
        orderBy('season')
      );

      const snapshot = await getDocs(q);
      const trends: SeasonalTrend[] = [];

      snapshot.forEach((doc) => {
        trends.push({
          id: doc.id,
          ...doc.data()
        } as SeasonalTrend);
      });

      AnalyticsService.trackError('Seasonal trends loaded', 'seasonal_trends_service');
      return trends;
    } catch (error) {
      console.error('Failed to fetch current trends:', error);
      AnalyticsService.trackError('Failed to fetch current trends', 'seasonal_trends_service');
      throw error;
    }
  }

  async getTrendsByYear(year: number): Promise<SeasonalTrend[]> {
    try {
      const q = query(
        this.trendsCollection,
        where('year', '==', year),
        orderBy('season')
      );

      const snapshot = await getDocs(q);
      const trends: SeasonalTrend[] = [];

      snapshot.forEach((doc) => {
        trends.push({
          id: doc.id,
          ...doc.data()
        } as SeasonalTrend);
      });

      return trends;
    } catch (error) {
      console.error('Failed to fetch trends by year:', error);
      AnalyticsService.trackError('Failed to fetch trends by year', 'seasonal_trends_service');
      throw error;
    }
  }

  async getTrendingFlavors(): Promise<string[]> {
    try {
      const q = query(
        this.trendsCollection,
        where('trending', '==', true),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const allFlavors = new Set<string>();

      snapshot.forEach((doc) => {
        const trend = doc.data() as SeasonalTrend;
        trend.topFlavors.forEach(flavor => allFlavors.add(flavor));
      });

      return Array.from(allFlavors);
    } catch (error) {
      console.error('Failed to fetch trending flavors:', error);
      AnalyticsService.trackError('Failed to fetch trending flavors', 'seasonal_trends_service');
      return [];
    }
  }
}

export const seasonalTrendsService = new SeasonalTrendsService();