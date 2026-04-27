# Frontend yaxshilash reja (Sprint roadmap)

> Manba: `frontend/` (React 18 + Vite + TS strict + Zustand + Konva/Fabric/Three).
> Bosqichlar 1–2 haftalik sprintlarga bo'lingan. Avvalgi sprintning bitishi keyingisini ochadi.

## Texnik holat (qisqacha)

**Kuchli tomonlar:** TS strict, Zustand store, Vite chunk splitting, Konva/Fabric ajratilgan, accessible `Modal`, IndexedDB draft storage, Tailwind design system.

**Zaif tomonlar:**

- Testlar umuman yo'q (Vitest/RTL sozlanmagan).
- `ErrorBoundary` yo'q — canvas xatosi butun sahifani sindiradi.
- Barcha `commerce.ts` endpointlari TODO/stub — real backend ulanmagan.
- Giant komponentlar: `customizer/Sidebar.tsx` (806), `editor/EditorPanel.tsx` (657), `TshirtSidebar.tsx` (583).
- Ikki parallel editor arxitekturasi (legacy Fabric vs yangi Konva).
- i18n yo'q — butun UI qattiq kodlangan o'zbek tili.
- Auth localStorage'da (XSS riski), CSRF yo'q.
- `react-hooks` ESLint plugin yoqilmagan — bog'liqlik massivi xatolari tutilmaydi.

---

## Sprint 1 — Barqarorlik va poydevor (1 hafta) ✅ qisman bajarildi

**Maqsad:** ishonchli crash-himoyasi va backend ulash uchun poydevor.

- [x] `ErrorBoundary` komponenti + `App` darajasida o'rash.
- [x] `SkipToContent` a11y havolasi.
- [x] `App.tsx` router — deklarativ route jadvali.
- [x] `.env.example` + `src/lib/env.ts` (VITE\_ prefiksli konfiguratsiya).
- [x] `src/lib/apiClient.ts` — `fetch` wrapper, typed errors (`ApiError`), auth header, timeout.
- [x] `commerce.ts` error-narrowing type guard.
- [ ] `eslint-plugin-react-hooks` qo'shish (alohida PRda `npm i -D` bilan).
- [ ] `husky` + `lint-staged` pre-commit hook (lint + type-check).

**Acceptance:** canvas ichida throw qilgan xato butun sahifani emas, faqat editorni sindiradi; build va lint toza.

---

## Sprint 2 — Backend ulash (1–2 hafta)

**Maqsad:** `commerce.ts` stublarini haqiqiy backendga ulash.

- [ ] `apiClient` orqali `/api/auth/login`, `/api/auth/register`, `/api/auth/logout` ulash.
- [ ] Token saqlashni `localStorage` dan `HttpOnly cookie` ga ko'chirish (backend tomondan `Set-Cookie`, frontend `credentials: 'include'`).
- [ ] CSRF token oqimini qo'shish (POST/PATCH/DELETE uchun).
- [ ] `/api/cart` CRUD (get, add, patch, remove, clear) — optimistic update.
- [ ] `/api/checkout` va `/api/payments/init` — redirect oqimi.
- [ ] `/api/orders` ro'yxati va detali.
- [ ] `/api/products/:slug` va draft yuklash (`/api/designs/drafts`).
- [ ] Xatoliklar uchun umumiy `ErrorToast` komponenti.

**Acceptance:** real serverga qarshi auth → product → savat → checkout → order detail oqimi ishlaydi.

---

## Sprint 3 — Test va CI (1 hafta)

**Maqsad:** regressiyani tutib olish.

- [ ] Vitest + `@testing-library/react` + `jsdom` + `vitest-canvas-mock` o'rnatish.
- [ ] `editorStore` uchun unit testlar (addLayer/undo/redo, z-index, bounds).
- [ ] `draftStorage` testi (IndexedDB fallback).
- [ ] `commerce.ts` formatter/narrow testlari.
- [ ] `ProductCard`, `Modal`, `CartPage` uchun RTL testlar.
- [ ] GitHub Actions workflow: `lint` + `type-check` + `test` + `build`.
- [ ] `README.md` ga ishga tushirish bo'limini yangilash.

**Acceptance:** `npm test` ishlaydi, CI asosiy branchda yashil; kritik yo'llarda 50%+ qamrov.

---

## Sprint 4 — Komponent bo'lish va editor konsolidatsiyasi (2 hafta)

**Maqsad:** gigant komponentlarni parchalash va ikki editorni birlashtirish yo'lini tanlash.

- [ ] `EditorPanel` (657q) → `EditorPanel` + `EditorToolbar` + `EditorPropertiesPanel` + `useEditorHotkeys` hook.
- [ ] `customizer/Sidebar` (806q), `TshirtSidebar` (583q), `SingleSurfaceSidebar` (501q) — `SidebarTabs` va `ImageTab` / `TextTab` / `StickerTab` / `ColorTab` ga ajratish.
- [ ] `ToolBtn`, `ColorSwatch`, `LabeledSlider` ni `components/ui/` ga olib chiqish.
- [ ] `*Wrapper.tsx` (5 ta) uchun `ProductCustomizerBase` generic wrapper.
- [ ] Qaror: Konva editorga to'liq o'tish (Fabric customizerlarni zararsiz deprekatsiya qilish) — [ADR](./adr/0001-editor-consolidation.md) yozish.

**Acceptance:** biror komponent 300 qatordan oshmaydi; Fabric/Konva bo'yicha qaror hujjatlashtirilgan.

---

## Sprint 5 — i18n va mobil tajriba (1 hafta)

- [ ] `react-i18next` o'rnatish, `locales/uz.json`, `locales/ru.json`, `locales/en.json`.
- [ ] Qattiq kodlangan matnlarni `t()` orqali chiqarish (~300 string).
- [ ] Til tanlash (header'da `LanguageSwitcher`), localStorage'da eslab qolish.
- [ ] Mobile canvas o'lcham moslashuvi (`Math.min(500, innerWidth - 32)`).
- [ ] Sidebar'ni mobile'da drawer sifatida ko'rsatish.
- [ ] Klaviatura yorliqlari uchun `dl` yordam panelini a11y ga moslash.

---

## Sprint 6 — Perf, kuzatuv, xavfsizlik (1 hafta)

- [ ] `LayerList` va layer node'larni `React.memo` bilan o'rash; `EditorPanel` handler'lariga `useCallback`.
- [ ] Surface preview render'ini Web Worker'ga ko'chirish (offscreen canvas).
- [ ] Three.js'ni faqat 3D mahsulotlar (mug, pen) uchun shartli yuklash.
- [ ] Sentry (`@sentry/react`) + Web Vitals'ni `reportWebVitals` orqali yig'ish.
- [ ] Content Security Policy headerlari (backend orqali), `Report-Only` rejimda sinov.
- [ ] Fayl yuklash: server tomonida magic-byte validatsiyasi (backend bilan kelishilgan).

**Acceptance:** LCP < 2.5s (3G fast), JS initial < 250KB gzip, zaif layerlarda `render` qalqimay-qoladi.

---

## Keyingi sprintlar (backlog)

- Design system kitobi (Storybook yoki Ladle).
- Draft auto-save (debounced) + konflikt hal qilish.
- A/B test infra (feature flag moslashuvchan).
- SEO: `prerender` yoki SSR kerakli sahifalarga.
- E2E: Playwright smoke suite (savatdan to'lov oqimi).

---

## Sprint-ga bog'liq bo'lmagan doimiy qoidalar

- Har bir PR: `lint` + `type-check` yashil.
- Yangi komponent 300 qatordan oshmasin.
- Tashqi API chaqiruvlari `apiClient` orqali.
- Qattiq kodlangan string — faqat `t()` orqali (Sprint 5 dan keyin).
- `any` taqiqlangan, `unknown` + guard qo'llash.
