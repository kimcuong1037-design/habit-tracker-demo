import path from "path";
import express from "express";
import cors from "cors";
import { authenticate } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth.routes.js";
import habitRoutes from "./routes/habit.routes.js";
import todayRoutes from "./routes/today.routes.js";
import checkinRoutes from "./routes/checkin.routes.js";
import milestoneRoutes from "./routes/milestone.routes.js";
import streakBreakRoutes from "./routes/streak-break.routes.js";

const app = express();

// 基础中间件
app.use(cors());
app.use(express.json());

// Production: 服务前端静态文件（最先匹配，无需认证）
const clientDist = path.resolve("packages/client/dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientDist));
}

// 公开路由（无需 JWT）
app.use("/api/auth", authRoutes);
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API 路由（需登录，每个路由前挂 authenticate）
app.use("/api/habits", authenticate, habitRoutes);
app.use("/api/today", authenticate, todayRoutes);
app.use("/api/check-ins", authenticate, checkinRoutes);
app.use("/api/milestones", authenticate, milestoneRoutes);
app.use("/api/streak-breaks", authenticate, streakBreakRoutes);

// Production: SPA fallback（非 API 请求都返回 index.html）
if (process.env.NODE_ENV === "production") {
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// 全局错误处理（放在最后）
app.use(errorHandler);

export default app;
