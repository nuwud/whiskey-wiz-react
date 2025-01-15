import { extractPreferredFlavors } from '../../utils/flavorProfileUtils';

describe('Flavor Profile Utilities', () => {
  const sampleTastingHistory = [
    { flavor_profile: ['Smoky', 'Peaty', 'Iodine'] },
    { flavor_profile: ['Sweet', 'Vanilla', 'Caramel'] },
    { flavor_profile: ['Smoky', 'Woody', 'Leather'] },
    { flavor_profile: ['Fruity', 'Apple', 'Pear'] }
  ];

  it('extracts top flavors from tasting history', () => {
    const topFlavors = extractPreferredFlavors(sampleTastingHistory);

    expect(topFlavors).toContain('Smoky');
    expect(topFlavors).toHaveLength(3);
  });

  it('handles empty tasting history', () => {
    const topFlavors = extractPreferredFlavors([]);

    expect(topFlavors).toHaveLength(0);
  });

  it('handles tasting history with no flavor profiles', () => {
    const incompleteHistory = [{ flavor_profile: [] }, { flavor_profile: [] }];
    const topFlavors = extractPreferredFlavors(incompleteHistory);

    expect(topFlavors).toHaveLength(0);
  });
});