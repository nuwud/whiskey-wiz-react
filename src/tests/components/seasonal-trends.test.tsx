import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SeasonalTrends from '../../components/seasonal-trends.component';

// Mock the service
jest.mock('../../services/seasonalTrendsService');

describe('SeasonalTrends Component', () => {
  const mockTrends = [
    {
      season: 'Winter',
      topFlavors: ['Caramel', 'Vanilla'],
      popularWhiskeyTypes: ['Bourbon', 'Scotch']
    }
  ];

  beforeEach(() => {
    (fetchSeasonalTrends as jest.Mock).mockResolvedValue(mockTrends);
  });

  it('renders seasonal trends', async () => {
    render(<SeasonalTrends />);

    await waitFor(() => {
      expect(screen.getByText('Winter')).toBeInTheDocument();
      expect(screen.getByText('Caramel')).toBeInTheDocument();
      expect(screen.getByText('Bourbon')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    render(<SeasonalTrends />);
    expect(screen.getByText('Loading seasonal trends...')).toBeInTheDocument();
  });
});