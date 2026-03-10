import express from "express";
import cors from "cors";
import { authPlaceholder } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import habitRoutes from "./routes/habit.routes.js";
import todayRoutes from "./routes/today.routes.js";
import checkinRoutes from "./routes/checkin.routes.js";
import milestoneRoutes from "./routes/milestone.routes.js";
import streakBreakRoutes from "./routes/streak-break.routes.js";

const app = express();

// 基础中间件
app.use(cors());
app.use(express.json());

// 认证预留（v1 注入默认用户 ID）
app.use(authPlaceholder);

// API 路由
app.use("/api/habits", habitRoutes);
app.use("/api/today", todayRoutes);
app.use("/api/check-ins", checkinRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/streak-breaks", streakBreakRoutes);

// 健康检查
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// 全局错误处理（放在最后）
app.use(errorHandler);

export default app;
