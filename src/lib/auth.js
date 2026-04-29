// بدون Firebase — دوال وهمية لا تفعل شيئاً
export async function signIn() {}
export async function signUp() {}
export async function signOut() {}
export function watchAuth(cb) {
  cb(null);
  return () => {};
}
