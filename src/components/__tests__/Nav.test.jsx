import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Nav from '../Nav';
import * as useAuthHook from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock ProfilePictureUpload component
jest.mock('../ProfilePictureUpload', () => {
  return function MockProfilePictureUpload({
    onClose,
    onUpdate,
    currentPicture,
  }) {
    return (
      <div data-testid="profile-picture-modal">
        <button onClick={() => onUpdate('https://example.com/new-pic.jpg')}>
          Mock Update
        </button>
        <button onClick={onClose}>Mock Close</button>
        <span>{currentPicture}</span>
      </div>
    );
  };
});

// Helper function to render with router
const renderWithRouter = (ui, { authValue } = {}) => {
  const defaultAuthValue = {
    user: null,
    loading: false,
    logout: jest.fn(),
  };

  useAuthHook.useAuth.mockReturnValue({ ...defaultAuthValue, ...authValue });

  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Nav Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    it('renders the brand/logo link', () => {
      renderWithRouter(<Nav />, { authValue: { user: null } });

      const brandLink = screen.getByText('Booking System');
      expect(brandLink).toBeInTheDocument();
      expect(brandLink).toHaveAttribute('href', '/');
    });

    it('does not render navigation links when user is not logged in', () => {
      renderWithRouter(<Nav />, { authValue: { user: null } });

      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      expect(screen.queryByText('Resources')).not.toBeInTheDocument();
      expect(screen.queryByText('My Bookings')).not.toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });

    it('renders nav element with correct class', () => {
      const { container } = renderWithRouter(<Nav />, {
        authValue: { user: null },
      });

      const navElement = container.querySelector('nav.nav-component');
      expect(navElement).toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com',
      id: 1,
    };

    it('renders all navigation links when user is logged in', () => {
      renderWithRouter(<Nav />, { authValue: { user: mockUser } });

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('My Bookings')).toBeInTheDocument();
    });

    it('renders the logout button when user is logged in', () => {
      renderWithRouter(<Nav />, { authValue: { user: mockUser } });

      // Open dropdown first
      const profileButton = screen.getByLabelText('Profile menu');
      fireEvent.click(profileButton);

      const logoutButton = screen.getByText('Logout');
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton.tagName).toBe('BUTTON');
    });

    it('Home link has correct href', () => {
      renderWithRouter(<Nav />, { authValue: { user: mockUser } });

      const homeLink = screen.getAllByText('Home')[0];
      expect(homeLink).toHaveAttribute('href', '/');
      expect(homeLink).toHaveClass('nav-link');
    });

    it('Resources link has correct href', () => {
      renderWithRouter(<Nav />, { authValue: { user: mockUser } });

      const resourcesLink = screen.getByText('Resources');
      expect(resourcesLink).toHaveAttribute('href', '/resources');
      expect(resourcesLink).toHaveClass('nav-link');
    });

    it('My Bookings link has correct href', () => {
      renderWithRouter(<Nav />, { authValue: { user: mockUser } });

      const bookingsLink = screen.getByText('My Bookings');
      expect(bookingsLink).toHaveAttribute('href', '/bookings');
      expect(bookingsLink).toHaveClass('nav-link');
    });

    it('calls logout function when logout button is clicked', () => {
      const mockLogout = jest.fn();
      renderWithRouter(<Nav />, {
        authValue: {
          user: mockUser,
          logout: mockLogout,
        },
      });

      // Open dropdown first
      const profileButton = screen.getByLabelText('Profile menu');
      fireEvent.click(profileButton);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('logout button has correct CSS class', () => {
      renderWithRouter(<Nav />, { authValue: { user: mockUser } });

      // Open dropdown first
      const profileButton = screen.getByLabelText('Profile menu');
      fireEvent.click(profileButton);

      const logoutButton = screen.getByText('Logout');
      expect(logoutButton).toHaveClass('dropdown-item');
    });
  });

  describe('Component structure and styling', () => {
    it('renders nav container with correct class', () => {
      const { container } = renderWithRouter(<Nav />, {
        authValue: { user: { username: 'testuser' } },
      });

      const navContainer = container.querySelector('.nav-container');
      expect(navContainer).toBeInTheDocument();
    });

    it('renders brand section with correct class', () => {
      const { container } = renderWithRouter(<Nav />, {
        authValue: { user: { username: 'testuser' } },
      });

      const brandSection = container.querySelector('.nav-brand');
      expect(brandSection).toBeInTheDocument();
    });

    it('renders nav-links section when authenticated', () => {
      const { container } = renderWithRouter(<Nav />, {
        authValue: { user: { username: 'testuser' } },
      });

      const navLinks = container.querySelector('.nav-links');
      expect(navLinks).toBeInTheDocument();
    });

    it('does not render nav-links section when not authenticated', () => {
      const { container } = renderWithRouter(<Nav />, {
        authValue: { user: null },
      });

      const navLinks = container.querySelector('.nav-links');
      expect(navLinks).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    const mockUser = { username: 'testuser' };

    it('uses semantic nav element', () => {
      const { container } = renderWithRouter(<Nav />, {
        authValue: { user: mockUser },
      });

      const navElement = container.querySelector('nav');
      expect(navElement).toBeInTheDocument();
    });

    it('all links are accessible and clickable', () => {
      renderWithRouter(<Nav />, { authValue: { user: mockUser } });

      const brandLink = screen.getByText('Booking System');
      const homeLink = screen.getAllByText('Home')[0];
      const resourcesLink = screen.getByText('Resources');
      const bookingsLink = screen.getByText('My Bookings');

      expect(brandLink.closest('a')).toBeInTheDocument();
      expect(homeLink.closest('a')).toBeInTheDocument();
      expect(resourcesLink.closest('a')).toBeInTheDocument();
      expect(bookingsLink.closest('a')).toBeInTheDocument();
    });

    it('logout button is keyboard accessible', () => {
      renderWithRouter(<Nav />, { authValue: { user: mockUser } });

      // Open dropdown first
      const profileButton = screen.getByLabelText('Profile menu');
      fireEvent.click(profileButton);

      const logoutButton = screen.getByText('Logout');
      expect(logoutButton).toBeEnabled();
      expect(logoutButton.tagName).toBe('BUTTON');
    });
  });

  describe('Edge cases', () => {
    it('handles missing logout function gracefully', () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      renderWithRouter(<Nav />, {
        authValue: {
          user: { username: 'testuser', email: 'test@example.com' },
          logout: undefined,
        },
      });

      // Open dropdown first
      const profileButton = screen.getByLabelText('Profile menu');
      fireEvent.click(profileButton);

      const logoutButton = screen.getByText('Logout');
      expect(logoutButton).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('renders correctly when user object has minimal properties', () => {
      renderWithRouter(<Nav />, {
        authValue: { user: {} },
      });

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('My Bookings')).toBeInTheDocument();
    });

    it('renders correctly when user is null', () => {
      renderWithRouter(<Nav />, {
        authValue: { user: null },
      });

      expect(screen.getByText('Booking System')).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('renders correctly when user is undefined', () => {
      renderWithRouter(<Nav />, {
        authValue: { user: undefined },
      });

      expect(screen.getByText('Booking System')).toBeInTheDocument();
      expect(screen.queryByText('Resources')).not.toBeInTheDocument();
    });
  });

  describe('User interaction', () => {
    it('clicking logout button does not navigate', () => {
      const mockLogout = jest.fn();
      renderWithRouter(<Nav />, {
        authValue: {
          user: { username: 'testuser', email: 'test@example.com' },
          logout: mockLogout,
        },
      });

      // Open dropdown
      const profileButton = screen.getByLabelText('Profile menu');
      fireEvent.click(profileButton);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      // Should call logout but not navigate (handled by logout function)
      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.pathname).toBe('/');
    });

    it('brand link is always clickable', () => {
      renderWithRouter(<Nav />, { authValue: { user: null } });

      const brandLink = screen.getByText('Booking System');
      expect(brandLink.closest('a')).not.toHaveAttribute('disabled');
    });
  });
});
