-- ============================================================
-- 14. POST EVENT ENGAGEMENT
-- Follow-up email log, community chat, content access control
-- ============================================================

CREATE TABLE IF NOT EXISTS follow_up_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  template_name TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_up_emails_event ON follow_up_emails(event_id);

CREATE TABLE IF NOT EXISTS community_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_chats_event ON community_chats(event_id);

CREATE TABLE IF NOT EXISTS community_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_chat_id UUID NOT NULL REFERENCES community_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_chat_messages_room ON community_chat_messages(community_chat_id);
CREATE INDEX IF NOT EXISTS idx_community_chat_messages_created ON community_chat_messages(community_chat_id, created_at);

CREATE TABLE IF NOT EXISTS content_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('recording', 'slide', 'document')),
  resource_id UUID NOT NULL,
  access_after TIMESTAMPTZ,
  access_rule TEXT DEFAULT 'post_event' CHECK (access_rule IN ('immediate', 'post_event', 'paid_only')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_access_rules_event ON content_access_rules(event_id);

COMMENT ON TABLE follow_up_emails IS 'Log of post-event emails sent';
COMMENT ON TABLE community_chats IS 'Post-event community rooms';
COMMENT ON TABLE content_access_rules IS 'When/how content (e.g. recordings) becomes available';
