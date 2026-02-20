-- =============================================
-- Fix 002: Aile Sistemi RLS Politika Duzeltmeleri
-- Bu SQL'i Supabase Dashboard > SQL Editor'den calistirin
-- =============================================

-- 1. Self-referential RLS sorununu cozmek icin SECURITY DEFINER helper fonksiyonlari
--    Bu fonksiyonlar RLS'yi bypass ederek sonsuz dongu sorununu onler

CREATE OR REPLACE FUNCTION public.get_my_family_ids()
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_family_ids()
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'admin'
$$;

-- 2. family_members tablosundaki sorunlu self-referential politikalari sil
DROP POLICY IF EXISTS "Family members can view members" ON family_members;
DROP POLICY IF EXISTS "Family admins can manage members" ON family_members;

-- 2a. SELECT: Helper fonksiyon kullanan yeni politika (sonsuz dongu yok)
CREATE POLICY "Family members can view members" ON family_members
  FOR SELECT USING (family_id IN (SELECT public.get_my_family_ids()));

-- 2b. DELETE: Admin baskasini cikarabilir, herkes kendini cikarabilir (aileden ayrilma)
CREATE POLICY "Family members can be deleted" ON family_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR family_id IN (SELECT public.get_my_admin_family_ids())
  );

-- 2c. UPDATE: Sadece adminler (rol degistirme icin)
CREATE POLICY "Family admins can update members" ON family_members
  FOR UPDATE USING (family_id IN (SELECT public.get_my_admin_family_ids()));

-- 3. Eksik INSERT politikalarini ekle

-- 3a. Aile kurucusu kendini admin olarak ekleyebilir
DROP POLICY IF EXISTS "Family creator can add themselves as admin" ON family_members;
CREATE POLICY "Family creator can add themselves as admin" ON family_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    family_id IN (SELECT id FROM families WHERE created_by = auth.uid())
  );

-- 3b. Davetli kullanicilar aileye katilabilir
DROP POLICY IF EXISTS "Invited users can join family" ON family_members;
CREATE POLICY "Invited users can join family" ON family_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    family_id IN (
      SELECT family_id FROM family_invitations
      WHERE invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status = 'pending'
    )
  );

-- 4. families tablosundaki self-referential politikayi duzelt
DROP POLICY IF EXISTS "Family members can view their family" ON families;
CREATE POLICY "Family members can view their family" ON families
  FOR SELECT USING (id IN (SELECT public.get_my_family_ids()));

-- 5. families tablosuna eksik DELETE politikasini ekle (admin bosaltilmis aileyi silebilir)
DROP POLICY IF EXISTS "Family creator can delete family" ON families;
CREATE POLICY "Family creator can delete family" ON families
  FOR DELETE USING (created_by = auth.uid());

-- 6. family_invitations admin politikasini duzelt (dolayli self-referential sorun)
DROP POLICY IF EXISTS "Family admins can create invitations" ON family_invitations;
CREATE POLICY "Family admins can create invitations" ON family_invitations
  FOR INSERT WITH CHECK (
    family_id IN (SELECT public.get_my_admin_family_ids())
  );
