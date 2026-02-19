import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../hooks/useAuth';

function ResourceListPage() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        capacity: 1,
        is_available: true
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/resources/');
            setResources(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch resources');
            console.error('Error fetching resources:', err);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingResource(null);
        setFormData({
            name: '',
            description: '',
            capacity: 1,
            is_available: true
        });
        setFormErrors({});
        setShowModal(true);
    };

    const openEditModal = (resource) => {
        setEditingResource(resource);
        setFormData({
            name: resource.name,
            description: resource.description || '',
            capacity: resource.capacity,
            is_available: resource.is_available
        });
        setFormErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingResource(null);
        setFormData({
            name: '',
            description: '',
            capacity: 1,
            is_available: true
        });
        setFormErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) {
            errors.name = 'Resource name is required';
        }
        if (formData.capacity < 1) {
            errors.capacity = 'Capacity must be at least 1';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            if (editingResource) {
                // Update existing resource
                await api.put(`/resources/${editingResource.id}/`, formData);
                setResources(prev => prev.map(r =>
                    r.id === editingResource.id ? { ...r, ...formData } : r
                ));
                alert('Resource updated successfully!');
            } else {
                // Create new resource
                const response = await api.post('/resources/', formData);
                setResources(prev => [...prev, response.data]);
                alert('Resource created successfully!');
            }
            closeModal();
        } catch (err) {
            console.error('Error saving resource:', err);
            const errorMessage = err.response?.data?.detail ||
                err.response?.data?.message ||
                'Failed to save resource. Please try again.';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (resourceId, resourceName) => {
        if (!window.confirm(`Are you sure you want to delete "${resourceName}"? This action cannot be undone.`)) {
            return;
        }

        setDeletingId(resourceId);
        try {
            await api.delete(`/resources/${resourceId}/`);
            setResources(prev => prev.filter(r => r.id !== resourceId));
            alert('Resource deleted successfully!');
        } catch (err) {
            console.error('Error deleting resource:', err);
            const errorMessage = err.response?.data?.detail ||
                err.response?.data?.message ||
                'Failed to delete resource. Please try again.';
            alert(errorMessage);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <PageLayout>
                <div className="page-header">
                    <h1>Available Resources</h1>
                    <p>Browse and book available resources</p>
                </div>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading resources...</p>
                </div>
            </PageLayout>
        );
    }

    if (error) {
        return (
            <PageLayout>
                <div className="page-header">
                    <h1>Available Resources</h1>
                    <p>Browse and book available resources</p>
                </div>
                <div className="error-state">
                    <h3>Error</h3>
                    <p>{error}</p>
                    <button onClick={fetchResources} className="action-button">Retry</button>
                </div>
            </PageLayout>
        );
    }

    if (resources.length === 0) {
        return (
            <PageLayout>
                <div className="page-header">
                    <h1>Available Resources</h1>
                    <p>Browse and book available resources</p>
                </div>

                {user?.is_staff && (
                    <div className="admin-controls">
                        <button
                            onClick={openAddModal}
                            className="action-button primary"
                            aria-label="Add new resource"
                        >
                            ➕ Add Resource
                        </button>
                    </div>
                )}

                <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <h3>No Resources Available</h3>
                    <p>There are no resources available at the moment. {user?.is_staff ? 'Add your first resource to get started!' : 'Please check back later.'}</p>
                </div>

                {/* Resource Form Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingResource ? 'Edit Resource' : 'Add New Resource'}</h2>
                                <button
                                    onClick={closeModal}
                                    className="modal-close"
                                    aria-label="Close modal"
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="resource-form">
                                <div className="form-group">
                                    <label htmlFor="name">
                                        Resource Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={formErrors.name ? 'error' : ''}
                                        placeholder="e.g., Conference Room A"
                                        maxLength={255}
                                        disabled={submitting}
                                    />
                                    {formErrors.name && (
                                        <span className="error-message">{formErrors.name}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Enter resource description (optional)"
                                        rows={4}
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="capacity">
                                        Capacity <span className="required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="capacity"
                                        name="capacity"
                                        value={formData.capacity}
                                        onChange={handleInputChange}
                                        className={formErrors.capacity ? 'error' : ''}
                                        min="1"
                                        disabled={submitting}
                                    />
                                    {formErrors.capacity && (
                                        <span className="error-message">{formErrors.capacity}</span>
                                    )}
                                </div>

                                <div className="form-group checkbox-group">
                                    <label htmlFor="is_available">
                                        <input
                                            type="checkbox"
                                            id="is_available"
                                            name="is_available"
                                            checked={formData.is_available}
                                            onChange={handleInputChange}
                                            disabled={submitting}
                                        />
                                        <span>Resource is available for booking</span>
                                    </label>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="action-button secondary"
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="action-button primary"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Saving...' : editingResource ? 'Update Resource' : 'Create Resource'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="page-header">
                <h1>Available Resources</h1>
                <p>Browse and book available resources</p>
            </div>

            {user?.is_staff && (
                <div className="admin-controls">
                    <button
                        onClick={openAddModal}
                        className="action-button primary"
                        aria-label="Add new resource"
                    >
                        ➕ Add Resource
                    </button>
                </div>
            )}

            <div className="resources-container">
                {resources.map((resource) => (
                    <div key={resource.id} className="resource-card">
                        <div className="resource-card-header">
                            <h3>{resource.name}</h3>
                            {user?.is_staff && (
                                <div className="resource-admin-actions">
                                    <button
                                        onClick={() => openEditModal(resource)}
                                        className="icon-button edit"
                                        aria-label={`Edit ${resource.name}`}
                                        title="Edit resource"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(resource.id, resource.name)}
                                        className="icon-button delete"
                                        aria-label={`Delete ${resource.name}`}
                                        title="Delete resource"
                                        disabled={deletingId === resource.id}
                                    >
                                        {deletingId === resource.id ? '⏳' : '🗑️'}
                                    </button>
                                </div>
                            )}
                        </div>
                        {resource.description && (
                            <p className="resource-description">{resource.description}</p>
                        )}
                        <div className="resource-details">
                            <p className="resource-capacity">
                                <strong>Capacity:</strong> {resource.capacity}
                            </p>
                            <p className={`resource-status ${resource.is_available ? 'available' : 'unavailable'}`}>
                                <strong>Status:</strong> {resource.is_available ? 'Available' : 'Unavailable'}
                            </p>
                        </div>
                        {resource.is_available ? (
                            <Link
                                to={`/bookings/new/${resource.id}`}
                                className="book-button"
                                aria-label={`Book ${resource.name}`}
                            >
                                Book Now
                            </Link>
                        ) : (
                            <button
                                className="book-button disabled"
                                disabled
                                aria-label={`${resource.name} is unavailable`}
                            >
                                Unavailable
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Resource Form Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingResource ? 'Edit Resource' : 'Add New Resource'}</h2>
                            <button
                                onClick={closeModal}
                                className="modal-close"
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="resource-form">
                            <div className="form-group">
                                <label htmlFor="name">
                                    Resource Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={formErrors.name ? 'error' : ''}
                                    placeholder="e.g., Conference Room A"
                                    maxLength={255}
                                    disabled={submitting}
                                />
                                {formErrors.name && (
                                    <span className="error-message">{formErrors.name}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter resource description (optional)"
                                    rows={4}
                                    disabled={submitting}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="capacity">
                                    Capacity <span className="required">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="capacity"
                                    name="capacity"
                                    value={formData.capacity}
                                    onChange={handleInputChange}
                                    className={formErrors.capacity ? 'error' : ''}
                                    min="1"
                                    disabled={submitting}
                                />
                                {formErrors.capacity && (
                                    <span className="error-message">{formErrors.capacity}</span>
                                )}
                            </div>

                            <div className="form-group checkbox-group">
                                <label htmlFor="is_available">
                                    <input
                                        type="checkbox"
                                        id="is_available"
                                        name="is_available"
                                        checked={formData.is_available}
                                        onChange={handleInputChange}
                                        disabled={submitting}
                                    />
                                    <span>Resource is available for booking</span>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="action-button secondary"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="action-button primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : editingResource ? 'Update Resource' : 'Create Resource'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}

export default ResourceListPage;
