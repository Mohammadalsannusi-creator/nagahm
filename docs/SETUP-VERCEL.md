# 🚀 دليل النشر على Vercel

بعد إعداد Firebase، اتبعي هذه الخطوات لنشر التطبيق مجاناً على Vercel مع تفعيل بروفيسور زكي.

---

## المتطلبات

- ✅ حساب [GitHub](https://github.com)
- ✅ حساب [Vercel](https://vercel.com) (يمكنك تسجيل الدخول بـ GitHub)
- ✅ مفتاح Anthropic API — من [console.anthropic.com](https://console.anthropic.com)
- ✅ قيم Firebase من الخطوة السابقة

---

## الخطوة 1 — رفع المشروع إلى GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/your-username/nagham-medical.git
git push -u origin main
```

> إذا لم يكن عندك Git مثبتاً، حمّليه من [git-scm.com](https://git-scm.com)

---

## الخطوة 2 — ربط المشروع بـ Vercel

1. افتحي [vercel.com](https://vercel.com) وسجّلي الدخول
2. اضغطي **"Add New → Project"**
3. اختاري مستودع `nagham-medical`
4. في إعدادات البناء:
   - **Framework Preset:** Vite
   - **Root Directory:** `.` (الجذر)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **لا** تنشري بعد — اذهبي لتبويب **Environment Variables** أولاً

---

## الخطوة 3 — إضافة متغيرات البيئة

في نفس صفحة إعداد المشروع، أضيفي هذه المتغيرات واحدة واحدة:

| الاسم | القيمة |
|-------|--------|
| `VITE_FIREBASE_API_KEY` | مفتاح Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | مثال: `nagham-medical.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | مثال: `nagham-medical` |
| `VITE_FIREBASE_STORAGE_BUCKET` | مثال: `nagham-medical.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | الرقم من Firebase |
| `VITE_FIREBASE_APP_ID` | معرّف التطبيق من Firebase |
| `ANTHROPIC_API_KEY` | مفتاحك من console.anthropic.com |

> ⚠️ متغيرات `VITE_FIREBASE_*` تبدأ بـ `VITE_` لأنها تُحمَّل في المتصفح.  
> `ANTHROPIC_API_KEY` بدون `VITE_` لأنه يبقى على الخادم فقط.

---

## الخطوة 4 — النشر

اضغطي **"Deploy"**. ستستغرق عملية البناء 1-3 دقائق.

بعد الانتهاء ستحصلين على رابط مثل:  
`https://nagham-medical.vercel.app`

---

## الخطوة 5 — إضافة النطاق لـ Firebase Auth

لأن Firebase يتحقق من النطاق المسموح به:

1. افتحي Firebase Console → **Authentication → Settings**
2. في قسم **Authorized domains**
3. اضغطي **"Add domain"**
4. أضيفي `nagham-medical.vercel.app` (رابط Vercel الخاص بك)

---

## 🔄 التحديثات المستقبلية

كل ما تدفعينه إلى `main` في GitHub يُنشر تلقائياً على Vercel!

```bash
git add .
git commit -m "تحديث"
git push
```

---

## 🧪 اختبار بروفيسور زكي بعد النشر

1. افتحي رابط Vercel
2. سجّلي الدخول بحساب نغم
3. اذهبي لـ **بروفيسور زكي**
4. ابدئي محادثة جديدة واطرحي سؤالاً طبياً
5. يجب أن يرد بعد 3-10 ثوانٍ ✅
