import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext.js";
import { Button } from "@/components/ui/button.js";
import { Card, CardContent } from "@/components/ui/card.js";
import AuthDialog from "@/components/AuthDialog.js";

const SCIENCE_CARDS = [
  {
    icon: "🔄",
    title: "习惯回路",
    subtitle: "提示 → 惯例 → 奖赏",
    description: "大脑将重复行为编码为自动化程序，通过建立固定的触发-行动-奖赏循环，让好习惯变得毫不费力。",
  },
  {
    icon: "📅",
    title: "66 天法则",
    subtitle: "平均 66 天养成一个新习惯",
    description: "伦敦大学研究发现，一个行为平均需要 66 天才能成为自动化习惯。关键在于保持耐心和持续性。",
  },
  {
    icon: "🔗",
    title: "习惯叠加",
    subtitle: "把新习惯绑定在已有习惯之后",
    description: "利用已有习惯的惯性力量，将新行为与旧行为绑定，大幅降低启动新习惯的心理阻力。",
  },
  {
    icon: "🏠",
    title: "环境设计",
    subtitle: "让好习惯更容易，坏习惯更困难",
    description: "通过调整环境来减少好习惯的阻力、增加坏习惯的阻力，让正确的选择成为最自然的选择。",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

  // 已登录用户自动跳转主页
  useEffect(() => {
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [user, navigate]);

  // 卡片入场动画
  useEffect(() => {
    SCIENCE_CARDS.forEach((_, i) => {
      setTimeout(() => {
        setVisibleCards((prev) => [...prev, i]);
      }, 300 + i * 150);
    });
  }, []);

  function openAuth(mode: "login" | "register") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  if (user) return null;

  return (
    <div className="min-h-screen">
      {/* 动态渐变背景 */}
      <div className="fixed inset-0 -z-10 animate-gradient bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 bg-[length:200%_200%]" />

      {/* 浮动光斑装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl animate-float" />
        <div className="absolute -right-20 top-1/2 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl animate-float-delayed" />
        <div className="absolute bottom-1/4 left-1/3 h-48 w-48 rounded-full bg-emerald-100/40 blur-3xl animate-float-slow" />
      </div>

      {/* Hero 区域 */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-3 text-5xl font-bold tracking-tight text-stone-800">
          <span className="mr-2">🌱</span>Habit Tracker
        </h1>
        <p className="mb-8 text-lg text-stone-600">
          用科学的方法，养成更好的习惯
        </p>

        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={() => openAuth("register")}
            className="px-8"
          >
            开始注册
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => openAuth("login")}
            className="px-8"
          >
            登录
          </Button>
        </div>

        <p className="mt-4 text-sm text-stone-500">
          💡 体验账号：demo / demo1234
        </p>
      </section>

      {/* 科学知识卡片区 */}
      <section className="mx-auto max-w-2xl px-6 pb-20">
        <h2 className="mb-8 text-center text-xl font-semibold text-stone-700">
          ── 科学帮你养成好习惯 ──
        </h2>

        <div className="space-y-4">
          {SCIENCE_CARDS.map((card, i) => (
            <Card
              key={card.title}
              className={`transition-all duration-500 ${
                visibleCards.includes(i)
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0"
              }`}
            >
              <CardContent className="flex gap-4 p-5">
                <span className="text-3xl">{card.icon}</span>
                <div>
                  <h3 className="font-semibold text-stone-800">
                    {card.title}
                  </h3>
                  <p className="text-sm font-medium text-emerald-600">
                    {card.subtitle}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 注册/登录 Dialog */}
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        initialMode={authMode}
      />
    </div>
  );
}
