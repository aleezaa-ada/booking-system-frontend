import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/bookings/');
            setBookings(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch bookings');
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
            return;
        }

        try {
            setCancellingId(bookingId);
            // Use DELETE to cancel the booking (removes it completely)
            await api.delete(`/bookings/${bookingId}/`);

            // Remove from local state since it's deleted
            setBookings(bookings.filter(booking => booking.id !== bookingId));

            alert('Booking cancelled successfully!');
        } catch (err) {
            let errorMessage = 'Failed to cancel booking. ';

            // Handle different error types
            if (err.response?.status === 403) {
                errorMessage = 'You do not have permission to cancel this booking. Please contact an administrator.';
            } else if (err.response?.status === 404) {
                errorMessage = 'Booking not found. It may have already been cancelled.';
            } else if (err.response?.data?.detail) {
                errorMessage += err.response.data.detail;
            } else if (err.response?.data?.message) {
                errorMessage += err.response.data.message;
            } else if (err.message) {
                errorMessage += err.message;
            } else {
                errorMessage += 'Please try again or contact support.';
            }

            alert(errorMessage);
            console.error('Error cancelling booking:', err);
        } finally {
            setCancellingId(null);
        }
    };

    const getStatusClass = (status) => {
        const statusClasses = {
            pending: 'status-pending',
            confirmed: 'status-confirmed',
            cancelled: 'status-cancelled',
            rejected: 'status-rejected',
        };
        return statusClasses[status] || '';
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="my-bookings-page">
                <h2>My Bookings</h2>
                <p className="loading-message">Loading bookings...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="my-bookings-page">
                <h2>My Bookings</h2>
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={fetchBookings}>Retry</button>
                </div>
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="my-bookings-page">
                <h2>My Bookings</h2>
                <p className="no-bookings-message">You don't have any bookings yet.</p>
                <Link to="/resources" className="create-booking-link">
                    Browse Resources
                </Link>
            </div>
        );
    }

    return (
        <div className="my-bookings-page">
            <h2>My Bookings</h2>
            <Link to="/resources" className="create-booking-link">
                Create New Booking
            </Link>

            <div className="bookings-table-container">
                <table className="bookings-table">
                    <thead>
                        <tr>
                            <th>Resource</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Status</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="booking-row">
                                <td className="resource-name">
                                    {booking.resource_name || booking.resource}
                                </td>
                                <td className="start-time">
                                    {formatDateTime(booking.start_time)}
                                </td>
                                <td className="end-time">
                                    {formatDateTime(booking.end_time)}
                                </td>
                                <td>
                                    <span className={`status-badge ${getStatusClass(booking.status)}`}>
                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </span>
                                </td>
                                <td className="booking-notes">
                                    {booking.notes || '-'}
                                </td>
                                <td className="actions">
                                    <Link
                                        to={`/bookings/edit/${booking.id}`}
                                        className="edit-button"
                                        aria-label={`Edit booking for ${booking.resource_name || booking.resource}`}
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleCancelBooking(booking.id)}
                                        className="cancel-button"
                                        disabled={
                                            cancellingId === booking.id ||
                                            booking.status === 'cancelled'
                                        }
                                        aria-label={`Delete booking for ${booking.resource_name || booking.resource}`}
                                        title={booking.status === 'cancelled' ? 'Booking already cancelled' : 'Delete this booking'}
                                    >
                                        {cancellingId === booking.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default BookingsPage;
