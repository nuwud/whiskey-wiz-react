import { render, screen, fireEvent } from '@testing-library/react'
import { FeatureToggleAdmin } from '@/components/admin/FeatureToggleAdmin'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'

// Mock feature data
const mockFeatures = [
  {
    id: 'stats',
    name: 'Advanced Statistics',
    description: 'Show detailed game statistics',
    enabled: true,
    requiresRefresh: true,
    category: 'analytics'
  }
]

describe('FeatureToggleAdmin', () => {
  beforeEach(() => {
    // Mock the Firebase snapshot
    (onSnapshot as jest.Mock).mockImplementation((_, callback) => {
      callback({
        docs: mockFeatures.map(feature => ({
          id: feature.id,
          data: () => feature
        }))
      })
      return jest.fn() // Unsubscribe function
    })
  })

  it('renders features', async () => {
    render(<FeatureToggleAdmin />)
    expect(screen.getByText('Advanced Statistics')).toBeInTheDocument()
  })

  it('toggles feature when switch is clicked', async () => {
    render(<FeatureToggleAdmin />)
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(updateDoc).toHaveBeenCalled()
  })
})