const request = require("supertest");
const { setupTestEnv, dbHandler } = require("./testSetup");

let app;
let server;

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
});

describe("Health Check - GET /api/health", () => {
  test("Should return health status successfully", async () => {
    const res = await request(app).get("/api/health");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("database");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("memory");
    expect(res.body).toHaveProperty("version");
  });

  test("Should include database connection status", async () => {
    const res = await request(app).get("/api/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.database).toBe("connected");
  });

  test("Should include system information", async () => {
    const res = await request(app).get("/api/health");

    expect(res.statusCode).toBe(200);
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.memory).toHaveProperty("rss");
    expect(res.body.memory).toHaveProperty("heapTotal");
    expect(res.body.memory).toHaveProperty("heapUsed");
    expect(res.body.version).toMatch(/^v\d+\.\d+\.\d+/);
  });

  test("Should include valid timestamp", async () => {
    const res = await request(app).get("/api/health");

    expect(res.statusCode).toBe(200);
    const timestamp = new Date(res.body.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).not.toBeNaN();
  });

  test("Should be accessible without authentication", async () => {
    const res = await request(app).get("/api/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("OK");
  });
});
