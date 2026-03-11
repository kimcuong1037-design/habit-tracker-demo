import { useState } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import Layout from "@/components/Layout.js";
import ProgressBar from "@/components/ProgressBar.js";
import HabitCard from "@/components/HabitCard.js";
import StreakBreakCard from "@/components/StreakBreakCard.js";
import MilestoneDialog from "@/components/MilestoneDialog.js";
import EncouragementCard from "@/components/EncouragementCard.js";
import CreateHabitDialog from "@/components/CreateHabitDialog.js";
import EditHabitDialog from "@/components/EditHabitDialog.js";
import DeleteHabitDialog from "@/components/DeleteHabitDialog.js";
import { Button } from "@/components/ui/button.js";
import { Card, CardContent } from "@/components/ui/card.js";
import { useToday } from "@/hooks/useToday.js";
import { useHabits } from "@/hooks/useHabits.js";
import { createCheckIn, deleteHabit } from "@/api/habits.js";
import { dismissMilestone, dismissStreakBreak } from "@/api/today.js";

export default function HomePage() {
  const { data: today, loading, refresh: refreshToday } = useToday();
  const { habits, refresh: refreshHabits } = useHabits();
  const [createOpen, setCreateOpen] = useState(false);
  const [editHabitId, setEditHabitId] = useState<string | null>(null);
  const [deleteHabitId, setDeleteHabitId] = useState<string | null>(null);

  const activeHabits = habits.filter((h) => h.isActive);
  const editTarget = activeHabits.find((h) => h.id === editHabitId) ?? null;
  const deleteTarget = activeHabits.find((h) => h.id === deleteHabitId) ?? null;

  // Show the first pending milestone as a modal
  const activeMilestone = today?.pendingMilestones[0] ?? null;

  const refreshAll = async () => {
    await Promise.all([refreshHabits(), refreshToday()]);
  };

  const handleCheckIn = async (habitId: string) => {
    await createCheckIn(habitId, { date: dayjs().format("YYYY-MM-DD") });
    toast.success("打卡成功！");
    await refreshToday();
  };

  const handleDelete = async () => {
    if (!deleteHabitId) return;
    try {
      await deleteHabit(deleteHabitId);
      toast.success(`习惯已删除`);
      setDeleteHabitId(null);
      await refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败，请重试");
    }
  };

  const handleDismissMilestone = async () => {
    if (!activeMilestone) return;
    await dismissMilestone(activeMilestone.id);
    await refreshToday();
  };

  const handleDismissStreakBreak = async (id: string) => {
    await dismissStreakBreak(id);
    await refreshToday();
  };

  // Split today items into uncompleted / completed
  const uncompleted = today?.habits.filter((h) => !h.checkedInToday) ?? [];
  const completed = today?.habits.filter((h) => h.checkedInToday) ?? [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Habit Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            用科学的方法，养成更好的习惯
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !today || today.progress.total === 0 ? (
          /* Empty state */
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <div className="text-4xl">🌱</div>
              <p className="text-center text-muted-foreground">
                还没有习惯？创建你的第一个吧
              </p>
              <Button size="lg" onClick={() => setCreateOpen(true)}>
                ＋ 创建习惯
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress */}
            <ProgressBar
              total={today.progress.total}
              completed={today.progress.completed}
            />

            {/* AI encouragement */}
            {today.encouragement && (
              <EncouragementCard message={today.encouragement.message} />
            )}

            {/* Streak break comfort cards */}
            {today.pendingStreakBreaks.length > 0 && (
              <div className="space-y-3">
                {today.pendingStreakBreaks.map((sb) => (
                  <StreakBreakCard
                    key={sb.id}
                    habitName={sb.habitName}
                    breakDate={sb.breakDate}
                    onDismiss={() => handleDismissStreakBreak(sb.id)}
                  />
                ))}
              </div>
            )}

            {/* Uncompleted habits */}
            <div className="space-y-3">
              {uncompleted.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onCheckIn={handleCheckIn}
                  onEdit={setEditHabitId}
                  onDelete={setDeleteHabitId}
                />
              ))}
            </div>

            {/* Divider if both sections have items */}
            {uncompleted.length > 0 && completed.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">已完成</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

            {/* Completed habits */}
            {completed.length > 0 && (
              <div className="space-y-3">
                {completed.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onCheckIn={handleCheckIn}
                    onEdit={setEditHabitId}
                    onDelete={setDeleteHabitId}
                  />
                ))}
              </div>
            )}

            {/* FAB */}
            <div className="fixed bottom-6 right-6">
              <Button
                size="lg"
                onClick={() => setCreateOpen(true)}
                className="size-12 rounded-full shadow-lg"
              >
                <span className="text-xl">＋</span>
              </Button>
            </div>
          </>
        )}
      </div>

      <CreateHabitDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refreshAll}
        existingHabits={activeHabits}
      />

      {editTarget && (
        <EditHabitDialog
          open={!!editHabitId}
          onOpenChange={(open) => { if (!open) setEditHabitId(null); }}
          habit={editTarget}
          onUpdated={refreshAll}
          existingHabits={activeHabits}
        />
      )}

      <DeleteHabitDialog
        open={!!deleteHabitId}
        onOpenChange={(open) => { if (!open) setDeleteHabitId(null); }}
        habitName={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
      />

      {activeMilestone && (
        <MilestoneDialog
          open
          onDismiss={handleDismissMilestone}
          milestone={activeMilestone}
        />
      )}
    </Layout>
  );
}
