// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1h";
process.env.JWT_COOKIE_EXPIRES_IN = "1";
process.env.ARGON2_MEMORY_COST = "4096"; // Lower for tests
process.env.ARGON2_TIME_COST = "1"; // Lower for tests
process.env.ARGON2_PARALLELISM = "1";

// Increase timeout for tests
jest.setTimeout(30000);
