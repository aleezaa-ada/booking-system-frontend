import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../assets/pages.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      await api.post('auth/users/reset_password/', { email });
      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Password reset request error:', err);
      if (err.response?.data?.email) {
        setError(err.response.data.email[0]);
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h2>Reset Password</h2>
          <p>
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>

        {success && (
          <div className="login-success">
            <p>
              <strong>✓ Check your email!</strong>
            </p>
            <p>
              If an account exists with that email address, you'll receive a
              password reset link shortly.
            </p>
          </div>
        )}

        {error && <div className="login-error">{error}</div>}

        {!success && (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className={`login-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

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

export default ForgotPasswordPage;
