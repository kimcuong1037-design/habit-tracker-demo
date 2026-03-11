import { Card, CardContent } from "@/components/ui/card.js";
import { Button } from "@/components/ui/button.js";

interface StreakBreakCardProps {
  habitName: string;
  breakDate: string;
  onDismiss: () => void;
}

export default function StreakBreakCard({
  habitName,
  breakDate,
  onDismiss,
}: StreakBreakCardProps) {
  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
      <CardContent className="px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-lg">💙</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              「{habitName}」在 {breakDate} 中断了
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              没关系。研究表明，偶尔的中断并不会前功尽弃——你之前建立的神经通路仍然在那里。重新开始，比第一次容易得多。
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="shrink-0 text-muted-foreground"
          >
            ✕
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
