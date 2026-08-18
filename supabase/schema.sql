-- schedules 테이블: 사용자별 수업 시간을 저장
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day_of_week text not null check (day_of_week in ('월', '화', '수', '목', '금')),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

-- 같은 사용자가 같은 요일/시작시간을 중복 저장하지 않도록 방지
create unique index if not exists schedules_user_day_start_idx
  on public.schedules (user_id, day_of_week, start_time);

-- 사용자 아이디로 조회할 때 빠르게 찾기 위한 인덱스
create index if not exists schedules_user_id_idx on public.schedules (user_id);

-- 행 단위 보안(RLS) 활성화: 기본적으로 아무도 접근 못하게 막고, 아래 정책으로만 허용
alter table public.schedules enable row level security;

-- 로그인한 사용자는 "자기 자신의" 시간표만 조회할 수 있음
create policy "Users can view own schedules"
  on public.schedules for select
  using (auth.uid() = user_id);

-- 로그인한 사용자는 "자기 자신의" user_id로만 새 행을 추가할 수 있음
create policy "Users can insert own schedules"
  on public.schedules for insert
  with check (auth.uid() = user_id);

-- 로그인한 사용자는 "자기 자신의" 시간표만 수정할 수 있음
create policy "Users can update own schedules"
  on public.schedules for update
  using (auth.uid() = user_id);

-- 로그인한 사용자는 "자기 자신의" 시간표만 삭제할 수 있음
create policy "Users can delete own schedules"
  on public.schedules for delete
  using (auth.uid() = user_id);
