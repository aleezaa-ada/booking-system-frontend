import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../assets/components.css';
import ProfilePictureUpload from './ProfilePictureUpload';

function Nav() {
  const { user, logout, refreshUser } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    if (user?.profile_picture) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfilePicture(user.profile_picture);
    }
  }, [user]);

  const handleProfilePictureUpdate = async newPictureUrl => {
    setProfilePicture(newPictureUrl);
    setShowProfileModal(false);
    // Refresh user data to sync with backend
    if (refreshUser) {
      await refreshUser();
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
  };

  return (
    <nav className="nav-component">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/">Booking System</Link>
        </div>
        {user && (
          <div className="nav-links">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/resources" className="nav-link">
              Resources
            </Link>
            <Link to="/bookings" className="nav-link">
              My Bookings
            </Link>

            <div className="profile-dropdown">
              <button
                onClick={toggleDropdown}
                className="profile-button"
                aria-label="Profile menu"
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-avatar-placeholder">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </button>

              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="dropdown-username">{user.username}</p>
                    <p className="dropdown-email">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowProfileModal(true);
                    }}
                    className="dropdown-item"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Manage Profile Picture
                  </button>
                  <button
                    onClick={handleLogout}
                    className="dropdown-item logout-item"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showProfileModal && (
        <ProfilePictureUpload
          currentPicture={profilePicture}
          onUpdate={handleProfilePictureUpdate}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showDropdown && (
        <div
          className="dropdown-overlay"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </nav>
  );
}

export default Nav;
