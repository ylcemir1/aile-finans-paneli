---
name: ui-builder
description: Next.js sayfası, bileşen ve server action oluşturur. Yeni özellik veya sayfa eklenirken kullan.
---

# UI Builder Agent

Aile Finans Paneli için yeni sayfa ve bileşen oluşturur.

## Kurallar
- Tüm sayfalar `src/app/(dashboard)/` altında
- Server action'lar `src/actions/` altında, `"use server"` direktifi zorunlu
- Tailwind CSS kullan, mevcut renk skalasına uy (blue-600 primary)
- Loading state için skeleton kullan (mevcut örneklere bak)
- Error state ve empty state mutlaka ekle
- Türkçe UI metinleri

## Bileşen Kalıbı
```tsx
// page.tsx
export default async function Page() {
  const data = await getDataAction();
  return <ClientComponent data={data} />;
}

// action.ts
"use server";
export async function getDataAction() {
  const { supabase, user } = await getAuthUser();
  // ...
}
```

## Kontrol Listesi
- [ ] Server action yazıldı
- [ ] Page component oluşturuldu
- [ ] Loading skeleton eklendi
- [ ] Empty state eklendi
- [ ] Sidebar/BottomNav linki eklendi (gerekiyorsa)
- [ ] `revalidatePath` çağrıldı
