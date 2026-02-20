import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../PrivateRoute';
import * as AuthContextModule from '../../context/AuthContext';

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: jest.fn(),
}));

// Test components
const ProtectedContent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

// Helper function to render with router
const renderWithRouter = (ui, { route = '/', authValue } = {}) => {
  const defaultAuthValue = {
    user: null,
    loading: false,
  };

  AuthContextModule.useAuth.mockReturnValue({
    ...defaultAuthValue,
    ...authValue,
  });

  window.history.pushState({}, 'Test page', route);

  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={ui} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
};

describe('PrivateRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is authenticated', () => {
    it('renders children when user is logged in', () => {
      const mockUser = { username: 'testuser', email: 'test@example.com' };

      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: mockUser, loading: false } }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('does not show loading message when user is authenticated', () => {
      const mockUser = { username: 'testuser', email: 'test@example.com' };

      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: mockUser, loading: false } }
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('does not redirect to login when user is authenticated', () => {
      const mockUser = { username: 'testuser', email: 'test@example.com' };

      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: mockUser, loading: false } }
      );

      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('when user is not authenticated', () => {
    it('redirects to login page when user is not logged in', () => {
      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: null, loading: false } }
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('does not render children when user is not logged in', () => {
      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: null, loading: false } }
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('does not show loading message when user is null and not loading', () => {
      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: null, loading: false } }
      );

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('when authentication is loading', () => {
    it('shows loading message when loading is true', () => {
      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: null, loading: true } }
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not render children while loading', () => {
      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: null, loading: true } }
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('does not redirect to login while loading', () => {
      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: null, loading: true } }
      );

      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('shows loading even when user exists but loading is true', () => {
      const mockUser = { username: 'testuser', email: 'test@example.com' };

      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: mockUser, loading: true } }
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('children rendering', () => {
    it('renders multiple children when authenticated', () => {
      const mockUser = { username: 'testuser', email: 'test@example.com' };

      renderWithRouter(
        <PrivateRoute>
          <div>
            <h1>Protected Page</h1>
            <p>Welcome, user!</p>
          </div>
        </PrivateRoute>,
        { authValue: { user: mockUser, loading: false } }
      );

      expect(screen.getByText('Protected Page')).toBeInTheDocument();
      expect(screen.getByText('Welcome, user!')).toBeInTheDocument();
    });

    it('renders complex JSX structure when authenticated', () => {
      const mockUser = { username: 'testuser', email: 'test@example.com' };

      const ComplexComponent = () => (
        <div>
          <header>Header</header>
          <main>Main Content</main>
          <footer>Footer</footer>
        </div>
      );

      renderWithRouter(
        <PrivateRoute>
          <ComplexComponent />
        </PrivateRoute>,
        { authValue: { user: mockUser, loading: false } }
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles undefined user correctly', () => {
      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: undefined, loading: false } }
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('handles empty user object as authenticated', () => {
      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: {}, loading: false } }
      );

      // Empty object is truthy, so should render protected content
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('prioritizes loading state over user state', () => {
      const mockUser = { username: 'testuser', email: 'test@example.com' };

      renderWithRouter(
        <PrivateRoute>
          <ProtectedContent />
        </PrivateRoute>,
        { authValue: { user: mockUser, loading: true } }
      );

      // Should show loading even though user exists
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });
});
