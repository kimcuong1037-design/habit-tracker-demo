import { Card, CardContent } from "@/components/ui/card.js";

interface EncouragementCardProps {
  message: string;
}

export default function EncouragementCard({ message }: EncouragementCardProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="px-4 py-3">
        <div className="flex items-start gap-2">
          <span className="shrink-0 text-base">🤖</span>
          <p className="text-sm leading-relaxed text-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
