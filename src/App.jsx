import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import PrivateRoute from './components/PrivateRoute';
import ResourceListPage from "./pages/ResourceListPage.jsx";

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    {/* Protected routes, will redirect to login page if not logged in*/}
                    <Route path="/bookings" element={<PrivateRoute><p>My Bookings Page </p></PrivateRoute>} />
                    <Route path="/resources" element={<PrivateRoute><ResourceListPage /></PrivateRoute>} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}
export default App;