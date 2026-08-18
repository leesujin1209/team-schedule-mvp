// 시간표에서 사용하는 요일 타입
export type Day = "월" | "화" | "수" | "목" | "금";

// 화면에 표시할 요일 순서
export const DAYS: Day[] = ["월", "화", "수", "목", "금"];

// 선택된 슬롯들을 저장하는 자료구조
// 예: "월_09:00" 처럼 "요일_시간" 형태의 문자열을 key로 사용한다
export type SelectedSlots = Set<string>;

// 요일 + 시간을 조합해서 슬롯의 고유 key를 만들어주는 함수
// 여러 컴포넌트에서 같은 방식으로 key를 만들어야 하므로 함수로 분리했다
export function slotKey(day: Day, time: string): string {
  return `${day}_${time}`;
}
