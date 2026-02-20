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
  },
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
const renderWithRouter = ui => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('ResourceListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Initial State', () => {
    it('renders the page heading', () => {
      api.get.mockResolvedValueOnce({ data: [] });
      renderWithRouter(<ResourceListPage />);
      expect(
        screen.getByRole('heading', { name: /available resources/i })
      ).toBeInTheDocument();
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
        availability_status: 'available',
      },
      {
        id: 2,
        name: 'Conference Room B',
        description: 'Small meeting room',
        capacity: 10,
        is_available: true,
        availability_status: 'available',
      },
      {
        id: 3,
        name: 'Projector',
        description: '',
        capacity: 1,
        is_available: false,
        availability_status: 'unavailable',
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
        expect(
          screen.getByText('Large conference room with projector')
        ).toBeInTheDocument();
        expect(screen.getByText('Small meeting room')).toBeInTheDocument();
      });
    });

    it('does not display description element when description is empty', async () => {
      api.get.mockResolvedValueOnce({ data: [mockResources[2]] });
      const { container } = renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Projector')).toBeInTheDocument();
      });

      const descriptionElements = container.querySelectorAll(
        '.resource-description'
      );
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
        expect(
          screen.queryByText(/loading resources/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty Resource List', () => {
    it('displays message when no resources are available', async () => {
      api.get.mockResolvedValueOnce({ data: [] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/no resources available at the moment/i)
        ).toBeInTheDocument();
      });
    });

    it('does not display resources container when list is empty', async () => {
      api.get.mockResolvedValueOnce({ data: [] });
      const { container } = renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/no resources available at the moment/i)
        ).toBeInTheDocument();
      });

      expect(
        container.querySelector('.resources-container')
      ).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when fetch fails', async () => {
      const errorMessage = 'Network error occurred';
      api.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } },
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
        expect(
          screen.getByText(/failed to fetch resources/i)
        ).toBeInTheDocument();
      });
    });

    it('displays retry button on error', async () => {
      api.get.mockRejectedValueOnce(new Error('Network Error'));

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument();
      });
    });

    it('retries fetching resources when retry button is clicked', async () => {
      const user = userEvent.setup();
      api.get.mockRejectedValueOnce(new Error('Network Error'));

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument();
      });

      const mockResources = [
        {
          id: 1,
          name: 'Test Resource',
          description: 'Test',
          capacity: 5,
          is_available: true,
          availability_status: 'available',
        },
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
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching resources:',
          error
        );
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
      availability_status: 'available',
    };

    const mockUnavailableResource = {
      id: 2,
      name: 'Broken Projector',
      description: 'Out of service',
      capacity: 1,
      is_available: false,
      availability_status: 'unavailable',
    };

    const mockPendingResource = {
      id: 3,
      name: 'Meeting Room',
      description: 'Has pending bookings',
      capacity: 5,
      is_available: true,
      availability_status: 'pending',
    };

    it('displays "Book Now" link for available resources', async () => {
      api.get.mockResolvedValueOnce({ data: [mockAvailableResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        const bookLink = screen.getByRole('link', {
          name: /book conference room/i,
        });
        expect(bookLink).toBeInTheDocument();
        expect(bookLink).toHaveAttribute(
          'href',
          `/bookings/new/${mockAvailableResource.id}`
        );
      });
    });

    it('displays "Book Now (Pending)" link for resources with pending status', async () => {
      api.get.mockResolvedValueOnce({ data: [mockPendingResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        const bookLink = screen.getByRole('link', {
          name: /book meeting room \(pending bookings exist\)/i,
        });
        expect(bookLink).toBeInTheDocument();
        expect(bookLink).toHaveAttribute(
          'href',
          `/bookings/new/${mockPendingResource.id}`
        );
        expect(bookLink).toHaveTextContent(/book now \(pending\)/i);
      });
    });

    it('displays disabled button for unavailable resources', async () => {
      api.get.mockResolvedValueOnce({ data: [mockUnavailableResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        const unavailableButton = screen.getByRole('button', {
          name: /broken projector is unavailable/i,
        });
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
        const bookLink1 = screen.getByRole('link', {
          name: /book conference room/i,
        });
        const bookLink2 = screen.getByRole('link', { name: /book room b/i });
        const bookLink3 = screen.getByRole('link', { name: /book room c/i });

        expect(bookLink1).toHaveAttribute('href', '/bookings/new/1');
        expect(bookLink2).toHaveAttribute('href', '/bookings/new/2');
        expect(bookLink3).toHaveAttribute('href', '/bookings/new/3');
      });
    });

    it('applies correct CSS classes to available, pending, and unavailable resources', async () => {
      api.get.mockResolvedValueOnce({
        data: [
          mockAvailableResource,
          mockPendingResource,
          mockUnavailableResource,
        ],
      });
      const { container } = renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Conference Room')).toBeInTheDocument();
      });

      const statusElements = container.querySelectorAll('.resource-status');
      expect(statusElements.length).toBe(3);

      const availableStatus = Array.from(statusElements).find(
        el => el.textContent === 'Status: Available'
      );
      const pendingStatus = Array.from(statusElements).find(
        el => el.textContent === 'Status: Could be Available'
      );
      const unavailableStatus = Array.from(statusElements).find(
        el => el.textContent === 'Status: Unavailable'
      );

      expect(availableStatus).toHaveClass('available');
      expect(pendingStatus).toHaveClass('pending');
      expect(unavailableStatus).toHaveClass('unavailable');
    });

    it('displays correct status text for each availability_status', async () => {
      api.get.mockResolvedValueOnce({
        data: [
          mockAvailableResource,
          mockPendingResource,
          mockUnavailableResource,
        ],
      });
      const { container } = renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Conference Room')).toBeInTheDocument();
      });

      const statusElements = container.querySelectorAll('.resource-status');
      expect(statusElements.length).toBe(3);

      const availableText = Array.from(statusElements).find(
        el =>
          el.textContent.includes('Available') &&
          !el.textContent.includes('Unavailable')
      );
      const pendingText = Array.from(statusElements).find(el =>
        el.textContent.includes('Could be Available')
      );
      const unavailableText = Array.from(statusElements).find(el =>
        el.textContent.includes('Unavailable')
      );

      expect(availableText).toBeInTheDocument();
      expect(pendingText).toBeInTheDocument();
      expect(unavailableText).toBeInTheDocument();
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
        availability_status: 'available',
      },
      {
        id: 2,
        name: 'Resource 2',
        description: 'Description 2',
        capacity: 10,
        is_available: true,
        availability_status: 'available',
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
        expect(
          screen.getByRole('link', { name: /book resource 1/i })
        ).toBeInTheDocument();
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
      availability_status: 'available',
    };

    it('has accessible heading', async () => {
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', {
          name: /available resources/i,
        });
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
      const unavailableResource = {
        ...mockResource,
        is_available: false,
        availability_status: 'unavailable',
      };
      api.get.mockResolvedValueOnce({ data: [unavailableResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /test room is unavailable/i,
        });
        expect(button).toHaveAttribute(
          'aria-label',
          'Test Room is unavailable'
        );
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
        availability_status: 'available',
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
        availability_status: 'available',
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
        availability_status: 'available',
      };
      api.get.mockResolvedValueOnce({ data: [resource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Room A & B (1st Floor)')).toBeInTheDocument();
      });
    });

    it('handles very long descriptions gracefully', async () => {
      const longDescription =
        'This is a very long description that goes on and on. '.repeat(20);
      const resource = {
        id: 1,
        name: 'Test Room',
        description: longDescription,
        capacity: 10,
        is_available: true,
        availability_status: 'available',
      };
      api.get.mockResolvedValueOnce({ data: [resource] });
      const { container } = renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        const descriptionElement = container.querySelector(
          '.resource-description'
        );
        expect(descriptionElement).toBeInTheDocument();
        expect(descriptionElement.textContent).toBe(longDescription);
      });
    });
  });

  describe('Admin - Add Resource Functionality', () => {
    beforeEach(() => {
      // Mock useAuth to return admin user
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
        },
        logout: jest.fn(),
        loading: false,
      });
      global.alert = jest.fn();
    });

    const mockResource = {
      id: 1,
      name: 'Test Room',
      description: 'Test',
      capacity: 10,
      is_available: true,
      availability_status: 'available',
    };

    it('displays "Add Resource" button for admin users', async () => {
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /add new resource/i })
        ).toBeInTheDocument();
      });
    });

    it('opens modal when "Add Resource" button is clicked', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /add new resource/i })
        ).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', {
        name: /add new resource/i,
      });
      await user.click(addButton);

      expect(
        screen.getByRole('heading', { name: /add new resource/i })
      ).toBeInTheDocument();
    });

    it('displays empty form fields in add modal', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /add new resource/i })
        ).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', {
        name: /add new resource/i,
      });
      await user.click(addButton);

      expect(screen.getByLabelText(/resource name/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/capacity/i)).toHaveValue(1);
      expect(screen.getByLabelText(/resource is available/i)).toBeChecked();
    });

    it('creates new resource successfully', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({ data: [] });
      const newResource = {
        id: 2,
        name: 'New Conference Room',
        description: 'A brand new room',
        capacity: 15,
        is_available: true,
      };
      api.post.mockResolvedValueOnce({ data: newResource });

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /add new resource/i })
        ).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', {
        name: /add new resource/i,
      });
      await user.click(addButton);

      // Fill in form
      await user.type(
        screen.getByLabelText(/resource name/i),
        'New Conference Room'
      );
      await user.type(
        screen.getByLabelText(/description/i),
        'A brand new room'
      );
      await user.clear(screen.getByLabelText(/capacity/i));
      await user.type(screen.getByLabelText(/capacity/i), '15');

      // Submit form
      const submitButton = screen.getByRole('button', {
        name: /create resource/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/resources/', {
          name: 'New Conference Room',
          description: 'A brand new room',
          capacity: '15',
          is_available: true,
        });
        expect(global.alert).toHaveBeenCalledWith(
          'Resource created successfully!'
        );
      });
    });

    it('validates required fields when creating resource', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({ data: [] });

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /add new resource/i })
        ).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', {
        name: /add new resource/i,
      });
      await user.click(addButton);

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', {
        name: /create resource/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/resource name is required/i)
        ).toBeInTheDocument();
      });

      expect(api.post).not.toHaveBeenCalled();
    });

    it('closes modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({ data: [] });

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /add new resource/i })
        ).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', {
        name: /add new resource/i,
      });
      await user.click(addButton);

      expect(
        screen.getByRole('heading', { name: /add new resource/i })
      ).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: /add new resource/i })
        ).not.toBeInTheDocument();
      });
    });

    it('closes modal when close X button is clicked', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({ data: [] });

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /add new resource/i })
        ).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', {
        name: /add new resource/i,
      });
      await user.click(addButton);

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: /add new resource/i })
        ).not.toBeInTheDocument();
      });
    });

    it('displays error message when resource creation fails', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({ data: [] });
      api.post.mockRejectedValueOnce({
        response: { data: { detail: 'Resource name already exists' } },
      });

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /add new resource/i })
        ).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', {
        name: /add new resource/i,
      });
      await user.click(addButton);

      await user.type(
        screen.getByLabelText(/resource name/i),
        'Duplicate Room'
      );
      const submitButton = screen.getByRole('button', {
        name: /create resource/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Resource name already exists'
        );
      });
    });
  });

  describe('Admin - Edit Resource Functionality', () => {
    beforeEach(() => {
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
        },
        logout: jest.fn(),
        loading: false,
      });
      global.alert = jest.fn();
    });

    const mockResource = {
      id: 1,
      name: 'Test Room',
      description: 'Original description',
      capacity: 10,
      is_available: true,
      availability_status: 'available',
    };

    it('displays edit button for each resource for admin users', async () => {
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /edit test room/i })
        ).toBeInTheDocument();
      });
    });

    it('opens edit modal with pre-filled data', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Room')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', {
        name: /edit test room/i,
      });
      await user.click(editButton);

      expect(
        screen.getByRole('heading', { name: /edit resource/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/resource name/i)).toHaveValue('Test Room');
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'Original description'
      );
      expect(screen.getByLabelText(/capacity/i)).toHaveValue(10);
      expect(screen.getByLabelText(/resource is available/i)).toBeChecked();
    });

    it('updates resource successfully', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      api.put.mockResolvedValueOnce({
        data: { ...mockResource, name: 'Updated Room' },
      });

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Room')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', {
        name: /edit test room/i,
      });
      await user.click(editButton);

      const nameInput = screen.getByLabelText(/resource name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Room');

      const submitButton = screen.getByRole('button', {
        name: /update resource/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/resources/1/',
          expect.objectContaining({
            name: 'Updated Room',
          })
        );
        expect(global.alert).toHaveBeenCalledWith(
          'Resource updated successfully!'
        );
      });
    });

    it('displays error message when resource update fails', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      api.put.mockRejectedValueOnce({
        response: { data: { detail: 'Update failed' } },
      });

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Room')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', {
        name: /edit test room/i,
      });
      await user.click(editButton);

      const submitButton = screen.getByRole('button', {
        name: /update resource/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Update failed');
      });
    });
  });

  describe('Admin - Delete Resource Functionality', () => {
    beforeEach(() => {
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
        },
        logout: jest.fn(),
        loading: false,
      });
      global.alert = jest.fn();
      global.confirm = jest.fn();
    });

    const mockResource = {
      id: 1,
      name: 'Test Room',
      description: 'Test',
      capacity: 10,
      is_available: true,
      availability_status: 'available',
    };

    it('displays delete button for each resource for admin users', async () => {
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /delete test room/i })
        ).toBeInTheDocument();
      });
    });

    it('shows confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(false);
      api.get.mockResolvedValueOnce({ data: [mockResource] });

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Room')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', {
        name: /delete test room/i,
      });
      await user.click(deleteButton);

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Test Room"? This action cannot be undone.'
      );
    });

    it('does not delete when user cancels confirmation', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(false);
      api.get.mockResolvedValueOnce({ data: [mockResource] });

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Room')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', {
        name: /delete test room/i,
      });
      await user.click(deleteButton);

      expect(api.delete).not.toHaveBeenCalled();
    });

    it('deletes resource successfully', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      api.delete.mockResolvedValueOnce({});

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Room')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', {
        name: /delete test room/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/resources/1/');
        expect(global.alert).toHaveBeenCalledWith(
          'Resource deleted successfully!'
        );
        expect(screen.queryByText('Test Room')).not.toBeInTheDocument();
      });
    });

    it('displays error message when delete fails', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      api.delete.mockRejectedValueOnce({
        response: {
          data: { detail: 'Cannot delete resource with active bookings' },
        },
      });

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Room')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', {
        name: /delete test room/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Cannot delete resource with active bookings'
        );
      });
    });

    it('disables delete button while deletion is in progress', async () => {
      const user = userEvent.setup();
      global.confirm.mockReturnValue(true);
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      api.delete.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Room')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', {
        name: /delete test room/i,
      });
      await user.click(deleteButton);

      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Regular User - No Admin Controls', () => {
    beforeEach(() => {
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({
        user: {
          id: 2,
          username: 'regularuser',
          email: 'user@example.com',
          is_staff: false,
        },
        logout: jest.fn(),
        loading: false,
      });
    });

    const mockResource = {
      id: 1,
      name: 'Test Room',
      description: 'Test',
      capacity: 10,
      is_available: true,
      availability_status: 'available',
    };

    it('does not display "Add Resource" button for regular users', async () => {
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Room')).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('button', { name: /add new resource/i })
      ).not.toBeInTheDocument();
    });

    it('does not display edit/delete buttons for regular users', async () => {
      api.get.mockResolvedValueOnce({ data: [mockResource] });
      renderWithRouter(<ResourceListPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Room')).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('button', { name: /edit test room/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /delete test room/i })
      ).not.toBeInTheDocument();
    });
  });
});
