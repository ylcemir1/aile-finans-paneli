---
description: Yeni Supabase migration dosyası oluşturur ve Supabase Dashboard'a yönlendirir
argument-hint: "<migration-aciklamasi>"
user-invocable: true
---

# DB Migrate Komutu

Argüman: migration açıklaması (örn. "add_user_settings_table")

1. `supabase-migrations/` dizinindeki mevcut dosyaları listele (en yüksek numarayı bul)
2. Bir sonraki numaralı migration dosyasını oluştur: `00N_<aciklama>.sql`
3. İstenen migration'ı SQL olarak yaz (tablo/sütun/policy değişiklikleri)
4. Kullanıcıya şunu söyle:
   - Dosya oluşturuldu: `supabase-migrations/00N_<aciklama>.sql`
   - Supabase Dashboard > SQL Editor'e git: https://supabase.com/dashboard/project/ylznyzwrzzgoucbanrzk/sql/new
   - SQL içeriğini yapıştır ve çalıştır
   - Sonra `supabase gen types typescript` ile types'ı güncelle
