import { getAuth } from 'firebase/auth';

const auth = getAuth();
import { getFirestore } from 'firebase/firestore';

const db = getFirestore();
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { retryOperation } from '../utils/retry.utils';
import { PlayerProfile, GuestProfile, UserRole, UserType } from '../types/auth.types';
import { AnalyticsService } from '../services/analytics.service';

const CURRENT_VERSION = 1;

export interface AuthService {
    register(email: string, password: string, displayName?: string): Promise<PlayerProfile>;
    login(email: string, password: string): Promise<UserCredential>;
    logout(): Promise<void>;
    createOrUpdateProfile(userId: string, data: Partial<PlayerProfile>): Promise<PlayerProfile>;
    getProfile(userId: string): Promise<PlayerProfile>;
    migrateProfile(userId: string, data: Partial<PlayerProfile>): Promise<PlayerProfile>;
}

export const authService = {
    async getUserRole(userId: string): Promise<UserRole> {
        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                return UserRole.PLAYER;
            }

            return userSnap.data()?.role || UserRole.PLAYER;
        } catch (error) {
            console.error("Failed to fetch user role:", error);
            return UserRole.PLAYER;
        }
    },
    async loginAsGuest(): Promise<GuestProfile> {
        const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
        const profile: GuestProfile = {
            userId: guestId,
            email: null,
            displayName: `Guest_${guestId.slice(6, 11)}`,
            role: UserRole.GUEST,
            type: UserType.GUEST,
            registrationType: 'guest',
            isAnonymous: true,
            guest: true,
            emailVerified: false,
            createdAt: new Date(),
            metrics: {
                gamesPlayed: 0,
                totalScore: 0,
                bestScore: 0,
            },
            guestToken: guestId,
            guestSessionToken: guestId,
            guestSessionExpiresAt: new Date(Date.now() + 3600000),
            adminPrivileges: null
        };
        await setDoc(doc(db, 'users', guestId), profile);
        return profile;
    },
    async register(email: string, password: string, displayName?: string): Promise<PlayerProfile> {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const role = await this.getUserRole(user.uid);

            const profile: PlayerProfile = {
                userId: user.uid,
                email: user.email || '',
                displayName: displayName || '',
                emailVerified: user.emailVerified,
                role: UserRole.PLAYER,
                type: UserType.REGISTERED,
                isAnonymous: false,
                registrationType: 'email',
                adminPrivileges: null,
                lastActive: Timestamp.now().toDate(),
                guest: false,
                metrics: {
                    lastVisit: Timestamp.now().toDate(),
                    visitCount: 1,
                    gamesPlayed: 0,
                    totalScore: 0,
                    averageScore: 0,
                    bestScore: 0,
                    badges: [],
                    achievements: []
                },
                geographicData: {},
                createdAt: Timestamp.now().toDate(),
                updatedAt: Timestamp.now().toDate(),
                lastLoginAt: Timestamp.now().toDate(),
                totalGames: 0,
                averageScore: 0,
                lifetimeScore: 0,
                totalQuartersCompleted: 0,
                quarterPerformance: {},
                preferences: {
                    favoriteWhiskeys: [],
                    preferredDifficulty: 'beginner',
                    notifications: true
                },
                statistics: {
                    totalSamplesGuessed: 0,
                    correctGuesses: 0,
                    hintsUsed: 0,
                    averageAccuracy: 0,
                    bestScore: 0,
                    worstScore: 0,
                    lastUpdated: new Date()
                },
                achievements: [],
                version: CURRENT_VERSION
            };

            await setDoc(doc(db, 'users', user.uid), profile);

            // Track registration
            AnalyticsService.trackEvent('user_registered', {
                userId: user.uid,
                role: role
            });

            return profile;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    },

    async login(email: string, password: string): Promise<PlayerProfile> {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const profile = await this.getProfile(userCredential.user.uid);

        if (!profile) {
            throw new Error('Profile not found');
        }

        return profile;
    },

    async logout(): Promise<void> {
        await signOut(auth);
    },

    async createOrUpdateProfile(userId: string, data: Partial<PlayerProfile>): Promise<PlayerProfile> {
        return retryOperation(async () => {
            try {
                const profileRef = doc(db, 'users', userId);
                const existingDoc = await getDoc(profileRef);
                const currentRole = await this.getUserRole(userId);

                let profile: PlayerProfile;
                if (existingDoc.exists()) {
                    profile = await runTransaction(db, async (transaction) => {
                        const profileDoc = await transaction.get(profileRef);
                        let profileData = profileDoc.data() as PlayerProfile;

                        // Ensure role is preserved unless explicitly changed by admin
                        const newRole = data.role && currentRole === UserRole.ADMIN ?
                            data.role : profileData.role || currentRole;

                        if (profileData.version !== CURRENT_VERSION) {
                            profileData = await this.migrateProfile(profileData.userId, profileData);
                        }

                        const updatedData = {
                            ...profileData,
                            ...data,
                            role: newRole,
                            lastActive: Timestamp.now().toDate(),
                            version: CURRENT_VERSION
                        };

                        transaction.set(profileRef, updatedData);
                        return updatedData;
                    });
                } else {
                    profile = {
                        userId,
                        displayName: '',
                        email: '',
                        emailVerified: false,
                        role: UserRole.PLAYER,
                        type: UserType.REGISTERED,
                        guest: false,
                        isAnonymous: false,
                        registrationType: 'email',
                        adminPrivileges: null,
                        geographicData: null,
                        metrics: {
                            lastVisit: new Date(),
                            visitCount: 1,
                            gamesPlayed: 0,
                            totalScore: 0,
                            averageScore: 0,
                            bestScore: 0,
                            badges: [],
                            achievements: []
                        },
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        lastLoginAt: new Date(),
                        lastActive: new Date(),
                        totalGames: 0,
                        averageScore: 0,
                        lifetimeScore: 0,
                        totalQuartersCompleted: 0,
                        quarterPerformance: {},
                        preferences: {
                            favoriteWhiskeys: [],
                            preferredDifficulty: 'beginner',
                            notifications: true
                        },
                        statistics: {
                            totalSamplesGuessed: 0,
                            correctGuesses: 0,
                            hintsUsed: 0,
                            averageAccuracy: 0,
                            bestScore: 0,
                            worstScore: 0,
                            lastUpdated: new Date()
                        },
                        achievements: [],
                        version: CURRENT_VERSION,
                        ...data
                    };
                    await setDoc(profileRef, profile);
                }

                return profile;
            } catch (error) {
                console.error('Failed to create/update profile:', error);
                throw new Error('Failed to update player profile');
            }
        });
    },

    async getProfile(userId: string): Promise<PlayerProfile | null> {
        try {
            const profileRef = doc(db, 'users', userId);
            const profileDoc = await getDoc(profileRef);
            if (!profileDoc.exists()) return null;
            let profile = profileDoc.data() as PlayerProfile;
            if (profile.version !== CURRENT_VERSION) {
                profile = await this.migrateProfile(profile.userId, profile);
            }
            return profile;
        } catch (error) {
            console.error('Failed to get profile:', error);
            throw new Error('Failed to retrieve player profile');
        }
    },

    async migrateProfile(userId: string, data: Partial<PlayerProfile>): Promise<PlayerProfile> {
        return retryOperation(async () => {
            try {
                const existingProfile = await this.getProfile(userId);
                if (!existingProfile) {
                    throw new Error('Profile not found');
                }
                const updatedProfile: PlayerProfile = {
                    ...existingProfile,
                    ...data,
                    updatedAt: new Date()
                };

                await setDoc(doc(db, 'users', userId), updatedProfile, { merge: true });
                return updatedProfile;
            } catch (error) {
                console.error('Profile migration failed:', error);
                throw error;
            }
        }, {
            maxAttempts: 3,
            retryableErrors: ['network-error', 'deadline-exceeded']
        });
    }
};