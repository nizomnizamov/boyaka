# 🟦 Boyaka — Shaxsiy Moliya Boshqaruvi

> Minimal va premium dizayndagi shaxsiy moliyaviy ilova. Xarajat va daromadlarni kuzating, byudjet tuzing, maqsadlar belgilang — hammasi bir joyda.

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue?logo=pwa)](https://web.dev/progressive-web-apps/)
[![Android](https://img.shields.io/badge/Android-Capacitor-green?logo=android)](https://capacitorjs.com/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)](https://vitejs.dev/)

---

## 📱 Imkoniyatlar

- 💰 Daromad va xarajat kuzatuvi
- 📊 Oylik byudjet rejalashtirish
- 🎯 Moliyaviy maqsadlar
- 📖 Qarz daftari
- 📈 Hisobotlar va grafik tahlil
- 👨‍👩‍👧 Oilaviy byudjet
- 🌍 29+ valyuta qo'llab-quvvatlash
- 🌙 Dark mode
- 📲 PWA — uy ekraniga o'rnatish
- 🤖 Android native app (Capacitor)

---

## 🏗️ Tech Stack

| Qatlam       | Texnologiya                           |
|--------------|---------------------------------------|
| Frontend     | React 18 + Vite 5                     |
| Styling      | Tailwind CSS (custom design system)   |
| State        | TanStack Query v5                     |
| i18n         | i18next                               |
| Charts       | Recharts                              |
| Backend      | Node.js + Express                     |
| Database     | PostgreSQL                            |
| Auth         | JWT + Google OAuth                    |
| Mobile       | Capacitor (Android)                   |
| PWA          | vite-plugin-pwa + Workbox             |

---

## 🚀 Local Development

### Talablar
- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 1. Clone va setup

```bash
git clone https://github.com/your-org/boyaka.git
cd boyaka
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# .env faylini to'ldiring (DATABASE_URL, JWT_SECRET, va boshqalar)
npm install
npm run migrate
npm run dev
```

Backend `http://localhost:5000` da ishlaydi.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# .env faylida VITE_API_URL=http://localhost:5000 bo'lishi kerak
npm install
npm run dev
```

Frontend `http://localhost:5173` da ishlaydi.

---

## 🏭 Production Build

```bash
cd frontend
npm run build
```

Build output: `frontend/dist/`

Preview:
```bash
npm run preview
```

---

## 🌐 Deployment

### Vercel (Tavsiya etiladi)

1. Vercel'da yangi project yarating
2. Root directory: `.` (loyiha root)
3. Build Command: `cd frontend && npm install && npm run build`
4. Output Directory: `frontend/dist`
5. Environment variables:

| Variable      | Qiymat                                        |
|---------------|-----------------------------------------------|
| `VITE_API_URL`| `https://your-backend.onrender.com`           |

`vercel.json` allaqachon sozlangan (SPA routing va security headers bilan).

### Netlify

```bash
# Root'da netlify.toml tayyor
# Netlify UI'da:
#   Base directory: frontend
#   Build command: npm run build
#   Publish directory: dist
```

### Backend (Render yoki Railway)

1. Render.com'da yangi Web Service yarating
2. Root: `backend/`
3. Build: `npm install`
4. Start: `npm start`
5. Environment variables ni `.env.example` asosida to'ldiring

---

## 📲 PWA (Progressive Web App)

Boyaka PWA sifatida o'rnatish mumkin!

### Fayllar
| Fayl | Joyi |
|------|------|
| Manifest | `frontend/public/manifest.webmanifest` (build vaqtida yaratiladi) |
| Icons | `frontend/public/icons/` |
| Service Worker | `frontend/dist/sw.js` (build vaqtida yaratiladi) |
| Offline sahifa | `frontend/public/offline.html` |

### Telefonda o'rnatish
1. Chrome/Safari'da saytni oching
2. "Bosh ekranga qo'shish" tugmasini bosing
3. App avtomatik o'rnatiladi

### 🎨 Ikonlarni almashtirish
Hozir `public/icons/` da **placeholder** ikonalar bor (SVG placeholder).

Final logo tayyor bo'lganda:
1. `public/icons/source-icon.svg` fayliga yangi logoni joylang (1024×1024, kvadrat)
2. `node scripts/generate-icons.js` ni ishga tushiring (sharp kerak)
3. Yoki onlayn: [realfavicongenerator.net](https://realfavicongenerator.net)

Kerakli PNG o'lchamlari: `72, 96, 128, 144, 152, 192, 384, 512` + maskable versiyalari

---

## 🤖 Android App (Capacitor)

Loyiha Capacitor bilan Android appga o'ralgan.

### Capacitor o'rnatilgan pluginlar
- `@capacitor/app` — back button
- `@capacitor/status-bar` — status bar rangi
- `@capacitor/splash-screen` — splash screen
- `@capacitor/keyboard` — keyboard resize

### Android build workflow

**1. Build qilish va sync:**
```bash
cd frontend
npm run android:build
# yoki qo'lda:
npm run build
npx cap sync android
```

**2. Android Studio'da ochish:**
```bash
npx cap open android
# Android Studio avtomatik ochiladi
```

**3. Emulator yoki real qurilmada run:**
- Android Studio'da ▶ (Run) tugmasini bosing
- Real qurilma: USB debugging yoqib ulang

**4. Debug APK (test uchun):**
Android Studio → Build → Build Bundle(s)/APK(s) → Build APK(s)

**5. Release AAB (Play Market uchun):**
Android Studio → Build → Generate Signed Bundle/APK → Android App Bundle

> ⚠️ Release uchun **keystore** kerak. Keystore bir marta yaratilib xavfsiz saqlansin!

```bash
# Keystore yaratish (bir marta):
keytool -genkey -v -keystore boyaka-release.keystore \
  -alias boyaka -keyalg RSA -keysize 2048 -validity 10000
```

### App settings
- **App ID:** `uz.boyaka.app`
- **App Name:** Boyaka
- **Min SDK:** 22 (Android 5.1+)
- **Target SDK:** 34 (Android 14)

---

## 🔒 Environment Variables

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_APP_ENV=development
```

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/boyaka
JWT_SECRET=your_min_32_chars_secret
FRONTEND_URL=http://localhost:5173
```

To'liq ro'yxat: `backend/.env.example` va `frontend/.env.example`

---

## 📋 Play Market tayyorgarlik ro'yxati

- [ ] Google Play Console account yaratish
- [ ] Release keystore yaratish va xavfsiz saqlash
- [ ] App ikonlari (512×512 PNG + feature graphic 1024×500)
- [ ] Screenshots (har xil screen o'lchamlarda)
- [ ] Privacy Policy sahifasi (https://boyaka.app/privacy)
- [ ] Terms of Use sahifasi (https://boyaka.app/terms)
- [ ] App nomi, tavsif (Uzbek va Ingliz)
- [ ] Release AAB yaratish (Android Studio)
- [ ] App signing (Google-managed yoki self-managed)
- [ ] Store listing to'ldirish
- [ ] Ichki test → Closed test → Open test → Production

---

## 🧪 Testing Checklist

### Local
- [x] `npm install` ✅
- [x] `npm run dev` ✅
- [x] `npm run build` ✅ (Exit code: 0)
- [x] `npm run preview` ✅

### PWA
- [x] `dist/manifest.webmanifest` yaratildi ✅
- [x] `dist/sw.js` service worker yaratildi ✅
- [x] Offline sahifa: `public/offline.html` ✅
- [x] Icons tuzilmasi: `public/icons/` ✅

### Android
- [x] `npx cap add android` ✅
- [x] `npx cap sync android` ✅
- [ ] Android Studio'da run → qurilmada test qiling

### Deployment
- [x] `vercel.json` — SPA routing + security headers ✅
- [x] `netlify.toml` — Netlify config ✅
- [x] `.env.example` fayllar ✅

---

## 📁 Loyiha tuzilmasi

```
boyaka/
├── frontend/
│   ├── public/
│   │   ├── icons/           ← PWA ikonlar (almashtiring!)
│   │   ├── offline.html     ← Offline fallback
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx   ← Desktop sidebar + mobile bottom nav
│   │   │   └── ErrorBoundary.jsx
│   │   ├── pages/           ← Barcha sahifalar
│   │   ├── context/         ← Auth, Currency, Theme
│   │   ├── hooks/           ← Custom hooks
│   │   └── utils/
│   ├── android/             ← Capacitor Android project
│   ├── capacitor.config.ts  ← Capacitor config
│   ├── vite.config.js       ← Vite + PWA config
│   └── package.json
├── backend/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── server.js
├── vercel.json              ← Vercel deployment config
├── netlify.toml             ← Netlify deployment config
└── README.md
```

---

## 🤝 Muammo topilsa

1. `npm run build` chiqargan errorni tekshiring
2. `.env` fayllar to'g'ri sozlanganini tekshiring
3. PostgreSQL ishlab turganini tekshiring (`pg_isready`)
4. Backend loglarini tekshiring (`npm run dev` backend)

---

*Boyaka — O'z moliyangizni o'zingiz boshqaring 💙*
