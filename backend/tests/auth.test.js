const request = require("supertest");
const { setupTestEnv, createTestUsers, dbHandler } = require("./testSetup");

let app;
let server;
let adminCookie;
let userCookie;

beforeAll(async () => {
  await dbHandler.connect();
  ({ app, server } = await setupTestEnv());
});

afterAll(async () => {
  await dbHandler.closeDatabase();
  server.close();
});

beforeEach(async () => {
  await dbHandler.clearDatabase();
  ({ adminCookie, userCookie } = await createTestUsers(app));
});

describe("Authentication", () => {
  describe("User Registration - POST /api/users", () => {
    describe("Successful registration", () => {
      test("Should register a new user successfully", async () => {
        const res = await request(app).post("/api/users").send({
          username: "newuser",
          email: "new@test.com",
          password: "password123",
        });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("user");
        expect(res.body.user.username).toBe("newuser");
        expect(res.body.user).not.toHaveProperty("password");
      });

      test("Should trim whitespace from username", async () => {
        const res = await request(app).post("/api/users").send({
          username: "  newuser  ", // Extra whitespace
          email: "new@test.com",
          password: "password123",
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.user.username).toBe("newuser"); // Should be trimmed
      });

      test("Should convert email to lowercase", async () => {
        const res = await request(app).post("/api/users").send({
          username: "newuser",
          email: "NEW@TEST.COM", // Uppercase email
          password: "password123",
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.user.email).toBe("new@test.com"); // Should be lowercase
      });
    });

    describe("Registration validation", () => {
      test("Should reject registration with missing fields", async () => {
        const res = await request(app).post("/api/users").send({
          username: "incomplete",
          email: "incomplete@test.com",
          // Missing password
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("password");
        expect(res.body.error).toContain("required");
      });

      test("Should reject registration with short password", async () => {
        const res = await request(app).post("/api/users").send({
          username: "shortpw",
          email: "short@test.com",
          password: "12345", // Too short
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("password");
        expect(res.body.error).toContain("at least 6");
      });

      test("Should reject registration with duplicate username", async () => {
        const res = await request(app).post("/api/users").send({
          username: "testuser", // Already exists
          email: "unique@test.com",
          password: "password123",
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error");
      });

      test("Should reject registration with duplicate email", async () => {
        const res = await request(app).post("/api/users").send({
          username: "uniqueuser",
          email: "test@test.com", // Already exists
          password: "password123",
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error");
      });
    });
  });

  describe("User Login - POST /api/login", () => {
    describe("Successful login", () => {
      test("Should login successfully with correct credentials", async () => {
        const res = await request(app).post("/api/login").send({
          username: "testuser",
          password: "password123",
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("user");
        expect(res.body.user.username).toBe("testuser");
        expect(res.headers["set-cookie"]).toBeDefined(); // Check for JWT cookie
      });
    });

    describe("Login validation", () => {
      test("Should reject login with incorrect password", async () => {
        const res = await request(app).post("/api/login").send({
          username: "testuser",
          password: "wrongpassword",
        });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error");
      });

      test("Should reject login with non-existent username", async () => {
        const res = await request(app).post("/api/login").send({
          username: "nonexistent",
          password: "password123",
        });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error");
      });

      test("Should reject login with missing fields", async () => {
        const res = await request(app).post("/api/login").send({
          username: "testuser",
          // Missing password
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("password");
        expect(res.body.error).toContain("required");
      });
    });
  });
});
