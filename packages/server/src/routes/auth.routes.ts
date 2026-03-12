import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "@habit-tracker/shared";
import * as authService from "../services/auth.service.js";

const router = Router();

// POST /api/auth/register — 用户注册
router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body.username, req.body.password);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login — 用户登录
router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body.username, req.body.password);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
