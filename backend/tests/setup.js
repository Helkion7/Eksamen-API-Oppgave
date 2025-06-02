// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.JWT_COOKIE_EXPIRES_IN = "1";

// Increase test timeout for slower tests
jest.setTimeout(30000);
