// بدون Firebase — مستخدمة ثابتة محلية
export const MOCK_USER = {
  uid: "nagham",
  email: "nagham@medical.local",
  displayName: "نغم السنوسي",
};

export function useAuth() {
  return { user: MOCK_USER, ready: true, configured: true };
}
