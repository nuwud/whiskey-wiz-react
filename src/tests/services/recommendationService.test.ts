import { fetchRecommendations } from '../../services/recommendationService';
import { firestore } from '../../config/firebaseConfig';

jest.mock('../../config/firebaseConfig');

describe('Recommendation Service', () => {
  const mockUserId = 'test-user-123';
  const mockTastingHistory = [
    { flavor_profile: ['Smoky', 'Peaty'] },
    { flavor_profile: ['Sweet', 'Vanilla'] }
  ];
  const mockRecommendations = [
    { id: '1', name: 'Smoky Delight', flavor_profile: ['Smoky', 'Peaty'] },
    { id: '2', name: 'Vanilla Dream', flavor_profile: ['Sweet', 'Vanilla'] }
  ];

  beforeEach(() => {
    (firestore.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            docs: mockTastingHistory.map(history => ({
              data: () => history
            }))
          })
        })
      })
    });

    (firestore.collection as jest.Mock).mockReturnValueOnce({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            docs: mockRecommendations.map(rec => ({
              id: rec.id,
              data: () => rec
            }))
          })
        })
      })
    });
  });

  it('fetches personalized whiskey recommendations', async () => {
    const recommendations = await fetchRecommendations(mockUserId);

    expect(recommendations).toHaveLength(2);
    expect(recommendations[0].name).toBe('Smoky Delight');
    expect(recommendations[1].name).toBe('Vanilla Dream');
  });

  it('handles errors during recommendation fetching', async () => {
    (firestore.collection as jest.Mock).mockReturnValueOnce({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue(new Error('Firestore error'))
        })
      })
    });

    await expect(fetchRecommendations(mockUserId)).rejects.toThrow('Firestore error');
  });
});