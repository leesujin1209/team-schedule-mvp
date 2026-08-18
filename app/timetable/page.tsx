"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TimetableGrid from "@/components/TimetableGrid";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { Day, SelectedSlots, slotKey } from "@/types/timetable";
import { slotsToScheduleRows, scheduleRowsToSlots } from "@/lib/scheduleMapping";

export default function TimetablePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useSupabaseUser();

  // 선택된 슬롯 state (화면 표시용). 저장/불러오기는 아래에서 Supabase와 동기화한다
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlots>(new Set());
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 로그인하지 않은 사용자는 로그인 페이지로 이동시킨다
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login");
    }
  }, [userLoading, user, router]);

  // 로그인한 사용자가 확인되면, 저장해둔 시간표를 Supabase에서 불러온다
  useEffect(() => {
    if (!user) return;

    let isCancelled = false;

    async function loadSchedule() {
      setIsLoadingSchedule(true);

      const { data, error } = await supabase
        .from("schedules")
        .select("day_of_week, start_time")
        .eq("user_id", user!.id);

      if (isCancelled) return;

      if (error) {
        console.error("시간표 불러오기 실패:", error);
        setStatusMessage("기존 시간표를 불러오지 못했습니다.");
      } else if (data) {
        setSelectedSlots(scheduleRowsToSlots(data as { day_of_week: Day; start_time: string }[]));
      }

      setIsLoadingSchedule(false);
    }

    loadSchedule();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  // 슬롯 하나를 클릭했을 때 선택/해제를 토글 (아직 저장 전, 화면 state만 변경)
  function handleToggleSlot(day: Day, time: string) {
    const key = slotKey(day, time);

    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleReset() {
    setSelectedSlots(new Set());
  }

  // 현재 선택된 슬롯을 Supabase schedules 테이블에 저장
  // 방식: 이 사용자의 기존 행을 모두 지우고, 현재 선택된 슬롯으로 다시 채운다 (전체 교체)
  async function handleSave() {
    if (!user) return;

    setIsSaving(true);
    setStatusMessage(null);

    const { error: deleteError } = await supabase
      .from("schedules")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error(deleteError);
      setStatusMessage(`저장 실패: ${deleteError.message}`);
      setIsSaving(false);
      return;
    }

    if (selectedSlots.size > 0) {
      const rows = slotsToScheduleRows(selectedSlots, user.id);
      const { error: insertError } = await supabase
        .from("schedules")
        .insert(rows);

      if (insertError) {
        console.error(insertError);
        setStatusMessage(`저장 실패: ${insertError.message}`);
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    setStatusMessage("시간표가 저장되었습니다.");
  }

  const selectedCount = useMemo(() => selectedSlots.size, [selectedSlots]);

  // 로그인 확인 중이거나, 아직 리다이렉트 전이라면 화면을 비워둔다
  if (userLoading || !user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-gray-400">로그인 확인 중...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <AppHeader userEmail={user.email} />

      <h1 className="mb-1 text-2xl font-bold text-gray-900">내 시간표 등록</h1>
      <p className="mb-6 text-sm text-gray-500">
        수업이 있는 시간을 클릭해서 선택하세요. 다시 클릭하면 선택이
        해제됩니다.
      </p>

      {isLoadingSchedule ? (
        <p className="py-10 text-center text-sm text-gray-400">
          저장된 시간표를 불러오는 중...
        </p>
      ) : (
        <TimetableGrid
          selectedSlots={selectedSlots}
          onToggleSlot={handleToggleSlot}
        />
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          선택된 슬롯:{" "}
          <span className="font-semibold text-blue-600">{selectedCount}</span>
          개 (30분 단위)
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving || isLoadingSchedule}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            전체 초기화
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoadingSchedule}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <p className="mt-3 text-sm text-gray-500">{statusMessage}</p>
      )}
    </main>
  );
}
