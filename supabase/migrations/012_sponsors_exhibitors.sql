-- ============================================================
-- 12. SPONSOR & EXHIBITOR SYSTEM
-- Virtual booths, sponsor chat, banner management
-- ============================================================

CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tier TEXT,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_event ON sponsors(event_id);

CREATE TABLE IF NOT EXISTS exhibitor_booths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  chat_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exhibitor_booths_event ON exhibitor_booths(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_booths_sponsor ON exhibitor_booths(sponsor_id) WHERE sponsor_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS exhibitor_booth_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_id UUID NOT NULL REFERENCES exhibitor_booths(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exhibitor_booth_chat_booth ON exhibitor_booth_chat_messages(booth_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_booth_chat_created ON exhibitor_booth_chat_messages(booth_id, created_at);

COMMENT ON TABLE sponsors IS 'Sponsors per event with tier and logo';
COMMENT ON TABLE exhibitor_booths IS 'Virtual booths; optional sponsor link';
COMMENT ON TABLE exhibitor_booth_chat_messages IS 'Chat per exhibitor booth';
