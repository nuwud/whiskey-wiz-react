import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AchievementBadges from '../../components/AchievementBadges';
import { fetchUserAchievements, unlockAchievement } from '../../services/achievementService';
import { authContext } from 'src/contexts/auth.context';

describe('AchievementBadges Component', () => {
  const mockCurrentUser = { uid: 'test-user' };
  const mockAchievements = [
    { id: '1', name: 'Whiskey Novice', description: 'First tasting', isUnlocked: false },
    { id: '2', name: 'Flavor Explorer', description: 'Tasted 10 whiskies', isUnlocked: true }
  ];

  beforeEach(() => {
    (fetchUserAchievements as jest.Mock).mockResolvedValue(mockAchievements);
    (unlockAchievement as jest.Mock).mockResolvedValue(null);

    (AuthContext.Provider as jest.Mock).mockImplementation(({ children, value }) => {
      return children;
    });
  });

  it('renders achievements', async () => {
    render(
      <AuthContext.Provider value={{ currentUser: mockCurrentUser }}>
        <AchievementBadges />
      </AuthContext.Provider>
    );

    await screen.findByText('Whiskey Novice');
    await screen.findByText('Flavor Explorer');
  });

  it('allows unlocking achievements', async () => {
    render(
      <AuthContext.Provider value={{ currentUser: mockCurrentUser }}>
        <AchievementBadges />
      </AuthContext.Provider>
    );

    const unlockButton = await screen.findByText('Unlock');
    fireEvent.click(unlockButton);

    expect(unlockAchievement).toHaveBeenCalledWith('test-user', expect.any(String));
  });
});