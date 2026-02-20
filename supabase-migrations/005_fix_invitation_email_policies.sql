-- =============================================
-- Fix 005: Davet e-posta RLS eslestirme duzeltmesi
-- Bu SQL'i Supabase Dashboard > SQL Editor'den calistirin
-- =============================================

-- 1) family_invitations SELECT politikasini auth.users bagimliligindan kurtar
DROP POLICY IF EXISTS "Users can view their invitations" ON family_invitations;

CREATE POLICY "Users can view their invitations" ON family_invitations
  FOR SELECT USING (
    invited_by = auth.uid()
    OR lower(invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

-- 2) family_invitations UPDATE (kabul/red) politikasini duzelt
DROP POLICY IF EXISTS "Invited users can update invitation status" ON family_invitations;

CREATE POLICY "Invited users can update invitation status" ON family_invitations
  FOR UPDATE USING (
    lower(invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

-- 3) family_members INSERT (davetli kullanici katilimi) politikasini duzelt
DROP POLICY IF EXISTS "Invited users can join family" ON family_members;

CREATE POLICY "Invited users can join family" ON family_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND family_id IN (
      SELECT family_id
      FROM family_invitations
      WHERE lower(invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
        AND status = 'pending'
    )
  );
