-- ============================================================
-- 3. REAL-TIME ANNOUNCEMENTS
-- Admin announcements + user notifications (Realtime + email fallback)
-- ============================================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_event_id ON announcements(event_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(event_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'announcement',
  title TEXT,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_event ON user_notifications(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON user_notifications(user_id, created_at DESC);

COMMENT ON TABLE announcements IS 'Admin announcements per event; use Supabase Realtime for push';
COMMENT ON TABLE user_notifications IS 'In-app notifications; email fallback via backend';
