import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';
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
    register: jest.fn(),
    user: null,
    loading: false,
  };

  AuthContextModule.useAuth.mockReturnValue({ ...defaultAuthValue, ...authValue });

  return render(
    <BrowserRouter>{ui}</BrowserRouter>,
    renderOptions
  );
};

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders register heading', () => {
      renderWithProviders(<RegisterPage />);
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders username input field', () => {
      renderWithProviders(<RegisterPage />);
      const usernameInput = screen.getByPlaceholderText(/choose a username/i);
      expect(usernameInput).toBeInTheDocument();
      expect(usernameInput).toHaveAttribute('type', 'text');
      expect(usernameInput).toBeRequired();
    });

    it('renders email input field', () => {
      renderWithProviders(<RegisterPage />);
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toBeRequired();
    });

    it('renders password input field', () => {
      renderWithProviders(<RegisterPage />);
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
    });

    it('renders register button', () => {
      renderWithProviders(<RegisterPage />);
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('has a form element', () => {
      const { container } = renderWithProviders(<RegisterPage />);
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('allows typing in username field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      const usernameInput = screen.getByPlaceholderText(/choose a username/i);
      await user.type(usernameInput, 'newuser');

      expect(usernameInput).toHaveValue('newuser');
    });

    it('allows typing in email field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, 'newuser@example.com');

      expect(emailInput).toHaveValue('newuser@example.com');
    });

    it('allows typing in password field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      const passwordInput = screen.getByPlaceholderText(/create a strong password/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('updates all fields when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      const usernameInput = screen.getByPlaceholderText(/choose a username/i);
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i);

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');

      expect(usernameInput).toHaveValue('newuser');
      expect(emailInput).toHaveValue('newuser@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('starts with empty input fields', () => {
      renderWithProviders(<RegisterPage />);

      expect(screen.getByPlaceholderText(/choose a username/i)).toHaveValue('');
      expect(screen.getByPlaceholderText(/enter your email/i)).toHaveValue('');
      expect(screen.getByPlaceholderText(/create a strong password/i)).toHaveValue('');
    });
  });

  describe('Form Submission - Success', () => {
    it('calls register function with username, email, and password on form submit', async () => {
      const user = userEvent.setup();
      const mockRegister = jest.fn().mockResolvedValue({ success: true });

      renderWithProviders(<RegisterPage />, {
        authValue: { register: mockRegister },
      });

      const usernameInput = screen.getByPlaceholderText(/choose a username/i);
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i);
      const registerButton = screen.getByRole('button', { name: /create account/i });

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('newuser', 'newuser@example.com', 'password123');
      });
    });

    it('navigates to login page on successful registration', async () => {
      const user = userEvent.setup();
      const mockRegister = jest.fn().mockResolvedValue({ success: true });

      renderWithProviders(<RegisterPage />, {
        authValue: { register: mockRegister },
      });

      const usernameInput = screen.getByPlaceholderText(/choose a username/i);
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i);
      const registerButton = screen.getByRole('button', { name: /create account/i });

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('does not show error message on successful registration', async () => {
      const user = userEvent.setup();
      const mockRegister = jest.fn().mockResolvedValue({ success: true });

      renderWithProviders(<RegisterPage />, {
        authValue: { register: mockRegister },
      });

      const usernameInput = screen.getByPlaceholderText(/choose a username/i);
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i);
      const registerButton = screen.getByRole('button', { name: /create account/i });

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission - Failure', () => {
    it('shows error message on failed registration', async () => {
      const user = userEvent.setup();
      const mockRegister = jest.fn().mockResolvedValue({ success: false });

      renderWithProviders(<RegisterPage />, {
        authValue: { register: mockRegister },
      });

      const usernameInput = screen.getByPlaceholderText(/choose a username/i);
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i);
      const registerButton = screen.getByRole('button', { name: /create account/i });

      await user.type(usernameInput, 'existinguser');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
      });
    });

    it('does not navigate on failed registration', async () => {
      const user = userEvent.setup();
      const mockRegister = jest.fn().mockResolvedValue({ success: false });

      renderWithProviders(<RegisterPage />, {
        authValue: { register: mockRegister },
      });

      const usernameInput = screen.getByPlaceholderText(/choose a username/i);
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i);
      const registerButton = screen.getByRole('button', { name: /create account/i });

      await user.type(usernameInput, 'existinguser');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('calls register function only once per submit', async () => {
      const user = userEvent.setup();
      const mockRegister = jest.fn().mockResolvedValue({ success: false });

      renderWithProviders(<RegisterPage />, {
        authValue: { register: mockRegister },
      });

      const usernameInput = screen.getByPlaceholderText(/choose a username/i);
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/create a strong password/i);
      const registerButton = screen.getByRole('button', { name: /create account/i });

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Form Validation', () => {
    it('has required attribute on username field', () => {
      renderWithProviders(<RegisterPage />);
      expect(screen.getByPlaceholderText(/choose a username/i)).toBeRequired();
    });

    it('has required attribute on email field', () => {
      renderWithProviders(<RegisterPage />);
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeRequired();
    });

    it('has required attribute on password field', () => {
      renderWithProviders(<RegisterPage />);
      expect(screen.getByPlaceholderText(/create a strong password/i)).toBeRequired();
    });

    it('email field has type email', () => {
      renderWithProviders(<RegisterPage />);
      expect(screen.getByPlaceholderText(/enter your email/i)).toHaveAttribute('type', 'email');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderWithProviders(<RegisterPage />);
      const heading = screen.getByRole('heading', { name: /Create Account/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('form has submit button type', () => {
      renderWithProviders(<RegisterPage />);
      const submitButton = screen.getByRole('button', { name: /Create Account/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});
