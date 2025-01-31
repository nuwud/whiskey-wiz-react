import { useAuthStore } from '../../store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card-ui.component';
import { useFeatures } from '../../contexts/feature.context';
import { PlayerProfile } from '../../types/auth.types';
import { Spinner } from '../ui/spinner-ui.component';

export const PlayerDashboard: React.FC = () => {
  const { profile, isLoading } = useAuthStore();
  const playerProfile = profile as PlayerProfile;
  const { features } = useFeatures();
  const showStats = features?.['advanced-stats'];

  if (isLoading) {
    return <Spinner />;
  }

  if (!playerProfile) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">Unable to load profile</p>
      </div>
    );
  }

  const metrics = playerProfile.metrics || {
    gamesPlayed: 0,
    totalScore: 0,
    averageScore: 0,
    bestScore: 0,
    badges: [],
    achievements: [],
    topThreeScores: [],
    topThreeChallengesCompleted: [],
    topThreeChallengesWon: [],
    topThreeChallengesLost: [],
    topThreeChallengesDrawn: [],
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8">
            {showStats && (
              <section>
                <h3 className="mb-4 text-lg font-medium">Your Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Games Played</p>
                    <p className="text-lg font-medium">{metrics.gamesPlayed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Score</p>
                    <p className="text-lg font-medium">{metrics.totalScore}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average Score</p>
                    <p className="text-lg font-medium">{metrics.averageScore}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Best Score</p>
                    <p className="text-lg font-medium">{metrics.bestScore}</p>
                  </div>
                </div>

                {metrics.badges.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Badges</h4>
                    <div className="flex flex-wrap gap-2">
                      {metrics.badges.map((badge, index) => (
                        <span key={index} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {metrics.achievements.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Achievements</h4>
                    <div className="flex flex-wrap gap-2">
                      {metrics.achievements.map((achievement, index) => (
                        <span key={index} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                          {achievement}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};