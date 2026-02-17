import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import * as AuthContextModule from '../../context/AuthContext';

// Mock useAuth hook
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock window.alert
global.alert = jest.fn();

// Helper function to render with providers
const renderWithProviders = (ui, { authValue, ...renderOptions } = {}) => {
  const defaultAuthValue = {
    login: jest.fn(),
    user: null,
    loading: false,
  };

  AuthContextModule.useAuth.mockReturnValue({ ...defaultAuthValue, ...authValue });

  return render(
    <BrowserRouter>{ui}</BrowserRouter>,
    renderOptions
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders login heading', () => {
      renderWithProviders(<LoginPage />);
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    });

    it('renders username input field', () => {
      renderWithProviders(<LoginPage />);
      const usernameInput = screen.getByPlaceholderText(/username/i);
      expect(usernameInput).toBeInTheDocument();
      expect(usernameInput).toHaveAttribute('type', 'text');
      expect(usernameInput).toBeRequired();
    });

    it('renders password input field', () => {
      renderWithProviders(<LoginPage />);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
    });

    it('renders login button', () => {
      renderWithProviders(<LoginPage />);
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('has a form element', () => {
      const { container } = renderWithProviders(<LoginPage />);
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('allows typing in username field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      await user.type(usernameInput, 'testuser');

      expect(usernameInput).toHaveValue('testuser');
    });

    it('allows typing in password field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText(/password/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('updates both fields when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');

      expect(usernameInput).toHaveValue('testuser');
      expect(passwordInput).toHaveValue('password123');
    });

    it('starts with empty input fields', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByPlaceholderText(/username/i)).toHaveValue('');
      expect(screen.getByPlaceholderText(/password/i)).toHaveValue('');
    });
  });

  describe('Form Submission - Success', () => {
    it('calls login function with username and password on form submit', async () => {
      const user = userEvent.setup();
      const mockLogin = jest.fn().mockResolvedValue(true);

      renderWithProviders(<LoginPage />, {
        authValue: { login: mockLogin },
      });

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
      });
    });

    it('navigates to home page on successful login', async () => {
      const user = userEvent.setup();
      const mockLogin = jest.fn().mockResolvedValue(true);

      renderWithProviders(<LoginPage />, {
        authValue: { login: mockLogin },
      });

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('does not show alert on successful login', async () => {
      const user = userEvent.setup();
      const mockLogin = jest.fn().mockResolvedValue(true);

      renderWithProviders(<LoginPage />, {
        authValue: { login: mockLogin },
      });

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      expect(global.alert).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission - Failure', () => {
    it('shows alert on failed login', async () => {
      const user = userEvent.setup();
      const mockLogin = jest.fn().mockResolvedValue(false);

      renderWithProviders(<LoginPage />, {
        authValue: { login: mockLogin },
      });

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, 'wronguser');
      await user.type(passwordInput, 'wrongpass');
      await user.click(loginButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Login failed!');
      });
    });

    it('does not navigate on failed login', async () => {
      const user = userEvent.setup();
      const mockLogin = jest.fn().mockResolvedValue(false);

      renderWithProviders(<LoginPage />, {
        authValue: { login: mockLogin },
      });

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, 'wronguser');
      await user.type(passwordInput, 'wrongpass');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('calls login function only once per submit', async () => {
      const user = userEvent.setup();
      const mockLogin = jest.fn().mockResolvedValue(false);

      renderWithProviders(<LoginPage />, {
        authValue: { login: mockLogin },
      });

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Form Validation', () => {
    it('has required attribute on username field', () => {
      renderWithProviders(<LoginPage />);
      expect(screen.getByPlaceholderText(/username/i)).toBeRequired();
    });

    it('has required attribute on password field', () => {
      renderWithProviders(<LoginPage />);
      expect(screen.getByPlaceholderText(/password/i)).toBeRequired();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderWithProviders(<LoginPage />);
      const heading = screen.getByRole('heading', { name: /login/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('form has submit button type', () => {
      renderWithProviders(<LoginPage />);
      const submitButton = screen.getByRole('button', { name: /login/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Navigation', () => {
    it('displays link to registration page', () => {
      renderWithProviders(<LoginPage />);
      const registerLink = screen.getByRole('link', { name: /register here/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('shows message prompting users to register', () => {
      renderWithProviders(<LoginPage />);
      expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
    });
  });
});
