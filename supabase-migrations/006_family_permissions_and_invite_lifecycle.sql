-- =============================================
-- 006: Family permissions + invitation lifecycle + audit logs
-- Run in Supabase SQL Editor
-- =============================================

-- 1) family_members: fine-grained permissions
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS can_view_finance BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_create_finance BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_edit_finance BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_delete_finance BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_members BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_invitations BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_assign_permissions BOOLEAN NOT NULL DEFAULT false;

-- Admin rows should always be fully privileged
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

-- 2) family_invitations: lifecycle fields
ALTER TABLE family_invitations
  ADD COLUMN IF NOT EXISTS invited_user_id UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ NULL;

-- Expand status constraint to include canceled/expired if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'family_invitations_status_check'
  ) THEN
    ALTER TABLE family_invitations DROP CONSTRAINT family_invitations_status_check;
  END IF;
END $$;

ALTER TABLE family_invitations
  ADD CONSTRAINT family_invitations_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'canceled', 'expired'));

-- Keep only one pending invitation per family/email
CREATE UNIQUE INDEX IF NOT EXISTS uq_family_invitation_pending_per_email
  ON family_invitations (family_id, invited_email)
  WHERE status = 'pending';

-- 3) Audit log table
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

-- 4) Permission helper function
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
  SELECT *
  INTO m
  FROM family_members
  WHERE user_id = p_user_id
    AND family_id = p_family_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF m.role = 'admin' THEN
    RETURN true;
  END IF;

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

-- 5) Audit log helper
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
  INSERT INTO family_audit_logs(
    family_id,
    actor_user_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    p_family_id,
    p_actor_user_id,
    p_action,
    p_target_type,
    p_target_id,
    coalesce(p_metadata, '{}'::jsonb)
  );
END;
$$;
