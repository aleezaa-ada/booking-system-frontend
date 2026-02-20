# Booking System Frontend

A modern, responsive React application for managing resource bookings with real-time availability, authentication, and an intuitive user interface.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Local Development](#local-development)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
  - [Running the Development Server](#running-the-development-server)
  - [Building for Production](#building-for-production)
  - [Preview Production Build](#preview-production-build)
- [Features](#features)
  - [User Authentication](#user-authentication)
  - [Resource Management](#resource-management)
  - [Booking System](#booking-system)
  - [Profile Management](#profile-management)
- [Project Structure](#project-structure)
- [Authentication Flow](#authentication-flow)
- [Components](#components)
- [Routing](#routing)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Styling](#styling)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Deployment](#deployment)
  - [Render Deployment](#render-deployment)
  - [Environment Configuration](#environment-configuration)
  - [Build Optimization](#build-optimization)
- [Technical Decisions](#technical-decisions)
- [Browser Support](#browser-support)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The Booking System Frontend is a production-ready React application built with modern web technologies. It provides an intuitive interface for users to browse resources, manage bookings, and handle their profiles with a seamless user experience.

This frontend connects to the [Booking System Backend API](https://github.com/aleezaa-ada/booking-system-backend) built with Django REST Framework.

**Key Features:**
- Secure authentication with token management
- Interactive booking form with date/time picker
- Responsive, modern UI/UX
- Profile picture upload with Cloudinary
- Real-time resource availability
- Fast development with Vite and HMR
- Comprehensive test coverage
- Production-ready build optimization

**Backend Integration:**
- Token-based authentication (Django REST Framework)
- RESTful API communication via Axios
- Real-time data synchronization
- CORS-enabled cross-origin requests

---

## Architecture

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 19.2.0 |
| Build Tool | Vite | 7.3.1 |
| Routing | React Router DOM | 7.13.0 |
| HTTP Client | Axios | 1.13.5 |
| Date Picker | React DatePicker | 9.1.0 |
| Testing | Jest | 30.2.0 |
| Testing Library | React Testing Library | 16.3.2 |
| Linting | ESLint | 9.39.1 |
| Formatting | Prettier | 3.8.1 |
| Compiler | React Compiler | 1.0.0 |
| Git Hooks | Husky | 9.1.7 |

### Core Technologies

**React 19** - Latest React with concurrent features and automatic batching  
**Vite** - Next-generation frontend tooling with lightning-fast HMR  
**React Router v7** - Client-side routing with protected routes  
**Axios** - Promise-based HTTP client with interceptors  
**React DatePicker** - Flexible and accessible date/time selection  
**Jest + RTL** - Comprehensive testing framework  

### Build Pipeline

```
Source Code (JSX/JS)
     ↓
React Compiler (Optimization)
     ↓
Vite Build (Bundling + Minification)
     ↓
Static Assets (dist/)
     ↓
Deployment (Render/CDN)
```

---

## Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher (or yarn/pnpm)
- **Backend API**: Running instance of the booking system backend
  - See [Backend Setup Instructions](https://github.com/aleezaa-ada/booking-system-backend?tab=readme-ov-file#local-development)
  - Backend must be running at `http://localhost:8000` (default)
- **Git**: For version control
---

## Setup Instructions

### Local Development

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd booking-system/booking-system-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the project root:
   ```env
   # Backend API URL (must match backend server)
   VITE_API_URL=http://localhost:8000/api/
   VITE_CLOUDINARY_CLOUD_NAME=ddb318rpg
   VITE_CLOUDINARY_UPLOAD_PRESET=pfp-upload-booking-system
   ```
   
   **Note:** The backend API runs on `http://localhost:8000` by default. See the [Backend README](https://github.com/aleezaa-ada/booking-system-backend) for backend setup.


4. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

5. **Verify Backend Connection**
   
   Ensure the backend API is running at the configured `VITE_API_URL`

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API base URL | Yes | - |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary Name for profile pictures | Yes | - |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary Preset for profile pictures | Yes | - |

**Note:** Vite requires environment variables to be prefixed with `VITE_` to be exposed to the client.

**Example Configurations:**

**Development:**
```env
VITE_API_URL=http://localhost:8000/api/
VITE_CLOUDINARY_CLOUD_NAME=ddb318rpg
VITE_CLOUDINARY_UPLOAD_PRESET=pfp-upload-booking-system
```

**Production:**
```env
VITE_API_URL=https://your-backend.onrender.com/api/
VITE_CLOUDINARY_CLOUD_NAME=ddb318rpg
VITE_CLOUDINARY_UPLOAD_PRESET=pfp-upload-booking-system
```

---

## Usage

### Running the Development Server

```bash
# Start development server with hot reload
npm run dev

# The app will be available at http://localhost:5173
```

**Features in Development Mode:**
- ⚡ Instant HMR (Hot Module Replacement)
- 🔍 React DevTools support
- 📊 Detailed error messages
- 🚀 Fast refresh

### Building for Production

```bash
# Create optimized production build
npm run build

# Output directory: dist/
```

**Build Process:**
1. Compiles JSX/JS with React Compiler
2. Bundles and minifies code
3. Optimizes assets (images, CSS)
4. Generates source maps
5. Creates static files in `dist/`

### Preview Production Build

```bash
# Preview production build locally
npm run preview

# Available at http://localhost:4173
```

---

## Features

### User Authentication

- **Registration**: Create new account with email validation
- **Login**: Secure token-based authentication
- **Logout**: Clear session and redirect
- **Persistent Login**: Token stored in localStorage
- **Protected Routes**: Automatic redirect for unauthenticated users
- **Profile Management**: Update user information

### Resource Management

- **Browse Resources**: View all available resources
- **Real-time Availability**: Live status updates
- **Resource Details**: Name, description, capacity
- **Availability Indicators**: Visual status (available/pending/unavailable)
- **Search & Filter**: Find resources quickly

### Booking System

- **Create Bookings**: Interactive form with validation
- **Edit Bookings**: Modify existing reservations
- **View Bookings**: See all your bookings in one place
- **Cancel Bookings**: Remove unwanted reservations
- **Date/Time Picker**: Easy-to-use datetime selection
- **Status Management**: Track booking status (pending/confirmed/cancelled/rejected)
- **Conflict Detection**: Prevent overlapping bookings
- **Notes**: Add custom notes to bookings

### Profile Management

- **Profile Picture Upload**: Cloudinary integration
- **User Information Display**: Username, email
- **Profile Dropdown**: Quick access to profile actions
- **Avatar Placeholder**: Default avatar when no picture

---

## Project Structure

```
booking-system-frontend/
├── public/                      # Static assets
│   ├── bookings.svg            # App icon
│   └── styles/                 # Public stylesheets
│
├── src/                        # Source code
│   ├── App.jsx                 # Root component with routing
│   ├── main.jsx                # Application entry point
│   │
│   ├── assets/                 # CSS and static resources
│   │   ├── components.css      # Component-specific styles
│   │   └── pages.css           # Page-specific styles
│   │
│   ├── components/             # Reusable components
│   │   ├── BookingForm.jsx     # Create/edit booking form
│   │   ├── Nav.jsx             # Navigation bar
│   │   ├── PageLayout.jsx      # Layout wrapper
│   │   ├── PrivateRoute.jsx    # Protected route wrapper
│   │   ├── ProfilePictureUpload.jsx  # Profile upload modal
│   │   └── __tests__/          # Component tests
│   │
│   ├── context/                # React Context
│   │   ├── AuthContext.js      # Auth context definition
│   │   └── AuthProvider.jsx    # Auth state provider
│   │
│   ├── hooks/                  # Custom React hooks
│   │   └── useAuth.js          # Authentication hook
│   │
│   ├── pages/                  # Page components
│   │   ├── HomePage.jsx        # Landing page
│   │   ├── LoginPage.jsx       # Login form
│   │   ├── RegisterPage.jsx    # Registration form
│   │   ├── ResourceListPage.jsx # Browse resources
│   │   ├── BookingsPage.jsx    # User's bookings list
│   │   └── __tests__/          # Page tests
│   │
│   └── services/               # API and external services
│       ├── api.js              # Axios instance with interceptors
│       └── __mocks__/          # API mocks for testing
│
├── __mocks__/                  # Global mocks
│   └── fileMock.js             # File mock for Jest
│
├── coverage/                   # Test coverage reports
│
├── .env                        # Environment variables (gitignored)
├── .eslintrc.js               # ESLint configuration
├── babel.config.cjs           # Babel configuration
├── jest.config.cjs            # Jest configuration
├── jest.setup.js              # Jest setup file
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

### Directory Conventions

- **components/**: Reusable UI components
- **pages/**: Route-level components (one per route)
- **context/**: React Context providers for global state
- **hooks/**: Custom React hooks for reusable logic
- **services/**: External API calls and integrations
- **assets/**: CSS, images, and static files
- **__tests__/**: Co-located test files

---

## Authentication Flow

### Registration Flow
```
User fills registration form
         ↓
POST /api/auth/users/
         ↓
Account created
         ↓
Redirect to login
```

### Login Flow
```
User enters credentials
         ↓
POST /api/auth/token/login/
         ↓
Receive auth token
         ↓
Store token in localStorage
         ↓
GET /api/auth/users/me/
         ↓
Load user data into state
         ↓
Redirect to dashboard
```

### Protected Route Flow
```
User navigates to protected route
         ↓
PrivateRoute checks auth state
         ↓
If authenticated → Render component
If not → Redirect to /login
```

### Token Management
- **Storage**: localStorage (`token` key)
- **Injection**: Axios interceptor adds token to all requests
- **Format**: `Authorization: Token <token>`
- **Persistence**: Token persists across browser sessions
- **Expiry**: Handled by backend; frontend removes on 401

---

## Components

### Core Components

#### **Nav.jsx**
Navigation bar with user profile dropdown

**Features:**
- Responsive design
- Profile picture display
- Dropdown menu with actions
- Logout functionality
- Profile picture upload modal

**Usage:**
```jsx
<Nav />
```

#### **PageLayout.jsx**
Layout wrapper for consistent page structure

**Features:**
- Navigation integration
- Main content area
- Footer (optional)
- Consistent spacing

**Usage:**
```jsx
<PageLayout>
  <YourContent />
</PageLayout>
```

#### **BookingForm.jsx**
Form for creating and editing bookings

**Props:**
- `onSuccess`: Callback after successful submission

**Features:**
- Create or edit mode
- Date/time pickers
- Resource selection
- Status management
- Form validation
- Error handling

**Usage:**
```jsx
<BookingForm onSuccess={handleSuccess} />
```

#### **PrivateRoute.jsx**
Wrapper for protected routes

**Props:**
- `children`: Component to render if authenticated

**Features:**
- Authentication check
- Automatic redirect
- Loading state

**Usage:**
```jsx
<PrivateRoute>
  <BookingsPage />
</PrivateRoute>
```

#### **ProfilePictureUpload.jsx**
Modal for uploading profile pictures

**Props:**
- `onClose`: Close modal callback
- `onUpdate`: Update callback with new URL

**Features:**
- Cloudinary integration
- Image preview
- Upload progress
- Error handling

---

## Routing

### Route Configuration

| Path | Component | Protected | Description |
|------|-----------|-----------|-------------|
| `/` | HomePage | No | Landing page |
| `/login` | LoginPage | No | User login |
| `/register` | RegisterPage | No | User registration |
| `/resources` | ResourceListPage | Yes | Browse resources |
| `/bookings` | BookingsPage | Yes | User's bookings |
| `/bookings/new/:resourceId` | BookingForm | Yes | Create new booking |
| `/bookings/edit/:bookingId` | BookingForm | Yes | Edit existing booking |

### Navigation Examples

**Programmatic Navigation:**
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/bookings');
```

**Link Navigation:**
```jsx
import { Link } from 'react-router-dom';

<Link to="/resources">Browse Resources</Link>
```

---

## State Management

### Context-Based State

The application uses React Context for global state management.

#### **AuthContext**

Manages authentication state and user information.

**Provided Values:**
- `user`: Current user object (or null)
- `token`: Authentication token
- `loading`: Loading state
- `login(username, password)`: Login function
- `register(username, email, password)`: Registration function
- `logout()`: Logout function
- `refreshUser()`: Refresh user data

**Usage:**
```javascript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Local State

Components use `useState` and `useEffect` for local state management:

```javascript
const [bookings, setBookings] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

---

## API Integration

### Backend API Reference

This frontend application connects to the **Booking System Backend API**.

**Backend Details:**
- **Documentation:** See [Backend README](https://github.com/aleezaa-ada/booking-system-backend)
- **Base URL:** `http://localhost:8000/api/` (development)
- **Authentication:** Token-based (Djoser)
- **API Framework:** Django REST Framework

**Available Endpoints:**
- Authentication: `/api/auth/*` (register, login, logout, user info)
- Resources: `/api/resources/` (list, create, update, delete)
- Bookings: `/api/bookings/` (list, create, update, delete)
- Profile: `/api/profile/picture/` (upload, delete profile picture)

For complete API documentation, see [Backend API Endpoints](../booking-system-backend/README.md#api-endpoints).

### Axios Instance

The application uses a configured Axios instance with interceptors.

**File:** `src/services/api.js`

**Configuration:**
```javascript
import axios from 'axios';

// Base URL from environment variable (e.g., http://localhost:8000/api/)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds auth token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});
```

**Token Format:** `Token <token>` (as required by Django REST Framework Token Authentication)

### API Usage Examples

**GET Request:**
```javascript
const response = await api.get('/resources/');
const resources = response.data;
```

**POST Request:**
```javascript
const response = await api.post('/bookings/', {
  resource: 1,
  start_time: '2026-02-21T14:00:00Z',
  end_time: '2026-02-21T16:00:00Z',
  notes: 'Team meeting'
});
```

**PUT/PATCH Request:**
```javascript
const response = await api.patch(`/bookings/${id}/`, {
  status: 'confirmed'
});
```

**DELETE Request:**
```javascript
await api.delete(`/bookings/${id}/`);
```

### Error Handling

```javascript
try {
  const response = await api.get('/bookings/');
  setBookings(response.data);
} catch (error) {
  if (error.response) {
    // Server responded with error
    setError(error.response.data.message);
  } else if (error.request) {
    // Request made but no response
    setError('Network error. Please try again.');
  } else {
    // Other errors
    setError('An unexpected error occurred.');
  }
}
```

### Backend API Endpoints Used

The frontend integrates with the following backend API endpoints:

#### Authentication Endpoints (Djoser)
- `POST /api/auth/users/` - Register new user
- `POST /api/auth/token/login/` - Login and get token
- `POST /api/auth/token/logout/` - Logout
- `GET /api/auth/users/me/` - Get current user

#### Resource Endpoints
- `GET /api/resources/` - List all resources
- `GET /api/resources/{id}/` - Get resource details

#### Booking Endpoints
- `GET /api/bookings/` - List user's bookings
- `POST /api/bookings/` - Create new booking
- `GET /api/bookings/{id}/` - Get booking details
- `PATCH /api/bookings/{id}/` - Update booking
- `DELETE /api/bookings/{id}/` - Delete booking

#### Profile Endpoints
- `PUT /api/profile/picture/` - Update profile picture
- `DELETE /api/profile/picture/delete/` - Delete profile picture

**Complete API Documentation:** See [Backend API Reference](https://github.com/aleezaa-ada/booking-system-backend?tab=readme-ov-file#api-endpoints)

---

## Styling

### CSS Architecture

The application uses modular CSS with a component-based approach.

**Style Files:**
- `assets/components.css`: Component-specific styles
- `assets/pages.css`: Page-specific styles

### Styling Conventions

**Class Naming:**
- Use descriptive, component-prefixed class names
- Example: `.booking-form-container`, `.nav-component`

**Responsive Design:**
```css
/* Mobile-first approach */
.container {
  padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
}
```

**CSS Variables:**
```css
:root {
  --primary-color: #4a90e2;
  --secondary-color: #f5f5f5;
  --error-color: #e74c3c;
  --success-color: #2ecc71;
}
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Coverage will be generated in coverage/lcov-report/index.html
```

### Test Structure

**Component Test Example:**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookingForm from '../BookingForm';

describe('BookingForm', () => {
  it('renders booking form', () => {
    render(
      <BrowserRouter>
        <BookingForm />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/create booking/i)).toBeInTheDocument();
  });
  
  it('validates required fields', async () => {
    render(
      <BrowserRouter>
        <BookingForm />
      </BrowserRouter>
    );
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/please select a resource/i)).toBeInTheDocument();
  });
});
```

### Coverage Requirements

**Configured in `jest.config.cjs`:**
```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

### Mocking

**API Mocking:**
```javascript
// src/services/__mocks__/api.js
export default {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};
```

---

## Code Quality

### Linting

**Run ESLint:**
```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

**ESLint Configuration:**
- React Hooks rules enforced
- React Refresh plugin
- Browser globals
- Jest globals for tests

### Formatting

**Run Prettier:**
```bash
# Format all files
npm run format
```

**Prettier Configuration:**
- 2-space indentation
- Single quotes
- Trailing commas
- Automatic semicolon insertion

### Git Hooks

**Husky** is configured to run checks before commits:
- Lint staged files
- Run tests
- Format code

**Configuration:** `.husky/pre-commit`

---

## Deployment

### Render Deployment

The application is configured for deployment on **Render**.

#### Prerequisites

1. Render account
2. Backend API deployed and accessible
3. Git repository connected to Render

#### Deployment Steps

1. **Create Web Service**
   - Go to Render Dashboard → New → Static Site
   - Connect your Git repository
   - Configure settings:
     - **Name:** booking-system-frontend
     - **Build Command:** `npm install && npm run build`
     - **Publish Directory:** `dist`

2. **Configure Environment Variables**

   Add the following in Render:
   ```env
   VITE_API_URL=https://your-backend.onrender.com/api/
   ```

3. **Deploy**
   - Render will automatically build and deploy
   - The site will be available at `https://your-app.onrender.com`

### Environment Configuration

#### Production Checklist

- [ ] `VITE_API_URL` points to production backend
- [ ] HTTPS enabled (automatic on Render)
- [ ] CORS configured on backend for frontend domain
- [ ] Assets optimized and minified

### Build Optimization

**Vite automatically optimizes:**
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Minification
- ✅ Asset compression
- ✅ Source maps (configurable)

**Build Output:**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other-assets]
└── bookings.svg
```

---

## Technical Decisions

### 1. **React 19**
   - **Why:** Latest features and performance improvements
   - **Benefits:** Concurrent rendering, automatic batching, new hooks
   - **Alternative considered:** Vue.js (rejected for team expertise)

### 2. **Vite Build Tool**
   - **Why:** Lightning-fast development experience
   - **Benefits:** Instant HMR, ESM-based, optimized builds
   - **Alternative considered:** Create React App (rejected for speed)

### 3. **React Router v7**
   - **Why:** Industry standard for React routing
   - **Benefits:** Nested routes, data loading, protected routes
   - **Alternative considered:** TanStack Router (rejected for maturity)

### 4. **Axios over Fetch**
   - **Why:** Better error handling and interceptors
   - **Benefits:** Request/response transformation, timeout support
   - **Alternative considered:** Native fetch (rejected for features)

### 5. **Context API for Auth State**
   - **Why:** Built-in React solution, no external dependencies
   - **Benefits:** Simple, lightweight, perfect for auth
   - **Alternative considered:** Redux (rejected for complexity)

### 6. **React DatePicker**
   - **Why:** Mature, accessible, customizable
   - **Benefits:** Keyboard navigation, time selection, localization
   - **Alternative considered:** Native input[type=datetime-local] (rejected for UX)

### 7. **Token-Based Authentication**
   - **Why:** Stateless, works with REST APIs
   - **Benefits:** Scalable, mobile-friendly, simple
   - **Storage:** localStorage (alternative: cookies with httpOnly)

### 8. **CSS Modules Approach**
   - **Why:** Scoped styles without build complexity
   - **Benefits:** No class name conflicts, simple setup
   - **Alternative considered:** Styled Components (rejected for bundle size)

### 9. **Jest + React Testing Library**
   - **Why:** Industry standard, component-focused testing
   - **Benefits:** Excellent documentation, user-centric approach
   - **Alternative considered:** Vitest (rejected for ecosystem maturity)

### 10. **React Compiler**
   - **Why:** Automatic optimization of React components
   - **Benefits:** Better performance without manual memoization
   - **Impact:** Reduced unnecessary re-renders

---

## Browser Support

### Supported Browsers

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

### Polyfills

Vite automatically includes necessary polyfills for:
- ES6+ features
- Promise
- Fetch API (via Axios)

---

## Performance Optimization

### Implemented Optimizations

1. **Code Splitting**
   - Route-based lazy loading
   - Dynamic imports for large components

2. **React Compiler**
   - Automatic memoization
   - Reduced re-renders

3. **Asset Optimization**
   - Image compression
   - CSS minification
   - JavaScript bundling

4. **Caching Strategy**
   - Service worker (can be added)
   - Browser caching headers

5. **Bundle Analysis**
   ```bash
   npm run build -- --mode analyze
   ```

---

## Troubleshooting

### Common Issues

#### 1. **Cannot Connect to Backend**
```
Error: Network Error
```

**Solution:**
- Check `VITE_API_URL` in `.env`
- Verify backend is running
- Check CORS configuration on backend

#### 2. **Token Authentication Failed**
```
401 Unauthorized
```

**Solution:**
- Check token in localStorage
- Re-login to get fresh token
- Verify token format: `Token <token>`

#### 3. **Build Fails**
```
ERROR: Cannot find module
```

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. **Tests Failing**
```
TypeError: Cannot read property of undefined
```

**Solution:**
- Check test mocks are properly configured
- Ensure React Router wrapper in tests
- Verify AuthContext provider in tests

#### 5. **Vite Dev Server Not Starting**
```
Port 5173 is already in use
```

**Solution:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or specify different port
npm run dev -- --port 3000
```

#### 6. **Environment Variables Not Working**
```
import.meta.env.VITE_API_URL is undefined
```

**Solution:**
- Ensure variable is prefixed with `VITE_`
- Restart dev server after changing `.env`
- Check `.env` file is in project root

### Debug Mode

**Enable React DevTools:**
1. Install React DevTools browser extension
2. Open DevTools in browser
3. Navigate to React tab

**Enable Network Inspection:**
- Use browser DevTools Network tab
- Check request/response headers
- Verify API calls and responses

---

## Contributing

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow React best practices
   - Write tests for new features
   - Update documentation

3. **Run Quality Checks**
   ```bash
   npm run lint
   npm run format
   npm test
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

**React Components:**
- Use functional components with hooks
- One component per file
- PascalCase for component names
- camelCase for functions and variables

**File Naming:**
- Components: `PascalCase.jsx`
- Utilities: `camelCase.js`
- Tests: `ComponentName.test.jsx`

**Import Order:**
1. React imports
2. Third-party libraries
3. Internal components
4. Utilities and services
5. Styles

### Git Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

---

## License

This project is proprietary and confidential. All rights reserved.

---

## Support

For technical support or questions:

- **Email:** aleezaahmed315@gmail.com
- **Documentation:** See this README
- **Issues:** Use GitHub Issues for bug reports

---

## Appendix

### Useful Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run preview            # Preview production build

# Testing
npm test                   # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report

# Code Quality
npm run lint               # Check for linting errors
npm run lint:fix           # Auto-fix linting errors
npm run format             # Format code with Prettier

# Dependencies
npm install                # Install dependencies
npm update                 # Update dependencies
npm outdated               # Check for outdated packages
```

### Keyboard Shortcuts (Dev Mode)

- `Cmd/Ctrl + S`: Save and trigger HMR
- `Cmd/Ctrl + Shift + R`: Hard reload
- `Option + Cmd + I`: Open DevTools

### Useful URLs

- **Development:** http://localhost:5173
- **Preview:** http://localhost:4173
- **Coverage Report:** `open coverage/lcov-report/index.html`

### Package Updates

```bash
# Update all dependencies
npm update

# Update specific package
npm install react@latest

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Vite Configuration Tips

**Custom Port:**
```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 3000
  }
});
```

**Proxy API Requests:**
```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
```

---

**Last Updated:** February 20, 2026  
**Version:** 1.0.0  
**Maintainer:** Aleeza Ahmed

---

### AI Declaration
I have used AI to plan my code and help write up this README file. I have reviewed and edited the content to ensure accuracy and clarity. The code and documentation reflect my understanding and implementation of the project requirements.

