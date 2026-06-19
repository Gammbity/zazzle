# Stitch AI — Zazzle Uzbekistan dizayn prompti

---

## Loyiha haqida qisqacha

**Zazzle Uzbekistan** — O'zbekiston uchun maxsus bosma mahsulotlar (print-on-demand) platformasi.
Foydalanuvchi o'z rasmini yoki dizaynini yuklaydi, mahsulotda qanday ko'rinishini real vaqtda ko'radi va buyurtma beradi.

**Tech stack:** React, TypeScript, Tailwind CSS, Vite  
**Til:** O'zbek tili  
**Asosiy rang:** Amber/Orange (#d97706 — amber-600)  
**Fon:** Oq + iliq amber gradiyenti  

---

## Sahifalar va komponentlar

### 1. Navbar (Sticky header)
- Chap: Logo — kichik kvadrat icon (amber gradient, ichida "Z" harfi) + "Zazzle" / "Uzbekistan" yozuvi
- O'rta: navigatsiya linklari — "Bosh sahifa", "Mahsulotlar", "Buyurtmalar"
- O'ng: Savat icon (badge bilan — amber doira ichida son), mobil uchun hamburger menyu
- Stil: `bg-white/95 backdrop-blur`, pastki border `amber-100`, sticky top-0

---

### 2. Home Page (Bosh sahifa)

#### Hero Section
- Katta sarlavha: **"Mahsulotlarga jonli ko'rinish bilan dizayn bering"** (amber gradient text accent bilan)
- Kichik tavsif: "Rasm yuklang va mahsulotda qanday ko'rinishini darhol ko'ring."
- 2 ta tugma: `Mahsulotlarni ko'rish` (amber solid) + `Qanday ishlashini ko'rish` (border/outline)
- O'ng tomonda: 2 ta floating product card — birida futbolka old tomoni, ikkinchisida futbolkani kiygan odam rasmiga
- Floating cardlar: oq, rounded-[2rem], shisha effekti (backdrop-blur), har biri biroz qiyalik bilan (rotate-[7deg] / -rotate-[9deg])
- Fon: radial amber + orange gradient, engil blur doiralari

#### Mahsulotlar Grid
- 5 ta mahsulot: Futbolka, Krujka, Vizitka, Stol kalendari, Ruchka
- Har bir karta: oq fon, rounded-[2rem], mahsulot rasmr, nom, narx, qisqa tavsif, "Dizayn qilish" tugmasi
- Narxlar: 18 000 — 120 000 UZS oralig'ida

---

### 3. Product Detail Page (Mahsulot sahifasi)

**2 ustunli layout (desktop):**

**Chap ustun (sticky):**
- Oq rounded panel ichida mahsulot preview
- Mug/Ruchka uchun: 3D aylanadigan ko'rinish
- Futbolka uchun: old/orqa almashtirish uchun thumbnail-lar qatori

**O'ng ustun (scroll qiladi):**
- **Purchase Panel** (Xarid paneli — BIRINCHI):
  - Mahsulot nomi + narx
  - Rang tanlash (colored swatches — doira-doira)
  - Hajm tanlash (size buttons: XS S M L XL XXL)
  - Miqdor stepper (− miqdor +)
  - `Savatga qo'shish` tugmasi (amber, to'liq kenglik, ShoppingCart icon)
- **Editor Panel** (IKKINCHI, pastroqda):
  - Konva canvas (oq kvadrat maydon)
  - Toolbar: Rasm yuklash, Matn qo'shish, Stiker qo'shish, Tozalash
  - Layer list — qo'shilgan elementlar ro'yxati

**Mobil (pastki sticky bar):**
- Mahsulot nomi + narx + `Savatga qo'shish` tugmasi
- `position: sticky; bottom: 0`

---

### 4. Cart Page (Savat sahifasi)

**Holat 1 — Mehmon:**
- Markazda: ShoppingBag icon + "Savatchangizga kirish uchun hisob kerak" + `Hisobga kirish` tugmasi

**Holat 2 — Bo'sh savat:**
- Package2 icon + "Savatcha hozircha bo'sh" + `Mahsulotlarga qaytish` tugmasi

**Holat 3 — Mahsulotlar bor (2 ustun):**
- **Chap:** savat elementlari — har biri oq karta (mahsulot nomi, variant, narx, miqdor stepper, `Olib tashlash` tugmasi)
- **O'ng:** Order Summary — amber-to-orange gradient panel (qorong'i) ichida: mahsulotlar soni, oraliq summa, yetkazib berish, jami + `Checkoutga o'tish` tugmasi

---

### 5. Orders Page (Buyurtmalar sahifasi)

- Sarlavha: "Mening buyurtmalarim"
- Har bir buyurtma: oq karta — buyurtma raqami, sana, status badge (Pending=sariq, Processing=ko'k, Delivered=yashil), jami summa, `Batafsil` link

---

## Dizayn tizimi

| Element | Qiymat |
|---|---|
| Asosiy rang | `amber-600` (#d97706) |
| Hover | `amber-700` |
| Fon | `white` + `amber-50` gradient |
| Border | `stone-200` yoki `amber-100` |
| Text asosiy | `slate-900` |
| Text ikkilamchi | `slate-500` |
| Border radius | `rounded-2xl` (16px) — `rounded-[2rem]` (32px) |
| Shadow | `shadow-sm shadow-stone-100/50` |
| Font | System sans-serif, bold sarlavhalar |

**Tugmalar:**
- Primary: `bg-amber-600 text-white rounded-full px-5 py-2.5 hover:bg-amber-700`
- Secondary: `border border-amber-200 bg-white text-slate-700 rounded-full hover:bg-amber-50`
- Danger: `border border-rose-200 bg-rose-50 text-rose-700 rounded-full`

**Cardlar:**
- `rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50`

**Fon gradient:**
- `linear-gradient(180deg, #fffbeb 0%, #ffffff 40%)`

---

## Muhim UX nuqtalari

1. Mahsulot sahifasida xarid paneli redaktordan **OLDIN** ko'rinadi
2. Mobilda pastki sticky bar doim ko'rinib turadi
3. Savat iconida amber badge bilan mahsulotlar soni
4. Barcha forma elementlari: rounded corners, amber focus ring
5. Loading holatlari: `animate-pulse` amber skeleton
6. Hamma matnlar O'zbek tilida
7. Narxlar UZS formatida (masalan: `65 000 UZS`)

---

## Sahifalar ro'yxati (routes)

- `/` — Bosh sahifa (Hero + Products grid)
- `/products/t-shirt` — Futbolka mahsulot sahifasi
- `/products/mug` — Krujka mahsulot sahifasi
- `/products/business-card` — Vizitka mahsulot sahifasi
- `/products/desk-calendar` — Stol kalendari mahsulot sahifasi
- `/products/pen` — Ruchka mahsulot sahifasi
- `/cart` — Savat
- `/checkout` — Checkout
- `/orders` — Buyurtmalar
- `/orders/:id` — Buyurtma tafsiloti





