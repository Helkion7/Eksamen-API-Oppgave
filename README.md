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
