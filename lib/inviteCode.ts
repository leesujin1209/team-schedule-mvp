// 헷갈리기 쉬운 문자(0, O, 1, I)는 제외한 문자셋
// 초대코드를 손으로 옮겨 적거나 소리내어 불러줄 때 실수를 줄이기 위함
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 6;

// 랜덤 6자리 초대코드 생성 (예: "7K9XQ2")
export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CHARSET.length);
    code += CHARSET[randomIndex];
  }
  return code;
}
