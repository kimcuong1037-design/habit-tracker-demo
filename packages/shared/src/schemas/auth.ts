import { z } from "zod";

/** 注册校验 */
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "用户名至少 3 个字符")
    .max(20, "用户名最多 20 个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
  password: z
    .string()
    .min(6, "密码至少 6 个字符")
    .max(50, "密码最多 50 个字符"),
});

/** 登录校验 */
export const loginSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});
