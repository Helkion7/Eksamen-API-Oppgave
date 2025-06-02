const request = require("supertest");
const mongoose = require("mongoose");
const express = require("express");
const cookieParser = require("cookie-parser");
const User = require("../models/User");
const dbHandler = require("./db");

// Import app creator function (to be created)
const createServer = require("../server");

let app;
let server;
let adminToken;
let userToken;
let adminCookie;
let userCookie;

beforeAll(async () => {
  await dbHandler.connect();

  // Create the Express app
  app = createServer(); // Using the app creator function now

  server = app.listen(0); // Listen on a random port
});

afterAll(async () => {
  await dbHandler.closeDatabase();
  server.close();
});

beforeEach(async () => {
  await dbHandler.clearDatabase();

  // Create an admin user and a regular user for testing
  await request(app).post("/api/users").send({
    username: "admin",
    email: "admin@test.com",
    password: "admin123",
  });

  // Upgrade to admin manually
  const admin = await User.findOne({ username: "admin" });
  admin.role = "admin";
  await admin.save();

  // Create a regular user
  await request(app).post("/api/users").send({
    username: "testuser",
    email: "test@test.com",
    password: "password123",
  });

  // Login and save tokens
  const adminRes = await request(app).post("/api/login").send({
    username: "admin",
    password: "admin123",
  });

  const userRes = await request(app).post("/api/login").send({
    username: "testuser",
    password: "password123",
  });

  adminCookie = adminRes.headers["set-cookie"][0];
  userCookie = userRes.headers["set-cookie"][0];
});

describe("User Registration - POST /api/users", () => {
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

describe("User Login - POST /api/login", () => {
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

describe("Get All Users - GET /api/users", () => {
  test("Should get all users when authenticated", async () => {
    const res = await request(app).get("/api/users").set("Cookie", userCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("users");
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBe(2); // admin and testuser

    // Check that only usernames are returned
    expect(res.body.users[0]).not.toHaveProperty("email");
    expect(res.body.users[0]).not.toHaveProperty("password");
  });

  test("Should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/users");

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error");
  });
});

describe("Get User by Username - GET /api/users/:username", () => {
  test("Should get user details when authenticated", async () => {
    const res = await request(app)
      .get("/api/users/testuser")
      .set("Cookie", userCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.username).toBe("testuser");
    expect(res.body.user).not.toHaveProperty("password");
  });

  test("Should return 404 for non-existent user", async () => {
    const res = await request(app)
      .get("/api/users/nonexistent")
      .set("Cookie", userCookie);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  test("Should reject unauthenticated request", async () => {
    const res = await request(app).get("/api/users/testuser");

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error");
  });
});

describe("Update User - PUT /api/users/:username", () => {
  test("User should update their own account", async () => {
    const res = await request(app)
      .put("/api/users/testuser")
      .set("Cookie", userCookie)
      .send({
        email: "updated@test.com",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe("updated@test.com");
  });

  test("Admin should update any user account", async () => {
    const res = await request(app)
      .put("/api/users/testuser")
      .set("Cookie", adminCookie)
      .send({
        email: "admin-updated@test.com",
        role: "admin",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe("admin-updated@test.com");
    expect(res.body.user.role).toBe("admin");
  });

  test("User should not update another user account", async () => {
    const res = await request(app)
      .put("/api/users/admin")
      .set("Cookie", userCookie)
      .send({
        email: "hacked@test.com",
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  test("Non-admin should not update user roles", async () => {
    const res = await request(app)
      .put("/api/users/testuser")
      .set("Cookie", userCookie)
      .send({
        role: "admin",
      });

    // The request should succeed but the role should not change
    expect(res.statusCode).toBe(200);

    // Verify that role wasn't changed
    const checkUser = await request(app)
      .get("/api/users/testuser")
      .set("Cookie", userCookie);

    expect(checkUser.body.user.role).toBe("user");
  });

  test("Should validate password length on update", async () => {
    const res = await request(app)
      .put("/api/users/testuser")
      .set("Cookie", userCookie)
      .send({
        password: "12345", // Too short
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toContain("password");
    expect(res.body.error).toContain("at least 6");
  });

  test("Should validate email format on update", async () => {
    const res = await request(app)
      .put("/api/users/testuser")
      .set("Cookie", userCookie)
      .send({
        email: "not-an-email", // Invalid email format
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toContain("email");
  });

  test("Should convert email to lowercase on update", async () => {
    const res = await request(app)
      .put("/api/users/testuser")
      .set("Cookie", userCookie)
      .send({
        email: "UPDATED@TEST.COM", // Uppercase email
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe("updated@test.com"); // Should be lowercase
  });

  test("Should validate role values on update", async () => {
    const res = await request(app)
      .put("/api/users/testuser")
      .set("Cookie", adminCookie)
      .send({
        role: "superuser", // Invalid role
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toContain("role");
  });
});

describe("Delete User - DELETE /api/users/:username", () => {
  test("Admin should delete user", async () => {
    const res = await request(app)
      .delete("/api/users/testuser")
      .set("Cookie", adminCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");

    // Verify user is deleted
    const checkUser = await request(app)
      .get("/api/users/testuser")
      .set("Cookie", adminCookie);

    expect(checkUser.statusCode).toBe(404);
  });

  test("Non-admin should not delete user", async () => {
    const res = await request(app)
      .delete("/api/users/admin")
      .set("Cookie", userCookie);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  test("Admin should not delete own account", async () => {
    const res = await request(app)
      .delete("/api/users/admin")
      .set("Cookie", adminCookie);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("Should return 404 for non-existent user", async () => {
    const res = await request(app)
      .delete("/api/users/nonexistent")
      .set("Cookie", adminCookie);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
