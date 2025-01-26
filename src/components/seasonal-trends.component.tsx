import React, { useState, useEffect } from 'react';
import { SeasonalTrend, seasonalTrendsService } from 'src/services/seasonal-trends.service';

const SeasonalTrends: React.FC = () => {
  const [trends, setTrends] = useState<SeasonalTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrends = async () => {
      try {
        const seasonalData = await seasonalTrendsService.getCurrentTrends();
        setTrends(seasonalData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load seasonal trends');
        setLoading(false);
      }
    };

    loadTrends();
  }, []);

  if (loading) return <div>Loading seasonal trends...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="seasonal-trends">
      <h2>Whiskey Flavor Trends by Season</h2>
      {trends.map((trend) => (
        <div key={trend.season} className="season-card">
          <h3>{trend.season}</h3>
          <div>
            <strong>Top Flavors:</strong>
            <ul>
              {trend.topFlavors.map((flavor) => (
                <li key={flavor}>{flavor}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Popular Whiskey Types:</strong>
            <ul>
              {trend.popularWhiskeyTypes.map((type) => (
                <li key={type}>{type}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SeasonalTrends;
