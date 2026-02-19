import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BookingForm from '../BookingForm';
import api from '../../services/api';
import * as AuthHook from '../../hooks/useAuth';

// Mock the api service
jest.mock('../../services/api');

// Mock useAuth hook
jest.mock('../../hooks/useAuth');

// Mock react-datepicker
jest.mock('react-datepicker', () => ({
  __esModule: true,
  default: require('react').forwardRef(({ selected, onChange, placeholderText, id, disabled }, ref) => {
    const React = require('react');
    return React.createElement('input', {
      ref: ref,
      type: 'text',
      id: id,
      value: selected && selected instanceof Date && !isNaN(selected.getTime()) ? selected.toISOString() : '',
      onChange: (e) => {
        if (e.target.value) {
          const date = new Date(e.target.value);
          if (!isNaN(date.getTime())) {
            onChange(date);
          }
        } else {
          onChange(null);
        }
      },
      placeholder: placeholderText,
      disabled: disabled,
      'aria-label': placeholderText,
      'data-testid': `datepicker-${id}`,
    });
  }),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock console methods
const originalError = console.error;
const originalLog = console.log;
beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
});

// Helper function to render with router
const renderWithRouter = (ui, { initialEntries = ['/book'] } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/book" element={ui} />
        <Route path="/book/:resourceId" element={ui} />
        <Route path="/bookings/edit/:bookingId" element={ui} />
        <Route path="/bookings" element={<div>My Bookings</div>} />
      </Routes>
    </MemoryRouter>
  );
};

// Helper function to set DatePicker value
const setDatePickerValue = (input, isoString) => {
  fireEvent.change(input, { target: { value: isoString } });
};

// Mock resources data
const mockResources = [
  { id: 1, name: 'Conference Room A', capacity: 10, is_available: true },
  { id: 2, name: 'Conference Room B', capacity: 20, is_available: true },
  { id: 3, name: 'Projector', capacity: 1, is_available: false },
];

// Mock booking data
const mockBooking = {
  id: 8,
  resource: 1,
  resource_name: 'Meeting Room A',
  start_time: '2026-02-18T18:11:00Z',
  end_time: '2026-02-18T19:11:00Z',
  status: 'pending',
  notes: 'Test notes',
  user: 4,
};

describe('BookingForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-18T10:00:00'));

    // Default mock for useAuth - regular user
    AuthHook.useAuth.mockReturnValue({
      user: { id: 1, username: 'testuser', email: 'test@example.com', is_staff: false },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Create Mode - Initial Rendering', () => {
    it('renders the create booking form with all required fields', async () => {
      api.get.mockResolvedValue({ data: mockResources });

      renderWithRouter(<BookingForm />);

      await waitFor(() => {
        expect(screen.queryByText(/loading resources/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { name: /create a booking/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/resource/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create booking/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('shows loading message while fetching resources', () => {
      api.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter(<BookingForm />);

      expect(screen.getByText(/loading resources/i)).toBeInTheDocument();
    });

    it('fetches and displays available resources in dropdown', async () => {
      api.get.mockResolvedValue({ data: mockResources });

      renderWithRouter(<BookingForm />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/resources/');
      });

      await waitFor(() => {
        expect(screen.getByText(/conference room a/i)).toBeInTheDocument();
        expect(screen.getByText(/conference room b/i)).toBeInTheDocument();
      });

      // Should not display unavailable resources
      expect(screen.queryByText(/projector/i)).not.toBeInTheDocument();
    });

    it('displays error message when resource fetching fails', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<BookingForm />);

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch resources/i)).toBeInTheDocument();
      });
    });

    it('does not fetch resources when resourceId is provided via URL', () => {
      renderWithRouter(<BookingForm />, { initialEntries: ['/book/1'] });

      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode - Initial Rendering', () => {
    it('fetches and displays existing booking data', async () => {
      api.get.mockResolvedValue({ data: mockBooking });

      renderWithRouter(<BookingForm />, { initialEntries: ['/bookings/edit/8'] });

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/bookings/8/');
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit booking/i })).toBeInTheDocument();
        expect(screen.getByDisplayValue('Meeting Room A')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
      });
    });

    it('shows loading message while fetching booking', () => {
      api.get.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<BookingForm />, { initialEntries: ['/bookings/edit/8'] });

      expect(screen.getByText(/loading booking details/i)).toBeInTheDocument();
    });

    it('displays error when fetching booking fails', async () => {
      api.get.mockRejectedValue(new Error('Not found'));

      renderWithRouter(<BookingForm />, { initialEntries: ['/bookings/edit/8'] });

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch booking details/i)).toBeInTheDocument();
      });
    });

    it('formats datetime correctly for DatePicker', async () => {
      api.get.mockResolvedValue({ data: mockBooking });

      renderWithRouter(<BookingForm />, { initialEntries: ['/bookings/edit/8'] });

      await waitFor(() => {
        const startInput = screen.getByTestId('datepicker-start_time');
        const endInput = screen.getByTestId('datepicker-end_time');

        // Should be in ISO format (toISOString())
        expect(startInput.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(endInput.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    it('shows resource as disabled field in edit mode', async () => {
      api.get.mockResolvedValue({ data: mockBooking });

      renderWithRouter(<BookingForm />, { initialEntries: ['/bookings/edit/8'] });

      await waitFor(() => {
        const resourceInput = screen.getByDisplayValue('Meeting Room A');
        expect(resourceInput).toBeDisabled();
        expect(screen.getByText(/resource cannot be changed when editing/i)).toBeInTheDocument();
      });
    });
  });

  describe('Status Field - Admin vs Regular User', () => {
    it('shows status dropdown for admin users in edit mode', async () => {
      AuthHook.useAuth.mockReturnValue({
        user: { id: 1, username: 'admin', email: 'admin@example.com', is_staff: true },
      });
      api.get.mockResolvedValue({ data: mockBooking });

      renderWithRouter(<BookingForm />, { initialEntries: ['/bookings/edit/8'] });

      await waitFor(() => {
        const statusSelect = screen.getByLabelText(/status/i);
        expect(statusSelect).toBeInTheDocument();
        expect(statusSelect.tagName).toBe('SELECT');
        expect(screen.getByRole('option', { name: /pending/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /confirmed/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /cancelled/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /rejected/i })).toBeInTheDocument();
      });
    });

    it('shows status as editable field for regular users in edit mode', async () => {
      api.get.mockResolvedValue({ data: mockBooking });

      renderWithRouter(<BookingForm />, { initialEntries: ['/bookings/edit/8'] });

      await waitFor(() => {
        const statusSelect = screen.getByLabelText(/status/i);
        expect(statusSelect).toBeInTheDocument();
        expect(statusSelect.tagName).toBe('SELECT');
        expect(statusSelect).not.toBeDisabled();
        expect(screen.getByRole('option', { name: /pending/i })).toBeInTheDocument();
      });
    });

    it('does not show status field in create mode', async () => {
      api.get.mockResolvedValue({ data: mockResources });

      renderWithRouter(<BookingForm />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      api.get.mockResolvedValue({ data: mockResources });
      renderWithRouter(<BookingForm />);
      await waitFor(() => {
        expect(screen.queryByText(/loading resources/i)).not.toBeInTheDocument();
      });
    });

    it('shows error when submitting without selecting a resource', async () => {
      const user = userEvent.setup({ delay: null });

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const form = screen.getByRole('heading', { name: /create a booking/i }).closest('div').querySelector('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await waitFor(() => {
        expect(screen.getByText(/please select a resource/i)).toBeInTheDocument();
      });
    });

    it('shows error when submitting without start time', async () => {
      const user = userEvent.setup({ delay: null });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const form = screen.getByRole('heading', { name: /create a booking/i }).closest('div').querySelector('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await waitFor(() => {
        expect(screen.getByText(/please select a start time/i)).toBeInTheDocument();
      });
    });

    it('shows error when submitting without end time', async () => {
      const user = userEvent.setup({ delay: null });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      // Manually trigger form submission to bypass HTML5 validation
      const form = screen.getByRole('heading', { name: /create a booking/i }).closest('div').querySelector('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await waitFor(() => {
        expect(screen.getByText(/please select an end time/i)).toBeInTheDocument();
      });
    });

    it('shows error when end time is before start time', async () => {
      const user = userEvent.setup({ delay: null });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T14:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T10:00:00.000Z');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end time must be after start time/i)).toBeInTheDocument();
      });
    });

    it('shows error when start time is in the past (create mode only)', async () => {
      const user = userEvent.setup({ delay: null });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-17T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-17T12:00:00.000Z');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/start time cannot be in the past/i)).toBeInTheDocument();
      });
    });

    it('allows past times when editing existing booking', async () => {
      api.get.mockResolvedValue({ data: mockBooking });
      api.put.mockResolvedValue({ data: { ...mockBooking } });

      renderWithRouter(<BookingForm />, { initialEntries: ['/bookings/edit/8'] });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit booking/i })).toBeInTheDocument();
      });

      const user = userEvent.setup({ delay: null });
      const submitButton = screen.getByRole('button', { name: /update booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/booking updated successfully/i)).toBeInTheDocument();
      });

      // Should not show past time error
      expect(screen.queryByText(/start time cannot be in the past/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission - Create Mode', () => {
    beforeEach(async () => {
      api.get.mockResolvedValue({ data: mockResources });
      renderWithRouter(<BookingForm />);
      await waitFor(() => {
        expect(screen.queryByText(/loading resources/i)).not.toBeInTheDocument();
      });
    });

    it('successfully creates a booking with valid data', async () => {
      const user = userEvent.setup({ delay: null });
      api.post.mockResolvedValue({ data: { id: 1, status: 'pending' } });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'Team meeting');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/bookings/', {
          resource: '1',
          start_time: '2026-02-20T10:00:00.000Z',
          end_time: '2026-02-20T12:00:00.000Z',
          notes: 'Team meeting',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/booking created successfully/i)).toBeInTheDocument();
      });
    });

    it('trims whitespace from notes before submission', async () => {
      const user = userEvent.setup({ delay: null });
      api.post.mockResolvedValue({ data: { id: 1 } });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, '  Important meeting  ');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/bookings/', expect.objectContaining({
          notes: 'Important meeting',
        }));
      });
    });

    it('resets form after successful submission', async () => {
      const user = userEvent.setup({ delay: null });
      api.post.mockResolvedValue({ data: { id: 1 } });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'Test notes');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/booking created successfully/i)).toBeInTheDocument();
      });

      // Form should be reset
      expect(resourceSelect.value).toBe('');
      expect(startTimeInput.value).toBe('');
      expect(endTimeInput.value).toBe('');
      expect(notesInput.value).toBe('');
    });

    it('disables form fields while submitting', async () => {
      const user = userEvent.setup({ delay: null });
      api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      // Fields should be disabled during submission
      expect(resourceSelect).toBeDisabled();
      expect(startTimeInput).toBeDisabled();
      expect(endTimeInput).toBeDisabled();
      expect(screen.getByLabelText(/notes/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /creating booking/i })).toBeDisabled();
    });
  });

  describe('Form Submission - Edit Mode', () => {
    it('successfully updates a booking', async () => {
      api.get.mockResolvedValue({ data: mockBooking });
      api.put.mockResolvedValue({ data: { ...mockBooking, notes: 'Updated notes' } });

      renderWithRouter(<BookingForm />, { initialEntries: ['/bookings/edit/8'] });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit booking/i })).toBeInTheDocument();
      });

      const user = userEvent.setup({ delay: null });
      const notesInput = screen.getByLabelText(/notes/i);
      await user.clear(notesInput);
      await user.type(notesInput, 'Updated notes');

      const submitButton = screen.getByRole('button', { name: /update booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/bookings/8/', expect.objectContaining({
          notes: 'Updated notes',
          status: 'pending',
        }));
      });

      await waitFor(() => {
        expect(screen.getByText(/booking updated successfully/i)).toBeInTheDocument();
      });
    });

    it('includes status when admin updates booking', async () => {
      AuthHook.useAuth.mockReturnValue({
        user: { id: 1, username: 'admin', email: 'admin@example.com', is_staff: true },
      });
      api.get.mockResolvedValue({ data: mockBooking });
      api.put.mockResolvedValue({ data: { ...mockBooking, status: 'confirmed' } });

      renderWithRouter(<BookingForm />, { initialEntries: ['/bookings/edit/8'] });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit booking/i })).toBeInTheDocument();
      });

      const user = userEvent.setup({ delay: null });
      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, 'confirmed');

      const submitButton = screen.getByRole('button', { name: /update booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/bookings/8/', expect.objectContaining({
          status: 'confirmed',
        }));
      });
    });

    it('does not reset form after edit submission', async () => {
      api.get.mockResolvedValue({ data: mockBooking });
      api.put.mockResolvedValue({ data: mockBooking });

      renderWithRouter(<BookingForm />, { initialEntries: ['/bookings/edit/8'] });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
      });

      const user = userEvent.setup({ delay: null });
      const submitButton = screen.getByRole('button', { name: /update booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/booking updated successfully/i)).toBeInTheDocument();
      });

      // Form should not be reset
      expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      api.get.mockResolvedValue({ data: mockResources });
      renderWithRouter(<BookingForm />);
      await waitFor(() => {
        expect(screen.queryByText(/loading resources/i)).not.toBeInTheDocument();
      });
    });

    it('displays non_field_errors from DRF', async () => {
      const user = userEvent.setup({ delay: null });
      api.post.mockRejectedValue({
        response: {
          data: {
            non_field_errors: ['This resource is already booked for the selected time slot.'],
          },
        },
      });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/this resource is already booked/i)).toBeInTheDocument();
      });
    });

    it('displays detail error message', async () => {
      const user = userEvent.setup({ delay: null });
      api.post.mockRejectedValue({
        response: {
          data: {
            detail: 'Cannot create booking - resource is already booked',
          },
        },
      });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/cannot create booking - resource is already booked/i)).toBeInTheDocument();
      });
    });

    it('displays field-specific errors', async () => {
      const user = userEvent.setup({ delay: null });
      api.post.mockRejectedValue({
        response: {
          data: {
            start_time: ['Start time is required'],
            end_time: ['End time must be after start time'],
          },
        },
      });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorText = screen.getByRole('alert').textContent;
        expect(errorText).toContain('start_time');
        expect(errorText).toContain('end_time');
      });
    });

    it('displays generic error when no specific error provided', async () => {
      const user = userEvent.setup({ delay: null });
      api.post.mockRejectedValue(new Error('Network error'));

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create booking/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back when cancel button is clicked', async () => {
      api.get.mockResolvedValue({ data: mockResources });
      renderWithRouter(<BookingForm />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const user = userEvent.setup({ delay: null });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('navigates to bookings page after successful creation', async () => {
      api.get.mockResolvedValue({ data: mockResources });
      api.post.mockResolvedValue({ data: { id: 1 } });

      renderWithRouter(<BookingForm />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const user = userEvent.setup({ delay: null });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/booking created successfully/i)).toBeInTheDocument();
      });

      // Fast-forward timers to trigger navigation
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/bookings');
      });
    });
  });

  describe('onSuccess Callback', () => {
    it('calls onSuccess callback instead of navigating when provided', async () => {
      const mockOnSuccess = jest.fn();
      const user = userEvent.setup({ delay: null });
      api.get.mockResolvedValue({ data: mockResources });
      api.post.mockResolvedValue({ data: { id: 1 } });

      renderWithRouter(<BookingForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading resources/i)).not.toBeInTheDocument();
      });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      // Should not navigate when onSuccess is provided
      jest.advanceTimersByTime(2000);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Pre-selected Resource', () => {
    it('does not show resource dropdown when resourceId is in URL', () => {
      renderWithRouter(<BookingForm />, { initialEntries: ['/book/1'] });

      expect(screen.queryByLabelText(/resource/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('datepicker-start_time')).toBeInTheDocument();
      expect(screen.getByTestId('datepicker-end_time')).toBeInTheDocument();
    });

    it('uses the provided resourceId for booking submission', async () => {
      const user = userEvent.setup({ delay: null });
      api.post.mockResolvedValue({ data: { id: 1 } });

      renderWithRouter(<BookingForm />, { initialEntries: ['/book/5'] });

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/bookings/', expect.objectContaining({
          resource: 5,
        }));
      });
    });
  });

  describe('Console Logging', () => {
    it('logs user and admin status', async () => {
      api.get.mockResolvedValue({ data: mockResources });

      renderWithRouter(<BookingForm />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('👤 Current user from context:', expect.any(Object));
        expect(console.log).toHaveBeenCalledWith('🔑 Is admin:', expect.any(Boolean));
      });
    });

    it('logs error when fetching resources fails', async () => {
      const error = new Error('Network error');
      api.get.mockRejectedValue(error);

      renderWithRouter(<BookingForm />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error fetching resources:', error);
      });
    });

    it('logs error response data when submission fails', async () => {
      api.get.mockResolvedValue({ data: mockResources });
      const errorResponse = { detail: 'Some error' };
      api.post.mockRejectedValue({ response: { data: errorResponse } });

      renderWithRouter(<BookingForm />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const user = userEvent.setup({ delay: null });

      const resourceSelect = screen.getByLabelText(/resource/i);
      await user.selectOptions(resourceSelect, '1');

      const startTimeInput = screen.getByTestId('datepicker-start_time');
      setDatePickerValue(startTimeInput, '2026-02-20T10:00:00.000Z');

      const endTimeInput = screen.getByTestId('datepicker-end_time');
      setDatePickerValue(endTimeInput, '2026-02-20T12:00:00.000Z');

      const submitButton = screen.getByRole('button', { name: /create booking/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error response data:', errorResponse);
      });
    });
  });
});
