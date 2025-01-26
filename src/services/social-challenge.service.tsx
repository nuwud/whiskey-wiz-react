import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  limit,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  orderBy,
  Firestore
} from 'firebase/firestore';
import { AnalyticsService } from './analytics.service';
import { Firebase } from 'src/config/firebase';
import { LeaderboardEntry } from './leaderboard.service';

interface SocialChallenge {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed';
  maxParticipants: number;
  participants: string[];
  challengeType: 'friendly_competition' | 'collaborative' | 'global_event';
  results?: Array<{
    userId: string;
    score: number;
    completedAt: Date;
  }>;
}

export class SocialChallengeService {
  private static instance: SocialChallengeService;
  private auth: Auth;
  private db: Firestore;
  private challengeCollection;

  private constructor() {
    const app = initializeApp(Firebase);
    this.auth = getAuth(app);
    this.db = getFirestore(app);
    this.challengeCollection = collection(this.db, 'social_challenges');
  }

  public static getInstance(): SocialChallengeService {
    if (!SocialChallengeService.instance) {
      SocialChallengeService.instance = new SocialChallengeService();
    }
    return SocialChallengeService.instance;
  }

  async recommendSocialChallenges(): Promise<SocialChallenge[]> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) return [];

      const q = query(
        this.challengeCollection,
        where('status', 'in', ['pending', 'active']),
        where('maxParticipants', '>', 0),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const potentialChallenges = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SocialChallenge));

      return potentialChallenges.filter(challenge =>
        !challenge.participants.includes(currentUser.uid)
      );
    } catch (error) {
      console.error('Failed to recommend social challenges', error);
      return [];
    }
  }

  async getGlobalChallengeLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const leaderboardRef = collection(this.db, 'global_challenge_leaderboard');
      const q = query(leaderboardRef, orderBy('totalScore', 'desc'), limit(100));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
    } catch (error) {
      console.error('Failed to fetch global leaderboard', error);
      return [];
    }
  }

  async trackChallengeCompletion(
    challengeId: string,
    userResults: Array<{
      userId: string;
      score: number;
      completedAt: Date;
    }>
  ): Promise<void> {
    try {
      const challengeRef = doc(this.challengeCollection, challengeId);

      await updateDoc(challengeRef, {
        status: 'completed',
        results: userResults,
        completedAt: new Date()
      });

      const batch = userResults.map(result => {
        const userPerformanceRef = doc(this.db, 'user_challenge_performance', result.userId);
        return updateDoc(userPerformanceRef, {
          [`challenges.${challengeId}`]: result
        });
      });

      await Promise.all(batch);

      AnalyticsService.trackEvent('challenge_group_completed', {
        challengeId,
        participantCount: userResults.length
      });
    } catch (error) {
      console.error('Failed to track challenge completion', error);
      throw error;
    }
  }

  async generateSocialAchievement(challengeId: string): Promise<{
    title: string;
    description: string;
    iconUrl: string;
  }> {
    try {
      const challengeRef = doc(this.challengeCollection, challengeId);
      const challengeDoc = await getDoc(challengeRef);
      const challengeData = challengeDoc.data() as SocialChallenge;

      return {
        title: `${challengeData.title} Champion`,
        description: `Completed the ${challengeData.title} social challenge`,
        iconUrl: this.generateAchievementIcon(challengeData)
      };
    } catch (error) {
      console.error('Failed to generate social achievement', error);
      throw error;
    }
  }

  private generateAchievementIcon(challenge: SocialChallenge): string {
    const iconBase = '/achievements/';
    const iconTypes = {
      'friendly_competition': 'friendly_icon.svg',
      'collaborative': 'team_icon.svg',
      'global_event': 'global_icon.svg'
    };

    return `${iconBase}${iconTypes[challenge.challengeType] || 'default_icon.svg'}`;
  }
}

export const socialChallengeService = SocialChallengeService.getInstance();