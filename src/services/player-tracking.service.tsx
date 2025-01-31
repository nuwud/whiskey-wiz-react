import { db, auth } from '../firebase';
import { collection, doc, setDoc, updateDoc, getDoc, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { AnalyticsService } from './analytics.service';

export interface PlayerProfile {
    userId: string;
    role: string;
    lastLoginAt: Date;
    email?: string;
    displayName?: string;
    gameStats: {
        totalGames: number;
        averageScore: number;
    };
    totalQuartersPlayed: number;
    lifetimeScore: number;
    quarterPerformance: Record<string, QuarterPerformance>;
    registrationType: 'guest' | 'email' | 'gmail' | 'shopify';
    geographicData?: {
        country?: string;
        region?: string;
    };
    preferences?: {
        favoriteWhiskeyTypes?: string[];
        preferredChallengeDifficulty?: 'easy' | 'medium' | 'hard';
    };
    lastActive?: {
        timestamp: Date;
        location?: { lat: number; lng: number };
        ipAddress?: string;
        device?: { type: string; model: string };
        browser?: { name: string; version: string };
        operatingSystem?: { name: string; version: string };
    }
    totalGames?: number;
    averageScore?: number;
}

export interface QuarterPerformance {
    quarterId: string;
    quarterName: string;
    totalScore: number;
    samplesAttempted: number;
    accuracyPercentage: number;
    timestamp: Date;
}

export interface SampleAttempt {
    sampleId: string;
    quarterId: string;
    userId: string;
    score: number;
    guesses: {
        age: { guess: number; accuracy: number },
        proof: { guess: number; accuracy: number },
        mashbillType: { guess: string; correct: boolean }
    };
    timestamp: Date;
}

export class PlayerTrackingService {
    playerProfileCollection = collection(db, 'player_profiles');
    sampleAttemptsCollection = collection(db, 'sample_attempts');

    public getSampleAttemptsCollection() {
        return this.sampleAttemptsCollection;
    }

    async createOrUpdatePlayerProfile(profileData: Partial<PlayerProfile>): Promise<PlayerProfile> {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('No authenticated user');

        try {
            const profileRef = doc(this.playerProfileCollection, currentUser.uid);

            // Fetch existing profile
            const existingProfile = await getDoc(profileRef);

            const updatedProfile: PlayerProfile = existingProfile.exists()
                ? {
                    ...existingProfile.data() as PlayerProfile,
                    ...profileData
                }
                : {
                    userId: currentUser.uid,
                    role: 'player',
                    lastLoginAt: new Date(),
                    email: currentUser.email || '',
                    displayName: currentUser.displayName || '',
                    gameStats: {
                        totalGames: 0,
                        averageScore: 0
                    },
                    totalQuartersPlayed: 0,
                    lifetimeScore: 0,
                    quarterPerformance: {},
                    registrationType: 'email',
                    ...profileData
                };

            // Update profile
            await setDoc(profileRef, updatedProfile, { merge: true });

            // Track profile update
            AnalyticsService.trackUserEngagement('player_profile_updated', {
                userId: currentUser.uid,
                registrationType: updatedProfile.registrationType
            });

            return updatedProfile;
        } catch (error) {
            console.error('Failed to create/update player profile', error);
            throw error;
        }
    }

    async getPlayerByUserId(userId: string): Promise<PlayerProfile | undefined> {
        const q = query(this.playerProfileCollection, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as PlayerProfile).pop();
    }
    async getPlayerByEmail(email: string): Promise<PlayerProfile | undefined> {
        const q = query(this.playerProfileCollection, where('email', '==', email));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as PlayerProfile).pop();
    }
    async getPlayerByDisplayName(displayName: string): Promise<PlayerProfile | undefined> {
        const q = query(this.playerProfileCollection, where('displayName', '==', displayName));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as PlayerProfile).pop();
    }
    async updatePlayerProfile(userId: string, updatedProfileData: Partial<PlayerProfile>): Promise<void> {
        await this.createOrUpdatePlayerProfile({ userId, ...updatedProfileData });
    }
    async deletePlayerProfile(userId: string): Promise<void> {
        await deleteDoc(doc(this.playerProfileCollection, userId));
    }

    async recordSampleAttempt(attempt: SampleAttempt): Promise<void> {
        try {
            await addDoc(this.sampleAttemptsCollection, attempt);

            // Update player profile with performance
            const profileRef = doc(this.playerProfileCollection, attempt.userId);
            await updateDoc(profileRef, {
                [`quarterPerformance.${attempt.quarterId}`]: {
                    quarterId: attempt.quarterId,
                    totalScore: attempt.score,
                    samplesAttempted: 1,
                    accuracyPercentage: this.calculateAccuracy(attempt),
                    timestamp: new Date()
                }
            });

            AnalyticsService.trackUserEngagement('sample_attempt_recorded', {
                quarterId: attempt.quarterId,
                score: attempt.score
            });
        } catch (error) {
            console.error('Failed to record sample attempt', error);
            throw error;
        }
    }

    private calculateAccuracy(attempt: SampleAttempt): number {
        const { age, proof, mashbillType } = attempt.guesses;

        const ageAccuracy = 100 - Math.abs(age.accuracy);
        const proofAccuracy = 100 - Math.abs(proof.accuracy);
        const mashbillAccuracy = mashbillType.correct ? 100 : 0;

        return (ageAccuracy + proofAccuracy + mashbillAccuracy) / 3;
    }

    async getPlayerPerformanceByQuarter(quarterId: string): Promise<PlayerProfile[]> {
        try {
            const q = query(
                this.playerProfileCollection,
                where(`quarterPerformance.${quarterId}`, '!=', null)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as PlayerProfile);
        } catch (error) {
            console.error('Failed to fetch quarter performance', error);
            return [];
        }
    }

    async getAllPlayerProfiles(): Promise<PlayerProfile[]> {
        try {
            const q = query(this.playerProfileCollection);
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as PlayerProfile);
        } catch (error) {
            console.error('Failed to fetch player profiles:', error);
            return [];
        }
    }

}

export class PlayerService {
    private playerProfileService = new PlayerTrackingService();

    async createOrUpdatePlayerProfile(profileData: Partial<PlayerProfile>): Promise<PlayerProfile> {
        return this.playerProfileService.createOrUpdatePlayerProfile(profileData);
    }

    async recordSampleAttempt(attempt: SampleAttempt): Promise<void> {
        await this.playerProfileService.recordSampleAttempt(attempt);
    }

    async getPlayerPerformanceByQuarter(quarterId: string): Promise<PlayerProfile[]> {
        return this.playerProfileService.getPlayerPerformanceByQuarter(quarterId);
    }

    async updateSampleAttempt(attemptId: string, updatedAttemptData: Partial<SampleAttempt>): Promise<void> {
        await updateDoc(doc(this.playerProfileService.sampleAttemptsCollection, attemptId), updatedAttemptData);
    }
    async deleteSampleAttempt(attemptId: string): Promise<void> {
        await deleteDoc(doc(this.playerProfileService.sampleAttemptsCollection, attemptId));
    }
    async getSampleAttemptsByUserId(userId: string): Promise<SampleAttempt[]> {
        const q = query(this.playerProfileService.sampleAttemptsCollection, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as SampleAttempt);
    }
    async getSampleAttemptsByQuarter(quarterId: string): Promise<SampleAttempt[]> {
        const q = query(this.playerProfileService.sampleAttemptsCollection, where('quarterId', '==', quarterId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as SampleAttempt);
    }
    async getSampleAttemptsByEmail(email: string): Promise<SampleAttempt[]> {
        const player = await this.getPlayerByEmail(email);
        if (!player) return [];
        return this.getSampleAttemptsByUserId(player.userId);
    }
    async getSampleAttemptsByDisplayName(displayName: string): Promise<SampleAttempt[]> {
        const player = await this.getPlayerByDisplayName(displayName);
        if (!player) return [];
        return this.getSampleAttemptsByUserId(player.userId);
    }
    async getSampleAttemptById(attemptId: string): Promise<SampleAttempt | undefined> {
        const docRef = doc(this.playerProfileService.sampleAttemptsCollection, attemptId);
        const docSnap = await getDoc(docRef);
        return docSnap.data() as SampleAttempt | undefined;
    }
    async getSampleAttemptBySampleId(sampleId: string): Promise<SampleAttempt | undefined> {
        const q = query(this.playerProfileService.sampleAttemptsCollection, where('sampleId', '==', sampleId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as SampleAttempt).pop();
    }
    async getSampleAttemptByUserIdAndSampleId(userId: string, sampleId: string): Promise<SampleAttempt | undefined> {
        const q = query(
            this.playerProfileService.sampleAttemptsCollection,
            where('userId', '==', userId),
            where('sampleId', '==', sampleId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as SampleAttempt).pop();
    }
    async getSampleAttemptByDisplayNameAndSampleId(displayName: string, sampleId: string): Promise<SampleAttempt | undefined> {
        const player = await this.getPlayerByDisplayName(displayName);
        if (!player) return;
        return this.getSampleAttemptByUserIdAndSampleId(player.userId, sampleId);
    }
    async getSampleAttemptByEmailAndSampleId(email: string, sampleId: string): Promise<SampleAttempt | undefined> {
        const player = await this.getPlayerByEmail(email);
        if (!player) return;
        return this.getSampleAttemptByUserIdAndSampleId(player.userId, sampleId);
    }
    async getSampleAttemptByUserIdAndQuarterId(userId: string, quarterId: string): Promise<SampleAttempt[]> {
        const q = query(
            this.playerProfileService.sampleAttemptsCollection,
            where('userId', '==', userId),
            where('quarterId', '==', quarterId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as SampleAttempt);
    }
    async getSampleAttemptByDisplayNameAndQuarterId(displayName: string, quarterId: string): Promise<SampleAttempt[]> {
        const player = await this.getPlayerByDisplayName(displayName);
        if (!player) return [];
        return this.getSampleAttemptByUserIdAndQuarterId(player.userId, quarterId);
    }

    private async getPlayerByEmail(email: string): Promise<PlayerProfile | undefined> {
        return this.playerProfileService.getPlayerByEmail(email);
    }
    private async getPlayerByDisplayName(displayName: string): Promise<PlayerProfile | undefined> {
        return this.playerProfileService.getPlayerByDisplayName(displayName);
    }
    async getPlayerByUserId(userId: string): Promise<PlayerProfile | undefined> {
        return this.playerProfileService.getPlayerByUserId(userId);
    }
    async getAllPlayerProfiles(): Promise<PlayerProfile[]> {
        return this.playerProfileService.getAllPlayerProfiles();
    }
}