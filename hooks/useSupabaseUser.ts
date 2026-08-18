"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

interface UseSupabaseUserResult {
  user: User | null;
  // 아직 로그인 상태를 확인하는 중인지 여부 (초기 로딩 깜빡임 방지용)
  loading: boolean;
}

// 현재 로그인한 사용자를 알려주고, 로그인/로그아웃이 바뀔 때마다 자동으로 갱신해주는 훅
export function useSupabaseUser(): UseSupabaseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) 처음 페이지에 들어왔을 때 현재 세션이 있는지 확인
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // 2) 이후 로그인/로그아웃이 발생하면 실시간으로 반영
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
