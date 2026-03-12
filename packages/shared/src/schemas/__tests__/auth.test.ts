import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "../../index.js";

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = registerSchema.safeParse({ username: "testuser", password: "pass123" });
    expect(result.success).toBe(true);
  });

  it("rejects username too short (< 3)", () => {
    const result = registerSchema.safeParse({ username: "ab", password: "pass123" });
    expect(result.success).toBe(false);
  });

  it("rejects username too long (> 20)", () => {
    const result = registerSchema.safeParse({
      username: "a".repeat(21),
      password: "pass123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects username with special chars", () => {
    const r1 = registerSchema.safeParse({ username: "test@user", password: "pass123" });
    const r2 = registerSchema.safeParse({ username: "test user", password: "pass123" });
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });

  it("accepts username with underscores", () => {
    const result = registerSchema.safeParse({ username: "test_user_1", password: "pass123" });
    expect(result.success).toBe(true);
  });

  it("rejects password too short (< 6)", () => {
    const result = registerSchema.safeParse({ username: "testuser", password: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects password too long (> 50)", () => {
    const result = registerSchema.safeParse({
      username: "testuser",
      password: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({ username: "demo", password: "demo1234" });
    expect(result.success).toBe(true);
  });

  it("rejects empty username", () => {
    const result = loginSchema.safeParse({ username: "", password: "demo1234" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ username: "demo", password: "" });
    expect(result.success).toBe(false);
  });
});
