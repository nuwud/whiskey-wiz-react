export const extractPreferredFlavors = (tastedWhiskies: any[]): string[] => {
  const flavorCounts: {[key: string]: number} = {};

  tastedWhiskies.forEach(whisky => {
    whisky.flavor_profile?.forEach((flavor: string) => {
      if (flavor) {
        flavorCounts[flavor] = (flavorCounts[flavor] || 0) + 1;
      }
    });
  });

  return Object.entries(flavorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
};