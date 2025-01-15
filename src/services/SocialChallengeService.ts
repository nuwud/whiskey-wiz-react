// Continuing from previous implementation

  // Advanced matching and recommendation system
  async recommendSocialChallenges(): Promise<SocialChallenge[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      // Complex recommendation logic
      const q = query(
        this.challengeCollection,
        where('status', 'in', ['pending', 'active']),
        where('maxParticipants', '>', 0),
        limit(10) // Limit to 10 recommendations
      );

      const snapshot = await getDocs(q);
      const potentialChallenges = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SocialChallenge));

      // Advanced filtering based on user's learning profile
      return potentialChallenges.filter(challenge => 
        !challenge.participants.includes(currentUser.uid)
      );
    } catch (error) {
      console.error('Failed to recommend social challenges', error);
      return [];
    }
  }

  // Global leaderboard for social challenges
  async getGlobalChallengeLeaderboard(): Promise<Array<{
    userId: string;
    username: string;
    totalChallengesCompleted: number;
    totalScore: number;
  }>> {
    try {
      // This would typically involve an aggregation service or cloud function
      const leaderboardRef = collection(db, 'global_challenge_leaderboard');
      const q = query(leaderboardRef, orderBy('totalScore', 'desc'), limit(100));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as {
        userId: string;
        username: string;
        totalChallengesCompleted: number;
        totalScore: number;
      });
    } catch (error) {
      console.error('Failed to fetch global leaderboard', error);
      return [];
    }
  }

  // Collaborative challenge completion tracking
  async trackChallengeCompletion(challengeId: string, userResults: {
    userId: string;
    score: number;
    completedAt: Date;
  }[]): Promise<void> {
    try {
      const challengeRef = doc(this.challengeCollection, challengeId);
      
      // Update challenge status and results
      await updateDoc(challengeRef, {
        status: 'completed',
        results: userResults,
        completedAt: new Date()
      });

      // Batch update individual user performance
      const batch = userResults.map(result => {
        const userPerformanceRef = doc(db, 'user_challenge_performance', result.userId);
        return updateDoc(userPerformanceRef, {
          [`challenges.${challengeId}`]: result
        });
      });

      await Promise.all(batch);

      AnalyticsService.trackUserEngagement('challenge_group_completed', {
        challengeId,
        participantCount: userResults.length
      });
    } catch (error) {
      console.error('Failed to track challenge completion', error);
      throw error;
    }
  }

  // Social sharing and achievement system
  async generateSocialAchievement(challengeId: string): Promise<{
    title: string;
    description: string;
    iconUrl: string;
  }> {
    try {
      const challengeRef = doc(this.challengeCollection, challengeId);
      const challengeDoc = await getDoc(challengeRef);
      const challengeData = challengeDoc.data() as SocialChallenge;

      // Generate a unique achievement based on challenge characteristics
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
    // In a real-world scenario, this would generate or fetch a unique icon
    // Based on challenge characteristics
    const iconBase = '/achievements/';
    const iconTypes = {
      'friendly_competition': 'friendly_icon.svg',
      'collaborative': 'team_icon.svg',
      'global_event': 'global_icon.svg'
    };

    return `${iconBase}${iconTypes[challenge.challengeType] || 'default_icon.svg'}`;
  }
}