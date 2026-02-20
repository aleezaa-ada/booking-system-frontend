import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ForgotPasswordPage from '../ForgotPasswordPage';
import api from '../../services/api';

// Mock the API
jest.mock('../../services/api');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Helper function to render with router
const renderWithRouter = ui => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the page heading', () => {
      renderWithRouter(<ForgotPasswordPage />);
      expect(
        screen.getByRole('heading', { name: /reset password/i })
      ).toBeInTheDocument();
    });

    it('renders descriptive text', () => {
      renderWithRouter(<ForgotPasswordPage />);
      expect(
        screen.getByText(/enter your email address and we'll send you a link/i)
      ).toBeInTheDocument();
    });

    it('renders email input field', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toBeRequired();
    });

    it('renders submit button', () => {
      renderWithRouter(<ForgotPasswordPage />);
      expect(
        screen.getByRole('button', { name: /send reset link/i })
      ).toBeInTheDocument();
    });

    it('renders link back to login', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const loginLink = screen.getByText(/back to login/i);
      expect(loginLink).toBeInTheDocument();
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });

    it('has a form element', () => {
      const { container } = renderWithRouter(<ForgotPasswordPage />);
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('allows typing in email field', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('form is hidden after successful submission', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValueOnce({ status: 204 });

      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText(/enter your email/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid email', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValueOnce({ status: 204 });

      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('auth/users/reset_password/', {
          email: 'test@example.com',
        });
      });
    });

    it('shows success message after successful submission', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValueOnce({ status: 204 });

      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/if an account exists with that email address/i)
      ).toBeInTheDocument();
    });

    it('hides form after successful submission', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValueOnce({ status: 204 });

      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText(/enter your email/i)
        ).not.toBeInTheDocument();
      });
    });

    it('disables button and shows loading state during submission', async () => {
      const user = userEvent.setup();
      api.post.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ status: 204 }), 100)
          )
      );

      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      await user.click(submitButton);

      expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValueOnce({
        response: {
          data: { email: ['This email does not exist in our system'] },
        },
      });

      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      // Use valid email format so HTML5 validation doesn't block submission
      await user.type(emailInput, 'nonexistent@example.com');

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/this email does not exist/i)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('displays generic error message when API error has no specific message', async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValueOnce({ response: { data: {} } });

      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('clears previous error when form is resubmitted', async () => {
      const user = userEvent.setup();
      api.post
        .mockRejectedValueOnce({
          response: { data: { email: ['First error'] } },
        })
        .mockResolvedValueOnce({ status: 204 });

      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText(/first error/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Submit again with different email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(screen.queryByText(/first error/i)).not.toBeInTheDocument();
          expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper label for email input', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const label = screen.getByLabelText(/email address/i);
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('type', 'email');
    });

    it('associates label with email input', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      expect(emailInput).toHaveAttribute('id', 'email');
    });
  });
});
