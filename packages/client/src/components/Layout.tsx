import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

/** 全局布局组件 — 移动端优先，居中内容区 */
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-6">{children}</div>
    </div>
  );
}
