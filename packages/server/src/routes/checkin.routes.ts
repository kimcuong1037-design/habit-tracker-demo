import { Router } from "express";
import * as checkinService from "../services/checkin.service.js";

const router = Router();

// GET /api/check-ins/retroactive-quota — 查询本月补卡配额
router.get("/retroactive-quota", async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const date = (req.query.date as string) || undefined;
    const quota = await checkinService.getRetroactiveQuota(userId, date);
    res.json({ data: quota });
  } catch (err) {
    next(err);
  }
});

export default router;
