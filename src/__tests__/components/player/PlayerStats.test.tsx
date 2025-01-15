import { render, screen } from '@testing-library/react'
import { PlayerStats } from '@/components/player/PlayerStats'
import { collection, query, getDocs } from 'firebase/firestore'
import { auth } from '@/lib/firebase'

// Mock game results
const mockResults = [
  {
    id: '1',
    quarter: 'Q1-2025',
    score: 85,
    accuracy: 0.85,
    completedAt: new Date()
  }
]

describe('PlayerStats', () => {
  beforeEach(() => {
    // Mock Firebase Auth
    (auth as any).currentUser = { uid: 'test-user' }

    // Mock Firestore query
    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockResults.map(result => ({
        id: result.id,
        data: () => result
      }))
    })
  })

  it('renders stats cards', async () => {
    render(<PlayerStats />)
    expect(screen.getByText('Total Games')).toBeInTheDocument()
    expect(screen.getByText('Average Score')).toBeInTheDocument()
    expect(screen.getByText('Best Quarter')).toBeInTheDocument()
  })

  it('shows game results', async () => {
    render(<PlayerStats />)
    expect(await screen.findByText('Q1-2025')).toBeInTheDocument()
    expect(await screen.findByText('85')).toBeInTheDocument()
  })
})