-- Add Zoom / Meet / Teams link per session (live join URL)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS meeting_url TEXT;

COMMENT ON COLUMN sessions.meeting_url IS 'Live meeting link (Zoom, Google Meet, Teams, etc.) for this session';
