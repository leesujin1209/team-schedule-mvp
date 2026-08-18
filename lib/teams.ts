import { supabase } from "@/lib/supabase/client";
import { generateInviteCode } from "@/lib/inviteCode";
import { Team } from "@/types/team";

// Postgres의 "값이 중복됨(unique violation)" 에러 코드
const UNIQUE_VIOLATION = "23505";

const MAX_INVITE_CODE_ATTEMPTS = 5;

// 새 팀을 만들고, 만든 사람을 첫 번째 팀원으로 등록한다
export async function createTeam(name: string, userId: string): Promise<Team> {
  // 초대코드가 우연히 겹칠 수 있으므로, 겹치면 몇 번 다시 시도한다
  for (let attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt++) {
    const inviteCode = generateInviteCode();

    const { data: team, error } = await supabase
      .from("teams")
      .insert({ name, invite_code: inviteCode, created_by: userId })
      .select()
      .single();

    if (error) {
      // 초대코드가 겹친 경우에만 재시도, 그 외 에러는 바로 던짐
      if (error.code === UNIQUE_VIOLATION) continue;
      throw error;
    }

    // 팀 생성자를 team_members에도 추가 (본인도 팀원이어야 목록/시간표 비교가 가능하므로)
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({ team_id: team.id, user_id: userId });

    if (memberError) throw memberError;

    return team as Team;
  }

  throw new Error("초대코드 생성에 실패했습니다. 다시 시도해주세요.");
}

// 초대코드로 팀을 찾아서, 현재 사용자를 팀원으로 추가한다
export async function joinTeamByCode(code: string, userId: string): Promise<Team> {
  const normalizedCode = code.trim().toUpperCase();

  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("invite_code", normalizedCode)
    .maybeSingle();

  if (error) throw error;
  if (!team) throw new Error("유효하지 않은 초대코드예요. 다시 확인해주세요.");

  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: userId });

  // 이미 참여 중인 팀이면 중복 에러가 나는데, 이 경우는 에러로 취급하지 않고 그냥 통과시킨다
  if (memberError && memberError.code !== UNIQUE_VIOLATION) {
    throw memberError;
  }

  return team as Team;
}
