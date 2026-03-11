import Anthropic from "@anthropic-ai/sdk";
import dayjs from "dayjs";
import { prisma } from "../utils/prisma.js";

// ── Static fallback library ──

const FALLBACK_MESSAGES = {
  dayOne: [
    "开始是最难的一步，但你已经迈出来了 (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧",
    "新的习惯，新的自己！加油 ٩(ˊᗜˋ*)و",
    "万事开头难，你做到了！继续保持 ☆*:.｡.o(≧▽≦)o.｡.:*☆",
  ],
  earlyStage: [
    "每一天的坚持都在为未来的自己铺路 ᕙ(⇀‸↼‶)ᕗ",
    "你正在建立属于自己的节奏，继续加油 (ง •_•)ง",
    "坚持的你，比昨天更强大了 ✧٩(ˊωˋ*)و✧",
    "好的开始！保持这份动力 ╰(*°▽°*)╯",
  ],
  stable: [
    "习惯正在慢慢扎根，你的大脑正在重塑 ᕙ(⇀‸↼‶)ᕗ",
    "稳定前进中！你的坚持值得骄傲 (ˊ˘ˋ*)♡",
    "节奏越来越好了，继续保持 ✧(≖ ◡ ≖✿)",
    "你的坚持正在改变你的神经回路 ᕦ(ò_óˇ)ᕤ",
  ],
  nearMilestone: [
    "快到里程碑了！冲刺吧 ٩(ˊᗜˋ*)و",
    "离下一个成就只差一点点了，加油！(ﾉ>ω<)ﾉ",
    "里程碑就在眼前，你一定可以的 ☆*:.｡.o(≧▽≦)o.｡.:*☆",
  ],
  allDone: [
    "全部搞定！今天的你超棒的 ✧(≖ ◡ ≖✿)",
    "今日任务全部达成！给自己一个大大的赞 (ノ´ヮ`)ノ*: ・ﾟ✧",
    "完美的一天！你做到了 ╰(*°▽°*)╯",
    "全部完成！你正在变成更好的自己 ✧٩(ˊωˋ*)و✧",
  ],
  comfort: [
    "没关系，休息也是旅程的一部分 (´；ω；`)♡ 明天继续就好",
    "偶尔的中断不会前功尽弃——你建立的神经通路还在那里 (っ˘̩╭╮˘̩)っ",
    "没事的，重新开始比第一次容易得多 ♡(ˊ͈ ꒳ ˋ͈)",
    "一次中断不代表失败，深呼吸，明天再来 (´・ω・`)♡",
  ],
};

function getRandomFallback(category: keyof typeof FALLBACK_MESSAGES): string {
  const messages = FALLBACK_MESSAGES[category];
  return messages[Math.floor(Math.random() * messages.length)];
}

// ── Context types ──

interface EncouragementContext {
  date: string;
  habits: Array<{
    name: string;
    currentStreak: number;
    checkedInToday: boolean;
    totalCheckIns: number;
  }>;
  progress: { total: number; completed: number; allDone: boolean };
  hasStreakBreaks: boolean;
}

// ── Determine state category ──

function categorize(ctx: EncouragementContext): keyof typeof FALLBACK_MESSAGES {
  if (ctx.hasStreakBreaks) return "comfort";
  if (ctx.progress.allDone) return "allDone";

  // Check if near a milestone (within 3 days)
  const milestoneThresholds = [7, 21, 30, 66, 100];
  for (const habit of ctx.habits) {
    for (const threshold of milestoneThresholds) {
      const remaining = threshold - habit.totalCheckIns;
      if (remaining > 0 && remaining <= 3) return "nearMilestone";
    }
  }

  // Streak-based categorization
  const maxStreak = Math.max(...ctx.habits.map((h) => h.currentStreak), 0);
  if (maxStreak === 0) return "dayOne";
  if (maxStreak <= 3) return "earlyStage";
  return "stable";
}

// ── Build prompt ──

function buildPrompt(ctx: EncouragementContext): string {
  const category = categorize(ctx);
  const habitSummary = ctx.habits
    .map((h) => `- 「${h.name}」：连续 ${h.currentStreak} 天，共 ${h.totalCheckIns} 次打卡${h.checkedInToday ? "（今日已完成）" : ""}`)
    .join("\n");

  const toneMap: Record<string, string> = {
    dayOne: "温暖鼓励，像朋友为新开始加油",
    earlyStage: "轻松友善，肯定早期的坚持",
    stable: "自信平稳，赞赏持续的节奏",
    nearMilestone: "兴奋冲刺，为即将到来的里程碑加油",
    allDone: "庆祝欢快，为今日全部完成鼓掌",
    comfort: "温暖安慰，像朋友安慰偶尔的中断",
  };

  return `你是一个习惯养成 app 的 AI 鼓励助手。请根据用户当前的习惯状态，生成一句个性化的鼓励语。

要求：
- 1-2 句话，简洁有力
- 必须包含至少一个颜文字或 emoji，增添活泼感
- 语气：${toneMap[category]}
- 用中文

当前状态：
- 日期：${ctx.date}
- 今日进度：${ctx.progress.completed}/${ctx.progress.total}${ctx.progress.allDone ? "（全部完成！）" : ""}
${ctx.hasStreakBreaks ? "- ⚠️ 有习惯的连续打卡刚刚中断\n" : ""}
习惯列表：
${habitSummary}

只输出鼓励语本身，不要加引号或其他格式。`;
}

// ── Main service ──

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

export async function getOrGenerateEncouragement(
  ctx: EncouragementContext,
): Promise<{ message: string; source: "ai" | "fallback" }> {
  // 1. Check cache
  const cached = await prisma.dailyEncouragement.findUnique({
    where: { date: ctx.date },
  });
  if (cached) {
    return { message: cached.message, source: cached.source as "ai" | "fallback" };
  }

  // 2. Try AI generation
  const client = getClient();
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

  if (client) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: 150,
        messages: [{ role: "user", content: buildPrompt(ctx) }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const message = textBlock?.text?.trim() ?? "";

      if (message) {
        await prisma.dailyEncouragement.create({
          data: {
            date: ctx.date,
            message,
            source: "ai",
            context: JSON.stringify({
              category: categorize(ctx),
              progress: ctx.progress,
              hasStreakBreaks: ctx.hasStreakBreaks,
            }),
          },
        });
        return { message, source: "ai" };
      }
    } catch {
      // Fall through to fallback
    }
  }

  // 3. Fallback
  const category = categorize(ctx);
  const message = getRandomFallback(category);

  await prisma.dailyEncouragement.create({
    data: {
      date: ctx.date,
      message,
      source: "fallback",
      context: JSON.stringify({ category }),
    },
  });

  return { message, source: "fallback" };
}
