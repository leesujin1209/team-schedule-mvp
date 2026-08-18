"use client";

import { DAYS, Day, SelectedSlots, slotKey } from "@/types/timetable";
import { generateTimeSlots } from "@/lib/generateTimeSlots";
import TimeSlot from "./TimeSlot";

interface TimetableGridProps {
  selectedSlots: SelectedSlots;
  onToggleSlot: (day: Day, time: string) => void;
}

// 월~금, 09:00~21:00 시간표 전체를 그려주는 컴포넌트
// - 첫 번째 컬럼: 시간 라벨 (09:00, 09:30, ...)
// - 나머지 컬럼: 월/화/수/목/금 각 요일의 슬롯
export default function TimetableGrid({
  selectedSlots,
  onToggleSlot,
}: TimetableGridProps) {
  const times = generateTimeSlots();

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <div className="min-w-[560px]">
        {/* 헤더: 요일 이름 */}
        <div className="grid grid-cols-[64px_repeat(5,1fr)] bg-gray-50">
          <div className="border-b border-gray-200 p-2 text-center text-xs text-gray-400">
            시간
          </div>
          {DAYS.map((day) => (
            <div
              key={day}
              className="border-b border-l border-gray-200 p-2 text-center text-sm font-medium text-gray-700"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 시간대별 행 */}
        {times.map((time) => {
          // 정시(00분)마다 구분선을 좀 더 진하게 표시해서 시간을 읽기 쉽게 함
          const isHourStart = time.endsWith(":00");

          return (
            <div
              key={time}
              className={[
                "grid grid-cols-[64px_repeat(5,1fr)]",
                isHourStart ? "border-t border-gray-300" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-center border-b border-gray-100 p-1 text-[11px] text-gray-400">
                {isHourStart ? time : ""}
              </div>

              {DAYS.map((day) => (
                <div key={slotKey(day, time)} className="border-l border-gray-100">
                  <TimeSlot
                    selected={selectedSlots.has(slotKey(day, time))}
                    onClick={() => onToggleSlot(day, time)}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
