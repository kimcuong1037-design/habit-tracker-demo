import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import Layout from "@/components/Layout.js";
import { Card, CardContent } from "@/components/ui/card.js";
import { Button } from "@/components/ui/button.js";
import { useMonthData, type MonthDayCell } from "@/hooks/useMonthData.js";

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

/** Heatmap color classes by intensity level (0–4), Emerald theme */
const LEVEL_CLASSES = [
  "bg-muted/40",          // 0: no check-ins
  "bg-emerald-200",       // 1: ≤25%
  "bg-emerald-400",       // 2: ≤50%
  "bg-emerald-500",       // 3: ≤75%
  "bg-emerald-600",       // 4: >75%
];

function getThisMonth(): Dayjs {
  return dayjs().startOf("month");
}

export default function MonthPage() {
  const [month, setMonth] = useState<Dayjs>(getThisMonth);
  const { data, loading } = useMonthData(month);

  const today = dayjs().format("YYYY-MM-DD");
  const isCurrentMonth = month.isSame(getThisMonth(), "month");
  const canGoNext = month.add(1, "month").isBefore(dayjs(), "month") || month.add(1, "month").isSame(dayjs(), "month");

  const handlePrev = () => setMonth((m) => m.subtract(1, "month"));
  const handleNext = () => {
    if (canGoNext) setMonth((m) => m.add(1, "month"));
  };
  const handleThisMonth = () => setMonth(getThisMonth());

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">月视图</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            打卡热力图，一览当月习惯密度
          </p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handlePrev}>
            ‹ 上月
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {month.format("YYYY年M月")}
            </span>
            {!isCurrentMonth && (
              <Button variant="outline" size="sm" onClick={handleThisMonth}>
                本月
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={isCurrentMonth}
          >
            下月 ›
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !data ? (
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
            {/* Heatmap grid */}
            <Card>
              <CardContent className="p-4">
                {/* Day-of-week headers */}
                <div className="mb-2 grid grid-cols-7 gap-1.5">
                  {DAY_LABELS.map((label) => (
                    <div
                      key={label}
                      className="text-center text-xs font-medium text-muted-foreground"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Empty padding cells for offset */}
                  {Array.from({ length: data.startOffset }, (_, i) => (
                    <div key={`pad-${i}`} />
                  ))}

                  {/* Day cells */}
                  {data.cells.map((cell) => (
                    <HeatmapCell
                      key={cell.date}
                      cell={cell}
                      isToday={cell.date === today}
                      isFuture={cell.date > today}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <span>少</span>
                  {LEVEL_CLASSES.map((cls, i) => (
                    <div
                      key={i}
                      className={`size-3.5 rounded-sm ${cls}`}
                    />
                  ))}
                  <span>多</span>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="py-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {data.completionRate}%
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    月度完成率
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {data.activeDays}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    活跃天数
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function HeatmapCell({
  cell,
  isToday,
  isFuture,
}: {
  cell: MonthDayCell;
  isToday: boolean;
  isFuture: boolean;
}) {
  const day = dayjs(cell.date).date();

  if (isFuture) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-md bg-muted/20 text-xs text-muted-foreground/40">
        {day}
      </div>
    );
  }

  return (
    <div
      className={`flex aspect-square items-center justify-center rounded-md text-xs font-medium ${
        LEVEL_CLASSES[cell.level]
      } ${
        isToday ? "ring-2 ring-primary ring-offset-1" : ""
      } ${
        cell.level >= 3 ? "text-white" : "text-foreground"
      }`}
      title={`${cell.date}: ${cell.checked}/${cell.total}`}
    >
      {day}
    </div>
  );
}
