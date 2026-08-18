"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Mode = "signIn" | "signUp";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    if (mode === "signIn") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      router.replace("/timetable");
      return;
    }

    // 회원가입
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    // Supabase 프로젝트 설정에 따라 이메일 인증이 필요할 수 있다
    setInfoMessage(
      "가입 요청이 완료되었습니다. 이메일 인증이 필요한 경우 받은 편지함을 확인해주세요."
    );
    setIsSubmitting(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">
        {mode === "signIn" ? "로그인" : "회원가입"}
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        이메일로 로그인하고 내 시간표를 저장하세요.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-gray-600">
            이메일
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="you@university.ac.kr"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm text-gray-600"
          >
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="6자 이상"
          />
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
        {infoMessage && (
          <p className="text-sm text-blue-600">{infoMessage}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting
            ? "처리 중..."
            : mode === "signIn"
              ? "로그인"
              : "회원가입"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signIn" ? "signUp" : "signIn");
          setErrorMessage(null);
          setInfoMessage(null);
        }}
        className="mt-4 text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700"
      >
        {mode === "signIn"
          ? "계정이 없으신가요? 회원가입"
          : "이미 계정이 있으신가요? 로그인"}
      </button>
    </main>
  );
}
