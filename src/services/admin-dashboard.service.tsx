import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  CollectionReference,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { QuarterTemplate } from './quarter-template.service';
import { PlayerProfile } from '../types/auth.types';
import { fromFirebaseTimestamp } from '../utils/timestamp.utils';
import { AnalyticsService } from './analytics.service';
import { monitoringService } from './monitoring.service';
import { UserType } from '../types/auth.types';


export interface AdminDashboardMetrics {
  playerStats: {
    total: number;
    active: number;
    revenue: {
      subscriptionConversions: number;
      merchandiseSales: number;
      bottleSales: number;
    };
    demographics: {
      countryDistribution: Record<string, number>;
      authMethodBreakdown: {
        guest: number;
        email: number;
        gmail: number;
        shopify: number;
      };
    };
  };
  topPerformers: PlayerProfile[];
  quarterPerformance: Array<{
    quarterId: string;
    averageScore: number;
    totalPlayers: number;
    topPerformer?: PlayerProfile;
  }>;
  machineLearningSuggestions: {
    marketingSegments: Array<{
      name: string;
      size: number;
      characteristics: string[];
      recommendedActions: string[];
    }>;
    recommendedMerchandise: Array<{
      itemId: string;
      name: string;
      confidence: number;
      reason: string;
    }>;
    potentialSubscriptionTargets: Array<{
      userId: string;
      likelihood: number;
      engagementMetrics: {
        gamesPlayed: number;
        averageScore: number;
        lastActive: Date;
      };
    }>;
  };
}

export interface MLInsights {
  recommendedMerchandise: Array<{
    itemId: string;
    name: string;
    confidence: number;
    reason: string;
  }>;
  potentialSubscriptionTargets: Array<{
    userId: string;
    likelihood: number;
    engagementMetrics: {
      gamesPlayed: number;
      averageScore: number;
      lastActive: Date;
    };
  }>;
  marketingSegments: Array<{
    name: string;
    size: number;
    characteristics: string[];
    recommendedActions: string[];
  }>;
}

interface MLRecommendation {
  userId: string;
  recommendationType: string;
  confidence: number;
  reason: string;
}

export const validatePlayerProfiles = (profiles: PlayerProfile[]): boolean => {
  return profiles.every(profile =>
    profile.userId &&
    profile.metrics &&
    profile.lastLoginAt &&
    typeof profile.metrics.averageScore === 'number'
  );
};

export const isValidPlayerProfile = (profile: unknown): profile is PlayerProfile => {
  return (
    typeof profile === 'object' &&
    profile !== null &&
    'userId' in profile &&
    'metrics' in profile &&
    typeof (profile as any).metrics.averageScore === 'number'
  );
};

export class AdminDashboardService {
  private playerProfiles: PlayerProfile[] = [];
  private playerProfileCollection: CollectionReference<PlayerProfile>;
  private quarterCollection: CollectionReference<QuarterTemplate>;

  constructor() {
    this.playerProfileCollection = collection(db, 'playerProfiles') as CollectionReference<PlayerProfile>;
    this.quarterCollection = collection(db, 'quarters') as CollectionReference<QuarterTemplate>;
  }

  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private isCacheStale(): boolean {
    return !this.lastFetch ||
      Date.now() - this.lastFetch.getTime() > this.CACHE_DURATION;
  }

  async fetchAndCacheProfiles(): Promise<void> {
    try {
      const profiles = await this.getPlayerProfiles();
      this.playerProfiles = profiles;
      this.lastFetch = new Date();
    } catch (error) {
      console.error('Failed to fetch and cache profiles:', error);
    }
  }


  mapFirestoreDataToPlayerProfile(data: DocumentData): PlayerProfile {
    return {
      userId: data.userId,
      displayName: data.displayName || '',
      email: data.email || '',
      role: data.role || 'user',
      adminPrivileges: data.adminPrivileges || [],
      type: data.type || UserType.GUEST,
      isAnonymous: !!data.isAnonymous,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
      lastActive: data.lastActive?.toDate() || new Date(),
      guest: !!data.guest,
      registrationType: data.registrationType || 'guest',
      geographicData: data.geographicData || {},
      achievements: data.achievements || [],
      metrics: data.metrics || {
        gamesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        bestScore: 0,
        badges: [],
        achievements: []
      },
      statistics: data.statistics || {
        gamesWon: 0,
        gamesLost: 0,
        totalPlayTime: 0
      },
      preferences: data.preferences || {
        favoriteWhiskeys: [],
        preferredDifficulty: 'beginner',
        notifications: false
      },
      totalGames: data.totalGames || 0,
      averageScore: data.averageScore || 0,
      lifetimeScore: data.lifetimeScore || 0,
      totalQuartersCompleted: data.totalQuartersCompleted || 0,
      quarterPerformance: data.quarterPerformance || []
    };
  }

  private async getActiveQuarters(): Promise<QuarterTemplate[]> {
    const q = query(this.quarterCollection, where('isActive', '==', true), orderBy('startDate', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as QuarterTemplate);
  }

  private getActivePlayerCount(profiles: PlayerProfile[]): number {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return profiles.filter(profile =>
      new Date(profile.lastLoginAt) > thirtyDaysAgo
    ).length;
  }

  private async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const TRACE_NAME = 'dashboard_metrics_fetch';
    let startTime = 0;

    try {
        startTime = monitoringService.startTrace(TRACE_NAME);
        const profiles = await this.getProfiles();
        
        const metrics: AdminDashboardMetrics = {
            playerStats: {
                total: profiles.length,
                active: this.getActivePlayerCount(profiles),
                revenue: this.calculateRevenueProjections(profiles),
                demographics: this.analyzePlayerDemographics(profiles)
            },
            topPerformers: this.getTopPerformers(profiles),
            quarterPerformance: await this.calculateQuarterPerformance(),
            machineLearningSuggestions: this.generateMachineLearningInsights(profiles)
        };

        // Track metrics generation
        AnalyticsService.trackEvent('dashboard_metrics_generated', {
            totalPlayers: metrics.playerStats.total,
            activePlayers: metrics.playerStats.active,
            revenueProjected: metrics.playerStats.revenue.subscriptionConversions
        });

        return metrics;

    } catch (error) {
        console.error('Failed to get dashboard metrics:', error);
        AnalyticsService.trackEvent('dashboard_metrics_failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    } finally {
        if (startTime) {
            monitoringService.endTrace(TRACE_NAME, startTime);
        }
    }
  }

  getPlayerAnalytics = async () => {
    const TRACE_NAME = 'player_analytics_fetch';
    let startTime = 0;

    try {
        startTime = monitoringService.startTrace(TRACE_NAME);
        const profiles = await this.getProfiles();
        
        const analytics = {
            totalPlayers: profiles.length,
            activePlayers: this.getActivePlayerCount(profiles),
            averageScore: this.calculateAverageScore(profiles),
            topPerformers: this.getTopPerformers(profiles, 5)
        };

        AnalyticsService.trackEvent('player_analytics_generated', {
            totalPlayers: analytics.totalPlayers,
            activePlayers: analytics.activePlayers
        });

        return analytics;

    } catch (error) {
        console.error('Failed to get player analytics:', error);
        AnalyticsService.trackEvent('player_analytics_failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    } finally {
        if (startTime) {
            monitoringService.endTrace(TRACE_NAME, startTime);
        }
    }
  };

  private calculateAverageScore(profiles: PlayerProfile[]): number {
    if (profiles.length === 0) return 0;
    const totalScore = profiles.reduce((sum, profile) =>
      sum + profile.metrics.averageScore, 0);
    return totalScore / profiles.length;
  }

  private getTopPerformers(profiles: PlayerProfile[], limit: number = 5): PlayerProfile[] {
    return [...profiles]
      .sort((a, b) => b.metrics.averageScore - a.metrics.averageScore)
      .slice(0, limit);
  }

  private async getPlayerProfiles(): Promise<PlayerProfile[]> {
    try {
      const snapshot = await getDocs(this.playerProfileCollection);
      return snapshot.docs.map(doc => this.mapFirestoreDataToPlayerProfile({
        ...doc.data(),
        userId: doc.id
      }));
    } catch (error) {
      console.error('Failed to fetch player profiles:', error);
      return [];
    }
  }

  private calculateConfidenceScore(profile: PlayerProfile): number {
    const scoreWeight = 0.4;
    const gamesPlayedWeight = 0.3;
    const recencyWeight = 0.3;

    // Normalize scores (assuming max score of 100)
    const normalizedScore = profile.metrics.averageScore / 100;

    // Normalize games played (assuming 50 games is max)
    const normalizedGamesPlayed = Math.min(profile.metrics.gamesPlayed / 50, 1);

    // Calculate recency score (1.0 if within last 7 days, decreasing linearly to 0.0 at 30 days)
    const daysSinceLastActive = (Date.now() - new Date(profile.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysSinceLastActive / 30));

    return (
      normalizedScore * scoreWeight +
      normalizedGamesPlayed * gamesPlayedWeight +
      recencyScore * recencyWeight
    );
  }

  private generateMachineLearningInsights(profiles: PlayerProfile[]): MLInsights {
    const insights: MLInsights = {
      recommendedMerchandise: [],
      potentialSubscriptionTargets: [],
      marketingSegments: []
    };

    try {
      // Get active users for merchandise recommendations
      const activeUsers = profiles.filter(profile => {
        const lastLogin = new Date(profile.lastLoginAt);
        return Date.now() - lastLogin.getTime() < 30 * 24 * 60 * 60 * 1000;
      });

      // Generate merchandise recommendations based on user performance
      insights.recommendedMerchandise = activeUsers
        .filter(profile => profile.metrics.averageScore > 75)
        .map(profile => ({
          userId: profile.userId,
          recommendationType: 'premium_subscription',
          itemId: `merch-${Math.random().toString(36).substr(2, 9)}`,
          name: `Premium Whiskey Tasting Kit`,
          confidence: 0.85,
          reason: `High performance user with consistent engagement`
        }));

      // Identify subscription targets
      insights.potentialSubscriptionTargets = activeUsers
        .filter(user => !user.guest)
        .map(user => ({
          userId: user.userId,
          likelihood: 0.7,
          engagementMetrics: {
            gamesPlayed: user.metrics.gamesPlayed,
            averageScore: user.metrics.averageScore,
            lastActive: new Date(user.lastLoginAt)
          }
        }));

      // Generate marketing segments
      insights.marketingSegments = [
        {
          name: "High Performers",
          size: profiles.filter(p => p.metrics.averageScore > 80).length,
          characteristics: ["High scores", "Regular participation"],
          recommendedActions: ["Offer premium features", "Early access to new content"]
        },
        {
          name: "Casual Players",
          size: profiles.filter(p => p.metrics.gamesPlayed < 5).length,
          characteristics: ["Occasional participation", "Varied performance"],
          recommendedActions: ["Engagement campaigns", "Beginner-friendly content"]
        }
      ];

      return insights;
    } catch (error) {
      console.error('Failed to generate ML insights:', error);
      return insights;  // Return empty insights structure if generation fails
    }
  }

  private calculateRevenueProjections(playerProfiles: PlayerProfile[]): {
    subscriptionConversions: number;
    merchandiseSales: number;
    bottleSales: number;
  } {
    // Calculate potential revenue based on player profiles
    const activeUserCount = playerProfiles.filter(profile => {
      const lastLoginDate = new Date(profile.lastLoginAt);
      return Date.now() - lastLoginDate.getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days
    }).length;

    // Example projections based on active users
    const subscriptionConversionRate = 0.1; // 10% conversion rate
    const avgMerchandisePerUser = 25; // $25 per user
    const avgBottlesPerUser = 50; // $50 per user

    return {
      subscriptionConversions: Math.round(activeUserCount * subscriptionConversionRate),
      merchandiseSales: Math.round(activeUserCount * avgMerchandisePerUser),
      bottleSales: Math.round(activeUserCount * avgBottlesPerUser)
    };
  }

  analyzePlayerDemographics(playerProfiles: PlayerProfile[]): {
    countryDistribution: Record<string, number>;
    authMethodBreakdown: {
      guest: number;
      email: number;
      gmail: number;
      shopify: number;
    };
  } {
    const countryDistribution: Record<string, number> = {};
    const authMethodBreakdown = {
      guest: 0,
      email: 0,
      gmail: 0,
      shopify: 0
    };

    playerProfiles.forEach(profile => {
      // Handle country distribution
      if (profile.geographicData?.country) {
        const country = profile.geographicData.country;
        countryDistribution[country] = (countryDistribution[country] || 0) + 1;
      }

      // Handle auth method breakdown based on UserType
      switch (profile.type) {
        case UserType.REGISTERED:
          authMethodBreakdown.guest++;
          break;
        case UserType.REGISTERED:
          // For registered users, check registrationType to determine specific method
          if (profile.type === UserType.REGISTERED) {
            authMethodBreakdown.email++;
          } else if (profile.type === UserType.REGISTERED) {
            authMethodBreakdown.gmail++;
          } else if (profile.type === UserType.REGISTERED) {
            authMethodBreakdown.shopify++;
          }
          break;
        case UserType.REGISTERED:
          // Admins are counted as registered email users
          authMethodBreakdown.email++;
          break;
      }
    });

    return {
      countryDistribution,
      authMethodBreakdown
    };
  }

  async calculateQuarterPerformance(): Promise<Array<{
    quarterId: string;
    averageScore: number;
    totalPlayers: number;
    topPerformer?: PlayerProfile;
  }>> {
    try {
      const quarters = await this.getActiveQuarters();
      const profiles = await this.getPlayerProfiles();

      return quarters.map(Quarter => {
        const quarterPlayers = profiles.filter((profile: PlayerProfile) => {
          // You'll need to add logic to determine which players participated in which quarter
          return fromFirebaseTimestamp(Quarter.startDate) <= profile.lastLoginAt;
        });

        const averageScore = quarterPlayers.reduce(
          (sum: number, player: PlayerProfile) => sum + player.metrics.averageScore,
          0
        ) / (quarterPlayers.length || 1);

        const topPerformer = quarterPlayers.length ?
          quarterPlayers.reduce((top: PlayerProfile | undefined, current: PlayerProfile) =>
            current.metrics.averageScore > (top?.metrics.averageScore || 0) ? current : top,
            undefined
          ) : undefined;

        return {
          quarterId: Quarter.id || '',
          averageScore,
          totalPlayers: quarterPlayers.length,
          topPerformer
        };
      });
    } catch (error: unknown) {
      console.error('Failed to calculate quarter performance:', error);
      return [];
    }
  }

  async getComprehensiveDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const metrics = await this.getDashboardMetrics();
    return metrics;
  }

  async getProfiles(): Promise<PlayerProfile[]> {
    if (this.isCacheStale()) {
      await this.refreshProfiles();
      this.cleanupStaleData();
      await this.fetchAndCacheProfiles();
      try {
        const profiles = await this.getPlayerProfiles();
        this.playerProfiles = profiles;
        this.lastFetch = new Date();
      } catch (error) {
        console.error('Failed to refresh player profiles:', error);
      }
    }
    return this.playerProfiles;
  }

  async refreshProfiles(): Promise<void> {
    try {
      const snapshot = await getDocs(this.playerProfileCollection);
      this.playerProfiles = snapshot.docs.map(doc => ({
        ...doc.data(),
        userId: doc.id
      })) as PlayerProfile[];
      this.lastFetch = new Date();
    } catch (error) {
      console.error('Failed to refresh player profiles:', error);
    }
  }

  cleanupStaleData(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.playerProfiles = this.playerProfiles.filter(profile =>
      new Date(profile.lastLoginAt) > thirtyDaysAgo
    );
  }

  generateMLRecommendations(profiles: PlayerProfile[]): MLRecommendation[] {
    return profiles
      .filter(profile => {
        const lastActive = new Date(profile.lastLoginAt);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastActive > thirtyDaysAgo && profile.metrics.averageScore > 70;
      })
      .map(profile => ({
        userId: profile.userId,
        recommendationType: 'premium_subscription',
        confidence: this.calculateConfidenceScore(profile),
        reason: `High performer with ${profile.metrics.gamesPlayed} games played`
      }));
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Operation failed after retries');
}