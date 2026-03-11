import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import { toast } from "sonner";
import Layout from "@/components/Layout.js";
import { Card, CardContent } from "@/components/ui/card.js";
import { Button } from "@/components/ui/button.js";
import { useWeekData } from "@/hooks/useWeekData.js";
import { createCheckIn } from "@/api/habits.js";

dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

function getThisWeekStart(): Dayjs {
  return dayjs().isoWeekday(1).startOf("day");
}

export default function WeekPage() {
  const [weekStart, setWeekStart] = useState<Dayjs>(getThisWeekStart);
  const { data, loading, refresh } = useWeekData(weekStart);

  const today = dayjs().format("YYYY-MM-DD");
  const thisWeekStart = getThisWeekStart();
  const isCurrentWeek = weekStart.isSame(thisWeekStart, "day");

  // Don't allow navigating to a fully-future week
  const canGoNext = weekStart.add(7, "day").isSameOrBefore(thisWeekStart, "day");

  const handlePrev = () => setWeekStart((ws) => ws.subtract(7, "day"));
  const handleNext = () => {
    if (canGoNext) setWeekStart((ws) => ws.add(7, "day"));
  };
  const handleToday = () => setWeekStart(getThisWeekStart());

  const handleCheckIn = async (habitId: string) => {
    try {
      await createCheckIn(habitId, { date: today });
      toast.success("打卡成功！");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "打卡失败");
    }
  };

  const weekLabel = data
    ? `${data.weekStart.format("M月D日")}–${data.weekEnd.format("M月D日")}`
    : "";

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">周视图</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            回顾本周打卡表现
          </p>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handlePrev}>
            ‹ 上周
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{weekLabel}</span>
            {!isCurrentWeek && (
              <Button variant="outline" size="sm" onClick={handleToday}>
                今
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={!canGoNext}
          >
            下周 ›
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !data || data.rows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <div className="text-4xl">🌱</div>
              <p className="text-center text-muted-foreground">
                还没有活跃的习惯
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Week matrix */}
            <Card>
              <CardContent className="overflow-x-auto p-4">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="pb-2 text-left text-xs font-medium text-muted-foreground">
                        习惯
                      </th>
                      {data.dates.map((date, i) => {
                        const isToday = date.format("YYYY-MM-DD") === today;
                        return (
                          <th
                            key={i}
                            className={`w-8 pb-2 text-center text-xs font-medium ${
                              isToday
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          >
                            <div>{DAY_LABELS[i]}</div>
                            <div className="mt-0.5 text-[10px]">
                              {date.format("D")}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map(({ habit, days }) => (
                      <tr key={habit.id} className="border-t border-border/50">
                        <td className="max-w-[100px] truncate py-2 pr-2 text-sm font-medium text-foreground">
                          {habit.name}
                        </td>
                        {days.map((checkIn, i) => {
                          const dateStr = data.dates[i].format("YYYY-MM-DD");
                          const isFuture = dateStr > today;
                          const isBeforeStart = dateStr < habit.startDate;
                          const isTodayCell = dateStr === today;
                          const checked = checkIn !== null;

                          return (
                            <td key={i} className="py-2 text-center">
                              <WeekCell
                                checked={checked}
                                isToday={isTodayCell}
                                isFuture={isFuture}
                                isBeforeStart={isBeforeStart}
                                onClick={
                                  isTodayCell && !checked
                                    ? () => handleCheckIn(habit.id)
                                    : undefined
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Completion rate */}
            <div className="text-center text-sm text-muted-foreground">
              本周完成率：
              <span className="font-semibold text-foreground">
                {data.completionRate}%
              </span>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

/** Single cell in the week matrix */
function WeekCell({
  checked,
  isToday,
  isFuture,
  isBeforeStart,
  onClick,
}: {
  checked: boolean;
  isToday: boolean;
  isFuture: boolean;
  isBeforeStart: boolean;
  onClick?: () => void;
}) {
  // Before habit start date or future: grey/empty
  if (isBeforeStart || isFuture) {
    return (
      <div className="mx-auto size-6 rounded-md bg-muted/30" />
    );
  }

  // Today + not checked: clickable diamond
  if (isToday && !checked) {
    return (
      <button
        onClick={onClick}
        className="mx-auto flex size-6 items-center justify-center rounded-md border-2 border-primary bg-primary/10 text-primary transition-colors hover:bg-primary/20"
      >
        <span className="text-xs">◇</span>
      </button>
    );
  }

  // Checked
  if (checked) {
    return (
      <div
        className={`mx-auto size-6 rounded-md ${
          isToday ? "bg-primary ring-2 ring-primary/30" : "bg-primary/80"
        }`}
      />
    );
  }

  // Past + not checked: empty
  return (
    <div className="mx-auto size-6 rounded-md border border-border bg-background" />
  );
}
