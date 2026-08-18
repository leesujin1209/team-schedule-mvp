"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { joinTeamByCode } from "@/lib/teams";

export default function JoinTeamPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useSupabaseUser();

  const [code, setCode] = useState("");
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
      const team = await joinTeamByCode(code, user.id);
      router.push(`/teams/${team.id}`);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "팀 참여에 실패했습니다."
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

      <h1 className="mb-1 text-2xl font-bold text-gray-900">초대코드로 참여</h1>
      <p className="mb-6 text-sm text-gray-500">
        팀장에게 받은 6자리 초대코드를 입력하세요.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="code" className="mb-1 block text-sm text-gray-600">
            초대코드
          </label>
          <input
            id="code"
            type="text"
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="예: 7K9XQ2"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-center text-lg font-mono tracking-[0.3em] focus:border-blue-500 focus:outline-none"
          />
        </div>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <button
          type="submit"
          disabled={isSubmitting || code.trim().length === 0}
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "참여하는 중..." : "팀 참여하기"}
        </button>
      </form>
    </main>
  );
}
