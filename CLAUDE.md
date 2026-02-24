# Aile Finans Paneli – Claude Context

## Proje Özeti
Next.js 16 (App Router) + Supabase tabanlı aile finans yönetim paneli. Türkçe UI.

## Tech Stack
- **Framework**: Next.js 16.1.6 – App Router, Server Actions (`"use server"`)
- **DB/Auth**: Supabase – PostgreSQL + RLS + Auth
- **Styling**: Tailwind CSS
- **Deploy**: Vercel
- **Dil**: TypeScript

## Dizin Yapısı
```
src/
  actions/        # Server actions (auth.ts, admin.ts, family.ts, ...)
  app/
    (auth)/       # login, register
    (dashboard)/  # /, bank-accounts, loans, credit-cards, installments, family, profile, admin
  components/
    auth/ admin/ family/ ui/
  lib/
    supabase/     # client.ts, server.ts, middleware.ts, admin.ts
    validations/  # Zod şemaları
  types/          # database.types.ts (Supabase gen)
supabase-migrations/  # 001..004 SQL migration dosyaları
```

## Kritik Kurallar
- Server action'lar `src/actions/` altında, her zaman `"use server"` direktifi ile
- Admin client (`createAdminClient`) sadece server-side, sadece admin işlemleri için
- RLS politikaları: `get_my_family_ids()` ve `get_my_admin_family_ids()` SECURITY DEFINER fonksiyonları
- Aile oluşturma: `supabase.rpc("create_family_with_admin")` kullanılmalı (RLS bypass)
- Migration'lar `supabase-migrations/` altında numaralı SQL dosyaları olarak saklanır

## Supabase
- URL: `NEXT_PUBLIC_SUPABASE_URL`
- Anon key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role: `SUPABASE_SERVICE_ROLE_KEY` (sadece server, admin client için)

## Roller
- `admin` – tüm kullanıcıları yönetir (profiles.role)
- `user` – standart kullanıcı
- Aile rolleri: `admin` / `member` (family_members.role)

## Yaygın Görevler
- Yeni sayfa: `src/app/(dashboard)/[sayfa]/page.tsx`
- Yeni action: `src/actions/[domain].ts` + `"use server"`
- DB migration: `supabase-migrations/00N_aciklama.sql` oluştur, Supabase SQL Editor'de çalıştır
- Types güncelle: Supabase CLI `supabase gen types typescript --local > src/types/database.types.ts`

## Önemli Notlar
- `user` import'u: `import { createClient } from "@/lib/supabase/server"`
- Admin client: `import { createAdminClient } from "@/lib/supabase/admin"`
- `revalidatePath()` her mutation sonrası çağrılmalı
- Form validation: Zod şemaları `src/lib/validations/index.ts`'de
