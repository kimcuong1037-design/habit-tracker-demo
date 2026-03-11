import type { ReactNode } from "react";
import BottomNav from "./BottomNav.js";

interface LayoutProps {
  children: ReactNode;
}

/** 全局布局组件 — 移动端优先，居中内容区 + 底部导航 */
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 py-6 pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
