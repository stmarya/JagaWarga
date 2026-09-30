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

-- Versioned security-awareness catalog. The web client requests one topic at a
-- time, so the full curriculum is not bundled into browser memory.
CREATE TABLE IF NOT EXISTS education_topics (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  badge TEXT NOT NULL,
  position INTEGER NOT NULL,
  published BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS education_lessons (
  id UUID PRIMARY KEY,
  topic_slug TEXT NOT NULL REFERENCES education_topics(slug) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  safe_action TEXT NOT NULL,
  risky_action TEXT NOT NULL,
  UNIQUE(topic_slug, position)
);
CREATE TABLE IF NOT EXISTS education_questions (
  id UUID PRIMARY KEY,
  topic_slug TEXT NOT NULL REFERENCES education_topics(slug) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option INTEGER NOT NULL CHECK (correct_option >= 0),
  explanation TEXT NOT NULL,
  UNIQUE(topic_slug, position)
);