-- ============================================================
-- 10. SESSION RECORDING LIBRARY
-- Video URL, on-demand access, access control
-- ============================================================

CREATE TABLE IF NOT EXISTS session_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration_sec INTEGER,
  access_level TEXT NOT NULL DEFAULT 'registered' CHECK (access_level IN ('public', 'registered', 'paid')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_recordings_session ON session_recordings(session_id);

COMMENT ON TABLE session_recordings IS 'On-demand session recordings; access_level controls who can view';
