"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { createTeam } from "@/lib/teams";

export default function NewTeamPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useSupabaseUser();

  const [teamName, setTeamName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login");
    }
  }, [userLoading, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 팀 생성 + 랜덤 6자리 초대코드 발급은 lib/teams.ts의 createTeam이 처리한다
      const team = await createTeam(teamName.trim(), user.id);
      router.push(`/teams/${team.id}`);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "팀 생성에 실패했습니다."
      );
      setIsSubmitting(false);
    }
  }

  if (userLoading || !user) {
    return (
      <main className="mx-auto max-w-lg px-6 py-10">
        <p className="text-sm text-gray-400">로그인 확인 중...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <AppHeader userEmail={user.email} />

      <h1 className="mb-1 text-2xl font-bold text-gray-900">새 팀 만들기</h1>
      <p className="mb-6 text-sm text-gray-500">
        팀 이름을 입력하면 팀원을 초대할 수 있는 6자리 코드가 자동으로
        발급돼요.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="teamName" className="mb-1 block text-sm text-gray-600">
            팀 이름
          </label>
          <input
            id="teamName"
            type="text"
            required
            maxLength={40}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="예: 캡스톤 3조"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "만드는 중..." : "팀 만들기"}
        </button>
      </form>
    </main>
  );
}
