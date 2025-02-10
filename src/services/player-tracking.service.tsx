import { db } from '../config/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    Timestamp,
    runTransaction
} from 'firebase/firestore';
import { AnalyticsService } from './analytics.service';
import { retryOperation } from '../utils/retry.utils';

export interface PlayerProfile {
    userId: string;
    role: string;
    displayName?: string;
    email?: string;
    lastLoginAt: Timestamp;
    lastActive: Timestamp;
    totalGames: number;
    averageScore: number;
    lifetimeScore: number;
    totalQuartersCompleted: number;
    quarterPerformance: Record<string, QuarterPerformance>;
    preferences: PlayerPreferences;
    statistics: PlayerStatistics;
    achievements: Achievement[];
    version: number;
}

export interface PlayerPreferences {
    favoriteWhiskeyTypes: string[];
    challengeDifficulty: 'easy' | 'medium' | 'hard';
    notifications: boolean;
    theme: 'light' | 'dark';
}

export interface PlayerStatistics {
    totalSamplesGuessed: number;
    correctGuesses: number;
    hintsUsed: number;
    averageAccuracy: number;
    bestScore: number;
    worstScore: number;
    lastUpdated: Timestamp;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    unlockedAt: Timestamp;
    progress: number;
    maxProgress: number;
}

export interface QuarterPerformance {
    quarterId: string;
    score: number;
    samplesCompleted: number;
    accuracy: number;
    completedAt: Timestamp;
}

export class PlayerTrackingService {
    private readonly COLLECTION_NAME = 'player_profiles';
    private readonly MAX_RETRY_ATTEMPTS = 3;
    private readonly CURRENT_VERSION = 1;

    private readonly collection = collection(db, this.COLLECTION_NAME);
    private readonly cache = new Map<string, { data: PlayerProfile; timestamp: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor() {
        // Clear expired cache entries periodically
        setInterval(() => this.clearExpiredCache(), this.CACHE_TTL);
    }

    private clearExpiredCache(): void {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.CACHE_TTL) {
                this.cache.delete(key);
            }
        }
    }

    async getProfile(userId: string): Promise<PlayerProfile | null> {
        try {
            // Check cache first
            const cached = this.cache.get(userId);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                return cached.data;
            }

            const profileRef = doc(this.collection, userId);
            const profileDoc = await getDoc(profileRef);

            if (!profileDoc.exists()) {
                return null;
            }

            let profile = profileDoc.data() as PlayerProfile;

            // Check version and migrate if necessary
            if (profile.version !== this.CURRENT_VERSION) {
                profile = await this.migrateProfile(profile);
            }

            // Update cache
            this.cache.set(userId, {
                data: profile,
                timestamp: Date.now()
            });

            return profile;
        } catch (error) {
            console.error('Failed to get profile:', error);
            throw new Error('Failed to retrieve player profile');
        }
    }

    async getAllPlayerProfiles(): Promise<PlayerProfile[]> {
        try {
            const snapshot = await getDocs(this.collection);
            const profiles = snapshot.docs.map(doc => {
                const data = doc.data() as PlayerProfile;
                return this.migrateProfile(data);
            });
            return Promise.all(profiles);
        } catch (error) {
            console.error('Failed to fetch all player profiles:', error);
            return [];
        }
    }

    async updateAchievements(userId: string, achievements: Achievement[]): Promise<void> {
        return retryOperation(async () => {
            try {
                const profileRef = doc(this.collection, userId);
                await runTransaction(db, async (transaction) => {
                    const profileDoc = await transaction.get(profileRef);

                    if (!profileDoc.exists()) {
                        throw new Error('Player profile not found');
                    }

                    const profile = profileDoc.data() as PlayerProfile;
                    profile.achievements = achievements;
                    profile.lastActive = Timestamp.now();

                    transaction.set(profileRef, profile);

                    // Update cache
                    this.cache.set(userId, {
                        data: profile,
                        timestamp: Date.now()
                    });
                });

                // Track achievements
                achievements.forEach(achievement => {
                    if (achievement.progress === achievement.maxProgress) {
                        AnalyticsService.trackUserEngagement('achievement_unlocked', {
                            userId,
                            achievementId: achievement.id
                        });
                    }
                });
            } catch (error) {
                console.error('Failed to update achievements:', error);
                throw new Error('Failed to update achievements');
            }
        }, { maxAttempts: this.MAX_RETRY_ATTEMPTS });
    }

    private async migrateProfile(profile: PlayerProfile): Promise<PlayerProfile> {
        // Handle migration based on version
        switch (profile.version) {
            case undefined:
                return {
                    ...profile,
                    preferences: profile.preferences 
                        ? { ...profile.preferences }
                        : {
                            favoriteWhiskeyTypes: [],
                            challengeDifficulty: 'easy',
                            notifications: true,
                            theme: 'light'
                        },
                    statistics: profile.statistics
                        ? { ...profile.statistics }
                        : {
                            totalSamplesGuessed: 0,
                            correctGuesses: 0,
                            hintsUsed: 0,
                            averageAccuracy: 0,
                            bestScore: 0,
                            worstScore: 0,
                            lastUpdated: Timestamp.now()
                        },
                    achievements: profile.achievements || [],
                    version: this.CURRENT_VERSION
                };
            default:
                return profile;
        }
    }
}

// Export singleton instance
export const playerTrackingService = new PlayerTrackingService();