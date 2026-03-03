-- ============================================================
-- RLS POLICIES (Supabase)
-- Enable RLS on new tables; service_role has full access.
-- Adjust authenticated/anon policies when using Supabase client from frontend.
-- (Existing tables users, events, registrations: leave as-is or configure separately.)
-- ============================================================

-- Ticket types
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access ticket_types" ON ticket_types FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read ticket_types for listing" ON ticket_types FOR SELECT TO anon USING (true);

-- Sessions
CREATE POLICY "Service role full access sessions" ON sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read sessions" ON sessions FOR SELECT TO anon USING (true);

-- Speakers
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access speakers" ON speakers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read speakers" ON speakers FOR SELECT TO anon USING (true);

-- Session speakers
ALTER TABLE session_speakers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access session_speakers" ON session_speakers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read session_speakers" ON session_speakers FOR SELECT TO anon USING (true);

-- Session bookmarks (users manage own)
ALTER TABLE session_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access session_bookmarks" ON session_bookmarks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access announcements" ON announcements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read announcements" ON announcements FOR SELECT TO anon USING (true);

-- User notifications
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access user_notifications" ON user_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Polls, poll_votes, questions, session_chat_messages
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access polls" ON polls FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read polls" ON polls FOR SELECT TO anon USING (true);

ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access poll_votes" ON poll_votes FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access questions" ON questions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read questions" ON questions FOR SELECT TO anon USING (true);

ALTER TABLE session_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access session_chat_messages" ON session_chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Breakout tables
ALTER TABLE breakout_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access breakout_groups" ON breakout_groups FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE breakout_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access breakout_members" ON breakout_members FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE breakout_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access breakout_chat_messages" ON breakout_chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Feedback
ALTER TABLE session_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access session_ratings" ON session_ratings FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE session_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access session_comments" ON session_comments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Speaker presentations
ALTER TABLE speaker_presentations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access speaker_presentations" ON speaker_presentations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read speaker_presentations" ON speaker_presentations FOR SELECT TO anon USING (true);

-- Networking
ALTER TABLE direct_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access direct_chats" ON direct_chats FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE direct_chat_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access direct_chat_participants" ON direct_chat_participants FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE direct_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access direct_chat_messages" ON direct_chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE matchmaking_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access matchmaking_profiles" ON matchmaking_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE speed_networking_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access speed_networking_slots" ON speed_networking_slots FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE speed_networking_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access speed_networking_matches" ON speed_networking_matches FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Recordings, themes, sponsors, exhibitors
ALTER TABLE session_recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access session_recordings" ON session_recordings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read session_recordings" ON session_recordings FOR SELECT TO anon USING (true);

ALTER TABLE event_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access event_themes" ON event_themes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read event_themes" ON event_themes FOR SELECT TO anon USING (true);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access sponsors" ON sponsors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read sponsors" ON sponsors FOR SELECT TO anon USING (true);
ALTER TABLE exhibitor_booths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access exhibitor_booths" ON exhibitor_booths FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read exhibitor_booths" ON exhibitor_booths FOR SELECT TO anon USING (true);
ALTER TABLE exhibitor_booth_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access exhibitor_booth_chat_messages" ON exhibitor_booth_chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access payments" ON payments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Post event
ALTER TABLE follow_up_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access follow_up_emails" ON follow_up_emails FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE community_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access community_chats" ON community_chats FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read community_chats" ON community_chats FOR SELECT TO anon USING (true);
ALTER TABLE community_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access community_chat_messages" ON community_chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE content_access_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access content_access_rules" ON content_access_rules FOR ALL TO service_role USING (true) WITH CHECK (true);
