import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Card Components', () => {
  describe('Card', () => {
    it('renders card with children', () => {
      render(<Card>Card content</Card>);
      
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('has default card styles', () => {
      const { container } = render(<Card>Content</Card>);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card');
    });

    it('forwards ref to div element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      const results = await axe(container);
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('CardHeader', () => {
    it('renders header with children', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      );
      
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('applies default header styles', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('flex', 'flex-col', 'p-6');
    });

    it('forwards ref to div element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref}>Header</CardHeader>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('renders title with children', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
        </Card>
      );
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('applies title styles', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      
      const title = container.firstChild as HTMLElement;
      expect(title).toHaveClass('text-2xl', 'font-semibold');
    });

    it('forwards ref to div element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardDescription', () => {
    it('renders description with children', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Test description</CardDescription>
          </CardHeader>
        </Card>
      );
      
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('applies description styles', () => {
      const { container } = render(
        <CardDescription>Description</CardDescription>
      );
      
      const description = container.firstChild as HTMLElement;
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('forwards ref to div element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardDescription ref={ref}>Description</CardDescription>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardContent', () => {
    it('renders content with children', () => {
      render(
        <Card>
          <CardContent>Card body content</CardContent>
        </Card>
      );
      
      expect(screen.getByText('Card body content')).toBeInTheDocument();
    });

    it('applies content styles', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('forwards ref to div element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref}>Content</CardContent>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('renders footer with children', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );
      
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('applies footer styles', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('forwards ref to div element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Card Integration', () => {
    it('renders complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Movie Title</CardTitle>
            <CardDescription>A great movie description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Movie details go here</p>
          </CardContent>
          <CardFooter>
            <button>Watch Now</button>
          </CardFooter>
        </Card>
      );
      
      expect(screen.getByText('Movie Title')).toBeInTheDocument();
      expect(screen.getByText('A great movie description')).toBeInTheDocument();
      expect(screen.getByText('Movie details go here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /watch now/i })).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    it('supports responsive classes', () => {
      const { container } = render(
        <Card className="w-full md:w-1/2 lg:w-1/3">
          Responsive card
        </Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('w-full', 'md:w-1/2', 'lg:w-1/3');
    });
  });
});
