import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../assets/components.css';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

function BookingForm({ onSuccess }) {
  const { resourceId: urlResourceId, bookingId } = useParams();
  const resourceId = urlResourceId ? parseInt(urlResourceId) : null;
  const isEditMode = !!bookingId;
  const { user } = useAuth(); // Get user from auth context

  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState(
    resourceId || ''
  );
  const [resourceName, setResourceName] = useState(''); // For displaying resource name when editing
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('pending'); // Booking status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fetchingResources, setFetchingResources] = useState(false);
  const [fetchingBooking, setFetchingBooking] = useState(false);

  const navigate = useNavigate();

  // Check if user is admin directly from context
  const isAdmin = user?.is_staff || false;

  console.log('👤 Current user from context:', user);
  console.log('🔑 Is admin:', isAdmin);
  console.log('✅ Status editing enabled for all users - Version 2.0');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setFetchingBooking(true);
        const response = await api.get(`/bookings/${bookingId}/`);
        const booking = response.data;

        // Pre-populate form with existing booking data
        setSelectedResourceId(booking.resource);
        setResourceName(
          booking.resource_name || `Resource ${booking.resource}`
        );

        // Convert ISO strings to Date objects for DatePicker
        setStartTime(booking.start_time ? new Date(booking.start_time) : null);
        setEndTime(booking.end_time ? new Date(booking.end_time) : null);
        setNotes(booking.notes || '');
        setStatus(booking.status || 'pending');
      } catch (err) {
        setError('Failed to fetch booking details');
        console.error('Error fetching booking:', err);
      } finally {
        setFetchingBooking(false);
      }
    };

    const fetchResources = async () => {
      try {
        setFetchingResources(true);
        const response = await api.get('/resources/');
        // Filter only available resources
        const availableResources = response.data.filter(r => r.is_available);
        setResources(availableResources);
      } catch (err) {
        setError('Failed to fetch resources');
        console.error('Error fetching resources:', err);
      } finally {
        setFetchingResources(false);
      }
    };

    // Fetch existing booking data if in edit mode
    if (isEditMode) {
      fetchBooking();
    } else if (!resourceId) {
      // Only fetch resources if not editing and resourceId is not pre-selected
      fetchResources();
    }
  }, [bookingId, resourceId, isEditMode]);

  const validateForm = () => {
    if (!selectedResourceId) {
      setError('Please select a resource');
      return false;
    }
    if (!startTime) {
      setError('Please select a start time');
      return false;
    }
    if (!endTime) {
      setError('Please select an end time');
      return false;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return false;
    }

    // Only validate past time for new bookings, not when editing
    if (!isEditMode && startTime < new Date()) {
      setError('Start time cannot be in the past');
      return false;
    }

    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        resource: selectedResourceId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: notes.trim(),
      };

      // Include status when editing
      if (isEditMode) {
        bookingData.status = status;
      }

      console.log('🚀 Submitting booking data:', bookingData);
      console.log('📝 Status being sent:', status);

      if (isEditMode) {
        // Update existing booking
        const response = await api.put(`/bookings/${bookingId}/`, bookingData);
        console.log('✅ API Response:', response.data);
        setSuccess(true);
      } else {
        // Create new booking
        await api.post('/bookings/', bookingData);
        setSuccess(true);

        // Reset form only when creating
        if (!resourceId) {
          setSelectedResourceId('');
        }
        setStartTime(null);
        setEndTime(null);
        setNotes('');
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to bookings page after a short delay
        setTimeout(() => {
          navigate('/bookings');
        }, 2000);
      }
    } catch (err) {
      let errorMessage = '';

      // Django Rest Framework returns validation errors in various formats
      if (err.response?.data) {
        const errorData = err.response.data;

        // Check for non_field_errors (common DRF validation error format)
        if (
          errorData.non_field_errors &&
          Array.isArray(errorData.non_field_errors)
        ) {
          errorMessage = errorData.non_field_errors.join(' ');
        }
        // Check for detail field
        else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        // Check for message field
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Check for error field
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
        // Check for field-specific errors
        else if (typeof errorData === 'object') {
          // Combine all field errors
          const fieldErrors = Object.entries(errorData)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('; ');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      }

      // Fallback to generic message
      if (!errorMessage) {
        errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} booking. Please try again.`;
      }

      setError(errorMessage);
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} booking:`,
        err
      );
      console.error('Error response data:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingResources || fetchingBooking) {
    return (
      <p className="loading-message">
        {fetchingBooking
          ? 'Loading booking details...'
          : 'Loading resources...'}
      </p>
    );
  }

  return (
    <div className="booking-form-container">
      <h2>{isEditMode ? 'Edit Booking' : 'Create a Booking'}</h2>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" role="status">
          {isEditMode
            ? 'Booking updated successfully!'
            : 'Booking created successfully!'}{' '}
          Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="booking-form">
        {!resourceId && !isEditMode && (
          <div className="form-group">
            <label htmlFor="resource">Resource *</label>
            <select
              id="resource"
              value={selectedResourceId}
              onChange={e => setSelectedResourceId(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">-- Select a Resource --</option>
              {resources.map(resource => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} (Capacity: {resource.capacity})
                </option>
              ))}
            </select>
          </div>
        )}

        {isEditMode && (
          <div className="form-group">
            <label htmlFor="resource">Resource</label>
            <input
              type="text"
              id="resource"
              value={resourceName}
              disabled
              className="disabled-input"
            />
            <small className="form-help">
              Resource cannot be changed when editing
            </small>
          </div>
        )}

        {isEditMode && (
          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              disabled={loading}
              required
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="start_time">Start Time *</label>
          <DatePicker
            id="start_time"
            selected={startTime}
            onChange={date => setStartTime(date)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="MMMM d, yyyy h:mm aa"
            minDate={new Date()}
            disabled={loading}
            placeholderText="Select start date and time"
            className="date-picker-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="end_time">End Time *</label>
          <DatePicker
            id="end_time"
            selected={endTime}
            onChange={date => setEndTime(date)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="MMMM d, yyyy h:mm aa"
            minDate={startTime || new Date()}
            disabled={loading}
            placeholderText="Select end date and time"
            className="date-picker-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add any additional notes here..."
            rows="4"
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading
              ? isEditMode
                ? 'Updating Booking...'
                : 'Creating Booking...'
              : isEditMode
                ? 'Update Booking'
                : 'Create Booking'}
          </button>
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default BookingForm;
