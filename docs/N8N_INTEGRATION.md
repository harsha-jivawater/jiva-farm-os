# n8n Integration

Status: Phase 1 and Phase 2 ready for environment configuration  
Direction: Jiva Farm OS sends selected events to n8n, and n8n can pull a read-only daily summary.

## Integration Rules

- n8n does not write back to Jiva Farm OS in this phase.
- n8n must not update production records.
- Webhook failures must not block Jiva users from saving records.
- Payloads stay compact and avoid raw backend IDs, emails, full notes, comments, private file URLs, and secrets.
- Record links point back to searchable app list pages using `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, or the default `https://www.jivawater.org`.
- Integration payloads should not expose raw record UUIDs.

## Environment Variables

| Variable | Purpose |
|---|---|
| `N8N_INTEGRATION_ENABLED` | Set to `true` to enable outbound app-to-n8n webhook events. Any other value disables outbound events. |
| `N8N_WEBHOOK_URL` | n8n webhook URL that receives event payloads from the app. |
| `N8N_WEBHOOK_SECRET` | Shared secret sent in the `X-Jiva-N8N-Secret` header for outbound event calls. |
| `N8N_SUMMARY_SECRET` | Shared secret required in the `X-Jiva-N8N-Summary-Secret` header for the daily summary API. |
| `SITE_URL` | Preferred app base URL for record links. |
| `NEXT_PUBLIC_SITE_URL` | Fallback app base URL for record links. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used only by the secret-protected daily summary route for read-only machine-to-machine summary reads without a user session. Never expose this to the browser or n8n. |

## Outbound Event Webhook

Helper:

- `lib/integrations/n8n.ts`
- `sendN8nEvent(eventName, payload)`

Behavior:

- Sends `POST` only when `N8N_INTEGRATION_ENABLED=true`.
- Adds header `X-Jiva-N8N-Secret`.
- Logs only the event name and status/failure class.
- Does not throw into the user workflow.
- Uses a short timeout so n8n slowness does not block Jiva Farm OS.

Common payload fields:

- `event`
- `occurredAt`
- `appEnvironment`
- `recordType`
- `recordCode`
- `title`
- `status`
- `nextAction`
- `ownerName`
- `assigneeName`
- `dueDate`
- `url`

## Events Sent

| Event | Trigger |
|---|---|
| `user_assigned` | A user is assigned to a Marketing Request or Planned Pilot Visit. This mirrors the in-app notification trigger and remains outbound-only. |
| `marketing_request_assigned` | Marketing Request assigned to a Designer/owner by Admin, Management, or Marketing Head. |
| `marketing_deadline_revised` | Admin, Management, or Marketing Head revises the marketing request deadline. |
| `paid_lead_ready_for_dispatch` | Farmer Lead payment is confirmed and the lead still has no dispatch. |
| `pilot_dispatch_requested` | A Free Pilot dispatch is created successfully. |
| `visit_report_submitted` | A Pilot Visit Report is submitted successfully. |

## In-App Notification Compatibility

- In-app notifications are stored in the app database after the notifications migration is applied.
- n8n remains optional and does not control notification delivery inside Jiva Farm OS.
- Assignment events create in-app notifications first, then send compact outbound `user_assigned` payloads when n8n is enabled.
- Future due/overdue reminder automation should use deterministic dedupe keys so the same reminder is not created repeatedly.
- Mention notifications are deferred until mentions can be selected or matched to a unique internal user safely.

## Daily Summary API

Route:

- `GET /api/integrations/n8n/daily-summary`

Required header:

- `X-Jiva-N8N-Summary-Secret: <N8N_SUMMARY_SECRET>`

Security behavior:

- Missing or incorrect secret returns `401`.
- No user session is required when the summary secret is valid.
- The route is read-only.
- The route uses server-only Supabase service access because normal RLS-protected app reads require a user session.
- The route validates `X-Jiva-N8N-Summary-Secret` before creating the service client or reading the database.
- The route maps source records into whitelisted summary fields and never returns raw Supabase rows directly.
- Summary links use searchable list pages instead of raw UUID detail URLs.

Response shape:

```json
{
  "generatedAt": "2026-07-10T00:00:00.000Z",
  "summaryDate": "10/07/2026",
  "appEnvironment": "production",
  "sourceLimit": 1000,
  "highPriorityLimit": 20,
  "counts": {
    "paidLeadsReadyForDispatch": 0,
    "pilotDispatchesToCreate": 0,
    "dispatchesNeedingAction": 0,
    "dispatchesOlderThanTwoDays": 0,
    "dispatchesOlderThanSevenDays": 0,
    "visitsNeedingReports": 0,
    "visitReportsNeedingReview": 0,
    "marketingAwaitingReview": 0,
    "marketingOverdue": 0,
    "systemHealthAlerts": 0
  },
  "highPriorityItems": []
}
```

Read limits:

- Each source query is capped at 1,000 rows.
- `highPriorityItems` is capped at 20.

## Phase Limits

- No n8n write-back.
- No email/SMS sending inside Jiva Farm OS.
- No heavy file transfer to n8n.
- No private upload URLs in payloads.
- No production record updates from n8n.

## Recommended n8n Workflow Setup

1. Create one webhook workflow for app events.
2. Validate `X-Jiva-N8N-Secret` before processing.
3. Route by the `event` field.
4. Use the app `url` search link for human review instead of storing private app data in n8n.
5. Create a scheduled workflow for the daily summary.
6. Call `/api/integrations/n8n/daily-summary` with `X-Jiva-N8N-Summary-Secret`.
7. Treat the daily summary as read-only operational briefing data.
