# User/Login RESTful API

A secure Node.js RESTful API for user authentication and management built with Express, MongoDB, and JWT tokens.

## Features

- 🔐 User registration and authentication
- 🔑 JWT-based authentication with refresh tokens
- 👥 User management (CRUD operations)
- 🛡️ Role-based access control (User/Admin)
- 🔒 Password hashing with Argon2
- 🚀 Rate limiting and security middleware
- 📊 Health check endpoint
- ✅ Comprehensive test suite
- 🍪 HTTP-only cookie authentication

## Request Workflow

Here's how a typical request flows through the system:

### Example: GET /api/users/:username (Protected Route)

```
1. Client Request
   ↓
2. Express Server (server.js)
   - CORS middleware
   - Helmet security headers
   - JSON body parser
   - Cookie parser
   ↓
3. Router (authRoutes.js)
   - Route matching: GET /api/users/:username
   ↓
4. Middleware Chain (applied in order):

   a) authenticate (auth.js)
      - Check for JWT in cookies
      - If no access token → try refresh token
      - Verify token signature
      - Find user in MongoDB
      - Attach user to req.user

   b) apiLimiter (rateLimit.js)
      - Check rate limit (100 requests/15min)
      - Block if limit exceeded
   ↓
5. Controller (authController.js)
   - Execute business logic
   - Query MongoDB via Mongoose
   - Format response data
   ↓
6. Response sent back to client
```

### Authentication Flow Detail

```
JWT Cookie Flow:
┌─────────────────┐    POST /api/login     ┌──────────────┐
│     Client      │ ───────────────────→   │    Server    │
└─────────────────┘                        └──────────────┘
         │                                         │
         │              Set-Cookie:                │
         │         jwt=access_token                │
         │    refreshToken=refresh_token           │
         │ ←─────────────────────────────────────  │
         │                                         │
         │      GET /api/users/john                │
         │     Cookie: jwt=access_token            │
         │ ───────────────────────────────────→    │
         │                                         │
         │                                    ┌────┴─────┐
         │                                    │ Verify   │
         │                                    │ JWT &    │
         │                                    │ Get User │
         │                                    └────┬─────┘
         │                                         │
         │            User data response           │
         │ ←─────────────────────────────────────  │
```

### Error Handling Flow

```
Request → Middleware/Controller Error → Error Handler (server.js)
                    │
                    ├── Validation Error (400)
                    ├── Authentication Error (401)
                    ├── Authorization Error (403)
                    ├── Rate Limit Error (429)
                    └── Server Error (500)
                                │
                                ↓
                        JSON Error Response
```

### Database Interaction Flow

```
Controller → Mongoose Model → MongoDB
     │              │             │
     │              │             ├── Connection Pool
     │              │             ├── Schema Validation
     │              │             └── CRUD Operations
     │              │
     │              ├── User.findById()
     │              ├── User.create()
     │              ├── User.findOneAndUpdate()
     │              └── User.findOneAndDelete()
     │
     └── Response Formatting
```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Argon2
- **Validation**: Joi
- **Testing**: Jest with Supertest
- **Security**: Helmet, CORS, Rate Limiting

## API Endpoints

### Public Routes

| Method | Endpoint      | Description       | Body                          |
| ------ | ------------- | ----------------- | ----------------------------- |
| `POST` | `/api/users`  | Create a new user | `{username, email, password}` |
| `POST` | `/api/login`  | Login user        | `{username, password}`        |
| `GET`  | `/api/health` | Health check      | -                             |

### Protected Routes (Authentication Required)

| Method   | Endpoint               | Description                    | Permissions   |
| -------- | ---------------------- | ------------------------------ | ------------- |
| `GET`    | `/api/users`           | Get all users (usernames only) | Authenticated |
| `GET`    | `/api/users/:username` | Get specific user data         | Authenticated |
| `PUT`    | `/api/users/:username` | Update user info               | User or Admin |
| `DELETE` | `/api/users/:username` | Delete user                    | Admin only    |

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Eksamen
   ```

2. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Start MongoDB**

   Make sure MongoDB is running on your system or configure a cloud database URL.

4. **Run the application**

   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3000`

## Usage Examples

### User Registration

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

### User Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "SecurePassword123!"
  }'
```

### Get All Users (Authenticated)

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Cookie: jwt=your-jwt-token"
```

### Get Specific User

```bash
curl -X GET http://localhost:3000/api/users/johndoe \
  -H "Cookie: jwt=your-jwt-token"
```

### Update User

```bash
curl -X PUT http://localhost:3000/api/users/johndoe \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=your-jwt-token" \
  -d '{
    "email": "newemail@example.com"
  }'
```

### Delete User (Admin only)

```bash
curl -X DELETE http://localhost:3000/api/users/johndoe \
  -H "Cookie: jwt=your-admin-jwt-token"
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Project Structure

```
backend/
├── controllers/
│   └── authController.js      # Business logic for auth operations
├── middleware/
│   ├── auth.js               # Authentication & authorization
│   ├── validation.js         # Request validation
│   └── rateLimit.js          # Rate limiting configuration
├── models/
│   └── User.js               # User schema definition
├── routes/
│   └── authRoutes.js         # API route definitions
├── utils/
│   └── jwtUtils.js           # JWT utility functions
├── tests/
│   └── setup.js              # Test configuration
├── .env                      # Environment variables
├── package.json              # Dependencies and scripts
└── server.js                 # Application entry point
```

## Security Features

- **Password Security**: Argon2 hashing algorithm
- **JWT Authentication**: Access and refresh token implementation
- **HTTP-Only Cookies**: Secure token storage
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Joi schema validation
- **CORS Configuration**: Cross-origin request handling
- **Helmet**: Security headers middleware
- **Role-Based Access**: User and Admin permissions

## API Response Format

### Success Response

```json
{
  "message": "Operation successful",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email@example.com"
  }
}
```

### Error Response

```json
{
  "error": "Error description"
}
```

## Environment Variables

| Variable                 | Description               | Default     |
| ------------------------ | ------------------------- | ----------- |
| `PORT`                   | Server port               | 3000        |
| `MONGODB_URI`            | MongoDB connection string | -           |
| `JWT_SECRET`             | JWT signing secret        | -           |
| `JWT_EXPIRES_IN`         | Access token expiration   | 15m         |
| `JWT_REFRESH_SECRET`     | Refresh token secret      | -           |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration  | 7d          |
| `NODE_ENV`               | Environment mode          | development |

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Support

For support and questions, please open an issue in the repository.
