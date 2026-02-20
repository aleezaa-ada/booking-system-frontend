import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PasswordResetConfirmPage from '../PasswordResetConfirmPage';
import api from '../../services/api';

// Mock the API
jest.mock('../../services/api');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper function to render with router and params
const renderWithRouter = (uid = 'test-uid', token = 'test-token') => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route
          path="/password-reset/:uid/:token"
          element={<PasswordResetConfirmPage />}
        />
      </Routes>
    </BrowserRouter>,
    {
      initialEntries: [`/password-reset/${uid}/${token}`],
    }
  );
};

// Custom render that uses MemoryRouter for better control
const renderWithMemoryRouter = (uid = 'test-uid', token = 'test-token') => {
  const { MemoryRouter } = require('react-router-dom');
  return render(
    <MemoryRouter initialEntries={[`/password-reset/${uid}/${token}`]}>
      <Routes>
        <Route
          path="/password-reset/:uid/:token"
          element={<PasswordResetConfirmPage />}
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('PasswordResetConfirmPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the page heading', () => {
      renderWithMemoryRouter();
      expect(
        screen.getByRole('heading', { name: /set new password/i })
      ).toBeInTheDocument();
    });

    it('renders descriptive text', () => {
      renderWithMemoryRouter();
      expect(
        screen.getByText(/enter your new password below/i)
      ).toBeInTheDocument();
    });

    it('renders new password input field', () => {
      renderWithMemoryRouter();
      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
      expect(passwordInput).toHaveAttribute('minLength', '8');
    });

    it('renders confirm password input field', () => {
      renderWithMemoryRouter();
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);
      expect(confirmInput).toBeInTheDocument();
      expect(confirmInput).toHaveAttribute('type', 'password');
      expect(confirmInput).toBeRequired();
      expect(confirmInput).toHaveAttribute('minLength', '8');
    });

    it('renders submit button', () => {
      renderWithMemoryRouter();
      expect(
        screen.getByRole('button', { name: /reset password/i })
      ).toBeInTheDocument();
    });

    it('renders link back to login', () => {
      renderWithMemoryRouter();
      expect(screen.getByText(/back to login/i)).toBeInTheDocument();
    });

    it('shows password length requirement', () => {
      renderWithMemoryRouter();
      expect(
        screen.getByText(/must be at least 8 characters long/i)
      ).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('allows typing in new password field', async () => {
      const user = userEvent.setup();
      renderWithMemoryRouter();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      await user.type(passwordInput, 'newpassword123');

      expect(passwordInput).toHaveValue('newpassword123');
    });

    it('allows typing in confirm password field', async () => {
      const user = userEvent.setup();
      renderWithMemoryRouter();

      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);
      await user.type(confirmInput, 'newpassword123');

      expect(confirmInput).toHaveValue('newpassword123');
    });
  });

  describe('Form Validation', () => {
    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderWithMemoryRouter();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'differentpassword');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // Should not call API
      expect(api.post).not.toHaveBeenCalled();
    });

    it('shows error when password is too short', async () => {
      const user = userEvent.setup();
      renderWithMemoryRouter();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);

      await user.type(passwordInput, 'short');
      await user.type(confirmInput, 'short');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters long/i)
        ).toBeInTheDocument();
      });

      // Should not call API
      expect(api.post).not.toHaveBeenCalled();
    });

    it('does not show error when passwords match and are valid', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValueOnce({ status: 204 });

      renderWithMemoryRouter();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      // Should call API
      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValueOnce({ status: 204 });

      renderWithMemoryRouter('test-uid', 'test-token');

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          'auth/users/reset_password_confirm/',
          {
            uid: 'test-uid',
            token: 'test-token',
            new_password: 'newpassword123',
            re_new_password: 'newpassword123',
          }
        );
      });
    });

    it('shows success message after successful reset', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValueOnce({ status: 204 });

      renderWithMemoryRouter();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password reset successful/i)
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/your password has been reset successfully/i)
      ).toBeInTheDocument();
    });

    it('redirects to login after successful reset', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValueOnce({ status: 204 });

      renderWithMemoryRouter();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password reset successful/i)
        ).toBeInTheDocument();
      });

      // Wait for the setTimeout to trigger navigate (3 seconds)
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/login');
        },
        { timeout: 4000 }
      );
    });

    it('disables button and shows loading state during submission', async () => {
      const user = userEvent.setup();
      api.post.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ status: 204 }), 100)
          )
      );

      renderWithMemoryRouter();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();

      await waitFor(() => {
        expect(
          screen.getByText(/password reset successful/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error for invalid or expired token', async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValueOnce({
        response: { data: { token: ['Invalid token'] } },
      });

      renderWithMemoryRouter();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(
              /this password reset link is invalid or has expired/i
            )
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('displays error for weak password', async () => {
      const user = userEvent.setup();

      // Mock the API rejection
      const mockError = {
        response: { data: { new_password: ['This password is too common.'] } },
      };
      api.post.mockRejectedValueOnce(mockError);

      renderWithMemoryRouter();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      // Type passwords
      await user.type(passwordInput, 'password123');
      await user.type(confirmInput, 'password123');

      // Ensure the values are set before clicking
      expect(passwordInput).toHaveValue('password123');
      expect(confirmInput).toHaveValue('password123');

      // Click submit
      await user.click(submitButton);

      // Wait for API to be called
      await waitFor(
        () => {
          expect(api.post).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      // Wait for error message to appear
      await waitFor(
        () => {
          expect(
            screen.getByText('This password is too common.')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('displays generic error message for non-field errors', async () => {
      const user = userEvent.setup();

      const mockError = {
        response: { data: { non_field_errors: ['Something went wrong'] } },
      };
      api.post.mockRejectedValueOnce(mockError);

      renderWithMemoryRouter();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');

      expect(passwordInput).toHaveValue('newpassword123');
      expect(confirmInput).toHaveValue('newpassword123');

      await user.click(submitButton);

      await waitFor(
        () => {
          expect(api.post).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      await waitFor(
        () => {
          expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('displays generic error when API error has no specific message', async () => {
      const user = userEvent.setup();

      const mockError = { response: { data: {} } };
      api.post.mockRejectedValueOnce(mockError);

      renderWithMemoryRouter();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');

      expect(passwordInput).toHaveValue('newpassword123');
      expect(confirmInput).toHaveValue('newpassword123');

      await user.click(submitButton);

      await waitFor(
        () => {
          expect(api.post).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      await waitFor(
        () => {
          expect(
            screen.getByText('An error occurred. Please try again.')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('clears previous error when form is resubmitted', async () => {
      const user = userEvent.setup();

      const mockError = { response: { data: { token: ['Invalid'] } } };
      api.post
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ status: 204 });

      renderWithMemoryRouter();

      const passwordInput = screen.getByPlaceholderText(/enter new password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm new password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');

      expect(passwordInput).toHaveValue('newpassword123');
      expect(confirmInput).toHaveValue('newpassword123');

      // First submission - should fail
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(api.post).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 }
      );

      await waitFor(
        () => {
          expect(
            screen.getByText(
              /this password reset link is invalid or has expired/i
            )
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Submit again - should succeed
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(api.post).toHaveBeenCalledTimes(2);
        },
        { timeout: 2000 }
      );

      await waitFor(
        () => {
          expect(
            screen.queryByText(
              /this password reset link is invalid or has expired/i
            )
          ).not.toBeInTheDocument();
          expect(
            screen.getByText(/password reset successful/i)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for inputs', () => {
      renderWithMemoryRouter();

      expect(screen.getByText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByText(/^confirm new password$/i)).toBeInTheDocument();
    });

    it('associates labels with inputs', () => {
      renderWithMemoryRouter();

      const newPasswordInput =
        screen.getByPlaceholderText(/enter new password/i);
      const confirmPasswordInput =
        screen.getByPlaceholderText(/confirm new password/i);

      expect(newPasswordInput).toHaveAttribute('id', 'newPassword');
      expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword');
    });
  });
});
