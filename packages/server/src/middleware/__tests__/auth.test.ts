import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { authenticate } from "../auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "habit-tracker-dev-secret";

function createMockReqResNext(authHeader?: string) {
  const req = { headers: { authorization: authHeader } } as any;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
  const next = vi.fn();
  return { req, res, next };
}

describe("authenticate middleware", () => {
  it("sets req.userId and calls next() for valid token", () => {
    const token = jwt.sign({ userId: "user-123", username: "test" }, JWT_SECRET);
    const { req, res, next } = createMockReqResNext(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(req.userId).toBe("user-123");
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when no Authorization header", () => {
    const { req, res, next } = createMockReqResNext(undefined);

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "UNAUTHORIZED" }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for malformed Authorization header", () => {
    const { req, res, next } = createMockReqResNext("Basic abc123");

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for invalid token", () => {
    const { req, res, next } = createMockReqResNext("Bearer invalid.token.here");

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for expired token", () => {
    const token = jwt.sign({ userId: "user-123" }, JWT_SECRET, { expiresIn: "-1s" });
    const { req, res, next } = createMockReqResNext(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
