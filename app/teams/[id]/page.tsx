"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { Team, TeamMemberWithProfile } from "@/types/team";
import { Day } from "@/types/timetable";
import { CommonAvailableBlock } from "@/types/availability";
import { computeCommonAvailability, formatDuration } from "@/lib/teamAvailability";

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const teamId = params.id;

  const router = useRouter();
  const { user, loading: userLoading } = useSupabaseUser();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMemberWithProfile[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<CommonAvailableBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login");
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    if (!user || !teamId) return;

    let isCancelled = false;

    async function loadTeamDetail() {
      setIsLoading(true);
      setLoadError(null);

      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .maybeSingle();

      if (isCancelled) return;

      if (teamError || !teamData) {
        setLoadError("팀을 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      setTeam(teamData as Team);

      // 팀원 목록은 profiles와 join해서 이메일도 함께 가져온다
      // (같은 팀 소속이 아니면 RLS 정책에 의해 빈 배열이 반환된다)
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select("id, user_id, joined_at, profiles(email)")
        .eq("team_id", teamId)
        .order("joined_at", { ascending: true });

      if (isCancelled) return;

      if (memberError) {
        console.error("팀원 목록 불러오기 실패:", memberError);
        setIsLoading(false);
        setIsLoadingAvailability(false);
        return;
      }

      const loadedMembers = (memberData ?? []) as unknown as TeamMemberWithProfile[];
      setMembers(loadedMembers);
      setIsLoading(false);

      // 팀원들의 schedules를 모두 가져와서 공통 가능 시간을 계산한다
      setIsLoadingAvailability(true);
      const memberIds = loadedMembers.map((member) => member.user_id);

      if (memberIds.length === 0) {
        setAvailableBlocks([]);
        setIsLoadingAvailability(false);
        return;
      }

      const { data: scheduleData, error: scheduleError } = await supabase
        .from("schedules")
        .select("user_id, day_of_week, start_time")
        .in("user_id", memberIds);

      if (isCancelled) return;

      if (scheduleError) {
        console.error("팀원 시간표 불러오기 실패:", scheduleError);
      } else {
        setAvailableBlocks(
          computeCommonAvailability(
            (scheduleData ?? []) as { day_of_week: Day; start_time: string }[]
          )
        );
      }

      setIsLoadingAvailability(false);
    }

    loadTeamDetail();

    return () => {
      isCancelled = true;
    };
  }, [user, teamId]);

  async function handleCopyInviteCode() {
    if (!team) return;
    await navigator.clipboard.writeText(team.invite_code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  }

  if (userLoading || !user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-gray-400">로그인 확인 중...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <AppHeader userEmail={user.email} />

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-400">
          팀 정보를 불러오는 중...
        </p>
      ) : loadError || !team ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-14 text-center">
          <p className="text-sm text-gray-500">
            {loadError ?? "팀을 찾을 수 없습니다."}
          </p>
        </div>
      ) : (
        <>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">{team.name}</h1>
          <p className="mb-6 text-sm text-gray-500">
            팀원 {members.length}명
          </p>

          <div className="mb-8 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-xs text-gray-400">초대코드</p>
              <p className="font-mono text-lg tracking-[0.3em] text-gray-900">
                {team.invite_code}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyInviteCode}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              {isCopied ? "복사됨!" : "코드 복사"}
            </button>
          </div>

          <h2 className="mb-3 text-sm font-semibold text-gray-700">팀원 목록</h2>
          <ul className="flex flex-col gap-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
              >
                <span className="text-sm text-gray-900">
                  {member.profiles?.email ?? "알 수 없는 사용자"}
                  {member.user_id === user.id && (
                    <span className="ml-2 text-xs text-blue-600">(나)</span>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(member.joined_at).toLocaleDateString("ko-KR")} 참여
                </span>
              </li>
            ))}
          </ul>

          <h2 className="mb-1 mt-8 text-sm font-semibold text-gray-700">
            공통 가능 시간
          </h2>
          <p className="mb-3 text-xs text-gray-400">
            팀원 전원이 비어있는, 1시간 이상 연속된 시간대예요. (긴 순서로 정렬)
          </p>

          {isLoadingAvailability ? (
            <p className="py-6 text-center text-sm text-gray-400">
              공통 가능 시간을 계산하는 중...
            </p>
          ) : availableBlocks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center">
              <p className="text-sm text-gray-500">
                1시간 이상 팀원 모두가 가능한 시간이 없어요.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {availableBlocks.map((block, index) => (
                <li
                  key={`${block.day}-${block.startTime}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {block.day}요일 {block.startTime}~{block.endTime}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDuration(block.durationMinutes)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
