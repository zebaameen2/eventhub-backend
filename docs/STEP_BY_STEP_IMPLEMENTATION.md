# EventHub – Step-by-Step Implementation

## What’s already done (do not overwrite)

- **Database design** – Full schema in `docs/IMPLEMENTATION_PLAN.md`
- **SQL migrations** – In `supabase/migrations/` (002–015)
- **RLS** – Enabled on new tables with `service_role` full access and anon read where needed

---

## Step 1: Run database migrations

1. Open **Supabase Dashboard** → your project → **SQL Editor**.
2. Run migrations **in order** (001 already applied if you added `confirm` earlier):
   - `001_add_confirm_to_registrations.sql` (if not already run)
   - `002_ticket_types_and_registration_ext.sql`
   - `003_sessions_speakers_bookmarks.sql`
   - `004_announcements_notifications.sql`
   - `005_polls_questions_chat.sql`
   - `006_breakout_sessions.sql`
   - `007_feedback_ratings.sql`
   - `008_speaker_presentations.sql`
   - `009_networking.sql`
   - `010_session_recordings.sql`
   - `011_event_themes.sql`
   - `012_sponsors_exhibitors.sql`
   - `013_payments_placeholder.sql`
   - `014_post_event_engagement.sql`
   - `015_rls_policies.sql`

Or use Supabase CLI: `supabase db push` (or run each file in order).

---

## Step 2: Backend APIs (extend only)

Add **new** route files under `routes/` and mount in `server.js`. Do **not** replace existing routes.

| Feature              | New file              | Mount at                     |
|----------------------|------------------------|------------------------------|
| Ticket types         | `routes/ticketTypes.js`| `/api/events/:id/ticket-types` |
| Sessions             | `routes/sessions.js`   | `/api/events/:id/sessions`   |
| Speakers             | `routes/speakers.js`  | `/api/events/:id/speakers`   |
| Session bookmarks    | (in sessions or own)   | `/api/events/:id/bookmarks`  |
| Announcements        | `routes/announcements.js` | `/api/events/:id/announcements` |
| Polls                | `routes/polls.js`      | `/api/events/:id/polls`      |
| Q&A                  | `routes/questions.js` | `/api/events/:id/questions`  |
| Session chat         | `routes/sessionChat.js`| `/api/sessions/:id/chat`     |
| Breakouts            | `routes/breakouts.js`  | `/api/events/:id/breakouts`  |
| Feedback/ratings     | `routes/feedback.js`   | `/api/sessions/:id/ratings`, `/api/sessions/:id/comments` |
| Recordings           | `routes/recordings.js` | `/api/sessions/:id/recordings` |
| Event themes         | `routes/themes.js`     | `/api/events/:id/theme`      |
| Sponsors / booths    | `routes/sponsors.js`   | `/api/events/:id/sponsors`, `/api/events/:id/booths` |
| Networking (1:1 chat)| `routes/networking.js` | `/api/events/:id/direct-chats` |
| Post-event           | `routes/postEvent.js`  | `/api/events/:id/community`, `/api/events/:id/follow-up` |

- Reuse `authMiddleware` for protected routes.
- For “event host only” actions, check `events.created_by === req.user.id` (or add a small helper).

---

## Step 3: Frontend structure (by feature)

Keep existing pages; add **new** feature modules and pages.

Suggested structure:

```
src/
  components/     (existing + new reusable)
    Button.jsx, Card.jsx, Modal.jsx, Toast.jsx
    ScheduleGrid.jsx, PollCard.jsx, ChatBox.jsx
  features/       (optional grouping)
    schedule/
    polls/
    chat/
  pages/
    EventSchedule.jsx
    EventPolls.jsx
    SessionChat.jsx
    EventAnnouncements.jsx
    ...
```

- Reuse existing `Header`, `ProtectedRoute`, API base URL from `.env`.
- Add routes in `App.jsx` for new pages (e.g. `/event/:id/schedule`, `/event/:id/polls`).

---

## Step 4: Real-time (Supabase Realtime)

- Subscribe to:
  - `announcements` (filter by `event_id`) for live announcements.
  - `session_chat_messages` (filter by `session_id`) for session chat.
  - `polls` (filter by `event_id` or `session_id`) for live poll state.
- Keep **email fallback** for announcements using your existing `/api/send-email` or SMTP.

---

## Step 5: Analytics dashboard

- **No new tables.** Use existing data:
  - Attendance: `registrations` (count, by confirm).
  - Engagement: `session_bookmarks`, `poll_votes`, `session_ratings`, `session_chat_messages`.
- Add an **Analytics** page that calls new backend endpoints which run these aggregates (e.g. `/api/events/:id/analytics`).

---

## Step 6: Payment gateway

- **Do not implement** until you confirm.
- Schema is ready: `payments` table and `registrations.payment_id`.
- When you’re ready: add Stripe (or other) in a new route and frontend checkout flow.

---

## Order to implement features

1. **Ticket types + registration limits** – Backend CRUD for `ticket_types`, enforce limits and set `access_code`/`confirmed_at` on accept.
2. **Schedule** – Sessions + speakers + bookmarks (backend + Schedule UI).
3. **Announcements** – CRUD + Realtime + email fallback.
4. **Polls** – CRUD + vote endpoint + Realtime.
5. **Q&A** – Submit question + answer (moderator) + list.
6. **Session chat** – Send/list messages + Realtime.
7. **Breakouts** – Groups + members + breakout chat.
8. **Feedback** – Ratings + comments endpoints.
9. **Recordings** – CRUD + access control by `access_level`.
10. **Themes** – CRUD for `event_themes`; apply in event layout.
11. **Sponsors / booths** – CRUD + booth chat.
12. **Networking** – 1:1 chat (create/find room, messages); matchmaking/speed networking later.
13. **Post-event** – Community chats + follow-up email log + content access rules.
14. **Analytics** – Aggregate endpoints + dashboard UI.

Existing **registration form**, **accept/reject**, and **EventStats** stay as they are; extend them to use `ticket_type_id`, `access_code`, and limits when you add ticket types.
