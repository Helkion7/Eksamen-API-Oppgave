# Postman Collection for User/Login RESTful API

This collection contains all the endpoints for testing the User/Login RESTful API built with Node.js, Express, and MongoDB.

## Import Instructions

1. Open Postman
2. Click "Import" button
3. Select the `User-Login-API.postman_collection.json` file
4. Import the `User-Login-API.postman_environment.json` file as well
5. Select the "User-Login-API Environment" in the environment dropdown

## Environment Variables

- `baseUrl`: The base URL of your API (default: http://localhost:3000)
- `productionUrl`: Production URL (https://yourdomain.com)
- `currentUser`: Automatically set after login
- `adminUser`: Automatically set after admin login
- `testEmail`: Default test email
- `adminEmail`: Default admin email

## Test Flow

### Basic User Flow

1. **Health Check** - Verify API is running
2. **Create User** - Register a new user
3. **Login User** - Authenticate and set cookies
4. **Get All Users** - List all usernames (requires authentication)
5. **Get User by Username** - Get specific user details
6. **Update User** - Modify user information

### Admin Flow

1. **Create Admin User** - Register an admin user (you'll need to manually set role in database)
2. **Login as Admin** - Authenticate as admin
3. **Update User Role** - Promote user to admin
4. **Delete User** - Remove a user (admin only)

## Authentication

This API uses JWT tokens stored in HTTP-only cookies. Authentication is handled automatically by the browser/Postman after successful login.

## Rate Limiting

- General API: 100 requests per 15 minutes
- Login attempts: 5 attempts per 15 minutes
- Rate limiting is bypassed for Postman requests in development

## Error Handling

All endpoints return appropriate HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security Features

- Password hashing with Argon2
- JWT access and refresh tokens
- CORS configuration
- Rate limiting
- Input validation
- Security headers with Helmet
