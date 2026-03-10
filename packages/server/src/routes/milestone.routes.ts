import { Router } from "express";
import * as milestoneService from "../services/milestone.service.js";

const router = Router();

// POST /api/milestones/:id/dismiss — 关闭里程碑回顾
router.post("/:id/dismiss", async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const result = await milestoneService.dismissMilestone(userId, req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
