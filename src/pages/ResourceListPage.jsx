import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

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
            <div className="resource-list-page">
                <h2>Available Resources</h2>
                <p className="loading-message">Loading resources...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="resource-list-page">
                <h2>Available Resources</h2>
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={fetchResources}>Retry</button>
                </div>
            </div>
        );
    }

    if (resources.length === 0) {
        return (
            <div className="resource-list-page">
                <h2>Available Resources</h2>
                <p className="no-resources-message">No resources available at the moment.</p>
            </div>
        );
    }

    return (
        <div className="resource-list-page">
            <h2>Available Resources</h2>
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
        </div>
    );
}

export default ResourceListPage;
