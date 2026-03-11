import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.js";

const MILESTONE_META: Record<string, { icon: string; label: string; message: string }> = {
  "7d": {
    icon: "🎯",
    label: "7 天成就",
    message: "连续 7 天！你的大脑正在建立新的神经通路，坚持下去。",
  },
  "21d": {
    icon: "🌟",
    label: "21 天成就",
    message: "21 天！习惯的雏形已经形成，你正在重塑自己的行为模式。",
  },
  "30d": {
    icon: "🎖️",
    label: "30 天成就",
    message: "一个月了！你已经证明了自己的毅力，继续保持这份坚持。",
  },
  "66d": {
    icon: "🏆",
    label: "66 天里程碑",
    message: '66 天——研究表明，这是一个习惯从"努力坚持"变为"自然而然"的平均时间。你做到了。',
  },
  "100d": {
    icon: "💎",
    label: "100 天传奇",
    message: "100 天！这个习惯已经成为你生活的一部分，了不起的成就。",
  },
};

interface MilestoneDialogProps {
  open: boolean;
  onDismiss: () => void;
  milestone: {
    id: string;
    habitName: string;
    type: string;
    totalDays: number;
    completionRate: number;
    longestStreak: number;
  };
}

export default function MilestoneDialog({
  open,
  onDismiss,
  milestone,
}: MilestoneDialogProps) {
  const meta = MILESTONE_META[milestone.type] ?? {
    icon: "🎯",
    label: `${milestone.totalDays} 天成就`,
    message: "你做得很棒！",
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            <span className="text-3xl">{meta.icon}</span>
            <div className="mt-2">{meta.label}</div>
            <div className="mt-1 text-sm font-normal text-muted-foreground">
              「{milestone.habitName}」
            </div>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-left">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                📊 数据
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>总打卡天数</span>
                  <span className="font-medium text-foreground">
                    {milestone.totalDays} 天
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>完成率</span>
                  <span className="font-medium text-foreground">
                    {Math.round(milestone.completionRate * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>最长连续</span>
                  <span className="font-medium text-foreground">
                    {milestone.longestStreak} 天
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm">{meta.message}</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onDismiss} className="w-full">
            知道了 ✓
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
