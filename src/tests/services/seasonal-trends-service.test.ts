import { fetchSeasonalTrends } from '../../services/seasonalTrendsService';
import { firestore } from '../../config/firebaseConfig';

// Mock Firestore
jest.mock('../../config/firebaseConfig', () => ({
  firestore: {
    collection: jest.fn()
  }
}));

describe('Seasonal Trends Service', () => {
  it('fetches seasonal trends from Firestore', async () => {
    const mockSnapshot = {
      docs: [
        { id: 'winter', data: () => ({ topFlavors: ['Caramel'], popularWhiskeyTypes: ['Bourbon'] }) },
        { id: 'summer', data: () => ({ topFlavors: ['Citrus'], popularWhiskeyTypes: ['Rum'] }) }
      ]
    };

    const mockCollection = {
      get: jest.fn().mockResolvedValue(mockSnapshot)
    };

    (firestore.collection as jest.Mock).mockReturnValue(mockCollection);

    const trends = await fetchSeasonalTrends();

    expect(trends).toHaveLength(2);
    expect(trends[0]).toEqual({
      season: 'winter',
      topFlavors: ['Caramel'],
      popularWhiskeyTypes: ['Bourbon']
    });
  });

  it('handles errors when fetching trends', async () => {
    const mockCollection = {
      get: jest.fn().mockRejectedValue(new Error('Firestore error'))
    };

    (firestore.collection as jest.Mock).mockReturnValue(mockCollection);

    await expect(fetchSeasonalTrends()).rejects.toThrow('Firestore error');
  });
});