import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ResourceListPage from '../ResourceListPage';

// Mock the api service
jest.mock('../../services/api', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
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

// Mock console.error to keep test output clean
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

describe('ResourceListPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering and Initial State', () => {
        it('renders the page heading', () => {
            api.get.mockResolvedValueOnce({ data: [] });
            renderWithRouter(<ResourceListPage />);
            expect(screen.getByRole('heading', { name: /available resources/i })).toBeInTheDocument();
        });

        it('displays loading message initially', () => {
            api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
            renderWithRouter(<ResourceListPage />);
            expect(screen.getByText(/loading resources/i)).toBeInTheDocument();
        });

        it('fetches resources on mount', async () => {
            api.get.mockResolvedValueOnce({ data: [] });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(api.get).toHaveBeenCalledTimes(1);
                expect(api.get).toHaveBeenCalledWith('/resources/');
            });
        });
    });

    describe('Successful Resource Loading', () => {
        const mockResources = [
            {
                id: 1,
                name: 'Conference Room A',
                description: 'Large conference room with projector',
                capacity: 20,
                is_available: true,
            },
            {
                id: 2,
                name: 'Conference Room B',
                description: 'Small meeting room',
                capacity: 10,
                is_available: true,
            },
            {
                id: 3,
                name: 'Projector',
                description: '',
                capacity: 1,
                is_available: false,
            },
        ];

        it('displays all resources after successful fetch', async () => {
            api.get.mockResolvedValueOnce({ data: mockResources });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room A')).toBeInTheDocument();
                expect(screen.getByText('Conference Room B')).toBeInTheDocument();
                expect(screen.getByText('Projector')).toBeInTheDocument();
            });
        });

        it('displays resource descriptions when available', async () => {
            api.get.mockResolvedValueOnce({ data: mockResources });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText('Large conference room with projector')).toBeInTheDocument();
                expect(screen.getByText('Small meeting room')).toBeInTheDocument();
            });
        });

        it('does not display description element when description is empty', async () => {
            api.get.mockResolvedValueOnce({ data: [mockResources[2]] });
            const { container } = renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText('Projector')).toBeInTheDocument();
            });

            const descriptionElements = container.querySelectorAll('.resource-description');
            expect(descriptionElements).toHaveLength(0);
        });

        it('displays resource capacity', async () => {
            api.get.mockResolvedValueOnce({ data: [mockResources[0]] });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText(/capacity:/i)).toBeInTheDocument();
                expect(screen.getByText(/20/)).toBeInTheDocument();
            });
        });

        it('displays resource availability status', async () => {
            api.get.mockResolvedValueOnce({ data: mockResources });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                const statusElements = screen.getAllByText(/status:/i);
                expect(statusElements.length).toBeGreaterThan(0);
            });
        });

        it('removes loading message after resources are loaded', async () => {
            api.get.mockResolvedValueOnce({ data: mockResources });
            renderWithRouter(<ResourceListPage />);

            expect(screen.getByText(/loading resources/i)).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText(/loading resources/i)).not.toBeInTheDocument();
            });
        });
    });

    describe('Empty Resource List', () => {
        it('displays message when no resources are available', async () => {
            api.get.mockResolvedValueOnce({ data: [] });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText(/no resources available at the moment/i)).toBeInTheDocument();
            });
        });

        it('does not display resources container when list is empty', async () => {
            api.get.mockResolvedValueOnce({ data: [] });
            const { container } = renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText(/no resources available at the moment/i)).toBeInTheDocument();
            });

            expect(container.querySelector('.resources-container')).not.toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('displays error message when fetch fails', async () => {
            const errorMessage = 'Network error occurred';
            api.get.mockRejectedValueOnce({
                response: { data: { message: errorMessage } }
            });

            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });
        });

        it('displays generic error message when no specific message provided', async () => {
            api.get.mockRejectedValueOnce(new Error('Network Error'));

            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText(/failed to fetch resources/i)).toBeInTheDocument();
            });
        });

        it('displays retry button on error', async () => {
            api.get.mockRejectedValueOnce(new Error('Network Error'));

            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
            });
        });

        it('retries fetching resources when retry button is clicked', async () => {
            const user = userEvent.setup();
            api.get.mockRejectedValueOnce(new Error('Network Error'));

            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
            });

            const mockResources = [
                { id: 1, name: 'Test Resource', description: 'Test', capacity: 5, is_available: true }
            ];
            api.get.mockResolvedValueOnce({ data: mockResources });

            const retryButton = screen.getByRole('button', { name: /retry/i });
            await user.click(retryButton);

            await waitFor(() => {
                expect(api.get).toHaveBeenCalledTimes(2);
                expect(screen.getByText('Test Resource')).toBeInTheDocument();
            });
        });

        it('logs error to console', async () => {
            const error = new Error('Test Error');
            api.get.mockRejectedValueOnce(error);

            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith('Error fetching resources:', error);
            });
        });
    });

    describe('Book Now Functionality', () => {
        const mockAvailableResource = {
            id: 1,
            name: 'Conference Room',
            description: 'Test room',
            capacity: 10,
            is_available: true,
        };

        const mockUnavailableResource = {
            id: 2,
            name: 'Broken Projector',
            description: 'Out of service',
            capacity: 1,
            is_available: false,
        };

        it('displays "Book Now" link for available resources', async () => {
            api.get.mockResolvedValueOnce({ data: [mockAvailableResource] });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                const bookLink = screen.getByRole('link', { name: /book conference room/i });
                expect(bookLink).toBeInTheDocument();
                expect(bookLink).toHaveAttribute('href', `/bookings/new/${mockAvailableResource.id}`);
            });
        });

        it('displays disabled button for unavailable resources', async () => {
            api.get.mockResolvedValueOnce({ data: [mockUnavailableResource] });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                const unavailableButton = screen.getByRole('button', { name: /broken projector is unavailable/i });
                expect(unavailableButton).toBeInTheDocument();
                expect(unavailableButton).toBeDisabled();
                expect(unavailableButton).toHaveTextContent(/unavailable/i);
            });
        });

        it('creates correct booking URL for each resource', async () => {
            const resources = [
                { ...mockAvailableResource, id: 1 },
                { ...mockAvailableResource, id: 2, name: 'Room B' },
                { ...mockAvailableResource, id: 3, name: 'Room C' },
            ];
            api.get.mockResolvedValueOnce({ data: resources });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                // Get only the "Book Now" links by their specific aria-labels
                const bookLink1 = screen.getByRole('link', { name: /book conference room/i });
                const bookLink2 = screen.getByRole('link', { name: /book room b/i });
                const bookLink3 = screen.getByRole('link', { name: /book room c/i });

                expect(bookLink1).toHaveAttribute('href', '/bookings/new/1');
                expect(bookLink2).toHaveAttribute('href', '/bookings/new/2');
                expect(bookLink3).toHaveAttribute('href', '/bookings/new/3');
            });
        });

        it('applies correct CSS classes to available and unavailable resources', async () => {
            api.get.mockResolvedValueOnce({ data: [mockAvailableResource, mockUnavailableResource] });
            const { container } = renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText('Conference Room')).toBeInTheDocument();
            });

            const statusElements = container.querySelectorAll('.resource-status');
            expect(statusElements.length).toBe(2);

            const availableStatus = Array.from(statusElements).find(el =>
                el.textContent.includes('Available') && !el.textContent.includes('Unavailable')
            );
            const unavailableStatus = Array.from(statusElements).find(el =>
                el.textContent === 'Status: Unavailable'
            );

            expect(availableStatus).toHaveClass('available');
            expect(unavailableStatus).toHaveClass('unavailable');
        });
    });

    describe('Resource Card Rendering', () => {
        const mockResources = [
            {
                id: 1,
                name: 'Resource 1',
                description: 'Description 1',
                capacity: 5,
                is_available: true,
            },
            {
                id: 2,
                name: 'Resource 2',
                description: 'Description 2',
                capacity: 10,
                is_available: true,
            },
        ];

        it('renders correct number of resource cards', async () => {
            api.get.mockResolvedValueOnce({ data: mockResources });
            const { container } = renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                const cards = container.querySelectorAll('.resource-card');
                expect(cards).toHaveLength(2);
            });
        });

        it('uses resource id as key', async () => {
            api.get.mockResolvedValueOnce({ data: mockResources });
            const { container } = renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                const cards = container.querySelectorAll('.resource-card');
                expect(cards.length).toBeGreaterThan(0);
            });
        });

        it('renders all resource details in each card', async () => {
            api.get.mockResolvedValueOnce({ data: [mockResources[0]] });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText('Resource 1')).toBeInTheDocument();
                expect(screen.getByText('Description 1')).toBeInTheDocument();
                expect(screen.getByText(/capacity:/i)).toBeInTheDocument();
                expect(screen.getByText('5')).toBeInTheDocument();
                expect(screen.getByText(/status:/i)).toBeInTheDocument();
                expect(screen.getByRole('link', { name: /book resource 1/i })).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        const mockResource = {
            id: 1,
            name: 'Test Room',
            description: 'Test Description',
            capacity: 10,
            is_available: true,
        };

        it('has accessible heading', async () => {
            api.get.mockResolvedValueOnce({ data: [mockResource] });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                const heading = screen.getByRole('heading', { name: /available resources/i });
                expect(heading).toBeInTheDocument();
            });
        });

        it('book now link has descriptive aria-label', async () => {
            api.get.mockResolvedValueOnce({ data: [mockResource] });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                const bookLink = screen.getByRole('link', { name: /book test room/i });
                expect(bookLink).toHaveAttribute('aria-label', 'Book Test Room');
            });
        });

        it('unavailable button has descriptive aria-label', async () => {
            const unavailableResource = { ...mockResource, is_available: false };
            api.get.mockResolvedValueOnce({ data: [unavailableResource] });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                const button = screen.getByRole('button', { name: /test room is unavailable/i });
                expect(button).toHaveAttribute('aria-label', 'Test Room is unavailable');
            });
        });
    });

    describe('Edge Cases', () => {
        it('handles resource with zero capacity', async () => {
            const resource = {
                id: 1,
                name: 'Virtual Resource',
                description: 'No physical capacity',
                capacity: 0,
                is_available: true,
            };
            api.get.mockResolvedValueOnce({ data: [resource] });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText('Virtual Resource')).toBeInTheDocument();
                expect(screen.getByText('0')).toBeInTheDocument();
            });
        });

        it('handles resource with very large capacity', async () => {
            const resource = {
                id: 1,
                name: 'Stadium',
                description: 'Large venue',
                capacity: 50000,
                is_available: true,
            };
            api.get.mockResolvedValueOnce({ data: [resource] });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText('Stadium')).toBeInTheDocument();
                expect(screen.getByText('50000')).toBeInTheDocument();
            });
        });

        it('handles resource with special characters in name', async () => {
            const resource = {
                id: 1,
                name: 'Room A & B (1st Floor)',
                description: 'Test',
                capacity: 10,
                is_available: true,
            };
            api.get.mockResolvedValueOnce({ data: [resource] });
            renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                expect(screen.getByText('Room A & B (1st Floor)')).toBeInTheDocument();
            });
        });

        it('handles very long descriptions gracefully', async () => {
            const longDescription = 'This is a very long description that goes on and on. '.repeat(20);
            const resource = {
                id: 1,
                name: 'Test Room',
                description: longDescription,
                capacity: 10,
                is_available: true,
            };
            api.get.mockResolvedValueOnce({ data: [resource] });
            const { container } = renderWithRouter(<ResourceListPage />);

            await waitFor(() => {
                const descriptionElement = container.querySelector('.resource-description');
                expect(descriptionElement).toBeInTheDocument();
                expect(descriptionElement.textContent).toBe(longDescription);
            });
        });
    });
});
