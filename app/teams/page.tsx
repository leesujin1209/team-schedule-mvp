"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { Team } from "@/types/team";

// team_members를 통해 teams를 join해서 가져올 때의 응답 형태
interface TeamMembershipRow {
  teams: Team | null;
}

export default function TeamsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useSupabaseUser();

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login");
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    let isCancelled = false;

    async function loadTeams() {
      setIsLoading(true);

      // 내가 속한 team_members 행들을 가져오면서, 연결된 teams 정보도 함께 join해서 가져온다
      const { data, error } = await supabase
        .from("team_members")
        .select("teams(id, name, invite_code, created_by, created_at)")
        .eq("user_id", user!.id)
        .order("joined_at", { ascending: false });

      if (isCancelled) return;

      if (error) {
        console.error("팀 목록 불러오기 실패:", error);
      } else if (data) {
        const rows = data as unknown as TeamMembershipRow[];
        setTeams(rows.map((row) => row.teams).filter((t): t is Team => t !== null));
      }

      setIsLoading(false);
    }

    loadTeams();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  if (userLoading || !user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-gray-400">로그인 확인 중...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <AppHeader userEmail={user.email} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">내 팀</h1>
        <div className="flex gap-2">
          <Link
            href="/teams/join"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            초대코드로 참여
          </Link>
          <Link
            href="/teams/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            새 팀 만들기
          </Link>
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-400">
          팀 목록을 불러오는 중...
        </p>
      ) : teams.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-14 text-center">
          <p className="text-sm text-gray-500">아직 속한 팀이 없어요.</p>
          <p className="mt-1 text-sm text-gray-400">
            새 팀을 만들거나, 팀원에게 받은 초대코드로 참여해보세요.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/teams/${team.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="font-medium text-gray-900">{team.name}</span>
                <span className="text-xs text-gray-400">
                  초대코드 {team.invite_code}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
