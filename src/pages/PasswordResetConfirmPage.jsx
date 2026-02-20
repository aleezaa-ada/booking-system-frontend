import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import '../assets/pages.css';

function PasswordResetConfirmPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      await api.post('auth/users/reset_password_confirm/', {
        uid,
        token,
        new_password: newPassword,
        re_new_password: confirmPassword,
      });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.token) {
          setError(
            'This password reset link is invalid or has expired. Please request a new one.'
          );
        } else if (errorData.new_password) {
          setError(errorData.new_password[0]);
        } else if (errorData.non_field_errors) {
          setError(errorData.non_field_errors[0]);
        } else {
          setError('An error occurred. Please try again.');
        }
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h2>Password Reset Successful!</h2>
          </div>
          <div className="login-success">
            <p>
              <strong>✓ Your password has been reset successfully.</strong>
            </p>
            <p>You can now log in with your new password.</p>
            <p>Redirecting to login page...</p>
          </div>
          <div className="login-footer">
            <Link to="/login" className="login-register-link">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h2>Set New Password</h2>
          <p>Enter your new password below</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              disabled={loading}
              minLength="8"
            />
            <small>Must be at least 8 characters long</small>
          </div>

          <div className="login-form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              disabled={loading}
              minLength="8"
            />
          </div>

          <button
            type="submit"
            className={`login-submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="login-footer">
          <p>Remember your password?</p>
          <Link to="/login" className="login-register-link">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetConfirmPage;
