import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { validate } from "../validate.js";

const testSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
});

function createMockReqResNext(body: unknown) {
  const req = { body } as any;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
  const next = vi.fn();
  return { req, res, next };
}

describe("validate middleware", () => {
  it("calls next() with parsed data for valid input", () => {
    const { req, res, next } = createMockReqResNext({ name: "test", value: 42 });

    validate(testSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: "test", value: 42 });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid input", () => {
    const { req, res, next } = createMockReqResNext({ name: "", value: "not-a-number" });

    validate(testSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("strips extra fields from input", () => {
    const { req, res, next } = createMockReqResNext({
      name: "test",
      value: 1,
      extra: "should be stripped",
    });

    validate(testSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: "test", value: 1 });
    expect(req.body.extra).toBeUndefined();
  });
});
