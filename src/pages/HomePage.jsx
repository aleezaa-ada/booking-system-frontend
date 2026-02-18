import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
    const { user, logout } = useAuth();

    return (
        <div className="home-page">
            <div className="home-container">
                <div className="home-header">
                    <h1>Welcome to the Booking System</h1>
                    <p>Manage your resource bookings efficiently and effortlessly</p>
                </div>

                {user ? (
                    <>
                        <div className="home-welcome">
                            <p className="greeting">
                                Hello, <span className="user-name">{user.username}</span>!
                            </p>
                            <p className="subtitle">What would you like to do today?</p>
                        </div>

                        <div className="home-actions">
                            <Link to="/bookings" className="home-action-link">
                                My Bookings
                            </Link>
                            <Link to="/resources" className="home-action-link secondary">
                                Browse Resources
                            </Link>
                        </div>

                        <div className="home-logout">
                            <button onClick={logout} className="home-logout-btn">
                                Logout
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="home-guest">
                        <p>Please log in or create an account to start booking resources.</p>
                        <div className="home-auth-actions">
                            <Link to="/login" className="home-auth-link login">
                                Login
                            </Link>
                            <Link to="/register" className="home-auth-link register">
                                Register
                            </Link>
                        </div>

                        <div className="home-features">
                            <h3>Why Choose Our Booking System?</h3>
                            <div className="home-features-grid">
                                <div className="home-feature-item">
                                    <h4>Easy Booking</h4>
                                    <p>Book resources quickly with our intuitive interface</p>
                                </div>
                                <div className="home-feature-item">
                                    <h4>Real-time Updates</h4>
                                    <p>See availability instantly and manage your bookings</p>
                                </div>
                                <div className="home-feature-item">
                                    <h4>Secure & Reliable</h4>
                                    <p>Your data is safe with our secure platform</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HomePage;