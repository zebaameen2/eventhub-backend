-- ============================================================
-- 1. EVENT REGISTRATION SYSTEM (extend)
-- Ticket types + registration limits + unique access credentials
-- ============================================================

-- Ticket types per event (VIP, General, etc.)
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER DEFAULT 0,
  quantity_limit INTEGER,
  sold_count INTEGER DEFAULT 0 CHECK (sold_count >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, name)
);

CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON ticket_types(event_id);

-- Extend registrations: ticket type, unique access code, confirmed_at
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_registrations_access_code ON registrations(access_code) WHERE access_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_type_id ON registrations(ticket_type_id) WHERE ticket_type_id IS NOT NULL;

-- Function: generate unique access code on insert (when null)
CREATE OR REPLACE FUNCTION set_registration_access_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.access_code IS NULL OR NEW.access_code = '' THEN
    NEW.access_code := upper(substr(md5(random()::text || NEW.id::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_registration_access_code ON registrations;
CREATE TRIGGER trigger_set_registration_access_code
  BEFORE INSERT ON registrations
  FOR EACH ROW EXECUTE PROCEDURE set_registration_access_code();

COMMENT ON TABLE ticket_types IS 'Ticket types per event (VIP, General, etc.) with limits';
COMMENT ON COLUMN registrations.access_code IS 'Unique credential for attendee access';
COMMENT ON COLUMN registrations.confirmed_at IS 'Set when registration is accepted';
