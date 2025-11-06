# Login Implementation Guide

This document describes the login implementation for the Next.js frontend.

## Overview

The login system integrates with the NestJS backend authentication API and uses shadcn/ui components for a modern, accessible UI.

## Features Implemented

- ✅ Login page with form validation
- ✅ Registration page with comprehensive form validation
- ✅ JWT token management
- ✅ Protected routes (dashboard)
- ✅ Auto-redirect logic
- ✅ Error handling with user-friendly messages
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript for type safety

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx                 # Home page (redirects to login/dashboard)
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── register/
│   │   └── page.tsx            # Registration page
│   └── dashboard/
│       └── page.tsx            # Protected dashboard page
├── components/
│   └── ui/                     # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── form.tsx
├── lib/
│   ├── api.ts                  # API client for backend communication
│   ├── auth.ts                 # Authentication utilities
│   └── utils.ts                # Utility functions
└── .env.local                  # Environment variables
```

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Install Dependencies

Dependencies are already installed via the setup process:

- `shadcn/ui` components
- `react-hook-form` for form handling
- `zod` for schema validation
- `@hookform/resolvers` for zod integration

### 3. Run the Application

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:3000`.

## API Integration

### Backend Endpoints

The frontend communicates with these backend endpoints:

#### Login

- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "password": "SecurePass123"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "operatorId": 1,
      "roleId": 1,
      "operator": {
        "id": 1,
        "name": "Operator Name",
        "super": true
      },
      "role": {
        "id": 1,
        "name": "Admin"
      }
    }
  }
  ```

#### Register

- **Endpoint**: `POST /auth/register`
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe",
    "operatorId": 1,
    "roleId": 1
  }
  ```
- **Validation Rules**:
  - `username`: 3-50 characters, alphanumeric and underscores only
  - `email`: Valid email format
  - `password`: Min 8 characters, must contain uppercase, lowercase, and number
  - `firstName`: 1-100 characters
  - `lastName`: 1-100 characters
  - `operatorId`: Positive integer
  - `roleId`: Positive integer
- **Response**: Same as login (201 Created)

### API Client (`lib/api.ts`)

The API client provides:

- Type-safe API calls
- Error handling with custom `ApiError` class
- Automatic JSON parsing
- Bearer token support for authenticated requests

Key functions:

- `login(credentials)`: Authenticate user
- `register(userData)`: Register new user
- `authenticatedRequest(endpoint, token, options)`: Make authenticated API calls

### Authentication Utilities (`lib/auth.ts`)

Provides authentication helpers:

- `storeAuth(authData)`: Store JWT token and user data in localStorage
- `getToken()`: Retrieve stored JWT token
- `getUser()`: Retrieve stored user data
- `isAuthenticated()`: Check if user is authenticated
- `clearAuth()`: Remove authentication data
- `logout()`: Log out user and redirect to login

## Pages

### Home Page (`app/page.tsx`)

Automatically redirects users:

- To `/dashboard` if authenticated
- To `/login` if not authenticated

### Login Page (`app/login/page.tsx`)

Features:

- Form validation using Zod schema
- Username and password fields
- Loading state during authentication
- Error messages for failed attempts
- Link to registration page
- Responsive design

**Form Validation Rules:**

- Username: Required
- Password: Required

**Error Handling:**

- 401: "Invalid username or password"
- 0: "Unable to connect to server"
- Other: Generic error message

### Registration Page (`app/register/page.tsx`)

Features:

- Comprehensive form validation using Zod schema
- All required fields: username, email, password, confirm password, first name, last name, operator ID, role ID
- Real-time validation feedback
- Password strength requirements
- Password confirmation matching
- Loading state during registration
- Error messages for validation and server errors
- Link to login page
- Responsive two-column layout on larger screens

**Form Validation Rules:**

- Username: 3-50 characters, alphanumeric and underscores only
- Email: Valid email format
- Password: Min 8 characters, must contain uppercase, lowercase, and number
- Confirm Password: Must match password
- First Name: 1-100 characters
- Last Name: 1-100 characters
- Operator ID: Positive integer
- Role ID: Positive integer

**Error Handling:**

- 409: "Username or email already exists"
- 400: Validation errors with detailed messages
- 0: "Unable to connect to server"
- Other: Generic error message

### Dashboard Page (`app/dashboard/page.tsx`)

Features:

- Protected route (redirects to login if not authenticated)
- Displays user information
- Logout functionality
- Shows operator and role details if available

## Usage Examples

### Basic Login Flow

1. User visits the homepage
2. System checks authentication status
3. Redirects to `/login` if not authenticated
4. User enters credentials
5. On success, token is stored and user redirects to `/dashboard`
6. Dashboard displays user information

### Basic Registration Flow

1. User clicks "Register here" link on login page
2. User fills out registration form with all required information
3. Form validates input in real-time
4. On submit, data is sent to backend
5. On success, token is stored and user redirects to `/dashboard`
6. On error (e.g., username taken), error message is displayed

### Making Authenticated Requests

```typescript
import { authenticatedRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";

async function fetchProtectedData() {
  const token = getToken();
  if (!token) return;

  const data = await authenticatedRequest("/api/protected", token);
  return data;
}
```

### Checking Authentication

```typescript
import { isAuthenticated, getUser } from "@/lib/auth";

function MyComponent() {
  if (!isAuthenticated()) {
    // Redirect to login or show message
    return <div>Please log in</div>;
  }

  const user = getUser();
  return <div>Welcome, {user?.firstName}!</div>;
}
```

## Security Considerations

1. **Token Storage**: JWT tokens are stored in localStorage (consider httpOnly cookies for production)
2. **HTTPS**: Always use HTTPS in production
3. **Token Expiration**: Backend JWT tokens expire after 24 hours (configurable)
4. **XSS Protection**: Sanitize user input and use React's built-in escaping
5. **CORS**: Configure backend CORS settings appropriately

## Styling

The application uses:

- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible components
- **Gradient backgrounds**: Modern visual design
- **Responsive design**: Mobile-first approach

## Future Enhancements

Potential improvements:

- [ ] Remember me functionality
- [ ] Password reset flow
- [ ] Registration page
- [ ] OAuth integration (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Session timeout warnings
- [ ] Token refresh mechanism
- [ ] Better error boundary handling
- [ ] Loading skeletons
- [ ] Dark mode toggle

## Troubleshooting

### Common Issues

**Issue: CORS errors**

- Ensure backend CORS is configured to allow frontend origin
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

**Issue: 401 errors on protected routes**

- Verify JWT token is stored correctly
- Check token hasn't expired
- Ensure Authorization header is set: `Bearer <token>`

**Issue: Login button not working**

- Check browser console for errors
- Verify backend server is running
- Test API endpoint with curl or Postman

**Issue: Redirect loop**

- Clear localStorage: `localStorage.clear()`
- Check authentication logic in useEffect hooks

## Testing

To test the login functionality:

1. Ensure backend server is running (`npm run start:dev` in backend)
2. Create a test user via backend registration endpoint or seed data
3. Navigate to `http://localhost:3000`
4. Enter valid credentials
5. Verify redirect to dashboard
6. Check user information is displayed
7. Test logout functionality

### Test Credentials

If you've run the backend seeds, you can use test users created there. Otherwise, register a new user first.

## Backend Documentation References

- [Authentication Guide](../../backend/docs/AUTHENTICATION.md)
- [API Examples](../../backend/docs/API_EXAMPLES.md)
- [Testing Auth](../../backend/docs/TESTING_AUTH.md)

## Support

For issues or questions:

1. Check backend API is running and accessible
2. Verify environment variables are set correctly
3. Review browser console for error messages
4. Check network tab in browser DevTools
