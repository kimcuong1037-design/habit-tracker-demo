import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { createTestUser, createTestHabit } from "../../__tests__/helpers.js";

describe("Habit Routes", () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T12:00:00Z"));

    const testUser = await createTestUser();
    token = testUser.token;
    userId = testUser.user.id;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).get("/api/habits");
    expect(res.status).toBe(401);
  });

  describe("POST /api/habits", () => {
    it("creates a habit", async () => {
      const res = await request(app)
        .post("/api/habits")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "读书",
          startDate: "2026-03-12",
          cueType: "trigger",
          cueValue: "睡前",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("读书");
    });

    it("returns 400 for invalid input", async () => {
      const res = await request(app)
        .post("/api/habits")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/habits", () => {
    it("returns habit list", async () => {
      await createTestHabit(userId);

      const res = await request(app)
        .get("/api/habits")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("DELETE /api/habits/:id", () => {
    it("deletes a habit", async () => {
      const habit = await createTestHabit(userId);

      const res = await request(app)
        .delete(`/api/habits/${habit.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Verify it's gone
      const listRes = await request(app)
        .get("/api/habits")
        .set("Authorization", `Bearer ${token}`);
      expect(listRes.body.data).toHaveLength(0);
    });

    it("returns 404 for non-existent habit", async () => {
      const res = await request(app)
        .delete("/api/habits/non-existent-id")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/habits/:id/check-ins", () => {
    it("creates a check-in", async () => {
      const habit = await createTestHabit(userId, { startDate: "2026-01-01" });

      const res = await request(app)
        .post(`/api/habits/${habit.id}/check-ins`)
        .set("Authorization", `Bearer ${token}`)
        .send({ date: "2026-03-12" });

      expect(res.status).toBe(201);
      expect(res.body.data.checkIn.date).toBe("2026-03-12");
    });
  });
});
