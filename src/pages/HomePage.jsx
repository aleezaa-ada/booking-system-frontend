import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

function HomePage() {
    const { user, logout } = useAuth();

    return (
        <div>
            <h1>Welcome to the Booking System!</h1>
            {user ? (
                <>
                    <p>Hello, {user.username}!</p>
                    <button onClick={logout}>Logout</button>
                    <nav>
                        <Link to="/bookings">My Bookings</Link> |
                        <Link to="/resources">View Resources</Link>
                    </nav>
                </>
            ) : (
                <>
                    <p>Please log in or register.</p>
                    <nav>
                        <Link to="/login">Login</Link> |
                        <Link to="/register">Register</Link>
                    </nav>
                </>
            )}
        </div>
    );
}
export default HomePage;