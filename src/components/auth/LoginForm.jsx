import { useState } from "react";
import { signIn, signUp } from "../../lib/auth.js";
import { LogIn, UserPlus, Loader2 } from "lucide-react";
import { useUI } from "../../store/ui.js";
import { isFirebaseConfigured } from "../../lib/firebase.js";

export default function LoginForm() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { pushToast } = useUI();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") await signIn(email, password);
      else await signUp(email, password);
    } catch (err) {
      pushToast(translate(err), "error");
    } finally {
      setBusy(false);
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="card max-w-lg p-8 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Firebase غير مهيأ</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            لتشغيل التطبيق، أنشئي ملف <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">.env.local</code> بقيم Firebase
            (راجعي <code>docs/SETUP-FIREBASE.md</code>) ثم أعيدي تشغيل الخادم.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-medical-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🩺</div>
          <h1 className="text-2xl font-bold">أهلاً نغم السنوسي</h1>
          <p className="text-slate-500 mt-1">سجّلي الدخول لمتابعة دراستك</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              dir="ltr"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              dir="ltr"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
            {busy ? (
              <Loader2 className="size-5 animate-spin" />
            ) : mode === "signin" ? (
              <>
                <LogIn className="size-5" /> تسجيل دخول
              </>
            ) : (
              <>
                <UserPlus className="size-5" /> إنشاء حساب
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="block mx-auto mt-4 text-sm text-medical-600 hover:underline"
        >
          {mode === "signin" ? "ليس لديكِ حساب؟ أنشئي واحداً" : "لديكِ حساب؟ سجّلي الدخول"}
        </button>
      </div>
    </div>
  );
}

function translate(err) {
  const code = err?.code || "";
  if (code.includes("invalid-email")) return "البريد الإلكتروني غير صالح.";
  if (code.includes("user-not-found")) return "لا يوجد حساب بهذا البريد.";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "كلمة المرور غير صحيحة.";
  if (code.includes("email-already")) return "هذا البريد مسجل فعلاً.";
  if (code.includes("weak-password")) return "كلمة المرور قصيرة جداً (6 أحرف على الأقل).";
  if (code.includes("network")) return "تعذّر الاتصال بالشبكة.";
  return err.message || "حدث خطأ غير متوقع.";
}
