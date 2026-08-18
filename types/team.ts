// teams 테이블 한 행
export interface Team {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

// team_members 테이블 한 행
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
}

// 팀원 목록을 보여줄 때, profiles 테이블과 join된 형태
export interface TeamMemberWithProfile {
  id: string;
  user_id: string;
  joined_at: string;
  profiles: { email: string | null } | null;
}
