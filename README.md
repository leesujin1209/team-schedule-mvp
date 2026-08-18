# 팀플 시간표 조율 MVP

대학생 팀플 일정 조율 웹앱의 MVP입니다.
Supabase Auth로 로그인하고, 자신의 시간표(수업 시간)를 등록/조회할 수 있습니다.

## 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com) 에서 새 프로젝트를 만듭니다.
2. 좌측 메뉴 **SQL Editor**에서 아래 세 파일을 **순서대로** 실행합니다.
   1. `supabase/schema.sql` → `schedules` 테이블 + 보안 정책(RLS)
   2. `supabase/schema_teams.sql` → `profiles` / `teams` / `team_members` 테이블 + 보안 정책 + 회원가입 트리거
   3. `supabase/schema_team_schedule_access.sql` → 팀원끼리 서로의 시간표를 조회할 수 있게 하는 정책 추가 (공통 가능 시간 계산에 필요)
3. 좌측 메뉴 **Authentication > Providers**에서 **Email**이 켜져 있는지 확인합니다.
   - 테스트를 빠르게 하고 싶다면 **Authentication > Providers > Email**에서
     "Confirm email"(이메일 인증 필수) 옵션을 잠시 꺼두면 가입 즉시 로그인할 수 있습니다.
4. 좌측 메뉴 **Project Settings > API**에서 `Project URL`과 `anon public` 키를 복사합니다.

> ⚠️ `schema_teams.sql`은 회원가입 시 `profiles` 테이블에 자동으로 행을 만들어주는
> 트리거를 포함합니다. 만약 이 스크립트를 실행하기 **전에** 이미 가입한 계정이 있다면,
> 그 계정은 `profiles`에 행이 없어서 팀 기능에서 이메일이 제대로 안 보일 수 있어요.
> 이 경우 새 계정으로 다시 가입하거나, SQL Editor에서 수동으로
> `insert into public.profiles (id, email) select id, email from auth.users;` 를 한 번 실행해주세요.

## 2. 환경변수 설정

`.env.local.example` 파일을 복사해서 `.env.local` 이라는 이름으로 저장하고, 위에서 복사한 값을 채웁니다.

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속 → 회원가입 → 시간표 등록

## 구현된 기능

1. 메인 페이지 (`app/page.tsx`) — 서비스 소개, 로그인 / 시간표 등록 페이지로 이동
2. 로그인 페이지 (`app/login/page.tsx`) — Supabase Auth 이메일/비밀번호 로그인 & 회원가입
3. 시간표 등록 페이지 (`app/timetable/page.tsx`)
   - 로그인하지 않은 사용자는 자동으로 `/login`으로 이동
   - 페이지 진입 시 Supabase에서 내 시간표를 불러와 화면에 표시
   - "저장하기" 클릭 시 `schedules` 테이블에 저장 (기존 데이터를 지우고 현재 선택 상태로 교체)
4. 월~금, 09:00~21:00, 30분 단위 시간표 그리드 (`components/TimetableGrid.tsx`)
5. 슬롯 클릭 시 선택/해제 토글 (`components/TimeSlot.tsx`)
6. 팀 목록 페이지 (`app/teams/page.tsx`) — 내가 속한 팀 목록
7. 팀 생성 페이지 (`app/teams/new/page.tsx`) — 팀 이름 입력 → 랜덤 6자리 초대코드 자동 발급
8. 초대코드 참여 페이지 (`app/teams/join/page.tsx`) — 초대코드 입력 → 해당 팀에 참여
9. 팀 상세 페이지 (`app/teams/[id]/page.tsx`) — 팀 이름, 초대코드(복사 가능), 팀원 목록 표시
10. **공통 가능 시간 계산** — 팀원 전원의 `schedules`를 비교해서, 아무도 수업이 없는 1시간 이상 연속 구간을 요일별로 찾아 길이순으로 표시 (`lib/teamAvailability.ts`)

## schedules 테이블 구조

| 컬럼          | 타입      | 설명                        |
| ------------- | --------- | --------------------------- |
| id            | uuid      | 기본키                      |
| user_id       | uuid      | `auth.users`를 참조하는 소유자 |
| day_of_week   | text      | '월' \| '화' \| '수' \| '목' \| '금' |
| start_time    | time      | 슬롯 시작 시각 (예: 09:00:00) |
| end_time      | time      | 슬롯 종료 시각 (예: 09:30:00) |
| created_at    | timestamp | 생성 시각                   |

저장 방식: 화면에서 선택된 30분 슬롯 하나하나가 `schedules`의 한 행으로 저장됩니다.
저장 시에는 해당 사용자의 기존 행을 모두 삭제한 뒤, 현재 선택 상태를 다시 insert하는
"전체 교체" 방식을 사용합니다 (`lib/scheduleMapping.ts` 참고).

## teams / team_members 테이블 구조

**teams**

| 컬럼        | 타입      | 설명                          |
| ----------- | --------- | ----------------------------- |
| id          | uuid      | 기본키                        |
| name        | text      | 팀 이름                       |
| invite_code | text      | 랜덤 6자리 초대코드 (유니크)  |
| created_by  | uuid      | 팀을 만든 사람 (profiles 참조) |
| created_at  | timestamp | 생성 시각                     |

**team_members** (팀 ↔ 사용자 다대다 관계)

| 컬럼      | 타입      | 설명                              |
| --------- | --------- | --------------------------------- |
| id        | uuid      | 기본키                            |
| team_id   | uuid      | teams 참조                        |
| user_id   | uuid      | profiles 참조                     |
| joined_at | timestamp | 참여 시각                         |

- 팀 생성 시 만든 사람이 자동으로 첫 번째 팀원(`team_members`)으로 등록됩니다.
- 초대코드로 참여하면 `teams.invite_code`로 팀을 찾은 뒤, 현재 사용자를 `team_members`에 추가합니다.
- 팀원 목록(`team_members` select)은 **같은 팀 소속인 사람만** 볼 수 있도록 RLS로 제한되어 있습니다.
- `teams` 테이블 자체는 초대코드로 검색할 수 있어야 하므로 로그인한 사용자라면 누구나 조회할 수 있게 열어두었습니다 (이름/초대코드만 노출, 팀원 명단은 비공개).

## 폴더 구조

```
app/
  page.tsx              메인 페이지
  login/page.tsx        로그인 / 회원가입 페이지
  timetable/page.tsx    시간표 등록 페이지 (Supabase 연동)
  teams/page.tsx        내 팀 목록
  teams/new/page.tsx    새 팀 만들기
  teams/join/page.tsx   초대코드로 팀 참여
  teams/[id]/page.tsx   팀 상세 (초대코드, 팀원 목록)
  layout.tsx            공통 레이아웃
  globals.css           Tailwind 전역 스타일
components/
  TimetableGrid.tsx     요일 x 시간 그리드 전체
  TimeSlot.tsx           슬롯 1칸 (가장 작은 단위)
  AppHeader.tsx           로그인 후 페이지 공통 상단 네비게이션
hooks/
  useSupabaseUser.ts     현재 로그인한 사용자 상태를 구독하는 훅
lib/
  supabase/client.ts     Supabase 클라이언트 (앱 전체에서 공용으로 사용)
  generateTimeSlots.ts   09:00~21:00을 30분 단위로 생성 + 시간 계산 유틸
  scheduleMapping.ts     화면 state <-> schedules 테이블 행 변환 함수
  inviteCode.ts           랜덤 6자리 초대코드 생성 함수
  teams.ts                팀 생성 / 초대코드 참여 로직
  teamAvailability.ts      팀원 시간표 비교 -> 공통 가능 시간 계산 알고리즘
types/
  timetable.ts           Day, SelectedSlots 등 공통 타입
  schedule.ts             schedules 테이블 행 타입
  team.ts                 teams / team_members 관련 타입
  availability.ts          공통 가능 시간 블록 타입
supabase/
  schema.sql              schedules 테이블 생성 + RLS 정책
  schema_teams.sql         profiles / teams / team_members 테이블 + RLS 정책 + 트리거
  schema_team_schedule_access.sql  팀원 간 시간표 조회 허용 정책
```

## 공통 가능 시간 계산 방식

`lib/teamAvailability.ts`의 `computeCommonAvailability` 함수가 담당합니다.

1. 팀원 전원의 `schedules` 행을 가져와서, 누구 하나라도 수업이 있는 30분 슬롯을 "불가능 시간"으로 표시합니다.
2. 월~금 × 09:00~21:00 전체 슬롯 중 "불가능 시간"에 속하지 않는 슬롯만 "모두 가능한 시간"이 됩니다.
3. 요일별로 시간 순서대로 훑으면서, 가능한 슬롯이 끊기지 않고 이어지는 구간을 하나로 묶습니다.
4. 묶인 구간의 길이가 1시간(=슬롯 2개) 미만이면 버리고, 나머지는 긴 구간부터 보이도록 정렬합니다.

## 다음 단계 (미구현)

- 이메일 매직링크 로그인, 소셜 로그인 등 추가 인증 수단
- 팀 나가기 / 팀장 위임 / 팀원 강퇴 등 팀 관리 기능
- 공통 가능 시간에 팀플 회의 일정을 바로 등록하는 기능
