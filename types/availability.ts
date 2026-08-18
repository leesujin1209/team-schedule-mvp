import { Day } from "./timetable";

// 팀원 모두가 가능한 연속 시간대 하나를 표현
export interface CommonAvailableBlock {
  day: Day;
  startTime: string; // 예: "13:00"
  endTime: string; // 예: "15:00"
  durationMinutes: number; // 예: 120
}
