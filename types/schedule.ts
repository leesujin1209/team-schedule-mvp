import { Day } from "./timetable";

// Supabase의 schedules 테이블 한 행(row)을 표현하는 타입
// DB 컬럼과 이름을 그대로 맞춰서, 어떤 필드가 저장되는지 한눈에 알 수 있게 했다
export interface ScheduleRow {
  id: string;
  user_id: string;
  day_of_week: Day;
  start_time: string; // 예: "09:00:00"
  end_time: string; // 예: "09:30:00"
  created_at: string;
}

// 새 행을 추가(insert)할 때 사용하는 타입 (id, created_at은 DB가 자동으로 채워줌)
export type ScheduleInsert = Omit<ScheduleRow, "id" | "created_at">;
