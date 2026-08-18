import { DAYS, Day, slotKey } from "@/types/timetable";
import { generateTimeSlots, addMinutesToTime } from "@/lib/generateTimeSlots";
import { CommonAvailableBlock } from "@/types/availability";

// schedules 테이블에서 가져온 한 행 (day_of_week, start_time만 있으면 충분하다)
interface ScheduleSlotInput {
  day_of_week: Day;
  start_time: string; // "09:00:00" 또는 "09:00" 모두 지원
}

const SLOT_MINUTES = 30;
const MIN_BLOCK_MINUTES = 60; // 최소 1시간 이상인 구간만 표시

// 여러 팀원의 schedules 행들을 받아서,
// "아무도 수업이 없는" 연속 시간대(1시간 이상)를 요일별로 찾아 길이순으로 정렬해 반환한다.
//
// 원리: 팀원 중 한 명이라도 수업이 있는 슬롯은 "불가능 시간"으로 표시하고,
// 그 합집합(busySlots)에 속하지 않는 슬롯들만 모두가 가능한 시간이 된다.
export function computeCommonAvailability(
  scheduleRows: ScheduleSlotInput[]
): CommonAvailableBlock[] {
  // 1) 팀원 중 누구 하나라도 수업이 있는 슬롯을 모아 "불가능 시간" 집합을 만든다
  const busySlots = new Set<string>();
  scheduleRows.forEach((row) => {
    const time = row.start_time.slice(0, 5); // "09:00:00" -> "09:00"
    busySlots.add(slotKey(row.day_of_week, time));
  });

  const times = generateTimeSlots(); // ["09:00", "09:30", ..., "20:30"]
  const blocks: CommonAvailableBlock[] = [];

  // 2) 요일별로 순서대로 슬롯을 훑으면서, 비어있는(모두 가능한) 슬롯이 연속되면 하나의 구간으로 묶는다
  DAYS.forEach((day) => {
    let blockStartTime: string | null = null;
    let slotCountInBlock = 0;

    const pushBlockIfLongEnough = (blockLastTime: string) => {
      if (blockStartTime === null) return;

      const durationMinutes = slotCountInBlock * SLOT_MINUTES;
      if (durationMinutes >= MIN_BLOCK_MINUTES) {
        blocks.push({
          day,
          startTime: blockStartTime,
          endTime: addMinutesToTime(blockLastTime, SLOT_MINUTES),
          durationMinutes,
        });
      }

      blockStartTime = null;
      slotCountInBlock = 0;
    };

    times.forEach((time, index) => {
      const isEveryoneFree = !busySlots.has(slotKey(day, time));

      if (isEveryoneFree) {
        if (blockStartTime === null) {
          blockStartTime = time; // 새 구간 시작
        }
        slotCountInBlock += 1;
      } else {
        // 이 슬롯에서 구간이 끊기므로, 바로 이전 슬롯까지를 하나의 구간으로 마감한다
        pushBlockIfLongEnough(times[index - 1]);
      }
    });

    // 하루의 마지막 슬롯(20:30)까지 구간이 이어졌다면 여기서 마감해준다
    pushBlockIfLongEnough(times[times.length - 1]);
  });

  // 3) 길이가 긴 구간부터 보이도록 정렬
  return blocks.sort((a, b) => b.durationMinutes - a.durationMinutes);
}

// 120 -> "2시간", 90 -> "1시간 30분" 처럼 사람이 읽기 좋은 형태로 변환
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) return `${hours}시간`;
  return `${hours}시간 ${remainingMinutes}분`;
}
