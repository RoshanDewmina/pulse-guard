# PR3: Slack-First Experience

**Branch:** `feature/pr3-slack-enhancements`

## Overview

This PR transforms Tokiflow's Slack integration into a best-in-class, Slack-native experience with threaded updates, interactive modals, and comprehensive slash commands. Users can now manage incidents entirely from Slack without context-switching to the dashboard.

## Changes

### 1. Threaded Updates

**Problem:** Previous implementation posted new messages for every incident update, flooding channels with notifications.

**Solution:** 
- Implemented threaded replies for incident status updates
- Store `slackMessageTs` and `slackChannelId` on first incident alert
- Subsequent updates (ACK, RESOLVE, status changes) post as threaded replies
- Keeps incident conversations organized in a single thread

**Files Modified:**
- `apps/worker/src/jobs/slack.ts` - Added thread detection and reply logic
- `apps/web/src/lib/slack.ts` - Added `postSlackThreadReply()` helper

**Example Flow:**
1. Incident created → Post new message to channel
2. User acknowledges → Post "✅ Incident Acknowledged" in thread
3. Incident resolved → Post "🎉 Incident Resolved" in thread

### 2. Interactive Modals

**Problem:** Simple button actions were limited; users couldn't specify mute duration or add resolution notes.

**Solution:**
- Replaced simple "Mute 2h" button with modal that opens a time picker
- Added "Resolve" button that opens a modal for optional resolution notes
- Modals submit via Slack's `view_submission` events
- Actions create incident events for full audit trail

**Mute Modal Features:**
- Duration picker: 30m, 1h, 2h, 4h, 8h, 24h
- Updates incident `suppressUntil` field
- Posts thread reply with mute confirmation

**Resolve Modal Features:**
- Optional multiline text input for resolution notes
- Updates incident status to RESOLVED
- Stores notes in incident `details` field
- Posts thread reply with resolution and notes

**Files Modified:**
- `apps/web/src/app/api/slack/actions/route.ts` - Added modal handlers
- `apps/web/src/lib/slack.ts` - Added `openSlackModal()` helper
- `apps/worker/src/jobs/slack.ts` - Added "Resolve" button to incident cards

### 3. Enhanced Slash Commands

**New Commands:**
- `/pulse monitors` - List all active monitors with status emojis
- `/pulse incidents` - List all open/acknowledged incidents
- `/pulse status <name>` - Show detailed monitor status with sparkline
- `/pulse ack <incident-id>` - Acknowledge an incident from command line
- `/pulse help` - Show all available commands

**Features:**
- Fuzzy monitor name matching (case-insensitive, partial matches)
- Rich formatting with Slack blocks
- Success rate and average duration calculations
- Recent runs sparkline (✅❌🟡🟠)
- Time-since formatting (e.g., "45m ago", "2h ago")
- Incident ID display for easy acknowledgment

**Files Modified:**
- `apps/web/src/app/api/slack/commands/route.ts` - Added `handleIncidents()`, enhanced help

### 4. Security & Validation

**Implemented:**
- Signature validation on all Slack endpoints (existing, verified)
- Token encryption in `AlertChannel.configJson` (existing)
- Org-level access checks for all commands
- Rate limiting on webhook endpoints (existing)

## Technical Details

### Thread Reply Implementation

```typescript
// Check if incident has existing Slack message
if (incident.slackMessageTs && incident.slackChannelId) {
  // Post as thread reply
  await postSlackThreadReply(
    accessToken,
    incident.slackChannelId,
    incident.slackMessageTs,
    replyText,
    replyBlocks
  );
} else {
  // First-time alert, post new message
  const result = await postSlackMessage(...);
  // Store thread_ts for future updates
  await prisma.incident.update({
    where: { id: incidentId },
    data: {
      slackMessageTs: result.ts,
      slackChannelId: result.channel,
    },
  });
}
```

### Modal View Structure

```typescript
const muteModalView = {
  type: 'modal',
  callback_id: `mute_${incidentId}`,
  title: { type: 'plain_text', text: 'Mute Incident' },
  submit: { type: 'plain_text', text: 'Mute' },
  blocks: [
    {
      type: 'input',
      block_id: 'mute_duration',
      element: {
        type: 'static_select',
        options: [
          { text: '30 minutes', value: '30' },
          { text: '1 hour', value: '60' },
          // ... more options
        ],
      },
    },
  ],
};
```

## Benefits

1. **Reduced Notification Fatigue:** Threaded updates keep channels clean
2. **Faster Incident Response:** Resolve incidents without leaving Slack
3. **Better Audit Trail:** All actions tracked with Slack user attribution
4. **Improved UX:** Rich formatting and interactive elements
5. **Command-Line Power Users:** Slash commands for power users
6. **Mobile-Friendly:** All interactions work on Slack mobile

## Database Changes

**No schema migrations required.** Existing fields used:
- `Incident.slackMessageTs` (String?)
- `Incident.slackChannelId` (String?)
- `Incident.suppressUntil` (DateTime?)
- `Incident.details` (String?)
- `IncidentEvent.eventType` (String)

## Testing Checklist

- [x] Threaded replies post correctly
- [x] Mute modal opens and submits
- [x] Resolve modal opens and submits
- [x] Slash commands return properly formatted responses
- [x] `/pulse incidents` shows open incidents
- [x] `/pulse monitors` lists all monitors
- [x] `/pulse status <name>` shows monitor details
- [x] `/pulse ack <id>` acknowledges incident
- [x] Incident events created for all actions
- [x] No linter errors

## Acceptance Criteria

✅ Users can acknowledge, mute, and resolve incidents from Slack  
✅ Thread replies keep incident conversations organized  
✅ Mute duration is configurable via modal  
✅ Resolution notes can be added via modal  
✅ Slash commands provide quick access to monitor/incident data  
✅ All actions create audit trail events  
✅ No channel flooding with duplicate messages  

## Screenshots

*(Placeholder for screenshots)*

### Threaded Incident Updates
```
[Initial Message]
⚠️ MISSED — Database Backup
**Missed expected run at 2:00 AM**

[Thread Reply]
✅ Incident Acknowledged
The incident has been acknowledged and is being investigated.

[Thread Reply]
🎉 Incident Resolved
Resolved by @alice
Notes: Fixed cron schedule configuration
```

### Mute Modal
```
┌─────────────────────────────┐
│ Mute Incident              │
├─────────────────────────────┤
│ Monitor: Database Backup    │
│ Incident: Missed expected... │
│                             │
│ Mute Duration              │
│ ┌─────────────────────┐    │
│ │ 2 hours          ▼  │    │
│ └─────────────────────┘    │
│                             │
│      [Cancel]  [Mute]       │
└─────────────────────────────┘
```

### Incidents List Command
```
/pulse incidents

🚨 Open Incidents (3)

⏰ 🔴 Database Backup - MISSED
   Missed expected run at 2:00 AM • Opened 15m ago • ID: `cuid123`

❌ 🟡 API Health Check - FAIL
   Check failed with exit code 1 • Opened 1h ago • ID: `cuid456`

📊 🔴 Payment Processor - ANOMALY
   Duration spike detected (z-score: 3.2) • Opened 2h ago • ID: `cuid789`

💡 Use `/pulse ack <incident-id>` to acknowledge an incident.
```

## Next Steps (PR4)

With Slack integration enhanced, PR4 will focus on:
- Welford anomaly detection implementation
- MTBF/MTTR calculations
- Enhanced analytics pages with health scores
- Duration charts with normal bands and anomaly markers

## Documentation

- [ ] Add Slack setup guide to `docs/integrations/slack.md`
- [ ] Document slash commands in user guide
- [ ] Add screenshots to documentation
- [ ] Create video walkthrough for onboarding

## Dependencies

- `@slack/web-api` - Already installed
- `@slack/bolt` - Already installed
- No new dependencies required

## API Endpoints Modified

- `POST /api/slack/actions` - Added modal submission handlers
- `POST /api/slack/commands` - Enhanced with incidents command
- Worker: `jobs/slack.ts` - Added thread reply logic

## Performance Impact

- **Minimal:** Thread replies are asynchronous
- **Reduced load:** Fewer messages = fewer API calls to Slack
- **Improved:** Users resolve incidents faster, reducing active incident count

---

**Ready for Review:** This PR is production-ready and includes comprehensive error handling, audit logging, and user-friendly UX improvements.

