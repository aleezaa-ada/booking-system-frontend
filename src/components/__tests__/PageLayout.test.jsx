import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PageLayout from '../PageLayout';
import * as useAuthHook from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Helper function to render with router
const renderWithRouter = (ui, { authValue } = {}) => {
  const defaultAuthValue = {
    user: { id: 1, username: 'testuser', email: 'test@example.com' },
    loading: false,
    logout: jest.fn(),
  };

  useAuthHook.useAuth.mockReturnValue({ ...defaultAuthValue, ...authValue });

  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('PageLayout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the Nav component', () => {
      renderWithRouter(
        <PageLayout>
          <div>Test Content</div>
        </PageLayout>
      );

      // Check that Nav is rendered by looking for its content
      expect(screen.getByText('Booking System')).toBeInTheDocument();
    });

    it('renders children content', () => {
      renderWithRouter(
        <PageLayout>
          <div data-testid="test-content">Test Content</div>
        </PageLayout>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      renderWithRouter(
        <PageLayout>
          <h1>Title</h1>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </PageLayout>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('wraps content in a page-layout div', () => {
      const { container } = renderWithRouter(
        <PageLayout>
          <div>Test</div>
        </PageLayout>
      );

      const pageLayout = container.querySelector('.page-layout');
      expect(pageLayout).toBeInTheDocument();
    });

    it('wraps children in a main element with page-content class', () => {
      const { container } = renderWithRouter(
        <PageLayout>
          <div>Test</div>
        </PageLayout>
      );

      const mainElement = container.querySelector('main.page-content');
      expect(mainElement).toBeInTheDocument();
    });

    it('applies custom className to main element', () => {
      const { container } = renderWithRouter(
        <PageLayout className="custom-class">
          <div>Test</div>
        </PageLayout>
      );

      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('page-content');
      expect(mainElement).toHaveClass('custom-class');
    });

    it('applies default empty className when none provided', () => {
      const { container } = renderWithRouter(
        <PageLayout>
          <div>Test</div>
        </PageLayout>
      );

      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('page-content');
      expect(mainElement.className).toBe('page-content ');
    });
  });

  describe('Layout hierarchy', () => {
    it('renders Nav before children content', () => {
      const { container } = renderWithRouter(
        <PageLayout>
          <div data-testid="child-content">Child</div>
        </PageLayout>
      );

      const pageLayout = container.querySelector('.page-layout');
      const nav = pageLayout.querySelector('nav');
      const main = pageLayout.querySelector('main');

      // Nav should come before main in the DOM
      const navIndex = Array.from(pageLayout.children).indexOf(nav);
      const mainIndex = Array.from(pageLayout.children).indexOf(main);

      expect(navIndex).toBeLessThan(mainIndex);
    });

    it('uses semantic main element for content', () => {
      renderWithRouter(
        <PageLayout>
          <div>Test</div>
        </PageLayout>
      );

      const mainElement = document.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });
  });

  describe('Integration with Nav', () => {
    it('displays nav links when user is authenticated', () => {
      const mockUser = { id: 1, username: 'testuser' };
      renderWithRouter(
        <PageLayout>
          <div>Content</div>
        </PageLayout>,
        { authValue: { user: mockUser } }
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('My Bookings')).toBeInTheDocument();
    });

    it('does not display nav links when user is not authenticated', () => {
      renderWithRouter(
        <PageLayout>
          <div>Content</div>
        </PageLayout>,
        { authValue: { user: null } }
      );

      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      expect(screen.queryByText('Resources')).not.toBeInTheDocument();
      expect(screen.queryByText('My Bookings')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('renders without children', () => {
      const { container } = renderWithRouter(<PageLayout />);

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toBeEmptyDOMElement();
    });

    it('handles null children', () => {
      const { container } = renderWithRouter(<PageLayout>{null}</PageLayout>);

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      const { container } = renderWithRouter(
        <PageLayout>{undefined}</PageLayout>
      );

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('handles complex nested children', () => {
      renderWithRouter(
        <PageLayout>
          <div>
            <section>
              <article>
                <h1>Nested Content</h1>
              </article>
            </section>
          </div>
        </PageLayout>
      );

      expect(screen.getByText('Nested Content')).toBeInTheDocument();
    });

    it('handles className with multiple classes', () => {
      const { container } = renderWithRouter(
        <PageLayout className="class1 class2 class3">
          <div>Test</div>
        </PageLayout>
      );

      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('page-content');
      expect(mainElement).toHaveClass('class1');
      expect(mainElement).toHaveClass('class2');
      expect(mainElement).toHaveClass('class3');
    });
  });
});
