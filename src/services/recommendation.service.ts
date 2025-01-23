import { firestore } from '../config/firebaseConfig';

interface WhiskeySample {
  id: string;
  name: string;
  flavor_profile: string[];
  region: string;
  age: number;
}

export const fetchRecommendations = async (userId: string) => {
  try {
    // Fetch user's tasting history
    const tastingHistoryRef = firestore
      .collection('users')
      .doc(userId)
      .collection('tasting_history');
    const historySnapshot = await tastingHistoryRef.get();

    // Extract flavor preferences and tasted whiskies
    const tastedWhiskies = historySnapshot.docs.map(doc => doc.data());
    const preferredFlavors = extractPreferredFlavors(tastedWhiskies);

    // Fetch potential recommendations
    const whiskiesRef = firestore.collection('whiskies');
    const query = whiskiesRef
      .where('flavor_profile', 'array-contains-any', preferredFlavors)
      .limit(5);

    const recommendationsSnapshot = await query.get();

    return recommendationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
};

const extractPreferredFlavors = (tastedWhiskies: any[]) => {
  const flavorCounts: {[key: string]: number} = {};

  tastedWhiskies.forEach(whisky => {
    whisky.flavor_profile.forEach((flavor: string) => {
      flavorCounts[flavor] = (flavorCounts[flavor] || 0) + 1;
    });
  });

  // Return top 3 preferred flavors
  return Object.entries(flavorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
};