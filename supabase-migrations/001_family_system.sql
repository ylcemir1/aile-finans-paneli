-- =============================================
-- Aile Sistemi - Veritabani Migration
-- Bu SQL'i Supabase Dashboard > SQL Editor'den calistirin
-- =============================================

-- 1. Aileler tablosu
CREATE TABLE IF NOT EXISTS families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Aile uyeleri tablosu
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_id, user_id)
);

-- 3. Aile davetleri tablosu
CREATE TABLE IF NOT EXISTS family_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES profiles(id) NOT NULL,
  invited_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Mevcut tablolara family_id ekleme
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);

-- 5. RLS politikalari
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- Families: sadece uyeler gorebilir
CREATE POLICY "Family members can view their family" ON families
  FOR SELECT USING (
    id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create families" ON families
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Family members: ayni aileden uyeler gorebilir
CREATE POLICY "Family members can view members" ON family_members
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members fm WHERE fm.user_id = auth.uid())
  );

CREATE POLICY "Family admins can manage members" ON family_members
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Family invitations: davet eden ve davet edilen gorebilir
CREATE POLICY "Users can view their invitations" ON family_invitations
  FOR SELECT USING (
    invited_by = auth.uid()
    OR invited_email IN (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Family admins can create invitations" ON family_invitations
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Invited users can update invitation status" ON family_invitations
  FOR UPDATE USING (
    invited_email IN (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 6. Indexler
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_email ON family_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_family_invitations_family_id ON family_invitations(family_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_family_id ON bank_accounts(family_id);
CREATE INDEX IF NOT EXISTS idx_loans_family_id ON loans(family_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_family_id ON credit_cards(family_id);
