-- =============================================
-- 007: Kapsamli aile sistemi duzeltmesi
-- Migration 005 + 006 + create_family_with_admin guncelleme
-- Supabase Dashboard > SQL Editor'den calistirilmali
-- =============================================

-- ==========================================
-- BOLUM 1: family_members izin kolonlari
-- ==========================================
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS can_view_finance BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_create_finance BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_edit_finance BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_delete_finance BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_members BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_invitations BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_assign_permissions BOOLEAN NOT NULL DEFAULT false;

-- Mevcut admin'lere tum izinleri ver
UPDATE family_members
SET
  can_view_finance = true,
  can_create_finance = true,
  can_edit_finance = true,
  can_delete_finance = true,
  can_manage_members = true,
  can_manage_invitations = true,
  can_assign_permissions = true
WHERE role = 'admin';

-- ==========================================
-- BOLUM 2: family_invitations yasam dongusu
-- ==========================================
ALTER TABLE family_invitations
  ADD COLUMN IF NOT EXISTS invited_user_id UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ NULL;

-- Status constraint guncelle
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'family_invitations_status_check'
  ) THEN
    ALTER TABLE family_invitations DROP CONSTRAINT family_invitations_status_check;
  END IF;
END $$;

ALTER TABLE family_invitations
  ADD CONSTRAINT family_invitations_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'canceled', 'expired'));

-- Ayni aileye ayni e-posta icin tek pending davet
CREATE UNIQUE INDEX IF NOT EXISTS uq_family_invitation_pending_per_email
  ON family_invitations (family_id, invited_email)
  WHERE status = 'pending';

-- ==========================================
-- BOLUM 3: Audit log tablosu
-- ==========================================
CREATE TABLE IF NOT EXISTS family_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NULL,
  target_id TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_audit_logs_family_id_created_at
  ON family_audit_logs (family_id, created_at DESC);

-- ==========================================
-- BOLUM 4: RLS politika duzeltmeleri (davet)
-- ==========================================

-- family_invitations SELECT: JWT email kullan (auth.users bagimliligini kaldir)
DROP POLICY IF EXISTS "Users can view their invitations" ON family_invitations;
CREATE POLICY "Users can view their invitations" ON family_invitations
  FOR SELECT USING (
    invited_by = auth.uid()
    OR lower(invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

-- family_invitations UPDATE: kabul/red
DROP POLICY IF EXISTS "Invited users can update invitation status" ON family_invitations;
CREATE POLICY "Invited users can update invitation status" ON family_invitations
  FOR UPDATE USING (
    lower(invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

-- family_invitations DELETE: admin iptal
DROP POLICY IF EXISTS "Family admins can delete invitations" ON family_invitations;
CREATE POLICY "Family admins can delete invitations" ON family_invitations
  FOR DELETE USING (
    family_id IN (SELECT public.get_my_admin_family_ids())
  );

-- family_members INSERT: davetli katilim
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

-- ==========================================
-- BOLUM 5: has_family_permission fonksiyonu
-- ==========================================
CREATE OR REPLACE FUNCTION public.has_family_permission(
  p_user_id UUID,
  p_family_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m family_members%ROWTYPE;
BEGIN
  SELECT * INTO m
  FROM family_members
  WHERE user_id = p_user_id AND family_id = p_family_id
  LIMIT 1;

  IF NOT FOUND THEN RETURN false; END IF;
  IF m.role = 'admin' THEN RETURN true; END IF;

  CASE p_permission
    WHEN 'view_finance' THEN RETURN m.can_view_finance;
    WHEN 'create_finance' THEN RETURN m.can_create_finance;
    WHEN 'edit_finance' THEN RETURN m.can_edit_finance;
    WHEN 'delete_finance' THEN RETURN m.can_delete_finance;
    WHEN 'manage_members' THEN RETURN m.can_manage_members;
    WHEN 'manage_invitations' THEN RETURN m.can_manage_invitations;
    WHEN 'assign_permissions' THEN RETURN m.can_assign_permissions;
    ELSE RETURN false;
  END CASE;
END;
$$;

-- ==========================================
-- BOLUM 6: add_family_audit_log fonksiyonu
-- ==========================================
CREATE OR REPLACE FUNCTION public.add_family_audit_log(
  p_family_id UUID,
  p_actor_user_id UUID,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO family_audit_logs(family_id, actor_user_id, action, target_type, target_id, metadata)
  VALUES (p_family_id, p_actor_user_id, p_action, p_target_type, p_target_id, coalesce(p_metadata, '{}'::jsonb));
END;
$$;

-- ==========================================
-- BOLUM 7: create_family_with_admin (GUNCELLENDI)
-- Artik admin icin tum izinleri de set eder
-- ==========================================
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

  IF EXISTS (SELECT 1 FROM family_members WHERE user_id = current_user_id) THEN
    RAISE EXCEPTION 'Already a member of a family';
  END IF;

  INSERT INTO families (name, created_by)
  VALUES (family_name, current_user_id)
  RETURNING id INTO new_family_id;

  INSERT INTO family_members (
    family_id, user_id, role,
    can_view_finance, can_create_finance, can_edit_finance, can_delete_finance,
    can_manage_members, can_manage_invitations, can_assign_permissions
  ) VALUES (
    new_family_id, current_user_id, 'admin',
    true, true, true, true,
    true, true, true
  );

  RETURN new_family_id;
END;
$$;

-- ==========================================
-- BOLUM 8: family_audit_logs RLS
-- ==========================================
ALTER TABLE family_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can view audit logs" ON family_audit_logs;
CREATE POLICY "Family members can view audit logs" ON family_audit_logs
  FOR SELECT USING (
    family_id IN (SELECT public.get_my_family_ids())
  );
