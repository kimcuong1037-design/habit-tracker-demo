import { Router } from "express";
import * as todayService from "../services/today.service.js";

const router = Router();

// GET /api/today — 今日综合视图
router.get("/", async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const date = (req.query.date as string) || undefined;
    const data = await todayService.getTodayView(userId, date);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
