# Authentication Testing Guide

## Prerequisites

1. Make sure the database is running and migrations are applied
2. Start the backend server: `npm run start:dev`

## Testing with cURL

### 1. Register a New User

```bash
curl -X POST http://localhost:3030/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3030/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123"
  }'
```

### 3. Access Protected Routes

To test a protected route, first add the `@UseGuards(JwtAuthGuard)` decorator to any endpoint.

Example: Protecting the users list endpoint:

```typescript
// In users.controller.ts
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Get()
async findAll() {
  return this.usersService.findAll();
}
```

Then test with:

```bash
# This will fail (401 Unauthorized)
curl http://localhost:3030/users

# This will succeed with a valid token
curl http://localhost:3030/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Testing with Postman or Thunder Client

### Register Request

- **Method:** POST
- **URL:** `http://localhost:3030/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestPass123",
  "firstName": "Test",
  "lastName": "User"
}
```

### Login Request

- **Method:** POST
- **URL:** `http://localhost:3030/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**

```json
{
  "username": "testuser",
  "password": "TestPass123"
}
```

### Protected Endpoint Request

- **Method:** GET (or appropriate method)
- **URL:** `http://localhost:3030/your-protected-endpoint`
- **Headers:**
  - `Authorization: Bearer YOUR_JWT_TOKEN`

## Validation Tests

### Username Validation

```bash
# Invalid: Too short (less than 3 chars)
curl -X POST http://localhost:3030/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Invalid: Contains special characters
curl -X POST http://localhost:3030/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@user",
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Password Validation

```bash
# Invalid: No uppercase letter
curl -X POST http://localhost:3030/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Invalid: No number
curl -X POST http://localhost:3030/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword",
    "firstName": "Test",
    "lastName": "User"
  }'

# Invalid: Too short (less than 8 chars)
curl -X POST http://localhost:3030/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test12",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Email Validation

```bash
# Invalid: Not an email format
curl -X POST http://localhost:3030/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "notanemail",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Error Scenarios

### Duplicate Username

```bash
# Register first user
curl -X POST http://localhost:3030/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test1@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Try to register with same username (will fail with 409 Conflict)
curl -X POST http://localhost:3030/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test2@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Invalid Login Credentials

```bash
# Wrong password (will fail with 401 Unauthorized)
curl -X POST http://localhost:3030/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "WrongPassword123"
  }'
```

## JWT Token Structure

After successful login or registration, you'll receive a JWT token. You can decode it at [jwt.io](https://jwt.io) to see:

```json
{
  "sub": 1,
  "username": "testuser",
  "email": "test@example.com",
  "iat": 1699200000,
  "exp": 1699286400
}
```

- `sub`: User ID
- `username`: Username
- `email`: User's email
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp

## Database Verification

You can verify users were created by checking your database:

```sql
SELECT id, username, email, firstName, lastName, createdAt FROM users;
```

Note: Passwords are hashed and should look like: `$2b$10$...` (bcrypt hash)
