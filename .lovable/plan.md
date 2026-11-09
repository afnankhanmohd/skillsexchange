# Sessions hub and live room

## User experience
- Build an authenticated sessions hub where students can schedule a session, create an open room, join with a room code, and see their invitations and sessions.
- Make the profile’s “Start a live session” action open the hub with that student selected as the invitee.
- Build a room with built-in audio/video calling and a shared, persistent multi-sheet whiteboard with drawing, colors, text, and clear-sheet controls.

## Technical approach
- Use authenticated TanStack routes for `/sessions` and `/sessions/$sessionId`, and reuse the existing session tables and participant access model.
- Tighten guest claiming with an atomic database function and add a participant-scoped signaling table for WebRTC negotiation; subscribe to persisted whiteboard strokes for live updates.
- Repair existing session API mismatches needed by the feature (null filters, stroke IDs, and allowed session statuses). Use browser WebRTC with STUN only; networks requiring TURN may not connect.
- Verify session creation/join, call setup as available, and shared whiteboard behavior in the preview; check responsive layouts and build status.
