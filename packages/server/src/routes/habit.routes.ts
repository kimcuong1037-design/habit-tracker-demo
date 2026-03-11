import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createHabitSchema, updateHabitSchema, createCheckInSchema } from "@habit-tracker/shared";
import * as habitService from "../services/habit.service.js";
import * as checkinService from "../services/checkin.service.js";

const router = Router();

// POST /api/habits — 创建习惯
router.post("/", validate(createHabitSchema), async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const habit = await habitService.createHabit(userId, req.body);
    res.status(201).json({ data: habit });
  } catch (err) {
    next(err);
  }
});

// GET /api/habits — 获取习惯列表
router.get("/", async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const date = (req.query.date as string) || undefined;
    const active = req.query.active !== "false";
    const habits = await habitService.listHabits(userId, { date, active });
    res.json({ data: habits });
  } catch (err) {
    next(err);
  }
});

// GET /api/habits/:id — 获取单个习惯详情
router.get("/:id", async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const habit = await habitService.getHabit(userId, req.params.id);
    res.json({ data: habit });
  } catch (err) {
    next(err);
  }
});

// PUT /api/habits/:id — 更新习惯
router.put("/:id", validate(updateHabitSchema), async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const habit = await habitService.updateHabit(userId, req.params.id as string, req.body);
    res.json({ data: habit });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/habits/:id — 删除习惯
router.delete("/:id", async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    await habitService.deleteHabit(userId, req.params.id);
    res.json({ message: "Habit deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// POST /api/habits/:id/check-ins — 打卡
router.post("/:id/check-ins", validate(createCheckInSchema), async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const result = await checkinService.createCheckIn(userId, req.params.id as string, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/habits/:id/check-ins — 获取打卡历史
router.get("/:id/check-ins", async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const checkIns = await checkinService.listCheckIns(userId, req.params.id, { from, to });
    res.json({ data: checkIns });
  } catch (err) {
    next(err);
  }
});

export default router;
