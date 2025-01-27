import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card-ui.component';
import { useAuth } from '@/contexts/auth.context';
import { recommendationService } from '@/services/recommendation.service';
import { AnalyticsService } from '@/services/analytics.service';
import { WhiskeySample } from '@/types';
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
        const userRecommendations = await recommendationService.getRecommendations(user.uid);
        setRecommendations(userRecommendations);
        AnalyticsService.trackUserEngagement('recommendations_loaded', {
          userId: user.uid,
          recommendationCount: userRecommendations.length
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recommendations';
        setError(errorMessage);
        AnalyticsService.trackError('Failed to load recommendations', 'whiskey_recommendations', user.uid);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <div className="text-sm text-red-700 text-center">{error}</div>
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
            <Drama className="h-5 w-5" />
            Your Whiskey Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((whiskey) => (
              <Card key={whiskey.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold mb-1">{whiskey.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{whiskey.distillery}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region:</span>
                      <span className="font-medium">{whiskey.mashbillType}</span>
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
                      <span className="font-medium">{whiskey.mashbillType}</span>
                    </div>
                  </div>

                  {whiskey.notes && whiskey.notes.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm text-gray-600 mb-2">Tasting Notes:</h4>
                      <div className="flex flex-wrap gap-1">
                        {whiskey.notes.map((note) => (
                          <span
                            key={note}
                            className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {whiskey.similarityReason && (
                    <div className="mt-4 p-2 bg-green-50 rounded-md">
                      <p className="text-sm text-green-700">{whiskey.similarityReason}</p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Match Score: {Math.round(whiskey.matchScore * 100)}%
                    </div>
                    <button
                      onClick={() => AnalyticsService.trackUserEngagement('recommendation_saved', {
                        userId: user.uid,
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