import { render, screen } from '@testing-library/react'
import { GameBoard } from '@/components/game/GameBoard'

describe('GameBoard', () => {
  it('renders current quarter', () => {
    render(<GameBoard quarter="Q1-2025" />)
    expect(screen.getByText('Q1 2025')).toBeInTheDocument()
  })

  it('shows initial score of 0', () => {
    render(<GameBoard quarter="Q1-2025" />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})