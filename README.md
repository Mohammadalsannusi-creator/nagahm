# 🩺 منصة نغم السنوسي الطبية

منصة دراسية شخصية متكاملة لطالبة الطب **نغم السنوسي** — تجمع إدارة الملفات، الذكاء الاصطناعي الطبي، بطاقات الاستذكار، لوحة الإحصائيات، وعارض التشريح الثلاثي الأبعاد في مكان واحد.

---

## ✨ الميزات الرئيسية

| الميزة | الوصف |
|--------|--------|
| 📂 **إدارة الملفات** | رفع PDF وعروض تقديمية لـ 8 أقسام مع وسوم ملونة وبحث فوري |
| 📄 **عارض PDF** | عرض ملفات PDF مع ملاحظات لاصقة وتكبير وتصفح |
| 🤖 **بروفيسور زكي** | مساعد طبي ذكي يبحث في الإنترنت ويجيب بالعربية |
| 📓 **دفتر الأسئلة** | استجواب ملفاتك مباشرةً بالذكاء الاصطناعي مع إشارات للصفحات |
| 🃏 **بطاقات الاستذكار** | نظام SM-2 للتكرار المتباعد — تراجع ما يستحق فقط |
| 📊 **الإحصائيات** | رسوم بيانية لساعات الدراسة وتوزيع الملفات بين الأقسام |
| 🦴 **تشريح 3D** | عرض نماذج GLB/GLTF ثلاثية الأبعاد قابلة للتدوير |
| 🕸️ **خريطة الترابط** | D3.js force graph يربط الملفات بأقسامها ووسومها |
| 🗑️ **سلة المهملات** | حذف ناعم مع استرجاع واحتفاظ 30 يوماً |
| ⏱️ **بومودورو** | مؤقت 25/5 دقيقة يسجّل جلسات الدراسة تلقائياً |
| 🔍 **بحث شامل** | بحث فوري عبر أسماء الملفات والوسوم |

---

## 🏗️ التقنيات

```
Vite + React 18 · Tailwind CSS 3 (RTL) · Firebase v10
React Router v6 · Zustand · Recharts · pdfjs-dist
D3.js · Fuse.js · Tesseract.js · @google/model-viewer
Vercel Serverless Functions · Anthropic Claude claude-sonnet-4-5
```

---

## ⚡ التشغيل المحلي

```bash
# 1. استنسخي المشروع
git clone https://github.com/your-username/nagham-medical.git
cd nagham-medical

# 2. ثبّتي التبعيات
npm install

# 3. انسخي ملف المتغيرات وعبّئيه بقيم Firebase الحقيقية
cp .env.example .env.local

# 4. شغّلي الخادم المحلي
npm run dev
# افتحي http://localhost:5173
```

> **ملاحظة:** بروفيسور زكي ودفتر الأسئلة يحتاجان Vercel لإخفاء مفتاح Anthropic.
> محلياً يمكنك اختبار باقي الميزات دون مفتاح API.

---

## ☁️ النشر على Vercel

راجعي الدليل التفصيلي: [`docs/SETUP-VERCEL.md`](docs/SETUP-VERCEL.md)

الخطوات المختصرة:
1. ارفعي المشروع إلى GitHub
2. اربطي المستودع بـ [Vercel](https://vercel.com)
3. أضيفي متغيرات البيئة (`VITE_FIREBASE_*` + `ANTHROPIC_API_KEY`)
4. انشري 🚀

---

## 🔥 إعداد Firebase

راجعي الدليل التفصيلي: [`docs/SETUP-FIREBASE.md`](docs/SETUP-FIREBASE.md)

تحتاجين إلى تفعيل:
- ✅ Authentication → Email/Password
- ✅ Firestore Database
- ✅ Storage

---

## 📁 هيكل المشروع

```
src/
├── components/
│   ├── ai/          ← بروفيسور زكي، دفتر الأسئلة
│   ├── files/       ← عارض PDF، شبكة الملفات، رفع
│   ├── layout/      ← الشريط الجانبي، الشريط العلوي
│   ├── study/       ← بومودورو
│   └── ui/          ← مكونات مشتركة
├── pages/           ← صفحات المواد، الإحصائيات، الأدوات
├── lib/             ← Firebase، Flashcards SM-2، PDF، OCR
├── hooks/           ← useAuth، useFiles، usePomodoro
└── store/           ← Zustand (Theme + Toasts)
api/
└── chat.js          ← Vercel Function (Claude API proxy)
```

---

## 🔐 قواعد الأمان

كل مستخدم يصل لبياناته فقط — Firestore و Storage محميان بقواعد:

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth.uid == uid;
}
```

---

## 📖 أدلة الاستخدام

- [`docs/SETUP-FIREBASE.md`](docs/SETUP-FIREBASE.md) — إنشاء مشروع Firebase
- [`docs/SETUP-VERCEL.md`](docs/SETUP-VERCEL.md) — النشر والمتغيرات
- [`docs/USER-GUIDE.md`](docs/USER-GUIDE.md) — دليل المستخدمة

---

*بُني بـ ❤️ لنغم السنوسي 🩺*
