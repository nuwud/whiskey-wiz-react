import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FlavorWheel from '../../components/FlavorWheel';

describe('FlavorWheel Component', () => {
  it('renders flavor categories', () => {
    render(<FlavorWheel />);

    expect(screen.getByText('Fruity')).toBeInTheDocument();
    expect(screen.getByText('Woody')).toBeInTheDocument();
    expect(screen.getByText('Spicy')).toBeInTheDocument();
    expect(screen.getByText('Sweet')).toBeInTheDocument();
  });

  it('toggles flavor category selection', () => {
    render(<FlavorWheel />);

    const fruityCategory = screen.getByText('Fruity');
    fireEvent.click(fruityCategory);

    expect(fruityCategory.closest('.category')).toHaveClass('active');

    // Click again to deselect
    fireEvent.click(fruityCategory);
    expect(fruityCategory.closest('.category')).not.toHaveClass('active');
  });

  it('displays flavor details when category is selected', () => {
    render(<FlavorWheel />);

    const woodyCategory = screen.getByText('Woody');
    fireEvent.click(woodyCategory);

    expect(screen.getByText('Oak')).toBeInTheDocument();
    expect(screen.getByText('Cedar')).toBeInTheDocument();
    expect(screen.getByText('Pine')).toBeInTheDocument();
  });
});