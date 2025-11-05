# 🚀 Quick Start - Authentication

## Setup (One-time)

1. **Install dependencies** (if not already done):

   ```bash
   npm install
   ```

2. **Configure environment** (if not already done):

   ```bash
   # The .env file should already have JWT configuration
   # If not, add these lines:
   JWT_SECRET=dev-secret-key-please-change-in-production
   JWT_EXPIRATION=24h
   ```

3. **Start the server**:

   ```bash
   npm run start:dev
   ```

   You should see:

   ```
   [Nest] LOG [RouterExplorer] Mapped {/auth/register, POST} route
   [Nest] LOG [RouterExplorer] Mapped {/auth/login, POST} route
   Application Running on: http://localhost:3030
   ```

## Test It Out (5 minutes)

### 1. Register a User

```bash
curl -X POST http://localhost:3030/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

✅ **Success Response:**

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

### 2. Login

```bash
curl -X POST http://localhost:3030/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "SecurePass123"
  }'
```

✅ **Success Response:**

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

### 3. Use JWT Token for Protected Routes

```bash
# Copy the access_token from step 1 or 2
export TOKEN="paste_your_token_here"

# Now you can access protected routes:
curl http://localhost:3030/protected-endpoint \
  -H "Authorization: Bearer $TOKEN"
```

## Protect Your Own Routes

To protect any route, just add the `@UseGuards(JwtAuthGuard)` decorator:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller('protected')
export class YourController {
  @UseGuards(JwtAuthGuard) // 👈 Add this line
  @Get()
  getProtectedData() {
    return { message: 'This is protected!' };
  }
}
```

## Common Issues

### ❌ "Username already exists"

**Solution:** Try a different username

### ❌ "Password must contain at least one uppercase..."

**Solution:** Use a password with uppercase, lowercase, and number (min 8 chars)

### ❌ "Invalid credentials"

**Solution:** Check your username and password

### ❌ "Unauthorized" on protected routes

**Solution:** Make sure you're sending the JWT token in the Authorization header

## Next Steps

📖 Read the full documentation:

- [AUTHENTICATION.md](./AUTHENTICATION.md) - Complete authentication guide
- [TESTING_AUTH.md](./TESTING_AUTH.md) - Detailed testing examples
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical implementation details

## Password Requirements

✅ Minimum 8 characters
✅ At least one uppercase letter
✅ At least one lowercase letter  
✅ At least one number

## Username Requirements

✅ 3-50 characters
✅ Only letters, numbers, and underscores
✅ Must be unique

---

**That's it! You now have working authentication! 🎉**
