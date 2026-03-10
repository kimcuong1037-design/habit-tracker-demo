import { Router } from "express";
import * as streakBreakService from "../services/streak-break.service.js";

const router = Router();

// POST /api/streak-breaks/:id/dismiss — 关闭断裂安慰消息
router.post("/:id/dismiss", async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const result = await streakBreakService.dismissStreakBreak(userId, req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
