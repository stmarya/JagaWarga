-- Persistence foundation only. The technical prototype does not activate server-side history.
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('family', 'class', 'organization')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'learner')),
  PRIMARY KEY (workspace_id, user_id)
);
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  actor_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Raw indicators, message bodies, email headers, QR images, and files must never be stored here.