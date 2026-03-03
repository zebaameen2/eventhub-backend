-- ============================================================
-- 9. NETWORKING SYSTEM
-- 1:1 chat, matchmaking placeholder, speed networking
-- ============================================================

CREATE TABLE IF NOT EXISTS direct_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direct_chats_event ON direct_chats(event_id);

CREATE TABLE IF NOT EXISTS direct_chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direct_chat_id UUID NOT NULL REFERENCES direct_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(direct_chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_direct_chat_participants_chat ON direct_chat_participants(direct_chat_id);
CREATE INDEX IF NOT EXISTS idx_direct_chat_participants_user ON direct_chat_participants(user_id);

CREATE TABLE IF NOT EXISTS direct_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direct_chat_id UUID NOT NULL REFERENCES direct_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direct_chat_messages_chat ON direct_chat_messages(direct_chat_id);
CREATE INDEX IF NOT EXISTS idx_direct_chat_messages_created ON direct_chat_messages(direct_chat_id, created_at);

-- Placeholder for AI-based matchmaking (bio, interests)
CREATE TABLE IF NOT EXISTS matchmaking_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  interests JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_matchmaking_profiles_event ON matchmaking_profiles(event_id);

-- Speed networking: time slots and matches
CREATE TABLE IF NOT EXISTS speed_networking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_speed_networking_slots_event ON speed_networking_slots(event_id);

CREATE TABLE IF NOT EXISTS speed_networking_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES speed_networking_slots(id) ON DELETE CASCADE,
  user_id_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slot_id, user_id_1, user_id_2)
);

CREATE INDEX IF NOT EXISTS idx_speed_networking_matches_slot ON speed_networking_matches(slot_id);

COMMENT ON TABLE direct_chats IS '1:1 chat room per event';
COMMENT ON TABLE matchmaking_profiles IS 'Placeholder for AI matchmaking (bio, interests)';
COMMENT ON TABLE speed_networking_matches IS 'Paired users per speed networking slot';
