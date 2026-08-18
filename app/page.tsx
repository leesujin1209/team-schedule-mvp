import Link from "next/link";

// 메인 페이지: 서비스를 간단히 소개하고, 시간표 등록 페이지로 안내한다
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-3 text-sm font-medium text-blue-600">
        대학생 팀플 시간표 조율 서비스
      </span>

      <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
        모두가 가능한 팀플 시간,
        <br />
        자동으로 찾아드려요
      </h1>

      <p className="mb-10 text-gray-500">
        학기 초에 내 시간표를 한 번만 등록해두면, 팀을 만들거나 참여할 때
        팀원들과 겹치는 빈 시간을 자동으로 비교해드립니다.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/timetable"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          내 시간표 등록하기
        </Link>
        <Link
          href="/teams"
          className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          내 팀 보기
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          로그인
        </Link>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        * 시간표 등록, 팀 생성/참여는 로그인이 필요해요 · 팀원 시간표 자동
        비교는 다음 단계에서 제공될 예정이에요
      </p>
    </main>
  );
}
