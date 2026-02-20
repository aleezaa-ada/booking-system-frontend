import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePictureUpload from '../ProfilePictureUpload';
import api from '../../services/api';

// Mock the api module
jest.mock('../../services/api');

// Mock fetch
global.fetch = jest.fn();

describe('ProfilePictureUpload', () => {
  const mockOnUpdate = jest.fn();
  const mockOnClose = jest.fn();
  const mockCurrentPicture = 'https://example.com/current-picture.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    global.confirm = jest.fn(() => true);
  });

  it('renders without crashing', () => {
    render(
      <ProfilePictureUpload
        currentPicture={null}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Profile Picture')).toBeInTheDocument();
  });

  it('displays current picture when provided', () => {
    render(
      <ProfilePictureUpload
        currentPicture={mockCurrentPicture}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const image = screen.getByAltText('Profile');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockCurrentPicture);
  });

  it('displays placeholder when no picture is provided', () => {
    render(
      <ProfilePictureUpload
        currentPicture={null}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('No profile picture')).toBeInTheDocument();
    expect(screen.getByText('Upload Picture')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ProfilePictureUpload
        currentPicture={null}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows error message for invalid file type', async () => {
    render(
      <ProfilePictureUpload
        currentPicture={null}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'test.txt', {
      type: 'text/plain',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(
        screen.getByText('Please select an image file')
      ).toBeInTheDocument();
    });
  });

  it('shows error message for file size exceeding limit', async () => {
    render(
      <ProfilePictureUpload
        currentPicture={null}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const fileInput = document.querySelector('input[type="file"]');
    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(
        screen.getByText('Image must be less than 5MB')
      ).toBeInTheDocument();
    });
  });

  it('handles successful image upload', async () => {
    const mockCloudinaryResponse = {
      secure_url: 'https://cloudinary.com/new-picture.jpg',
      public_id: 'profile_pictures/abc123',
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCloudinaryResponse,
    });

    api.patch.mockResolvedValueOnce({ data: {} });

    render(
      <ProfilePictureUpload
        currentPicture={null}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const uploadButton = screen.getByText('Upload Picture');
    fireEvent.click(uploadButton);

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'test.jpg', {
      type: 'image/jpeg',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('profile/picture/', {
        profile_picture: mockCloudinaryResponse.secure_url,
        cloudinary_public_id: mockCloudinaryResponse.public_id,
      });
    });

    expect(mockOnUpdate).toHaveBeenCalledWith(
      mockCloudinaryResponse.secure_url
    );
  });

  it('handles upload failure', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
    });

    render(
      <ProfilePictureUpload
        currentPicture={null}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const uploadButton = screen.getByText('Upload Picture');
    fireEvent.click(uploadButton);

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'test.jpg', {
      type: 'image/jpeg',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  it('handles picture removal', async () => {
    api.delete.mockResolvedValueOnce({ data: {} });

    render(
      <ProfilePictureUpload
        currentPicture={mockCurrentPicture}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const removeButton = screen.getByText('Remove Picture');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('profile/picture/delete/');
    });

    expect(mockOnUpdate).toHaveBeenCalledWith(null);
  });

  it('does not remove picture when user cancels confirmation', async () => {
    global.confirm = jest.fn(() => false);

    render(
      <ProfilePictureUpload
        currentPicture={mockCurrentPicture}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const removeButton = screen.getByText('Remove Picture');
    fireEvent.click(removeButton);

    expect(api.delete).not.toHaveBeenCalled();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('disables buttons when uploading', async () => {
    global.fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(
      <ProfilePictureUpload
        currentPicture={null}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const uploadButton = screen.getByText('Upload Picture');
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'test.jpg', {
      type: 'image/jpeg',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });
  });

  it('shows "Change Picture" button when picture exists', () => {
    render(
      <ProfilePictureUpload
        currentPicture={mockCurrentPicture}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Change Picture')).toBeInTheDocument();
    expect(screen.getByText('Remove Picture')).toBeInTheDocument();
  });

  it('displays supported formats hint', () => {
    render(
      <ProfilePictureUpload
        currentPicture={null}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText('Supported formats: JPG, PNG, GIF (max 5MB)')
    ).toBeInTheDocument();
  });
});
