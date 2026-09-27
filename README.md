# VideoMove — video messenger + short-video social network

React + Vite + Tailwind (Glassmorphism) frontend, Supabase backend (Auth, PostgreSQL, Storage, Realtime). Firebase ishlatilmagan.

## 1. Supabase loyihasini tayyorlash
1. https://supabase.com da yangi project oching.
2. **SQL Editor** → `supabase/schema.sql` faylini to‘liq qo‘ying → **Run**.
   Bu barcha jadvallar, indekslar, triggerlar, RPC funksiyalar, RLS policy'lar, 7 ta Storage bucket va Realtime'ni sozlaydi. Qayta ishga tushirish xavfsiz.
3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:5173` (production'da Vercel domeningiz)
   - Redirect URLs: `http://localhost:5173/**` va `https://<domeningiz>/**`
4. (Ixtiyoriy) **Authentication → Providers → Google** ni yoqing (Google Cloud'dan Client ID/Secret).
5. **Project Settings → API** dan `Project URL` va `anon public` key'ni oling.

> Service-role key hech qachon frontendga qo‘yilmaydi.

## 2. Ishga tushirish
```bash
cp .env.example .env      # URL va anon key'ni yozing
npm install
npm run dev
```

## 3. Deploy (Vercel)
Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. `vercel.json` SPA route'larni sozlaydi.

## Funksiyalar
- **Auth**: register (ism, familiya, username, email, parol, avatar), login, Google, email tasdiqlash, parolni tiklash, session saqlash, logout.
- **Bir nechta akkaunt**: Settings → Add account; akkauntlar o‘rtasida almashish, olib tashlash.
- **Feed**: storylar, video/rasm postlar, like / comment / share / save, cheksiz scroll, realtime like soni va “N new posts”.
- **Reels**: to‘liq ekran vertikal video, swipe (scroll-snap) va klaviatura ↑↓, autoplay, double-tap like, follow.
- **Stories**: rasm / video / matn, 24 soat, ko‘rishlar soni va ro‘yxati, like, o‘chirish.
- **Live**: WebRTC (host → har bir tomoshabin), Supabase Realtime broadcast orqali signaling, presence orqali tomoshabinlar soni, realtime komment va reaksiyalar. Followerlarga bildirishnoma.
- **Messenger**: 1:1 va guruh chat, matn, emoji, rasm, video, fayl, ovozli xabar, reply, edit, delete, copy, forward, reaksiyalar, sent / delivered / read, “typing…”, online / last seen. Chat fayllari **private** bucket'larda, signed URL orqali.
- **Search**: foydalanuvchilar, videolar, hashtaglar, trend hashtaglar.
- **Notifications**: follow, like, comment, reply, mention, message, story like, live — trigger orqali yaratiladi, realtime keladi, Settings'da har bir turini o‘chirish mumkin.
- **Settings**: Account, Privacy (online status, kim yozishi mumkin), Notifications, Appearance (Dark/Light/System, localStorage), Security (parol, boshqa qurilmalardan chiqish), Language (uz/en/ru), Add account, Logout.

## Arxitektura
```
src/
  components/{layout,auth,chat,video,stories,profile,live,common}
  pages/ (Home, Reels, Explore, Messages, Notifications, Profile, PostPage, Live, LiveRoom, Settings, auth/*)
  services/ (auth, account, profile, video, comment, story, message, follow, notification, live, storage)
  store/ (Zustand: auth, theme, ui)
  hooks/ (useAppRealtime, useInView, useSignedUrl)
  lib/supabase.js
supabase/schema.sql
```

## Eslatmalar
- Storage limiti: video 50 MB (Supabase Free plan global limiti 50 MB). Pro'da `schema.sql` va `storageService.js` dagi limitni oshirishingiz mumkin.
- Live mesh-arxitektura (host har bir tomoshabinga alohida ulanadi) ~10–20 tomoshabingacha yaxshi ishlaydi. Katta auditoriya uchun SFU (LiveKit, mediasoup) kerak; signaling qatlami tayyor. Qattiq NAT orqasidagi foydalanuvchilar uchun `.env` ga TURN server qo‘shing.
- Eski storylarni avtomatik tozalash uchun `schema.sql` oxiridagi `pg_cron` qatorini yoqing.
