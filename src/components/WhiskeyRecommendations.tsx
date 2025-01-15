import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecommendations } from '../services/recommendationService';

interface Whiskey {
  id: string;
  name: string;
  flavor_profile: string[];
  region: string;
  age: number;
}

const WhiskeyRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Whiskey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentUser } = useAuth();

  useEffect(() => {
    const loadRecommendations = async () => {
      if (currentUser) {
        try {
          const userRecommendations = await fetchRecommendations(currentUser.uid);
          setRecommendations(userRecommendations);
          setLoading(false);
        } catch (err) {
          setError('Failed to load whiskey recommendations');
          setLoading(false);
        }
      }
    };

    loadRecommendations();
  }, [currentUser]);

  if (loading) return <div>Loading recommendations...</div>;
  if (error) return <div>{error}</div>;
  if (!currentUser) return <div>Please log in to get recommendations</div>;

  return (
    <div className="whiskey-recommendations">
      <h2>Recommended Whiskies</h2>
      <div className="recommendations-grid">
        {recommendations.map((whiskey) => (
          <div key={whiskey.id} className="recommendation-card">
            <h3>{whiskey.name}</h3>
            <p>Region: {whiskey.region}</p>
            <p>Age: {whiskey.age} years</p>
            <div className="flavor-profile">
              <strong>Flavor Profile:</strong>
              <ul>
                {whiskey.flavor_profile.map((flavor) => (
                  <li key={flavor}>{flavor}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhiskeyRecommendations;