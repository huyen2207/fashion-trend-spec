// パスワードのハッシュ（bcrypt）。DB の users.password_hash には、このハッシュだけを保存する
import bcrypt from "bcryptjs";

const ROUNDS = 10;
export const PASSWORD_MIN = 8;
// bcrypt は 72 バイトより後ろを無視するため、それより長いパスワードは受け付けない
export const PASSWORD_MAX_BYTES = 72;

export function checkPasswordRule(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `パスワードは${PASSWORD_MIN}文字以上にしてください。`;
  if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES) return `パスワードは${PASSWORD_MAX_BYTES}バイト以内にしてください。`;
  return null;
}

export const hashPassword = (password: string) => bcrypt.hash(password, ROUNDS);

// 登録のない人でも同じだけ時間をかけ、応答時間からメールアドレスの登録の有無が分からないようにする
const DUMMY_HASH = bcrypt.hashSync("styleher-dummy-password", ROUNDS);

export async function verifyPassword(password: string, hash: string | null | undefined) {
  const ok = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return ok && !!hash;
}
