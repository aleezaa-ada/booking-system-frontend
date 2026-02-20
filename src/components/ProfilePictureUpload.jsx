import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import '../assets/components.css';

const CLOUDINARY_UPLOAD_URL = cloudName =>
  `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

function ProfilePictureUpload({ currentPicture, onUpdate, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentPicture || '');
  const fileInputRef = useRef(null);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    setPreviewUrl(currentPicture || '');
  }, [currentPicture]);

  const handleFileSelect = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'profile_pictures'); // Organize in a folder

      const response = await fetch(CLOUDINARY_UPLOAD_URL(cloudName), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      // Update backend with new profile picture
      await api.patch('profile/picture/', {
        profile_picture: data.secure_url,
        cloudinary_public_id: data.public_id,
      });

      setPreviewUrl(data.secure_url);

      // Notify parent component
      if (onUpdate) {
        onUpdate(data.secure_url);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (
      !window.confirm('Are you sure you want to remove your profile picture?')
    ) {
      return;
    }

    setError('');
    setUploading(true);

    try {
      await api.delete('profile/picture/delete/');
      setPreviewUrl('');

      // Notify parent component
      if (onUpdate) {
        onUpdate(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="profile-picture-modal">
      <div className="profile-picture-content">
        <div className="profile-picture-header">
          <h3>Profile Picture</h3>
          <button onClick={onClose} className="close-button" aria-label="Close">
            ×
          </button>
        </div>

        <div className="profile-picture-body">
          {error && <div className="error-message">{error}</div>}

          <div className="profile-picture-preview">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="preview-image" />
            ) : (
              <div className="preview-placeholder">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <p>No profile picture</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />

          <div className="profile-picture-actions">
            <button
              onClick={triggerFileInput}
              disabled={uploading}
              className="upload-button"
            >
              {uploading
                ? 'Uploading...'
                : previewUrl
                  ? 'Change Picture'
                  : 'Upload Picture'}
            </button>

            {previewUrl && (
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="remove-button"
              >
                Remove Picture
              </button>
            )}
          </div>

          <p className="upload-hint">
            Supported formats: JPG, PNG, GIF (max 5MB)
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProfilePictureUpload;
