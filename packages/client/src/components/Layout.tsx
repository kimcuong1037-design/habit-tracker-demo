import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext.js";
import BottomNav from "./BottomNav.js";

interface LayoutProps {
  children: ReactNode;
}

/** 全局布局组件 — 移动端优先，居中内容区 + 底部导航 */
export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶栏 */}
      {user && (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2.5">
            <span className="text-sm text-muted-foreground">
              {user.username}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              登出
            </button>
          </div>
        </header>
      )}
      <div className="mx-auto max-w-md px-4 py-6 pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
