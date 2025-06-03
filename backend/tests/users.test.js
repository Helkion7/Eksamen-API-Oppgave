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

describe("User Management", () => {
  describe("Get All Users - GET /api/users", () => {
    test("Should get all users when authenticated", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Cookie", userCookie);

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
    describe("Authorization", () => {
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
    });

    describe("Validation", () => {
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
  });

  describe("Delete User - DELETE /api/users/:username", () => {
    describe("Admin operations", () => {
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

      test("Admin should not delete own account", async () => {
        const res = await request(app)
          .delete("/api/users/admin")
          .set("Cookie", adminCookie);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("error");
      });
    });

    describe("Authorization and validation", () => {
      test("Non-admin should not delete user", async () => {
        const res = await request(app)
          .delete("/api/users/admin")
          .set("Cookie", userCookie);

        expect(res.statusCode).toBe(403);
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
  });
});
