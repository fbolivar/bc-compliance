-- =============================================================
-- BC COMPLIANCE - MIGRATION 005: INVITATION SYSTEM
-- =============================================================

-- Invitation status enum
DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  status invitation_status NOT NULL DEFAULT 'pending',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES profiles(id),
  message TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, email, status)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Auto-update timestamp
DROP TRIGGER IF EXISTS set_invitations_updated_at ON invitations;
CREATE TRIGGER set_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Org members can see their org's invitations
CREATE POLICY invitations_select ON invitations FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Org members can create invitations
CREATE POLICY invitations_insert ON invitations FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- Org members can update (revoke) invitations
CREATE POLICY invitations_update ON invitations FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Org members can delete invitations
CREATE POLICY invitations_delete ON invitations FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Function to accept an invitation (called with service role, no RLS)
CREATE OR REPLACE FUNCTION accept_invitation(
  p_token UUID,
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
  v_existing RECORD;
  v_role_id UUID;
BEGIN
  -- Find valid invitation
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invitacion no valida o expirada');
  END IF;

  -- Check if user is already a member
  SELECT * INTO v_existing
  FROM organization_members
  WHERE organization_id = v_invitation.organization_id
    AND user_id = p_user_id;

  IF FOUND THEN
    -- Update invitation status
    UPDATE invitations SET status = 'accepted', accepted_at = NOW() WHERE id = v_invitation.id;
    RETURN jsonb_build_object('error', 'Ya eres miembro de esta organizacion');
  END IF;

  -- Find role_id for the invited role
  SELECT id INTO v_role_id
  FROM roles
  WHERE organization_id = v_invitation.organization_id
    AND name = v_invitation.role;

  -- Add user to organization
  INSERT INTO organization_members (organization_id, user_id, role_id, is_owner, is_active)
  VALUES (v_invitation.organization_id, p_user_id, v_role_id, FALSE, TRUE);

  -- Mark invitation as accepted
  UPDATE invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_invitation.organization_id
  );
END;
$$;

-- Function to auto-expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$;
