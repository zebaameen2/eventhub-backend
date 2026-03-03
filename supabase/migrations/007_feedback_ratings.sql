-- ============================================================
-- 6. FEEDBACK & RATINGS
-- Session rating (1-5), comments, for analytics
-- ============================================================

CREATE TABLE IF NOT EXISTS session_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_session_ratings_session ON session_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_ratings_user ON session_ratings(user_id);

CREATE TABLE IF NOT EXISTS session_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_comments_session ON session_comments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_comments_created ON session_comments(session_id, created_at);

COMMENT ON TABLE session_ratings IS '1-5 star rating per session per user';
COMMENT ON TABLE session_comments IS 'Text feedback/comments per session';
