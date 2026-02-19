import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BookingsPage from '../BookingsPage.jsx';

// Mock the api service
jest.mock('../../services/api', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    }
}));

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
    useAuth: jest.fn(() => ({
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        logout: jest.fn(),
        loading: false,
    })),
}));

// Import after mocking
import api from '../../services/api';

// Mock window.confirm and alert
global.confirm = jest.fn();
global.alert = jest.fn();

// Mock console.error
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalConsoleError;
});

// Helper function to render with router
const renderWithRouter = (ui) => {
    return render(
        <BrowserRouter>{ui}</BrowserRouter>
    );
};

describe('BookingsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering and Initial State', () => {
        it('renders the page heading', () => {
            api.get.mockResolvedValueOnce({ data: [] });
            renderWithRouter(<BookingsPage />);
            expect(screen.getByRole('heading', { name: /my bookings/i })).toBeInTheDocument();
        });

        it('displays loading message initially', () => {
            api.get.mockImplementation(() => new Promise(() => {}));
            renderWithRouter(<BookingsPage />);
            expect(screen.getByText(/loading bookings/i)).toBeInTheDocument();
        });

        it('fetches bookings on mount', async () => {
            api.get.mockResolvedValueOnce({ data: [] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(api.get).toHaveBeenCalledWith('/bookings/');
            });
        });
    });

    describe('Successful Bookings Loading', () => {
        const mockBookings = [
            {
                id: 1,
                resource: 5,
                resource_name: 'Conference Room A',
                start_time: '2024-01-15T10:00:00Z',
                end_time: '2024-01-15T11:00:00Z',
                status: 'confirmed',
                notes: 'Team meeting',
            },
            {
                id: 2,
                resource: 6,
                resource_name: 'Conference Room B',
                start_time: '2024-01-16T14:00:00Z',
                end_time: '2024-01-16T15:00:00Z',
                status: 'pending',
                notes: '',
            },
            {
                id: 3,
                resource: 7,
                resource_name: 'Projector',
                start_time: '2024-01-17T09:00:00Z',
                end_time: '2024-01-17T10:00:00Z',
                status: 'cancelled',
                notes: 'No longer needed',
            },
        ];

        it('displays all bookings in table format', async () => {
            api.get.mockResolvedValueOnce({ data: mockBookings });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room A')).toBeInTheDocument();
                expect(screen.getByText('Conference Room B')).toBeInTheDocument();
                expect(screen.getByText('Projector')).toBeInTheDocument();
            });
        });

        it('displays table headers', async () => {
            api.get.mockResolvedValueOnce({ data: mockBookings });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Resource')).toBeInTheDocument();
                expect(screen.getByText('Start Time')).toBeInTheDocument();
                expect(screen.getByText('End Time')).toBeInTheDocument();
                expect(screen.getByText('Status')).toBeInTheDocument();
                expect(screen.getByText('Notes')).toBeInTheDocument();
                expect(screen.getByText('Actions')).toBeInTheDocument();
            });
        });

        it('formats datetime correctly', async () => {
            api.get.mockResolvedValueOnce({ data: [mockBookings[0]] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                // Check that datetime is formatted (not the raw ISO string)
                expect(screen.queryByText('2024-01-15T10:00:00Z')).not.toBeInTheDocument();
                // Should have formatted date elements
                const timeElements = screen.getAllByText(/Jan|2024|10:00|AM|PM/i);
                expect(timeElements.length).toBeGreaterThan(0);
            });
        });

        it('displays notes when available', async () => {
            api.get.mockResolvedValueOnce({ data: [mockBookings[0]] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Team meeting')).toBeInTheDocument();
            });
        });

        it('displays dash when notes are empty', async () => {
            api.get.mockResolvedValueOnce({ data: [mockBookings[1]] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room B')).toBeInTheDocument();
            });

            const noteCells = screen.getAllByText('-');
            expect(noteCells.length).toBeGreaterThan(0);
        });

        it('displays status badges with correct text', async () => {
            api.get.mockResolvedValueOnce({ data: mockBookings });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Confirmed')).toBeInTheDocument();
                expect(screen.getByText('Pending')).toBeInTheDocument();
                expect(screen.getByText('Cancelled')).toBeInTheDocument();
            });
        });

        it('applies correct CSS classes to status badges', async () => {
            api.get.mockResolvedValueOnce({ data: mockBookings });
            const { container } = renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Confirmed')).toBeInTheDocument();
            });

            const confirmedBadge = container.querySelector('.status-confirmed');
            const pendingBadge = container.querySelector('.status-pending');
            const cancelledBadge = container.querySelector('.status-cancelled');

            expect(confirmedBadge).toBeInTheDocument();
            expect(pendingBadge).toBeInTheDocument();
            expect(cancelledBadge).toBeInTheDocument();
        });

        it('displays edit buttons for all bookings', async () => {
            api.get.mockResolvedValueOnce({ data: mockBookings });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                const editButtons = screen.getAllByRole('link', { name: /edit/i });
                expect(editButtons).toHaveLength(3);
            });
        });

        it('displays cancel buttons for all bookings', async () => {
            api.get.mockResolvedValueOnce({ data: mockBookings });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                const cancelButtons = screen.getAllByRole('button', { name: /delete/i });
                // Filter out the "Create New Booking" link
                const actualCancelButtons = cancelButtons.filter(btn =>
                    btn.textContent === 'Delete' || btn.textContent === 'Deleting...'
                );
                expect(actualCancelButtons.length).toBeGreaterThan(0);
            });
        });

        it('creates correct edit URLs for each booking', async () => {
            api.get.mockResolvedValueOnce({ data: mockBookings });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                const editLinks = screen.getAllByRole('link', { name: /edit booking/i });
                expect(editLinks[0]).toHaveAttribute('href', '/bookings/edit/1');
                expect(editLinks[1]).toHaveAttribute('href', '/bookings/edit/2');
                expect(editLinks[2]).toHaveAttribute('href', '/bookings/edit/3');
            });
        });

        it('removes loading message after bookings are loaded', async () => {
            api.get.mockResolvedValueOnce({ data: mockBookings });
            renderWithRouter(<BookingsPage />);

            expect(screen.getByText(/loading bookings/i)).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText(/loading bookings/i)).not.toBeInTheDocument();
            });
        });
    });

    describe('Empty Bookings List', () => {
        it('displays message when no bookings exist', async () => {
            api.get.mockResolvedValueOnce({ data: [] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText(/You haven't made any bookings yet. Browse resources to get started!/i)).toBeInTheDocument();
            });
        });

        it('displays link to browse resources when no bookings', async () => {
            api.get.mockResolvedValueOnce({ data: [] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                const browseLink = screen.getByRole('link', { name: /browse resources/i });
                expect(browseLink).toBeInTheDocument();
                expect(browseLink).toHaveAttribute('href', '/resources');
            });
        });

        it('does not display table when no bookings', async () => {
            api.get.mockResolvedValueOnce({ data: [] });
            const { container } = renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText(/You haven't made any bookings yet. Browse resources to get started!/i)).toBeInTheDocument();
            });

            expect(container.querySelector('.bookings-table')).not.toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('displays error message when fetch fails', async () => {
            const errorMessage = 'Network error occurred';
            api.get.mockRejectedValueOnce({
                response: { data: { message: errorMessage } }
            });

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });
        });

        it('displays generic error message when no specific message provided', async () => {
            api.get.mockRejectedValueOnce(new Error('Network Error'));

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText(/failed to fetch bookings/i)).toBeInTheDocument();
            });
        });

        it('displays retry button on error', async () => {
            api.get.mockRejectedValueOnce(new Error('Network Error'));

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
            });
        });

        it('retries fetching bookings when retry button is clicked', async () => {
            const user = userEvent.setup();
            api.get.mockRejectedValueOnce(new Error('Network Error'));

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
            });

            const mockBookings = [
                {
                    id: 1,
                    resource_name: 'Test Room',
                    start_time: '2024-01-15T10:00:00Z',
                    end_time: '2024-01-15T11:00:00Z',
                    status: 'pending',
                    notes: ''
                }
            ];
            api.get.mockResolvedValueOnce({ data: mockBookings });

            const retryButton = screen.getByRole('button', { name: /retry/i });
            await user.click(retryButton);

            await waitFor(() => {
                expect(api.get).toHaveBeenCalledTimes(2);
                expect(screen.getByText('Test Room')).toBeInTheDocument();
            });
        });
    });

    describe('Delete Booking Functionality', () => {
        const mockBooking = {
            id: 1,
            resource_name: 'Conference Room',
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T11:00:00Z',
            status: 'pending',
            notes: 'Meeting'
        };

        beforeEach(() => {
            global.confirm = jest.fn();
            global.alert = jest.fn();
        });

        it('displays delete button for each booking', async () => {
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
                expect(deleteButton).toBeInTheDocument();
            });
        });

        it('shows confirmation dialog when delete button is clicked', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(false);
            api.get.mockResolvedValueOnce({ data: [mockBooking] });

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
            await user.click(deleteButton);

            expect(global.confirm).toHaveBeenCalledWith(
                'Are you sure you want to cancel this booking? This action cannot be undone.'
            );
        });

        it('does not call delete API when user cancels confirmation', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(false);
            api.get.mockResolvedValueOnce({ data: [mockBooking] });

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
            await user.click(deleteButton);

            expect(api.delete).not.toHaveBeenCalled();
        });

        it('calls delete API with correct booking ID when confirmed', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(true);
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            api.delete.mockResolvedValueOnce({});

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
            await user.click(deleteButton);

            await waitFor(() => {
                expect(api.delete).toHaveBeenCalledWith('/bookings/1/');
            });
        });

        it('removes booking from list after successful deletion', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(true);
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            api.delete.mockResolvedValueOnce({});

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
            await user.click(deleteButton);

            await waitFor(() => {
                expect(screen.queryByText('Conference Room')).not.toBeInTheDocument();
            });
        });

        it('shows success message after deletion', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(true);
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            api.delete.mockResolvedValueOnce({});

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
            await user.click(deleteButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Booking cancelled successfully!');
            });
        });

        it('disables delete button while deletion is in progress', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(true);
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            api.delete.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
            await user.click(deleteButton);

            expect(screen.getByText('Deleting...')).toBeInTheDocument();
            expect(deleteButton).toBeDisabled();
        });

        it('disables delete button for cancelled bookings', async () => {
            const cancelledBooking = { ...mockBooking, status: 'cancelled' };
            api.get.mockResolvedValueOnce({ data: [cancelledBooking] });

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
                expect(deleteButton).toBeDisabled();
            });
        });

        it('shows 403 permission error message', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(true);
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            api.delete.mockRejectedValueOnce({
                response: { status: 403 }
            });

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
            await user.click(deleteButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(
                    'You do not have permission to cancel this booking. Please contact an administrator.'
                );
            });
        });

        it('shows 404 not found error message', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(true);
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            api.delete.mockRejectedValueOnce({
                response: { status: 404 }
            });

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
            await user.click(deleteButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(
                    'Booking not found. It may have already been cancelled.'
                );
            });
        });

        it('shows error detail message when provided by API', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(true);
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            api.delete.mockRejectedValueOnce({
                response: {
                    data: { detail: 'You can only delete your own bookings.' }
                }
            });

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
            await user.click(deleteButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(
                    'Failed to cancel booking. You can only delete your own bookings.'
                );
            });
        });

        it('shows generic error message when no specific error provided', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(true);
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            api.delete.mockRejectedValueOnce(new Error('Network Error'));

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
            await user.click(deleteButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(
                    'Failed to cancel booking. Network Error'
                );
            });
        });

        it('re-enables delete button after failed deletion', async () => {
            const user = userEvent.setup();
            global.confirm.mockReturnValue(true);
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            api.delete.mockRejectedValueOnce(new Error('Network Error'));

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
            await user.click(deleteButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalled();
            });

            expect(deleteButton).not.toBeDisabled();
            expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        it('handles deletion of multiple bookings independently', async () => {
            const user = userEvent.setup();
            const mockBookings = [
                { ...mockBooking, id: 1, resource_name: 'Room A' },
                { ...mockBooking, id: 2, resource_name: 'Room B' },
            ];

            global.confirm.mockReturnValue(true);
            api.get.mockResolvedValueOnce({ data: mockBookings });
            api.delete.mockResolvedValue({});

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Room A')).toBeInTheDocument();
                expect(screen.getByText('Room B')).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByRole('button', { name: /delete booking/i });
            await user.click(deleteButtons[0]);

            await waitFor(() => {
                expect(api.delete).toHaveBeenCalledWith('/bookings/1/');
                expect(screen.queryByText('Room A')).not.toBeInTheDocument();
                expect(screen.getByText('Room B')).toBeInTheDocument();
            });
        });

        it('logs error to console on deletion failure', async () => {
            const user = userEvent.setup();
            const consoleErrorSpy = jest.spyOn(console, 'error');
            global.confirm.mockReturnValue(true);
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            const error = new Error('Network Error');
            api.delete.mockRejectedValueOnce(error);

            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const deleteButton = screen.getByRole('button', { name: /delete booking for conference room/i });
            await user.click(deleteButton);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error cancelling booking:', error);
            });
        });
    });


    describe('Create New Booking Link', () => {
        it('displays create new booking link when bookings exist', async () => {
            const mockBookings = [{
                id: 1,
                resource_name: 'Test Room',
                start_time: '2024-01-15T10:00:00Z',
                end_time: '2024-01-15T11:00:00Z',
                status: 'pending',
                notes: ''
            }];
            api.get.mockResolvedValueOnce({ data: mockBookings });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                const createLink = screen.getByRole('link', { name: /create new booking/i });
                expect(createLink).toBeInTheDocument();
                expect(createLink).toHaveAttribute('href', '/resources');
            });
        });
    });

    describe('Accessibility', () => {
        const mockBooking = {
            id: 1,
            resource_name: 'Conference Room',
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T11:00:00Z',
            status: 'pending',
            notes: 'Meeting'
        };

        it('has accessible heading', async () => {
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                const heading = screen.getByRole('heading', { name: /my bookings/i });
                expect(heading).toBeInTheDocument();
            });
        });

        it('edit links have descriptive aria-labels', async () => {
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                const editLink = screen.getByRole('link', {
                    name: /edit booking for conference room/i
                });
                expect(editLink).toHaveAttribute('aria-label', 'Edit booking for Conference Room');
            });
        });

        it('cancel buttons have descriptive aria-labels', async () => {
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                const cancelButton = screen.getByRole('button', {
                    name: /delete booking for conference room/i
                });
                expect(cancelButton).toHaveAttribute('aria-label', 'Delete booking for Conference Room');
            });
        });
    });

    describe('Edge Cases', () => {
        it('handles booking without resource_name', async () => {
            const booking = {
                id: 1,
                resource: 5,
                start_time: '2024-01-15T10:00:00Z',
                end_time: '2024-01-15T11:00:00Z',
                status: 'pending',
                notes: ''
            };
            api.get.mockResolvedValueOnce({ data: [booking] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('5')).toBeInTheDocument();
            });
        });

        it('handles rejected status', async () => {
            const booking = {
                id: 1,
                resource_name: 'Room',
                start_time: '2024-01-15T10:00:00Z',
                end_time: '2024-01-15T11:00:00Z',
                status: 'rejected',
                notes: ''
            };
            api.get.mockResolvedValueOnce({ data: [booking] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Rejected')).toBeInTheDocument();
            });
        });
    });

    describe('Admin User - Booked By Column', () => {
        beforeEach(() => {
            // Mock useAuth to return admin user
            const { useAuth } = require('../../hooks/useAuth');
            useAuth.mockReturnValue({
                user: { id: 1, username: 'admin', email: 'admin@example.com', is_staff: true },
                logout: jest.fn(),
                loading: false,
            });
        });

        const mockBookingsWithUsers = [
            {
                id: 1,
                resource_name: 'Conference Room A',
                start_time: '2024-01-15T10:00:00Z',
                end_time: '2024-01-15T11:00:00Z',
                status: 'confirmed',
                notes: 'Team meeting',
                username: 'johndoe'
            },
            {
                id: 2,
                resource_name: 'Conference Room B',
                start_time: '2024-01-16T14:00:00Z',
                end_time: '2024-01-16T15:00:00Z',
                status: 'pending',
                notes: '',
                username: 'janedoe'
            },
        ];

        it('displays "Booked By" column header for admin users', async () => {
            api.get.mockResolvedValueOnce({ data: mockBookingsWithUsers });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Booked By')).toBeInTheDocument();
            });
        });

        it('displays usernames in the "Booked By" column', async () => {
            api.get.mockResolvedValueOnce({ data: mockBookingsWithUsers });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('johndoe')).toBeInTheDocument();
                expect(screen.getByText('janedoe')).toBeInTheDocument();
            });
        });

        it('displays dash when username is not available', async () => {
            const bookingWithoutUsername = [{
                id: 1,
                resource_name: 'Conference Room A',
                start_time: '2024-01-15T10:00:00Z',
                end_time: '2024-01-15T11:00:00Z',
                status: 'confirmed',
                notes: 'Team meeting',
            }];
            api.get.mockResolvedValueOnce({ data: bookingWithoutUsername });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room A')).toBeInTheDocument();
            });

            // Check that "Booked By" column exists
            expect(screen.getByText('Booked By')).toBeInTheDocument();

            // The dash should be in the booked-by cell
            const bookedByCells = document.querySelectorAll('.booked-by');
            expect(bookedByCells.length).toBeGreaterThan(0);
            expect(bookedByCells[0].textContent).toBe('-');
        });

        it('displays correct table structure with Booked By column', async () => {
            api.get.mockResolvedValueOnce({ data: mockBookingsWithUsers });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Resource')).toBeInTheDocument();
                expect(screen.getByText('Start Time')).toBeInTheDocument();
                expect(screen.getByText('End Time')).toBeInTheDocument();
                expect(screen.getByText('Status')).toBeInTheDocument();
                expect(screen.getByText('Booked By')).toBeInTheDocument();
                expect(screen.getByText('Notes')).toBeInTheDocument();
                expect(screen.getByText('Actions')).toBeInTheDocument();
            });
        });
    });

    describe('Regular User - No Booked By Column', () => {
        beforeEach(() => {
            // Reset mock to return regular user (not staff)
            const { useAuth } = require('../../hooks/useAuth');
            useAuth.mockReturnValue({
                user: { id: 2, username: 'regularuser', email: 'user@example.com', is_staff: false },
                logout: jest.fn(),
                loading: false,
            });
        });

        const mockBooking = {
            id: 1,
            resource_name: 'Conference Room A',
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T11:00:00Z',
            status: 'confirmed',
            notes: 'Team meeting',
            username: 'johndoe'
        };

        it('does not display "Booked By" column header for regular users', async () => {
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room A')).toBeInTheDocument();
            });

            expect(screen.queryByText('Booked By')).not.toBeInTheDocument();
        });

        it('does not display usernames for regular users', async () => {
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room A')).toBeInTheDocument();
            });

            // Should not see the username in the table
            expect(screen.queryByText('johndoe')).not.toBeInTheDocument();
        });

        it('displays correct table structure without Booked By column', async () => {
            api.get.mockResolvedValueOnce({ data: [mockBooking] });
            renderWithRouter(<BookingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Resource')).toBeInTheDocument();
                expect(screen.getByText('Start Time')).toBeInTheDocument();
                expect(screen.getByText('End Time')).toBeInTheDocument();
                expect(screen.getByText('Status')).toBeInTheDocument();
                expect(screen.queryByText('Booked By')).not.toBeInTheDocument();
                expect(screen.getByText('Notes')).toBeInTheDocument();
                expect(screen.getByText('Actions')).toBeInTheDocument();
            });
        });
    });
});
