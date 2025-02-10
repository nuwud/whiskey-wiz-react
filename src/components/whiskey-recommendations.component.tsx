import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card-ui.component';
import { useAuth } from '../contexts/auth.context';
import { recommendationService } from '../services/recommendation.service';
import { AnalyticsService } from '../services/analytics.service';
import { WhiskeySample } from '../types/game.types';
import { Drama } from 'lucide-react';

interface WhiskeyRecommendation extends WhiskeySample {
  matchScore: number;
  similarityReason: string;
  distillery: string;
}

export const WhiskeyRecommendations: React.FC = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<WhiskeyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userRecommendations = await recommendationService.getRecommendations(user.userId);
        setRecommendations(userRecommendations);
        AnalyticsService.trackUserEngagement('recommendations_loaded', {
          userId: user.userId,
          recommendationCount: userRecommendations.length
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recommendations';
        setError(errorMessage);
        AnalyticsService.trackEvent('Failed to load recommendations', {
          component: 'whiskey_recommendations',
          userId: user.userId
        });
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 rounded-full border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50">
        <div className="text-sm text-center text-red-700">{error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Please log in to get personalized whiskey recommendations.</p>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">
            No recommendations available yet. Try completing more tastings to get personalized suggestions!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Drama className="w-5 h-5" />
            Your Whiskey Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((whiskey) => (
              <Card key={whiskey.id} className="transition-shadow hover:shadow-lg">
                <CardContent className="p-4">
                  <h3 className="mb-1 text-lg font-bold">{whiskey.name}</h3>
                  <p className="mb-3 text-sm text-gray-600">{whiskey.distillery}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region:</span>
                      <span className="font-medium">{whiskey.mashbill}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">{whiskey.age} years</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Proof:</span>
                      <span className="font-medium">{whiskey.proof}°</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Mashbill:</span>
                      <span className="font-medium">{whiskey.mashbill}</span>
                    </div>
                  </div>

                  {whiskey.notes && whiskey.notes.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium text-gray-600">Tasting Notes:</h4>
                      <div className="flex flex-wrap gap-1">
                        {whiskey.notes.map((note) => (
                          <span
                            key={note}
                            className="px-2 py-1 text-xs rounded-full bg-amber-50 text-amber-700"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {whiskey.similarityReason && (
                    <div className="p-2 mt-4 rounded-md bg-green-50">
                      <p className="text-sm text-green-700">{whiskey.similarityReason}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-gray-500">
                      Match Score: {Math.round(whiskey.matchScore * 100)}%
                    </div>
                    <button
                      onClick={() => AnalyticsService.trackUserEngagement('recommendation_saved', {
                        userId: user.userId,
                        whiskeyId: whiskey.id
                      })}
                      className="text-xs text-amber-600 hover:text-amber-700"
                    >
                      Save to Profile
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};