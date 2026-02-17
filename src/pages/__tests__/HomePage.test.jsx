import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../HomePage';
import * as AuthContextModule from '../../context/AuthContext';

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: jest.fn(),
}));

// Helper function to render with providers
const renderWithProviders = (ui, { authValue, ...renderOptions } = {}) => {
  const defaultAuthValue = {
    user: null,
    logout: jest.fn(),
    loading: false,
  };

  AuthContextModule.useAuth.mockReturnValue({ ...defaultAuthValue, ...authValue });

  return render(
    <BrowserRouter>{ui}</BrowserRouter>,
    renderOptions
  );
};

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not logged in', () => {
    it('renders welcome message', () => {
      renderWithProviders(<HomePage />);
      expect(screen.getByText('Welcome to the Booking System!')).toBeInTheDocument();
    });

    it('shows login prompt message', () => {
      renderWithProviders(<HomePage />);
      expect(screen.getByText('Please log in or register.')).toBeInTheDocument();
    });

    it('displays login link', () => {
      renderWithProviders(<HomePage />);
      const loginLink = screen.getByRole('link', { name: /login/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('displays register link', () => {
      renderWithProviders(<HomePage />);
      const registerLink = screen.getByRole('link', { name: /register/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('does not show logout button when not logged in', () => {
      renderWithProviders(<HomePage />);
      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    });

    it('does not show authenticated navigation links', () => {
      renderWithProviders(<HomePage />);
      expect(screen.queryByRole('link', { name: /my bookings/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /view resources/i })).not.toBeInTheDocument();
    });
  });

  describe('when user is logged in', () => {
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com',
    };

    const mockLogout = jest.fn();

    it('renders welcome message', () => {
      renderWithProviders(<HomePage />, {
        authValue: { user: mockUser, logout: mockLogout },
      });
      expect(screen.getByText('Welcome to the Booking System!')).toBeInTheDocument();
    });

    it('displays personalized greeting with username', () => {
      renderWithProviders(<HomePage />, {
        authValue: { user: mockUser, logout: mockLogout },
      });
      expect(screen.getByText(`Hello, ${mockUser.username}!`)).toBeInTheDocument();
    });

    it('displays logout button', () => {
      renderWithProviders(<HomePage />, {
        authValue: { user: mockUser, logout: mockLogout },
      });
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('calls logout function when logout button is clicked', () => {
      renderWithProviders(<HomePage />, {
        authValue: { user: mockUser, logout: mockLogout },
      });
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      logoutButton.click();
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('displays My Bookings link', () => {
      renderWithProviders(<HomePage />, {
        authValue: { user: mockUser, logout: mockLogout },
      });
      const bookingsLink = screen.getByRole('link', { name: /my bookings/i });
      expect(bookingsLink).toBeInTheDocument();
      expect(bookingsLink).toHaveAttribute('href', '/bookings');
    });

    it('displays View Resources link', () => {
      renderWithProviders(<HomePage />, {
        authValue: { user: mockUser, logout: mockLogout },
      });
      const resourcesLink = screen.getByRole('link', { name: /view resources/i });
      expect(resourcesLink).toBeInTheDocument();
      expect(resourcesLink).toHaveAttribute('href', '/resources');
    });

    it('does not show login/register links when logged in', () => {
      renderWithProviders(<HomePage />, {
        authValue: { user: mockUser, logout: mockLogout },
      });
      expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^register$/i })).not.toBeInTheDocument();
    });

    it('does not show login prompt when logged in', () => {
      renderWithProviders(<HomePage />, {
        authValue: { user: mockUser, logout: mockLogout },
      });
      expect(screen.queryByText('Please log in or register.')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper heading structure', () => {
      renderWithProviders(<HomePage />);
      const heading = screen.getByRole('heading', { name: /welcome to the booking system!/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });
  });
});
