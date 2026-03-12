import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import * as authService from "../auth.service.js";
import { AppError } from "../../middleware/error-handler.js";

const JWT_SECRET = process.env.JWT_SECRET || "habit-tracker-dev-secret";

describe("auth.service", () => {
  describe("register", () => {
    it("creates user and returns valid JWT", async () => {
      const result = await authService.register("newuser", "password123");

      expect(result.user.username).toBe("newuser");
      expect(result.user.id).toBeDefined();
      expect(result.token).toBeDefined();

      const payload = jwt.verify(result.token, JWT_SECRET) as any;
      expect(payload.userId).toBe(result.user.id);
      expect(payload.username).toBe("newuser");
    });

    it("throws 409 for duplicate username", async () => {
      await authService.register("duplicate", "password123");

      await expect(authService.register("duplicate", "other123")).rejects.toThrow(AppError);
      try {
        await authService.register("duplicate", "other123");
      } catch (err) {
        expect((err as AppError).statusCode).toBe(409);
        expect((err as AppError).code).toBe("USERNAME_TAKEN");
      }
    });
  });

  describe("login", () => {
    it("returns token for valid credentials", async () => {
      await authService.register("loginuser", "password123");
      const result = await authService.login("loginuser", "password123");

      expect(result.user.username).toBe("loginuser");
      expect(result.token).toBeDefined();
    });

    it("throws 401 for wrong password", async () => {
      await authService.register("wrongpw", "password123");

      await expect(authService.login("wrongpw", "wrongpass")).rejects.toThrow(AppError);
      try {
        await authService.login("wrongpw", "wrongpass");
      } catch (err) {
        expect((err as AppError).statusCode).toBe(401);
      }
    });

    it("throws 401 for non-existent user", async () => {
      await expect(authService.login("ghost", "password123")).rejects.toThrow(AppError);
      try {
        await authService.login("ghost", "password123");
      } catch (err) {
        expect((err as AppError).statusCode).toBe(401);
      }
    });
  });
});
