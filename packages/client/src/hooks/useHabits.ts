import { useState, useEffect, useCallback } from "react";
import type { Habit, CreateHabitRequest, UpdateHabitRequest } from "@habit-tracker/shared";
import * as habitsApi from "../api/habits.js";

/** 习惯列表 CRUD hook */
export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await habitsApi.listHabits();
      setHabits(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (data: CreateHabitRequest) => {
    const res = await habitsApi.createHabit(data);
    await refresh();
    return res.data;
  };

  const update = async (id: string, data: UpdateHabitRequest) => {
    const res = await habitsApi.updateHabit(id, data);
    await refresh();
    return res.data;
  };

  const remove = async (id: string) => {
    await habitsApi.deleteHabit(id);
    await refresh();
  };

  return { habits, loading, error, refresh, create, update, remove };
}
