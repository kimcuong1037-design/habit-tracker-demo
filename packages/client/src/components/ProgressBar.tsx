interface ProgressBarProps {
  total: number;
  completed: number;
}

export default function ProgressBar({ total, completed }: ProgressBarProps) {
  const allDone = total > 0 && completed >= total;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">今日进度</span>
        <span className={allDone ? "font-medium text-amber-600" : "text-foreground"}>
          {allDone ? "今天全部达成！" : `${completed}/${total} 已完成`}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            allDone ? "bg-amber-500" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
