import { useAuthStore } from '../../store/auth.store';
import { PlayerProfile as PlayerProfileType } from '../../types/auth.types';
import { Spinner } from '../ui/spinner-ui.component';

export const PlayerProfile = () => {
  const { profile, isLoading } = useAuthStore();
  const playerProfile = profile as PlayerProfileType;

  if (isLoading) {
    return <Spinner />;
  }

  if (!playerProfile) {
    return <div>Error loading profile</div>;
  }

  const metrics = playerProfile?.metrics || {
    gamesPlayed: 0,
    bestScore: 0,
    averageScore: 0,
    badges: [],
  };

  const { favoriteWhiskeys = [], preferredDifficulty = 'beginner' } = playerProfile?.preferences || {};

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-600">
          <h1 className="text-2xl font-bold text-white">
            {playerProfile.displayName || 'Whiskey Enthusiast'}
          </h1>
          <p className="text-amber-100">{playerProfile.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-amber-800">Games</h3>
            <p className="text-2xl font-bold text-amber-600">
              {metrics.gamesPlayed}
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-amber-800">Best Score</h3>
            <p className="text-2xl font-bold text-amber-600">
              {metrics.bestScore}
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-amber-800">Average Score</h3>
            <p className="text-2xl font-bold text-amber-600">
              {metrics.averageScore}
            </p>
          </div>
        </div>

        {/* Badges & Achievements */}
        <div className="p-6 border-t">
          <h2 className="text-xl font-bold mb-4">Badges & Achievements</h2>
          {(metrics.badges?.length ?? 0) === 0 ? (  // Using the metrics object we defined earlier
            <p className="text-gray-500">Play more games to earn badges!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.badges?.map((badge, index) => (
                <div key={index} className="bg-gray-100 p-4 rounded-lg text-center">
                  <span className="text-lg">🏆</span>
                  <p className="mt-2 font-medium">{badge}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="p-6 border-t">
          <h2 className="text-xl font-bold mb-4">Preferences</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Favorite Whiskeys</h3>
              {favoriteWhiskeys.length === 0 ? (
                <p className="text-gray-500">No favorites yet</p>
              ) : (
                <ul className="list-disc list-inside">
                  {favoriteWhiskeys.map((whiskey, index) => (
                    <li key={index}>{whiskey}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="font-medium text-gray-700">Preferred Difficulty</h3>
              <p className="capitalize">{preferredDifficulty}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};