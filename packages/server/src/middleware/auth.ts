import type { Request, Response, NextFunction } from "express";

// v1：透传默认用户，不做实际认证
export function authPlaceholder(req: Request, _res: Response, next: NextFunction) {
  (req as any).userId = "default-user";
  next();
}
