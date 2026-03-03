-- ============================================================
-- 8. SPEAKER MANAGEMENT – presentations
-- Session mapping via session_speakers (already in 003)
-- ============================================================

CREATE TABLE IF NOT EXISTS speaker_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_id UUID NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_speaker_presentations_speaker ON speaker_presentations(speaker_id);
CREATE INDEX IF NOT EXISTS idx_speaker_presentations_session ON speaker_presentations(session_id) WHERE session_id IS NOT NULL;

COMMENT ON TABLE speaker_presentations IS 'Uploaded presentations per speaker/session';
