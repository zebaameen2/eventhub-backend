-- ============================================================
-- 5. BREAKOUT SESSIONS
-- Groups, moderator role, separate chat per breakout
-- ============================================================

CREATE TABLE IF NOT EXISTS breakout_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_breakout_groups_event ON breakout_groups(event_id);

CREATE TABLE IF NOT EXISTS breakout_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakout_group_id UUID NOT NULL REFERENCES breakout_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(breakout_group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_breakout_members_group ON breakout_members(breakout_group_id);
CREATE INDEX IF NOT EXISTS idx_breakout_members_user ON breakout_members(user_id);

CREATE TABLE IF NOT EXISTS breakout_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakout_group_id UUID NOT NULL REFERENCES breakout_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_breakout_chat_group ON breakout_chat_messages(breakout_group_id);
CREATE INDEX IF NOT EXISTS idx_breakout_chat_created ON breakout_chat_messages(breakout_group_id, created_at);

COMMENT ON TABLE breakout_groups IS 'Breakout groups per event/session';
COMMENT ON TABLE breakout_members IS 'Members with member or moderator role';
COMMENT ON TABLE breakout_chat_messages IS 'Chat scoped to breakout group';
