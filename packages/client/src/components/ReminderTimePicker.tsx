import { Bell, BellOff } from "lucide-react";
import { Badge } from "@/components/ui/badge.js";
import { Button } from "@/components/ui/button.js";

const TIME_PRESETS = [
  { label: "早 8:00", value: "08:00" },
  { label: "中 12:00", value: "12:00" },
  { label: "晚 20:00", value: "20:00" },
];

interface ReminderTimePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export default function ReminderTimePicker({
  value,
  onChange,
}: ReminderTimePickerProps) {
  const enabled = value !== null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm font-medium">
          {enabled ? (
            <Bell className="size-3.5 text-primary" />
          ) : (
            <BellOff className="size-3.5 text-muted-foreground" />
          )}
          每日提醒（可选）
        </label>
        {enabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => onChange(null)}
          >
            关闭
          </Button>
        )}
      </div>

      {enabled ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {TIME_PRESETS.map((preset) => (
              <Badge
                key={preset.value}
                variant={value === preset.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() =>
                  onChange(value === preset.value ? preset.value : preset.value)
                }
              >
                {preset.label}
              </Badge>
            ))}
          </div>
          <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/50"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onChange("08:00")}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-dashed border-input px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <Bell className="size-3.5" />
          点击设置提醒时间
        </button>
      )}
    </div>
  );
}
