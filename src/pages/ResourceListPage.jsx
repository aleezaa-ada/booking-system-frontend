import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PageLayout from '../components/PageLayout';

function ResourceListPage() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <h3>No Resources Available</h3>
                    <p>There are no resources available at the moment. Please check back later.</p>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="page-header">
                <h1>Available Resources</h1>
                <p>Browse and book available resources</p>
            </div>

            <div className="resources-container">
                {resources.map((resource) => (
                    <div key={resource.id} className="resource-card">
                        <h3>{resource.name}</h3>
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
        </PageLayout>
    );
}

export default ResourceListPage;
