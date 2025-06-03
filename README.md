# User/Login RESTful API

## Project Overview

This is a secure, scalable RESTful API for user authentication and management built with Node.js, Express, and MongoDB. The API provides endpoints for user registration, authentication, and management with role-based permissions.

**Tech Stack:**

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Argon2
- **Validation**: Joi
- **Testing**: Jest with Supertest

The API follows REST principles and implements secure authentication practices including password hashing, rate limiting, and JWT-based session management.

## Getting Started

### Prerequisites

- Node.js v14 or higher
- MongoDB v4.4 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd Eksamen
   ```

2. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the backend directory based on the provided `.env` example:

   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/eksamen_db
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   JWT_COOKIE_EXPIRES_IN=7
   NODE_ENV=development
   ```

4. Start MongoDB:
   Ensure your MongoDB server is running.

5. Start the server:

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Reference

### Authentication Endpoints

#### Register a new user

- **URL**: `/api/users`
- **Method**: `POST`
- **Authentication**: Public
- **Request Body**:
  ```json
  {
    "username": "newuser",
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "message": "User created successfully",
    "user": {
      "id": "user_id",
      "username": "newuser",
      "email": "user@example.com",
      "createdAt": "timestamp"
    }
  }
  ```
- **Error Response**: `400 Bad Request` (validation errors or duplicate user)

#### Login

- **URL**: `/api/login`
- **Method**: `POST`
- **Authentication**: Public
- **Request Body**:
  ```json
  {
    "username": "existinguser",
    "password": "yourpassword"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": "user_id",
      "username": "existinguser",
      "email": "user@example.com",
      "role": "user"
    }
  }
  ```
- **Error Response**: `401 Unauthorized` (invalid credentials)

### User Management Endpoints

#### Get all users

- **URL**: `/api/users`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response**: `200 OK`
  ```json
  {
    "count": 2,
    "users": [{ "username": "admin" }, { "username": "user1" }]
  }
  ```

#### Get user by username

- **URL**: `/api/users/:username`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response**: `200 OK`
  ```json
  {
    "user": {
      "id": "user_id",
      "username": "targetuser",
      "email": "target@example.com",
      "role": "user"
    }
  }
  ```
- **Error Response**: `404 Not Found`

#### Update user

- **URL**: `/api/users/:username`
- **Method**: `PUT`
- **Authentication**: Required (Own user or Admin only)
- **Request Body**:
  ```json
  {
    "email": "newemail@example.com",
    "password": "newpassword"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "User updated successfully",
    "user": {
      "id": "user_id",
      "username": "targetuser",
      "email": "newemail@example.com",
      "role": "user"
    }
  }
  ```
- **Error Response**: `403 Forbidden` (unauthorized), `400 Bad Request` (validation errors)

#### Delete user

- **URL**: `/api/users/:username`
- **Method**: `DELETE`
- **Authentication**: Required (Admin only)
- **Success Response**: `200 OK`
  ```json
  {
    "message": "User deleted successfully"
  }
  ```
- **Error Response**: `403 Forbidden` (unauthorized), `404 Not Found`

## Authentication & Authorization

The API uses JWT (JSON Web Tokens) for authentication, delivered as an HTTP-only cookie.

### Authentication Flow

1. User registers or logs in
2. Server creates a JWT containing the user ID and signs it
3. JWT is sent to client as an HTTP-only cookie
4. Subsequent requests include the cookie which is verified by the server

### Authorization Levels

- **Public**: Unauthenticated users can access registration and login endpoints
- **User**: Authenticated users can view user lists and specific user details
- **Self**: Users can only update their own account information
- **Admin**: Administrators can update any user account, change roles, and delete users

## Database Schema

### User Schema

```javascript
{
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The API uses consistent error response formats:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting & Usage Guidelines

The API implements rate limiting to prevent abuse:

- General API endpoints: 100 requests per 15 minutes per IP
- Login endpoint: 5 attempts per 15 minutes per IP (to prevent brute force attacks)

## Development Guidelines

### Project Structure

## Authentication & Authorization Flow

This section explains how the API handles user authentication and authorization, including security measures and middleware implementation.

### High-Level Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client        │    │   Express App    │    │   Database      │
│   Request       │    │   + Middleware   │    │   (MongoDB)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. POST /api/users    │                       │
         │ (register/login)      │                       │
         ├──────────────────────►│                       │
         │                       │ 2. Hash password      │
         │                       │    (argon2)           │
         │                       │                       │
         │                       │ 3. Save user/verify   │
         │                       ├──────────────────────►│
         │                       │◄──────────────────────┤
         │                       │                       │
         │                       │ 4. Create JWT token   │
         │                       │    Set HTTP-only      │
         │                       │    cookie             │
         │ 5. Response + Cookie  │                       │
         │◄──────────────────────┤                       │
         │                       │                       │
         │ 6. Protected Request  │                       │
         │    (with JWT cookie)  │                       │
         ├──────────────────────►│                       │
         │                       │ 7. authenticate()     │
         │                       │    middleware         │
         │                       │                       │
         │                       │ 8. Decode JWT &       │
         │                       │    Find user          │
         │                       ├──────────────────────►│
         │                       │◄──────────────────────┤
         │                       │                       │
         │                       │ 9. Authorization      │
         │                       │    check (role/owner) │
         │                       │                       │
         │                       │ 10. Execute request   │
         │ 11. Response          │                       │
         │◄──────────────────────┤                       │
```

### Middleware Chain

Every request passes through this middleware chain:

```
Incoming Request
       │
       ▼
┌─────────────────┐
│  Rate Limiting  │ ← apiLimiter/loginLimiter (from .env config)
│  Middleware     │   • 100 requests/15min (general)
└─────────────────┘   • 5 requests/15min (login)
       │
       ▼
┌─────────────────┐
│   Validation    │ ← Joi schema validation
│   Middleware    │   • validateUserRegistration
└─────────────────┘   • validateUserLogin/Update
       │
       ▼
┌─────────────────┐
│ Authentication  │ ← authenticate() middleware
│   Middleware    │   • JWT verification from cookies
└─────────────────┘   • User lookup in database
       │
       ▼
┌─────────────────┐
│ Authorization   │ ← Role & ownership checks
│   Middleware    │   • isAdmin (admin only)
└─────────────────┘   • isAdminOrSameUser (owner or admin)
       │
       ▼
┌─────────────────┐
│   Controller    │ ← Business logic execution
│    Function     │
└─────────────────┘
```

### Authentication Process

#### 1. User Registration/Login

```javascript
// Registration - POST /api/users
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123"
}

// Password hashing with Argon2
const hashedPassword = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,    // 64MB memory cost
  timeCost: 3,          // 3 iterations
  parallelism: 1,       // 1 thread
});
```

#### 2. JWT Token Creation & Cookie Setting

```javascript
// JWT creation
const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
  expiresIn: "7d",
});

// Secure HTTP-only cookie
res.cookie("jwt", token, {
  httpOnly: true, // Prevents XSS attacks
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "strict", // CSRF protection
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
});
```

### Authorization Levels

The API implements three authorization levels:

#### 1. Public Routes

- `POST /api/users` (registration)
- `POST /api/login` (authentication)

#### 2. Authenticated Routes

- `GET /api/users` (list all users)
- `GET /api/users/:username` (get specific user)

#### 3. Protected Routes with Role/Ownership Checks

**Owner or Admin (`isAdminOrSameUser`)**:

- `PUT /api/users/:username` - Update user profile

**Admin Only (`isAdmin`)**:

- `DELETE /api/users/:username` - Delete user

### Security Features

#### Password Security (Argon2)

- **Algorithm**: Argon2id (winner of password hashing competition)
- **Memory Cost**: 65536 KB (from ARGON2_MEMORY_COST)
- **Time Cost**: 3 iterations (from ARGON2_TIME_COST)
- **Parallelism**: 1 thread (from ARGON2_PARALLELISM)
- **Resistance**: Timing attacks, GPU attacks, side-channel attacks

#### JWT Security

- **Storage**: HTTP-only cookies (prevents XSS)
- **Transmission**: Secure flag in production (HTTPS only)
- **CSRF Protection**: SameSite=strict attribute
- **Expiration**: 7 days (configurable via JWT_EXPIRES_IN)
- **Verification**: Server-side validation on each request

#### Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Login Endpoint**: 5 requests per 15 minutes (brute force protection)
- **Configuration**: Configurable via environment variables

### Route Protection Examples

```javascript
// Public routes (no authentication required)
router.post("/users", validateUserRegistration, authController.createUser);
router.post("/login", validateUserLogin, authController.loginUser);

// Authenticated routes (valid JWT required)
router.get("/users", authenticate, authController.getAllUsers);
router.get("/users/:username", authenticate, authController.getUserByUsername);

// Owner or Admin only (user can update own profile, admin can update any)
router.put(
  "/users/:username",
  authenticate, // Must be logged in
  isAdminOrSameUser, // Must be owner or admin
  validateUserUpdate, // Validate input data
  authController.updateUser
);

// Admin only (only admins can delete users)
router.delete(
  "/users/:username",
  authenticate, // Must be logged in
  isAdmin, // Must be admin
  authController.deleteUser
);
```

### Authorization Logic Flow

1. **Authentication Check**: Verify JWT token exists and is valid
2. **User Lookup**: Find user in database to ensure account still exists
3. **Role Verification**: Check user role (user/admin) from database
4. **Ownership Check**: For user-specific operations, verify the requesting user is the owner
5. **Permission Grant**: Allow or deny access based on above checks

This multi-layered approach ensures that:

- Passwords are never stored in plaintext
- JWT tokens are securely transmitted and stored
- Each request is properly authenticated
- Authorization is enforced based on user roles and resource ownership
- Sensitive operations require appropriate permissions
