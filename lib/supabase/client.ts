import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase 환경변수가 설정되지 않았습니다. .env.local 파일에 " +
      "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 를 채워주세요."
  );
}

// 앱 어디서든 이 supabase 인스턴스를 import해서 재사용한다
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
