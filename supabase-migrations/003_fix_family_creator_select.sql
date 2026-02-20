-- =============================================
-- Fix 003: Aile kurucusunun kendi ailesini gorebilmesi
-- Bu SQL'i Supabase Dashboard > SQL Editor'den calistirin
-- =============================================

-- Mevcut SELECT politikasini guncelle:
-- Hem family_members uyeleri hem de aileyi olusturan kisi gorebilsin
DROP POLICY IF EXISTS "Family members can view their family" ON families;

CREATE POLICY "Family members can view their family" ON families
  FOR SELECT USING (
    id IN (SELECT public.get_my_family_ids())
    OR created_by = auth.uid()
  );
