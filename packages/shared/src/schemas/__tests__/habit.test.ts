import { describe, it, expect } from "vitest";
import { createHabitSchema, updateHabitSchema, createCheckInSchema } from "../../index.js";

describe("createHabitSchema", () => {
  const validInput = {
    name: "早起跑步",
    startDate: "2026-01-01",
    cueType: "trigger",
    cueValue: "起床后",
  };

  it("accepts valid input", () => {
    const result = createHabitSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with optional fields", () => {
    const result = createHabitSchema.safeParse({
      ...validInput,
      description: "每天早上跑步30分钟",
      reminderTime: "08:00",
      stackedHabitId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createHabitSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 50 chars", () => {
    const result = createHabitSchema.safeParse({
      ...validInput,
      name: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const r1 = createHabitSchema.safeParse({ ...validInput, startDate: "2026/01/01" });
    const r2 = createHabitSchema.safeParse({ ...validInput, startDate: "abc" });
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });

  it("rejects invalid cueType", () => {
    const result = createHabitSchema.safeParse({ ...validInput, cueType: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects empty cueValue", () => {
    const result = createHabitSchema.safeParse({ ...validInput, cueValue: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid stackedHabitId (non-UUID)", () => {
    const result = createHabitSchema.safeParse({
      ...validInput,
      stackedHabitId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid reminderTime format", () => {
    const r1 = createHabitSchema.safeParse({ ...validInput, reminderTime: "25:00" });
    const r2 = createHabitSchema.safeParse({ ...validInput, reminderTime: "8:00" });
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });

  it("accepts valid reminderTime", () => {
    const result = createHabitSchema.safeParse({ ...validInput, reminderTime: "08:30" });
    expect(result.success).toBe(true);
  });

  it("accepts null reminderTime", () => {
    const result = createHabitSchema.safeParse({ ...validInput, reminderTime: null });
    expect(result.success).toBe(true);
  });
});

describe("updateHabitSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updateHabitSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update", () => {
    const result = updateHabitSchema.safeParse({ name: "新名称" });
    expect(result.success).toBe(true);
  });

  it("validates name when provided", () => {
    const result = updateHabitSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts isActive and sortOrder", () => {
    const result = updateHabitSchema.safeParse({ isActive: false, sortOrder: 2 });
    expect(result.success).toBe(true);
  });
});

describe("createCheckInSchema", () => {
  it("accepts valid date", () => {
    const result = createCheckInSchema.safeParse({ date: "2026-03-12" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const result = createCheckInSchema.safeParse({ date: "2026/03/12" });
    expect(result.success).toBe(false);
  });

  it("rejects missing date", () => {
    const result = createCheckInSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
