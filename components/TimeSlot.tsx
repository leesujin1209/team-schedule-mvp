"use client";

interface TimeSlotProps {
  selected: boolean;
  onClick: () => void;
}

// 시간표의 칸 하나(30분 단위)를 렌더링하는 컴포넌트
// 선택 여부에 따라 색상만 다르게 보여주고, 클릭되면 부모에게 알려준다
export default function TimeSlot({ selected, onClick }: TimeSlotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "h-6 w-full border border-gray-200 transition-colors",
        selected
          ? "bg-blue-500 hover:bg-blue-600"
          : "bg-white hover:bg-blue-100",
      ].join(" ")}
    />
  );
}
