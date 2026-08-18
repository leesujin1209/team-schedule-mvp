-- 팀 상세 페이지에서 "공통 가능 시간"을 계산하려면 팀원들의 schedules를 조회할 수 있어야 한다.
-- 기존 schema.sql에는 "본인 시간표만 조회 가능" 정책만 있었으므로, 아래 정책을 추가한다.
-- (기존 정책과 새 정책은 OR로 합쳐지므로, 본인 시간표 조회는 계속 그대로 동작한다)
create policy "Team members can view teammates schedules"
  on public.schedules for select
  using (
    exists (
      select 1
      from public.team_members my_membership
      join public.team_members teammate_membership
        on my_membership.team_id = teammate_membership.team_id
      where my_membership.user_id = auth.uid()
        and teammate_membership.user_id = schedules.user_id
    )
  );
