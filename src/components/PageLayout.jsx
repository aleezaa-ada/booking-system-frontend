import React from 'react';
import Nav from './Nav';

function PageLayout({ children, className = '' }) {
    return (
        <div className="page-layout">
            <Nav />
            <main className={`page-content ${className}`}>
                {children}
            </main>
        </div>
    );
}

export default PageLayout;
