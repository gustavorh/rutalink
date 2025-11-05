# Authentication Flow Diagrams

## Registration Flow

```
Client                    Backend                     Database
  |                          |                            |
  |-- POST /auth/register -->|                            |
  |   {username, email,      |                            |
  |    password, etc.}       |                            |
  |                          |                            |
  |                          |-- Check username exists -->|
  |                          |<-- No                      |
  |                          |                            |
  |                          |-- Check email exists ----->|
  |                          |<-- No                      |
  |                          |                            |
  |                          |-- Hash password            |
  |                          |   (bcrypt)                 |
  |                          |                            |
  |                          |-- Insert user ------------>|
  |                          |<-- User created            |
  |                          |                            |
  |                          |-- Generate JWT token       |
  |                          |   (JwtService.sign)        |
  |                          |                            |
  |<-- 201 Created           |                            |
  |    {access_token, user}  |                            |
  |                          |                            |
```

## Login Flow

```
Client                    Backend                     Database
  |                          |                            |
  |-- POST /auth/login ----->|                            |
  |   {username, password}   |                            |
  |                          |                            |
  |                    LocalAuthGuard                     |
  |                    triggers LocalStrategy             |
  |                          |                            |
  |                          |-- Find by username ------->|
  |                          |<-- User data               |
  |                          |                            |
  |                          |-- Compare password         |
  |                          |   (bcrypt.compare)         |
  |                          |   ✓ Valid                  |
  |                          |                            |
  |                          |-- Generate JWT token       |
  |                          |   (JwtService.sign)        |
  |                          |                            |
  |<-- 200 OK                |                            |
  |    {access_token, user}  |                            |
  |                          |                            |
```

## Protected Route Access Flow

```
Client                    Backend
  |                          |
  |-- GET /protected ------->|
  |   Authorization:         |
  |   Bearer <JWT>           |
  |                          |
  |                    JwtAuthGuard
  |                    triggers JwtStrategy
  |                          |
  |                          |-- Verify token
  |                          |   (jwt.verify)
  |                          |   ✓ Valid & not expired
  |                          |
  |                          |-- Extract payload
  |                          |   {sub, username, email}
  |                          |
  |                          |-- Attach to request.user
  |                          |
  |                          |-- Execute route handler
  |                          |
  |<-- 200 OK                |
  |    Protected data        |
  |                          |
```

## JWT Token Structure

```
Header (Algorithm & Type)
{
  "alg": "HS256",
  "typ": "JWT"
}
         |
         v
Payload (Claims)
{
  "sub": 1,              // User ID
  "username": "johndoe",
  "email": "john@example.com",
  "iat": 1699200000,     // Issued at
  "exp": 1699286400      // Expires at
}
         |
         v
Signature (Verification)
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  JWT_SECRET
)

Result: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiam9obmRvZSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsImlhdCI6MTY5OTIwMDAwMCwiZXhwIjoxNjk5Mjg2NDAwfQ.signature_hash
```

## Error Flow - Invalid Credentials

```
Client                    Backend                     Database
  |                          |                            |
  |-- POST /auth/login ----->|                            |
  |   {username, password}   |                            |
  |                          |                            |
  |                    LocalAuthGuard                     |
  |                    triggers LocalStrategy             |
  |                          |                            |
  |                          |-- Find by username ------->|
  |                          |<-- User data               |
  |                          |                            |
  |                          |-- Compare password         |
  |                          |   (bcrypt.compare)         |
  |                          |   ✗ Invalid                |
  |                          |                            |
  |                          |-- Throw UnauthorizedException
  |                          |                            |
  |<-- 401 Unauthorized      |                            |
  |    "Invalid credentials" |                            |
  |                          |                            |
```

## Error Flow - Duplicate Registration

```
Client                    Backend                     Database
  |                          |                            |
  |-- POST /auth/register -->|                            |
  |   {username: "existing"} |                            |
  |                          |                            |
  |                          |-- Check username exists -->|
  |                          |<-- Yes, found              |
  |                          |                            |
  |                          |-- Throw ConflictException  |
  |                          |                            |
  |<-- 409 Conflict          |                            |
  |    "Username already     |                            |
  |     exists"              |                            |
  |                          |                            |
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Auth Module                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │Auth          │      │Auth          │                     │
│  │Controller    │─────▶│Service       │                     │
│  └──────────────┘      └──────────────┘                     │
│         │                      │                             │
│         │                      │                             │
│         ▼                      ▼                             │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │Guards:       │      │Users         │                     │
│  │- LocalAuth   │      │Service       │                     │
│  │- JwtAuth     │      └──────────────┘                     │
│  └──────────────┘              │                             │
│         │                      │                             │
│         ▼                      ▼                             │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │Strategies:   │      │Database      │                     │
│  │- Local       │      │(Drizzle ORM) │                     │
│  │- JWT         │      └──────────────┘                     │
│  └──────────────┘                                            │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────┐                                            │
│  │JWT Service   │                                            │
│  │(Token Gen)   │                                            │
│  └──────────────┘                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Security Layers

```
Request Flow with Security Layers:

HTTP Request
     │
     ▼
┌─────────────────────────┐
│ 1. Validation Layer     │  ◀── class-validator
│    - Input validation   │      - Email format
│    - DTO transformation │      - Password strength
└─────────────────────────┘      - Username format
     │
     ▼
┌─────────────────────────┐
│ 2. Authentication Layer │  ◀── Passport Strategies
│    - LocalStrategy      │      - Username/password
│    - JwtStrategy        │      - Token validation
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ 3. Authorization Layer  │  ◀── Guards
│    - JwtAuthGuard       │      - Protected routes
│    - LocalAuthGuard     │      - Login endpoint
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ 4. Business Logic Layer │  ◀── Services
│    - AuthService        │      - Registration
│    - UsersService       │      - User management
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ 5. Data Layer           │  ◀── Drizzle ORM
│    - Database queries   │      - Type-safe queries
│    - Password hashing   │      - bcrypt
└─────────────────────────┘
```

## Password Hashing Process

```
Registration:
─────────────
Plain Password ────────▶ bcrypt.hash(password, 10) ────▶ Hashed Password
"SecurePass123"         (with salt rounds)              "$2b$10$..."
                                                              │
                                                              ▼
                                                        Store in DB


Login:
──────
User Input ────────────────┐
"SecurePass123"            │
                           ▼
                    bcrypt.compare()
                           │
                           ├──────────────┐
                           │              │
                           ▼              ▼
DB Hashed Password      Compare        Result
"$2b$10$..."         ─────────▶     ✓ Match / ✗ No Match
```

## Complete Authentication Cycle

```
1. User Registration
   └─▶ Validate input
       └─▶ Check uniqueness (username/email)
           └─▶ Hash password
               └─▶ Save to database
                   └─▶ Generate JWT
                       └─▶ Return token + user data

2. User Login
   └─▶ Validate input
       └─▶ Find user by username
           └─▶ Verify password (bcrypt)
               └─▶ Generate JWT
                   └─▶ Return token + user data

3. Access Protected Resource
   └─▶ Extract JWT from header
       └─▶ Verify JWT signature
           └─▶ Check expiration
               └─▶ Extract user payload
                   └─▶ Attach to request
                       └─▶ Execute route handler
```

## Key Components Interaction

```
┌────────────┐
│ Client     │
└─────┬──────┘
      │
      ├─ POST /auth/register
      │     │
      │     ▼
      │  ┌────────────────┐     ┌────────────────┐
      │  │ AuthController │────▶│ AuthService    │
      │  └────────────────┘     └────────┬───────┘
      │                                   │
      │                                   ├─▶ UsersService
      │                                   ├─▶ bcrypt.hash()
      │                                   └─▶ JwtService.sign()
      │
      ├─ POST /auth/login
      │     │
      │     ▼
      │  ┌────────────────┐     ┌────────────────┐
      │  │ LocalAuthGuard │────▶│ LocalStrategy  │
      │  └────────────────┘     └────────┬───────┘
      │                                   │
      │                                   └─▶ AuthService.validateUser()
      │
      └─ GET /protected (with JWT)
            │
            ▼
         ┌────────────────┐     ┌────────────────┐
         │ JwtAuthGuard   │────▶│ JwtStrategy    │
         └────────────────┘     └────────┬───────┘
                                          │
                                          └─▶ jwt.verify()
```
