---
description: Akıllı git commit - değişiklikleri analiz edip uygun commit mesajı yazar ve push eder
argument-hint: "[push] - isteğe bağlı, push da yapar"
user-invocable: true
---

# Commit Komutu

Değişiklikleri analiz et ve commit oluştur:

1. `git status` ve `git diff` ile nelerin değiştiğini gör
2. Değişikliklere uygun Türkçe-dostu commit mesajı oluştur (Conventional Commits formatında: feat/fix/refactor/docs)
3. İlgili dosyaları stage et (`git add`)
4. Commit oluştur (Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com> ekle)
5. Eğer argüman "push" ise `git push` da yap

Commit mesajı formatı:
```
<tip>: <kısa açıklama>

<gerekirse detay>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
