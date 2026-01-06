import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Movie Agent');
  });

  it('renders the subtitle', () => {
    render(<Home />);
    
    const subtitle = screen.getByText(/AI-Powered Movie Recommendations/i);
    expect(subtitle).toBeInTheDocument();
  });

  it('shows step 1 completion status', () => {
    render(<Home />);
    
    const stepComplete = screen.getByText(/Step 1 Complete/i);
    expect(stepComplete).toBeInTheDocument();
  });
});
