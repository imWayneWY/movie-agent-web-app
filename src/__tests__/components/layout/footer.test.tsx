import React from 'react';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/footer';

describe('Footer', () => {
  it('renders the footer element', () => {
    render(<Footer />);
    
    const footer = screen.getByTestId('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveAttribute('role', 'contentinfo');
  });

  it('renders the brand name', () => {
    render(<Footer />);
    
    expect(screen.getByText('Movie Agent')).toBeInTheDocument();
  });

  it('renders copyright with current year', () => {
    render(<Footer />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
  });

  it('renders copyright text', () => {
    render(<Footer />);
    
    expect(screen.getByText(/AI-Powered Movie Recommendations/i)).toBeInTheDocument();
  });

  it('renders GitHub link with correct attributes', () => {
    render(<Footer />);
    
    const githubLink = screen.getByRole('link', { name: /github repository/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('applies custom className', () => {
    render(<Footer className="custom-class" />);
    
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('custom-class');
  });

  it('has border-top styling', () => {
    render(<Footer />);
    
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('border-t');
  });
});
