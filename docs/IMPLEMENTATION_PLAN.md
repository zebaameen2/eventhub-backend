# EventHub – Implementation Plan

## Existing (do not overwrite)
- **users**: id, firstname, lastname, email, password_hash, created_at
- **events**: id, eventname, description, hostname, eventdate, email, country, address, city, state, postal, audience, type, attendees, price, tech, agenda, twitter, website, linkedin, instagram, approval, sponsors, banner_url, card_url, created_by, created_at
- **registrations**: id, event_id, user_id, confirm (pending | accept | reject)

---

## Phase 1: Database schema (migrations first)

### 1. Event Registration System (extend)
- `ticket_types` – event_id, name (VIP, General, etc.), price, quantity_limit, sold_count
- Extend `registrations`: add ticket_type_id, access_code (unique), confirmed_at; keep existing confirm column
- Email trigger: use existing backend send-email + accept/reject flow (already have auto confirmation path)

### 2. Event Schedule System
- `sessions` – id, event_id, title, description, start_time, end_time, room/location, capacity
- `speakers` – id, event_id, name, bio, avatar_url, linkedin, twitter, order
- `session_speakers` – session_id, speaker_id (many-to-many)
- `session_bookmarks` – user_id, session_id, created_at
- Schedule UI will consume sessions + speakers + bookmarks

### 3. Real-Time Announcements
- `announcements` – id, event_id, created_by (user_id), title, body, created_at
- `user_notifications` – id, user_id, event_id, announcement_id, read_at, created_at
- Supabase Realtime on announcements; email fallback via backend

### 4. Interactive Features
- `polls` – id, event_id, session_id (nullable), question, options (jsonb), status, created_at
- `poll_votes` – id, poll_id, user_id, option_index, created_at (unique poll_id + user_id)
- `questions` – id, event_id, session_id, user_id, text, answer, answered_at, created_at
- `session_chat_messages` – id, session_id, user_id, body, created_at

### 5. Breakout Sessions
- `breakout_groups` – id, event_id, session_id, name, capacity, created_at
- `breakout_members` – id, breakout_group_id, user_id, role (member | moderator), joined_at
- Breakout chat: `breakout_chat_messages` – id, breakout_group_id, user_id, body, created_at

### 6. Feedback & Ratings
- `session_ratings` – id, session_id, user_id, rating (1–5), created_at (unique session_id + user_id)
- `session_comments` – id, session_id, user_id, body, created_at

### 7. Event Analytics (no new tables for raw data)
- Use existing: registrations, session_bookmarks, poll_votes, session_ratings, session_chat_messages
- Dashboard: aggregate queries + optional `analytics_snapshots` for cached daily counts

### 8. Speaker Management
- `speakers` (see Phase 1.2)
- `speaker_presentations` – id, speaker_id, session_id, file_url, title, created_at
- Session mapping via session_speakers

### 9. Networking System
- `direct_chats` – id, event_id, created_at (1:1 chat room)
- `direct_chat_participants` – direct_chat_id, user_id, joined_at (exactly 2 per chat)
- `direct_chat_messages` – id, direct_chat_id, user_id, body, created_at
- `matchmaking_profiles` – id, event_id, user_id, bio, interests (jsonb), updated_at (placeholder for AI)
- `speed_networking_slots` – id, event_id, slot_start, slot_end, created_at
- `speed_networking_matches` – id, slot_id, user_id_1, user_id_2, created_at

### 10. Session Recording Library
- `session_recordings` – id, session_id, video_url, title, duration_sec, access_level (public | registered | paid), created_at

### 11. Custom Branding
- `event_themes` – id, event_id, primary_color, secondary_color, logo_url, favicon_url, custom_css (text), updated_at

### 12. Sponsor & Exhibitor System
- `sponsors` – id, event_id, name, tier, logo_url, website, description, created_at
- `exhibitor_booths` – id, event_id, sponsor_id, title, description, banner_url, chat_enabled, created_at
- `exhibitor_booth_chat_messages` – id, booth_id, user_id, body, created_at

### 13. Payment & Ticketing (schema only – ask before implementing gateway)
- `payments` – id, registration_id, amount_cents, currency, status (pending | completed | failed | refunded), stripe_payment_id, created_at
- `ticket_types` already has price; registration can link to payment_id when implemented

### 14. Post Event Engagement
- `follow_up_emails` – id, event_id, sent_at, subject, template_name (e.g. thank_you, survey)
- `community_chats` – id, event_id, name, created_at (post-event room)
- `community_chat_messages` – id, community_chat_id, user_id, body, created_at
- `content_access_rules` – id, event_id, resource_type (recording | slide), resource_id, access_after (timestamp or 'immediate' | 'post_event')

---

## Phase 2: RLS policies (Supabase)
- Each table: select/insert/update/delete by role (anon, authenticated, service_role) and by event ownership / participation
- Document in same migrations or separate `*_rls.sql` files

## Phase 3: Backend APIs (extend only)
- New route files: `sessions.js`, `speakers.js`, `announcements.js`, `polls.js`, `questions.js`, `chat.js`, `breakouts.js`, `feedback.js`, `recordings.js`, `themes.js`, `sponsors.js`, `networking.js`, `postEvent.js`
- Wire in server.js under `/api/...`
- Reuse authMiddleware; add optional event-host checks where needed

## Phase 4: Frontend
- Feature modules under `src/features/` or `src/pages/` by domain (schedule, polls, chat, etc.)
- Reusable: Button, Card, Modal, Toast, ScheduleGrid, PollCard, ChatBox
- Real-time: Supabase channel subscriptions for announcements, chat, polls

## Phase 5: Real-time
- Subscribe to `announcements`, `session_chat_messages`, `polls` changes
- Email fallback for announcements (existing send-email + template)

---

## Order of implementation
1. **DB migrations** (this PR): all tables + RLS
2. **Backend**: registration (ticket types, limits, credentials), then schedule, then announcements, polls, Q&A, chat, breakouts, feedback, recordings, themes, sponsors, networking, post-event (payment only when you confirm)
3. **Frontend**: one feature at a time, reusing components

Payment gateway (Stripe): **not implemented until you confirm.** Schema only.
