-- ============================================================
-- 11. CUSTOM BRANDING
-- Event theme: logo, colors, custom CSS
-- ============================================================

CREATE TABLE IF NOT EXISTS event_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE UNIQUE,
  primary_color TEXT DEFAULT '#ec4899',
  secondary_color TEXT DEFAULT '#ffffff',
  logo_url TEXT,
  favicon_url TEXT,
  custom_css TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_themes_event ON event_themes(event_id);

COMMENT ON TABLE event_themes IS 'Per-event branding: logo, colors, custom CSS';
