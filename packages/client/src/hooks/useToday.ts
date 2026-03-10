import { useState, useEffect, useCallback } from "react";
import * as todayApi from "../api/today.js";

type TodayData = Awaited<ReturnType<typeof todayApi.getToday>> extends { data: infer D } ? D : never;

/** 今日视图数据 hook */
export function useToday(date?: string) {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await todayApi.getToday(date);
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
