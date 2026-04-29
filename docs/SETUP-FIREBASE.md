# 🔥 دليل إعداد Firebase

اتبعي هذه الخطوات مرة واحدة فقط لربط التطبيق بـ Firebase.

---

## الخطوة 1 — إنشاء مشروع Firebase

1. افتحي [console.firebase.google.com](https://console.firebase.google.com)
2. اضغطي **"Add project"** أو **"إضافة مشروع"**
3. اكتبي اسماً مثل `nagham-medical`
4. أوقفي Google Analytics (اختياري)
5. اضغطي **"Create project"**

---

## الخطوة 2 — تفعيل Authentication

1. من القائمة الجانبية: **Build → Authentication**
2. اضغطي **"Get started"**
3. اختاري **Email/Password**
4. فعّليه ← اضغطي **Save**

### إنشاء حساب نغم
1. اذهبي لتبويب **Users**
2. اضغطي **"Add user"**
3. أدخلي البريد وكلمة المرور
4. اضغطي **"Add user"**

---

## الخطوة 3 — تفعيل Firestore

1. من القائمة: **Build → Firestore Database**
2. اضغطي **"Create database"**
3. اختاري **"Start in production mode"**
4. اختاري المنطقة الأقرب (مثل `europe-west1`)
5. اضغطي **"Enable"**

### قواعد الأمان
اذهبي لتبويب **Rules** والصقي:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;
    }
  }
}
```

اضغطي **Publish**.

---

## الخطوة 4 — تفعيل Storage

1. من القائمة: **Build → Storage**
2. اضغطي **"Get started"**
3. اختاري **Production mode**
4. اختاري نفس المنطقة السابقة
5. اضغطي **Done**

### قواعد Storage
اذهبي لتبويب **Rules** والصقي:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;
    }
  }
}
```

اضغطي **Publish**.

---

## الخطوة 5 — الحصول على إعدادات التطبيق

1. اذهبي للإعدادات: **Project Settings** (أيقونة الترس)
2. في قسم **Your apps**، اضغطي أيقونة **</> (Web)**
3. اكتبي اسم التطبيق واضغطي **Register app**
4. انسخي الـ config object

---

## الخطوة 6 — تعبئة `.env.local`

افتحي ملف `.env.local` في المشروع وعبّئيه:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=nagham-medical.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nagham-medical
VITE_FIREBASE_STORAGE_BUCKET=nagham-medical.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

> **تحذير:** لا ترفعي هذا الملف إلى GitHub! إنه مدرج في `.gitignore`.

---

## ✅ التحقق

شغّلي `npm run dev` وافتحي `http://localhost:5173`.  
إذا ظهرت شاشة تسجيل الدخول بدلاً من رسالة "Firebase غير مهيأ" فالإعداد نجح ✅
