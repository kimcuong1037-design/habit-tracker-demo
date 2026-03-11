import { useLocation, useNavigate } from "react-router";
import { CalendarCheck, LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const tabs: { path: string; label: string; icon: LucideIcon }[] = [
  { path: "/", label: "今日", icon: CalendarCheck },
  { path: "/week", label: "周视图", icon: LayoutGrid },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.5 : 1.5} />
              <span className={active ? "font-semibold" : "font-medium"}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
