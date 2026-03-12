import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";

describe("Auth Routes", () => {
  describe("GET /api/health", () => {
    it("returns 200", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });

  describe("POST /api/auth/register", () => {
    it("registers a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "newuser", password: "pass123456" });

      expect(res.status).toBe(201);
      expect(res.body.data.user.username).toBe("newuser");
      expect(res.body.data.token).toBeDefined();
    });

    it("returns 409 for duplicate username", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({ username: "dupe", password: "pass123456" });

      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "dupe", password: "other123456" });

      expect(res.status).toBe(409);
    });

    it("returns 400 for invalid input", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ username: "ab", password: "12" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({ username: "logintest", password: "pass123456" });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "logintest", password: "pass123456" });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it("returns 401 for wrong credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "nobody", password: "wrong123" });

      expect(res.status).toBe(401);
    });
  });
});
