# Authentication Implementation

This document describes the authentication functionality implemented in the application.

## Overview

The application implements JWT-based authentication with username/password credentials. The authentication system is built using NestJS with Passport strategies and follows SOLID principles for maintainability and scalability.

## Features

- User registration with username, email, password, first name, and last name
- User login with username and password
- JWT token-based authentication
- Password hashing using bcrypt
- Input validation using class-validator
- Protected routes using JWT guards

## Database Schema

The `users` table includes the following fields:

```typescript
{
  id: number (auto-increment, primary key)
  username: string (unique, required, max 50 chars)
  email: string (unique, required)
  password: string (hashed, required)
  firstName: string (required)
  lastName: string (required)
  createdAt: timestamp
  updatedAt: timestamp
}
```

## API Endpoints

### Register a New User

**POST** `/auth/register`

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validation Rules:**

- `username`: 3-50 characters, alphanumeric and underscores only
- `email`: Valid email format
- `password`: Min 8 characters, must contain uppercase, lowercase, and number
- `firstName`: 1-100 characters
- `lastName`: 1-100 characters

**Response (201):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Login

**POST** `/auth/login`

**Request Body:**

```json
{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## Protected Routes

To protect routes with JWT authentication, use the `JwtAuthGuard`:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProtectedResource() {
    return { message: 'This is protected' };
  }
}
```

To access protected routes, include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Environment Variables

Add the following to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h

# Database Configuration (if not already set)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
```

⚠️ **Important**: Change `JWT_SECRET` in production to a strong, random secret key.

## Architecture

### Modules

- **AuthModule**: Handles authentication logic, JWT configuration, and Passport strategies
- **UsersModule**: Manages user CRUD operations

### Services

- **AuthService**:
  - `register()`: Creates new users with hashed passwords
  - `validateUser()`: Validates username/password credentials
  - `login()`: Generates JWT tokens for authenticated users

### Strategies

- **LocalStrategy**: Validates username/password for login
- **JwtStrategy**: Validates JWT tokens for protected routes

### Guards

- **LocalAuthGuard**: Protects login endpoint, triggers LocalStrategy
- **JwtAuthGuard**: Protects routes requiring authentication

### DTOs

- **RegisterDto**: Validates registration input
- **LoginDto**: Validates login input
- **AuthResponseDto**: Standardizes authentication responses

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
2. **Password Validation**: Enforces strong passwords with complexity requirements
3. **JWT Tokens**: Short-lived tokens (default 24h) for session management
4. **Input Validation**: All inputs are validated using class-validator
5. **Duplicate Prevention**: Checks for existing username/email before registration

## Future Enhancements

The current implementation supports easy extension with:

- Password reset functionality
- Email verification
- Refresh tokens
- Role-based access control (RBAC)
- OAuth integration (Google, GitHub, etc.)
- Two-factor authentication (2FA)
- Account lockout after failed attempts
- Session management

## Testing the API

### Using cURL

**Register:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "SecurePass123"
  }'
```

**Access Protected Route:**

```bash
curl -X GET http://localhost:3000/protected-endpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Handling

The API returns appropriate HTTP status codes:

- `201 Created`: Successful registration
- `200 OK`: Successful login
- `400 Bad Request`: Invalid input (validation errors)
- `401 Unauthorized`: Invalid credentials or missing/invalid token
- `409 Conflict`: Username or email already exists

## Dependencies

- `@nestjs/jwt`: JWT token generation and validation
- `@nestjs/passport`: Passport integration for authentication
- `passport-jwt`: JWT strategy for Passport
- `passport-local`: Local strategy for username/password auth
- `bcrypt`: Password hashing
- `class-validator`: DTO validation
- `class-transformer`: Object transformation
