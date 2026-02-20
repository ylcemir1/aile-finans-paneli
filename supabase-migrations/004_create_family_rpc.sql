-- =============================================
-- Fix 004: Atomik aile olusturma fonksiyonu
-- Bu SQL Supabase Dashboard > SQL Editor'den calistirildi
-- =============================================

-- 1. Yetim aileleri temizle (family_members'da karsiligi olmayan)
DELETE FROM families
WHERE id NOT IN (SELECT DISTINCT family_id FROM family_members);

-- 2. Atomik aile olusturma fonksiyonu
-- SECURITY DEFINER ile RLS bypass ediliyor
-- Tek transaction'da hem aile olusturulur hem admin eklenir
CREATE OR REPLACE FUNCTION public.create_family_with_admin(family_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_family_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Kullanici zaten bir ailede mi kontrol et
  IF EXISTS (SELECT 1 FROM family_members WHERE user_id = current_user_id) THEN
    RAISE EXCEPTION 'Already a member of a family';
  END IF;

  -- Aileyi olustur
  INSERT INTO families (name, created_by)
  VALUES (family_name, current_user_id)
  RETURNING id INTO new_family_id;

  -- Kurucuyu admin olarak ekle
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (new_family_id, current_user_id, 'admin');

  RETURN new_family_id;
END;
$$;
