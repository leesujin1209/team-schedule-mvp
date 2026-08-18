"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface AppHeaderProps {
  userEmail?: string | null;
}

// 로그인 후 페이지(시간표, 팀 등)에서 공통으로 쓰는 상단 네비게이션 바
export default function AppHeader({ userEmail }: AppHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
      <nav className="flex gap-4 text-sm font-medium text-gray-500">
        <Link href="/timetable" className="hover:text-gray-900">
          내 시간표
        </Link>
        <Link href="/teams" className="hover:text-gray-900">
          내 팀
        </Link>
      </nav>

      <div className="flex items-center gap-3 text-sm">
        {userEmail && <span className="text-gray-400">{userEmail}</span>}
        <button
          type="button"
          onClick={handleLogout}
          className="text-gray-400 underline underline-offset-2 hover:text-gray-600"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
