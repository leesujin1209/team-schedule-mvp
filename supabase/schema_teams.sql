-- =========================================================
-- profiles 테이블
-- auth.users는 클라이언트에서 직접 조회할 수 없으므로,
-- 팀원 이메일 등을 화면에 보여주기 위해 별도의 profiles 테이블을 둔다.
-- 회원가입 시 트리거가 자동으로 이 테이블에 행을 만들어준다.
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 로그인한 사용자라면 누구나 다른 사람의 이메일을 볼 수 있게 함 (팀원 목록 표시용)
create policy "Authenticated users can view profiles"
  on public.profiles for select
  using (auth.uid() is not null);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 새 사용자가 가입(auth.users에 insert)하면 자동으로 profiles에도 행을 만들어주는 함수
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- teams 테이블
-- =========================================================
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.teams enable row level security;

-- 초대코드로 팀을 찾으려면(참여 전) 팀을 조회할 수 있어야 하므로,
-- 로그인한 사용자는 누구나 팀 정보(이름/초대코드)를 조회할 수 있게 허용한다.
create policy "Authenticated users can view teams"
  on public.teams for select
  using (auth.uid() is not null);

-- 자기 자신을 created_by로 해서만 팀을 생성할 수 있음
create policy "Users can create teams"
  on public.teams for insert
  with check (auth.uid() = created_by);

-- =========================================================
-- team_members 테이블 (팀 <-> 사용자 다대다 관계)
-- =========================================================
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (team_id, user_id) -- 같은 팀에 중복 참여 방지
);

alter table public.team_members enable row level security;

-- 팀원 목록은 "같은 팀에 속한 사람"만 볼 수 있게 제한 (핵심 프라이버시 요구사항)
create policy "Members can view members of their own teams"
  on public.team_members for select
  using (
    team_id in (
      select team_id from public.team_members where user_id = auth.uid()
    )
  );

-- 로그인한 사용자는 "자기 자신"을 팀원으로만 추가할 수 있음
-- (팀 생성 시 본인을 첫 멤버로 추가 / 초대코드로 참여 시 본인을 추가)
create policy "Users can add themselves to a team"
  on public.team_members for insert
  with check (auth.uid() = user_id);
