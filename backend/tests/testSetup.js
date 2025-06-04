const request = require("supertest");
const mongoose = require("mongoose");
const User = require("../models/User");
const dbHandler = require("./db");
const createServer = require("../server");

// Setup function to initialize test environment
async function setupTestEnv() {
  const app = createServer();
  const server = app.listen(0); // Listen on a random port

  return { app, server };
}

// Create test users and get authentication cookies
async function createTestUsers(app) {
  // Create an admin user
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

  // Login and get cookies
  const adminRes = await request(app).post("/api/login").send({
    username: "admin",
    password: "admin123",
  });

  const userRes = await request(app).post("/api/login").send({
    username: "testuser",
    password: "password123",
  });

  // Extract both access and refresh tokens
  const adminCookies = adminRes.headers["set-cookie"];
  const userCookies = userRes.headers["set-cookie"];

  return {
    adminCookie: adminCookies.find((cookie) => cookie.startsWith("jwt=")),
    adminRefreshCookie: adminCookies.find((cookie) =>
      cookie.startsWith("refreshToken=")
    ),
    userCookie: userCookies.find((cookie) => cookie.startsWith("jwt=")),
    userRefreshCookie: userCookies.find((cookie) =>
      cookie.startsWith("refreshToken=")
    ),
  };
}

module.exports = {
  setupTestEnv,
  createTestUsers,
  dbHandler,
};
