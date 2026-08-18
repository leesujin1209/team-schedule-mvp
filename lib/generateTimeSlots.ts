// 09:00부터 20:30까지 30분 단위로 시간 목록을 만들어주는 함수
// 20:30 슬롯은 20:30~21:00 구간을 의미하므로, 시간표는 결국 09:00~21:00을 모두 커버한다
export function generateTimeSlots(): string[] {
  const times: string[] = [];

  for (let hour = 9; hour < 21; hour++) {
    times.push(`${pad(hour)}:00`);
    times.push(`${pad(hour)}:30`);
  }

  return times;
}

// 9 -> "09" 처럼 한 자리 숫자를 두 자리로 맞춰주는 함수
function pad(num: number): string {
  return num.toString().padStart(2, "0");
}

// "09:00" 같은 시간 문자열에 minutes(분)을 더해주는 함수
// 예: addMinutesToTime("20:30", 30) -> "21:00"
// schedules 테이블에 저장할 end_time(수업 종료 시각)을 계산할 때 사용한다
export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [hourStr, minuteStr] = time.split(":");
  const totalMinutes = Number(hourStr) * 60 + Number(minuteStr) + minutesToAdd;

  const newHour = Math.floor(totalMinutes / 60) % 24;
  const newMinute = totalMinutes % 60;

  return `${pad(newHour)}:${pad(newMinute)}`;
}
