import { z } from "zod";
import { CueType } from "../constants/enums.js";

/** 日期格式校验 (YYYY-MM-DD) */
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式须为 YYYY-MM-DD");

/** 创建习惯校验 */
export const createHabitSchema = z.object({
  name: z.string().min(1, "习惯名称不能为空").max(50, "习惯名称不能超过50个字符"),
  description: z.string().max(200, "描述不能超过200个字符").optional(),
  startDate: dateString,
  cueType: z.nativeEnum(CueType),
  cueValue: z.string().min(1, "触发场景不能为空"),
  stackedHabitId: z.string().uuid().optional(),
});

/** 更新习惯校验 */
export const updateHabitSchema = z.object({
  name: z.string().min(1, "习惯名称不能为空").max(50, "习惯名称不能超过50个字符").optional(),
  description: z.string().max(200, "描述不能超过200个字符").optional().nullable(),
  cueType: z.nativeEnum(CueType).optional(),
  cueValue: z.string().min(1, "触发场景不能为空").optional(),
  stackedHabitId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/** 打卡校验 */
export const createCheckInSchema = z.object({
  date: dateString,
});
