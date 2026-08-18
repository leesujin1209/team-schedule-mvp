import { Day, SelectedSlots, slotKey } from "@/types/timetable";
import { ScheduleInsert } from "@/types/schedule";
import { addMinutesToTime } from "./generateTimeSlots";

const SLOT_DURATION_MINUTES = 30;

// 화면에서 선택된 슬롯들(selectedSlots)을 schedules 테이블에 저장할 행들로 변환
// "월_09:00" -> { day_of_week: "월", start_time: "09:00:00", end_time: "09:30:00" }
export function slotsToScheduleRows(
  selectedSlots: SelectedSlots,
  userId: string
): ScheduleInsert[] {
  return Array.from(selectedSlots).map((key) => {
    const [day, time] = key.split("_") as [Day, string];
    const endTime = addMinutesToTime(time, SLOT_DURATION_MINUTES);

    return {
      user_id: userId,
      day_of_week: day,
      start_time: `${time}:00`,
      end_time: `${endTime}:00`,
    };
  });
}

// DB에서 불러온 schedules 행들을 화면에서 쓰는 selectedSlots(Set)로 변환
export function scheduleRowsToSlots(
  rows: { day_of_week: Day; start_time: string }[]
): SelectedSlots {
  const slots: SelectedSlots = new Set();

  rows.forEach((row) => {
    // DB에서 "09:00:00" 형태로 오므로, 앞의 "09:00"만 잘라서 사용한다
    const time = row.start_time.slice(0, 5);
    slots.add(slotKey(row.day_of_week, time));
  });

  return slots;
}
