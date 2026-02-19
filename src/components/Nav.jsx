import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../assets/components.css';

function Nav() {
    const { user, logout } = useAuth();

    return (
        <nav className="nav-component">
            <div className="nav-container">
                <div className="nav-brand">
                    <Link to="/">Booking System</Link>
                </div>
                {user && (
                    <div className="nav-links">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/resources" className="nav-link">Resources</Link>
                        <Link to="/bookings" className="nav-link">My Bookings</Link>
                        <button onClick={logout} className="nav-logout-btn">Logout</button>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Nav;
