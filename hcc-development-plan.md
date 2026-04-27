# Emailing Module — Complete Implementation Plan

> Last updated: April 2026  
> Repos: `hcc-admin-v2` · `HCC-adam-backend` · `emailControllerAuth2`

---

## 1. Current Architecture (What Exists Today)

### hcc-admin-v2

- Mailing page has 3 tabs driven by `picklistName` prop: **Inbox**, **Gmail**, **Email Templates**
- `MailingComp` (`mailingComp/index.jsx`) switches between these via prop
- Bulk email: `mailingTable.jsx` → "Email All" button → `bulkEmialDrawer.jsx` → `POST apiPath.prodPath3/api/bulkEmail/sendBulkEmail/:id`
- Single email: `mailingTable.jsx` → "Send Mail" per row → `mailingDrawer.jsx` → `POST apiPath.devPath/api/appGmail/send/:id`
- Templates: fetched from `GET apiPath.prodPath/api/appGmail/templates` (returns hardcoded 3 file-based templates)

### emailControllerAuth2

- Only 2 route modules: `authRoutes.js` and `bulkEmailRoutes.js`
- Bulk email queue: BullMQ + Redis, processes via `bulkEmailService.js`
- Gmail send: `gmailService.js` using OAuth credentials stored on User model
- Templates: file-based only (`professional.html`, `modern.html`, `minimal.html`) — no DB model
- No SendGrid, no webhook endpoint, no activity logging, no contact lists

### HCC-adam-backend

- `emailTemplateModel.js` exists (templateName, subject, body, createdBy) — used for CRUD UI only, never used for actual sending
- Single email send: `POST /api/appGmail/send/:userId` via Gmail API
- No activity model today

### URL Map (current)

|`apiPath` key|Value (dev)|Value (prod)|Points to|
|---|---|---|---|
|`prodPath`|`http://localhost:3001`|`https://hcc-adam-backend.vercel.app`|HCC-adam-backend|
|`prodPath3`|`https://api-hccbackendcrm.com`|same|emailControllerAuth2|
|`devPath`|`http://localhost:8080`|—|emailControllerAuth2 (legacy)|

---

## 2. Target Architecture

### New tab structure (hcc-admin-v2 Mailing page)

|Tab|Sub-tabs|Was|
|---|---|---|
|0 — Inbox|—|Inbox tab (no change)|
|1 — Clients|Clients / Contacts|Gmail tab (renamed, extended)|
|2 — Bulk Email|Contact Lists / Bulk Jobs|New|
|3 — Templates|Contact Lists mgmt / Templates & Newsletters|New|

### New capabilities

- **Twilio SendGrid** as alternate bulk email provider alongside Gmail
- **DB-backed templates** with Template Builder (HTML paste, merge tags, live preview)
- **Contact Lists** — save named lists of clients/contacts for bulk sends
- **Bulk Jobs monitoring** — live status dashboard with pause/retry
- **Application-wide activity logging** — every significant action logged to adam-backend
- **Email delivery telemetry** — per-recipient sent/delivered/bounced tracked in emailControllerAuth2
- **SendGrid webhooks** — delivery events processed automatically

---

## 3. Who Owns What (Service Responsibility Map)

|Concern|Service|Notes|
|---|---|---|
|Single email send|HCC-adam-backend|`POST /api/appGmail/send/:userId` unchanged|
|Bulk email queue|emailControllerAuth2|Existing, extended|
|Templates CRUD|emailControllerAuth2|New — replaces file-based|
|Contact Lists CRUD|emailControllerAuth2|New|
|Bulk Jobs status|emailControllerAuth2|Existing routes, bugs fixed|
|Gmail OAuth|emailControllerAuth2|Existing, unchanged|
|SendGrid sending|emailControllerAuth2|New `sendgridService.js`|
|SendGrid webhooks|emailControllerAuth2|New `webhookController.js`|
|Application activity feed|HCC-adam-backend|New `activityModel.js`|
|Email delivery telemetry|emailControllerAuth2|New `emailDeliveryLogModel.js`|
|Client/contact data|HCC-adam-backend|Existing, unchanged|

---

## 4. New Models

### 4.1 `activityModel.js` — HCC-adam-backend

Application-wide activity log. Powers client profile activity feed. Single source of truth for all user-facing events.

```
actorUserId     ObjectId ref User
subjectType     String enum (see below)
subjectId       String (_id of affected document)
eventType       String enum (see below)
metadata        Mixed (JSON — flexible per event, see spec below)
correlationId   String (ties UI action → API → webhook outcome)
timestamp       Date default now
```

**`subjectType` enum:**

```
'client' | 'note' | 'task' | 'research' | 'email' | 'file' | 'template' | 'system'
```

**`eventType` enum (full list):**

```
note.created, note.updated, note.deleted, note.viewed,
note.attachment.added, note.attachment.removed,

client.created, client.updated, client.deleted, client.viewed,
client.merged, client.archived,

research.added, research.removed, research.status_changed, research.assigned,

email.draft_created, email.scheduled, email.sent, email.cancelled,
email.queued, email.delivered, email.bounced, email.deferred,
email.failed, email.complaint, email.unsubscribed,

bulk.started, bulk.completed, bulk.failed,

file.uploaded, file.exported, file.deleted,

task.created, task.updated, task.completed, task.assigned,

template.created, template.updated, template.deleted,

auth.login, auth.logout, auth.failed, auth.session_expired,

system.config_changed
```

**`metadata` shape per event type:**

```js
// email.sent
{ service: 'gmail'|'sendgrid', subject, preview, recipientEmail,
  messageId, templateId?, jobId?, attachmentCount }

// email.delivered | email.bounced | email.failed
{ service, recipientEmail, messageId, providerEvent,
  errorCode?, errorMessage?, jobId?, correlationId }

// bulk.started
{ jobId, service, recipientCount, templateId?, contactListId? }

// bulk.completed
{ jobId, sentCount, failedCount, durationMs }

// note.created
{ noteId, title, category, hasAttachments }

// research.status_changed
{ from, to, assignedTo? }

// client.updated
{ changedFields: ['phone', 'email'] }  // summary only, not full payload

// auth.login
{ ip, userAgent }

// template.created | template.updated
{ templateId, name, kind, service }
```

**Activity tap points (where to write):**

|Event|Triggered from|
|---|---|
|`note.*`|adam-backend `noteController.js`|
|`client.*`|adam-backend `clientsControllers.js`|
|`research.*`|adam-backend research controller|
|`email.sent` (single)|adam-backend `emailControllers.js`|
|`email.sent` (bulk, per recipient)|emailControllerAuth2 `bulkEmailService.js` → POST to adam-backend|
|`email.delivered / bounced / failed`|emailControllerAuth2 SendGrid webhook handler|
|`bulk.started / completed`|emailControllerAuth2 `bulkEmailService.js`|
|`template.*`|emailControllerAuth2 `templateController.js` → POST to adam-backend|
|`task.*`|adam-backend `taskController.js`|
|`file.*`|adam-backend `fileController.js`|
|`auth.*`|emailControllerAuth2 `auth.js` Passport callbacks|

---

### 4.2 `emailDeliveryLogModel.js` — emailControllerAuth2

Per-recipient delivery telemetry. High-volume operational log. Replaces the `results[]` array embedded in `BulkJob`.

```
jobId           ObjectId ref BulkJob (indexed)
recipientEmail  String
service         String enum: 'gmail' | 'sendgrid'
status          String enum: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed' | 'deferred'
subject         String
bodyPreview     String (first 200 chars of rendered body)
messageId       String (provider message ID — used for webhook matching)
errorCode       String
errorMessage    String
attemptCount    Number default 1
correlationId   String
sentAt          Date
deliveredAt     Date
bouncedAt       Date
```

> **Why not embed in BulkJob:** The embedded `results[]` array grows unboundedly. 500 recipients = 500 subdocs on one document. Separate collection with index on `jobId` is correct at scale.

---

### 4.3 `templateModel.js` — emailControllerAuth2 (primary) + HCC-adam-backend (mirror)

Replaces file-based template lookup. Stores HTML body in DB so Template Builder can create/edit dynamically.

```
name            String required
description     String
kind            String enum: 'template' | 'newsletter'
format          String enum: 'html' | 'text'
subject         String (may contain {{mergeTags}})
body            String (raw HTML with {{mergeTags}} — stored uncompiled)
usageCount      Number default 0 (incremented at send time)
createdBy       ObjectId ref User
service         String enum: 'gmail' | 'sendgrid' | 'both'
createdAt       Date
updatedAt       Date
```

> Template bodies are stored as raw HTML. Merge tag substitution (`{{key}}`) happens at send time so edits to a template don't rewrite send history.

---

### 4.4 `contactListModel.js` — emailControllerAuth2 (primary) + HCC-adam-backend (mirror)

```
name            String required
description     String
ownerId         ObjectId ref User
members         Array of { email: String, name: String, clientRefId?: String }
filters         Mixed (optional saved filter query for dynamic lists)
createdAt       Date
updatedAt       Date
```

> `clientRefId` is optional — stores the adam-backend client `_id` for cross-reference. No cross-DB join required. Frontend passes email arrays at send time.

---

### 4.5 `bulkJob.js` — emailControllerAuth2 (modify existing)

**Add these fields to existing schema:**

```
templateId      ObjectId ref Template (new)
contactListId   ObjectId ref ContactList (new)
service         String enum: 'gmail' | 'sendgrid', default: 'gmail' (new)
scheduledAt     Date optional (new)
```

**Remove this field:**

```
results         [{ email, status, error }]  ← REMOVE, replaced by EmailDeliveryLog
```

---

## 5. New Services and Utilities

### 5.1 `src/utils/templateUtils.js` — emailControllerAuth2 (new)

Extracts `processTemplate()` currently duplicated in `gmailService.js` and `emailController.js`. Both services import from here.

```js
// Replaces {{key}} with data[key] throughout template HTML
function processTemplate(template, data) { ... }
module.exports = { processTemplate };
```

---

### 5.2 `src/services/sendgridService.js` — emailControllerAuth2 (new)

Mirrors the interface of `gmailService.js` exactly. Provider adapter — frontend never knows which service sent.

```js
// Same signature as gmailService.sendEmail
async function sendEmail(to, subject, body, templateId, templateData, userId, files) { ... }
module.exports = { sendEmail };
```

- Uses `@sendgrid/mail` package
- Reads `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` from env
- Imports `processTemplate` from `templateUtils.js`
- Reads template body from DB (`templateModel`) by `templateId` instead of filesystem

---

### 5.3 `src/utils/activityLogger.js` — emailControllerAuth2 (new)

Posts activity events back to adam-backend. Keeps adam-backend as single source of truth for activity feed.

```js
async function logActivity(eventType, subjectType, subjectId, actorUserId, metadata) {
  await axios.post(`${process.env.ADAM_BACKEND_URL}/api/activity`, {
    actorUserId, subjectType, subjectId, eventType, metadata,
    correlationId: generateId()
  });
}
module.exports = { logActivity };
```

---

## 6. New Controllers and Routes

### 6.1 emailControllerAuth2

#### `src/controllers/templateController.js` (new)

- `createTemplate` — POST `/api/templates`
- `getAllTemplates` — GET `/api/templates` (replaces hardcoded array in `emailController.js`)
- `getTemplate` — GET `/api/templates/:id`
- `updateTemplate` — PATCH `/api/templates/:id`
- `deleteTemplate` — DELETE `/api/templates/:id`
- Each mutation calls `activityLogger` to post `template.*` event to adam-backend

#### `src/routes/templateRoutes.js` (new)

Mounted in `index.js` as `app.use('/api/templates', templateRouter)`

#### `src/controllers/contactListController.js` (new)

- `createList` — POST `/api/contact-lists`
- `getAllLists` — GET `/api/contact-lists`
- `getList` — GET `/api/contact-lists/:id`
- `updateList` — PATCH `/api/contact-lists/:id`
- `deleteList` — DELETE `/api/contact-lists/:id`

#### `src/routes/contactListRoutes.js` (new)

Mounted as `app.use('/api/contact-lists', contactListRouter)`

#### `src/controllers/webhookController.js` (new)

- `handleSendgridWebhook` — POST `/api/webhooks/sendgrid`
    1. Verify `X-Twilio-Email-Event-Webhook-Signature` header → 403 if invalid
    2. Parse events array from SendGrid
    3. Update matching `EmailDeliveryLog` by `messageId`
    4. Call `activityLogger` for `email.delivered`, `email.bounced`, `email.failed` events

#### `src/routes/webhookRoutes.js` (new)

Mounted as `app.use('/api/webhooks', webhookRouter)`

**SendGrid event → status mapping:**

|SendGrid event|`EmailDeliveryLog.status`|
|---|---|
|`delivered`|`delivered`|
|`bounce`|`bounced`|
|`dropped`|`failed`|
|`deferred`|`deferred`|
|`spamreport`|`failed`|
|`open` / `click`|skip (not tracked in v1)|

---

### 6.2 HCC-adam-backend

#### `controllers/activityController.js` (new)

- `createActivity` — POST `/api/activity`
- `getActivityFeed` — GET `/api/activity?subjectType=client&subjectId=:id`

#### `routes/activityRoutes.js` (new)

Mounted as `app.use('/api/activity', activityRouter)`

---

## 7. Modified Existing Files

### 7.1 emailControllerAuth2

#### `src/index.js`

```js
// Add BEFORE express.json() — webhook needs raw body
app.use('/api/webhooks/sendgrid', express.raw({ type: 'application/json' }));

// Existing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add new route mounts
const templateRouter = require('./routes/templateRoutes');
const contactListRouter = require('./routes/contactListRoutes');
const webhookRouter = require('./routes/webhookRoutes');
app.use('/api/templates', templateRouter);
app.use('/api/contact-lists', contactListRouter);
app.use('/api/webhooks', webhookRouter);
```

> **Critical:** `express.raw()` for the webhook path must come before `express.json()`. Webhook signature verification needs the raw request body.

#### `src/services/gmailService.js`

- Remove `processTemplate()` function — import from `templateUtils.js`
- Remove hardcoded `getEmailTemplates()` — replaced by DB query in `templateController.js`
- Update template lookup: query `templateModel` by `_id` instead of reading filesystem

#### `src/services/bulkEmailService.js`

- Add service dispatcher (Gmail vs SendGrid):

```js
const { sendEmail: gmailSend } = require('./gmailService');
const { sendEmail: sgSend } = require('./sendgridService');
const sender = job.data.service === 'sendgrid' ? sgSend : gmailSend;
```

- Replace `results.push(...)` with `EmailDeliveryLog.create(...)` per recipient
- Add `activityLogger` calls: `bulk.started` on job creation, `bulk.completed` on finish
- Fix: guard `templateData` parse — `if (typeof templateData === 'string') templateData = JSON.parse(templateData)`

#### `src/controllers/bulkEmailControllers.js`

- Extract `service` from `req.body` and pass to `addBulkEmailJob`
- **Bug fix:** `getBulkEmailStatus` uses `req.params.jobId` but route has `:id` — fix to `req.params.id`
- **Bug fix:** `getQueueStats` calls `bulkEmailService.getQueueStats()` but service not imported — add import

#### `src/controllers/emailController.js`

- Remove hardcoded `getEmailTemplates()` array — replaced by `templateController.getAllTemplates`
- Remove `processTemplate()` — import from `templateUtils.js`
- Add `activityLogger` call after successful single send: `email.sent`

---

### 7.2 HCC-adam-backend

#### `controllers/emailControllers.js`

- Add `activityLogger`-equivalent call after successful single send: `email.sent`
- Since activity model lives in same service, write directly: `Activity.create({ ... })`

#### `controllers/noteController.js`

- Add `Activity.create()` after note created, updated, deleted

#### `controllers/clientsControllers.js`

- Add `Activity.create()` after client created, updated, deleted

#### `controllers/taskController.js`

- Add `Activity.create()` after task created, updated, completed

---

### 7.3 hcc-admin-v2

#### `src/components/mailingComp/index.jsx`

Replace `picklistName` prop-driven switch with 4-tab layout using `useState`:

```js
const tabs = ['Inbox', 'Clients', 'Bulk Email', 'Templates'];
const [activeTab, setActiveTab] = useState(0);
```

- Tab 0 → existing `InboxTable` (unchanged)
- Tab 1 → existing `MailingTable` (was "Gmail" tab, no internal changes)
- Tab 2 → new `BulkEmailTab` component (sub-tabs: Contact Lists | Bulk Jobs)
- Tab 3 → new `TemplatesTab` component (sub-tabs: Contact Lists mgmt | Templates & Newsletters)
- Header actions become tab-contextual (Google auth button only on Tab 0/1, etc.)

#### `src/components/subcomponents/drawers/bulkEmialDrawer.jsx`

Add to existing drawer:

- `service` select at top: `Gmail` / `SendGrid`
- `contactListId` select: loads from `GET apiPath.prodPath3/api/contact-lists` — selecting pre-populates To field
- Pass `service` and `contactListId` in FormData on submit

---

## 8. New Frontend Components

### 8.1 New Tables

#### `src/components/subcomponents/tables/contactListsTable.jsx` (new)

- Calls `GET apiPath.prodPath3/api/contact-lists`
- Renders lists as **cards** (not table rows) — per handoff spec
- Each card: name, member count, description, select checkbox
- "Send bulk to selected" button opens upgraded `bulkEmialDrawer`
- "New list" button opens `newContactListDrawer`

#### `src/components/subcomponents/tables/bulkJobsTable.jsx` (new)

- Calls `GET apiPath.prodPath3/api/bulkEmail/getBulkEmailJobs/:userId`
- Polls every 5s while tab is open
- KPI cards at top: Sent (30d), Success rate, Failed count
- Table columns: status badge, subject, service (Gmail/SendGrid), sent/total progress, created date
- Running rows: Pause button
- Failed/partial rows: Retry button → `POST /api/bulkEmail/:jobId/retry`

#### `src/components/subcomponents/tables/templatesTable.jsx` (new)

- Calls `GET apiPath.prodPath3/api/templates`
- Grid of cards: name, kind badge (Template/Newsletter), subject preview, usageCount
- "Create new" button opens `templateBuilderDrawer`

---

### 8.2 New Drawers

#### `src/components/subcomponents/drawers/templateBuilderDrawer.jsx` (new)

- Fields: name, description, kind (Template/Newsletter), subject
- Body: textarea for HTML paste
- Merge tag chip buttons: `{{firstName}}`, `{{lastName}}`, `{{company}}`, `{{email}}`, `{{bookingLink}}`, `{{senderName}}`, `{{senderTitle}}` — clicking appends to body
- Live preview panel: renders `innerHTML` of body with sample values substituted
- Save → `POST apiPath.prodPath3/api/templates`

#### `src/components/subcomponents/drawers/newContactListDrawer.jsx` (new)

- Left side: searchable client table (`GET apiPath.prodPath/api/clients/allNewLeads`), checkboxes
- Right side: name + description fields + live selected count
- Save → `POST apiPath.prodPath3/api/contact-lists` with `members: [{ email, name, clientRefId }]`

---

## 9. Environment Variables

### emailControllerAuth2 — new vars needed

```
SENDGRID_API_KEY=
SENDGRID_WEBHOOK_PUBLIC_KEY=        # from SendGrid dashboard → Settings → Mail Settings
SENDGRID_FROM_EMAIL=                # verified sender in SendGrid
ADAM_BACKEND_URL=https://hcc-adam-backend.vercel.app
```

---

## 10. Build Order

Steps 1–6 are all backend. Steps 7–10 are independent frontend components (any order). Step 11 is final assembly.

|Step|What|Service|File(s)|
|---|---|---|---|
|1|Extract `processTemplate`, update imports|emailControllerAuth2|`templateUtils.js` (new), update `gmailService.js`, `emailController.js`|
|2|Template model + controller + routes|emailControllerAuth2|`templateModel.js`, `templateController.js`, `templateRoutes.js`|
|3|SendGrid service|emailControllerAuth2|`sendgridService.js`|
|4|Add service dispatcher to bulk worker|emailControllerAuth2|update `bulkEmailService.js`|
|5|Contact List model + controller + routes (completed)|emailControllerAuth2|`contactListModel.js`, `contactListController.js`, `contactListRoutes.js`|
|5a|Activity model + routes|HCC-adam-backend|`activityModel.js`, `activityController.js`, `activityRoutes.js`|
|5b|EmailDeliveryLog model, remove BulkJob.results[], activityLogger util|emailControllerAuth2|`emailDeliveryLogModel.js`, `activityLogger.js`, update `bulkEmailService.js`, `bulkJob.js`|
|5c|SendGrid webhook endpoint|emailControllerAuth2|`webhookController.js`, `webhookRoutes.js`, update `index.js`|
|6|Wire activity logging into existing controllers|HCC-adam-backend|update `emailControllers.js`, `noteController.js`, `clientsControllers.js`, `taskController.js`|
|7|Upgrade `bulkEmialDrawer.jsx` — service toggle + list picker|hcc-admin-v2|update `bulkEmialDrawer.jsx`|
|8|Contact Lists UI|hcc-admin-v2|`contactListsTable.jsx`, `newContactListDrawer.jsx`|
|9|Templates UI|hcc-admin-v2|`templatesTable.jsx`, `templateBuilderDrawer.jsx`|
|10|Bulk Jobs UI|hcc-admin-v2|`bulkJobsTable.jsx`|
|11|Restructure `MailingComp` — 4 tabs, assemble all components|hcc-admin-v2|update `mailingComp/index.jsx`|

---

## 11. Known Bugs to Fix Along the Way

|Bug|File|Fix|
|---|---|---|
|`getBulkEmailStatus` uses `req.params.jobId` but route registers `:id`|`bulkEmailControllers.js`|Change to `req.params.id`|
|`getQueueStats` calls `bulkEmailService.getQueueStats()` but service not imported|`bulkEmailControllers.js`|Add `const bulkEmailService = require('../services/bulkEmailService')`|
|`templateData = JSON.parse(templateData)` crashes if already object or null|`bulkEmailService.js`|Add guard: `if (typeof templateData === 'string') templateData = JSON.parse(templateData)`|

---

## Implementation progress — emailControllerAuth2 (April 2026)

### Completed: Phase 1 — Gmail / SendGrid bulk provider switch

- **Bulk provider selection**: `POST /api/bulkEmail/sendBulkEmail/:id` accepts `service` (`gmail` | `sendgrid`); defaults to `gmail` when omitted.
- **Queue worker** ([`src/services/bulkEmailService.js`](src/services/bulkEmailService.js)): dispatches to `gmailService.sendEmail` or `sendgridService.sendEmail` based on queued `service`.
- **SendGrid adapter** ([`src/services/sendgridService.js`](src/services/sendgridService.js)): `@sendgrid/mail`, env `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL`, same template file + merge-tag behavior as Gmail with body fallback, attachments supported.
- **Job metadata** ([`src/models/bulkJob.js`](src/models/bulkJob.js)): `service` field (`gmail` | `sendgrid`).
- **Safe `templateData` handling** in the worker (string JSON parse vs object vs empty).
- **Dependencies**: `@sendgrid/mail` in [`package.json`](package.json).

### Completed: Phase 2A — SendGrid webhooks + delivery telemetry

- **Model** ([`src/models/emailDeliveryLogModel.js`](src/models/emailDeliveryLogModel.js)): per-recipient log (`jobId`, `recipientEmail`, `service`, `status`, `subject`, `bodyPreview`, `messageId`, timestamps, `providerEvent`, etc.) with indexes.
- **On send** ([`src/services/bulkEmailService.js`](src/services/bulkEmailService.js)): after each recipient attempt, creates `EmailDeliveryLog` with `sent` or `failed`; **existing `BulkJob.results[]` kept** for backward compatibility.
- **Provider message IDs**: [`sendgridService.js`](src/services/sendgridService.js) and [`gmailService.js`](src/services/gmailService.js) return `{ messageId }` from API responses; Gmail path throws on failure (no invalid `res` usage).
- **Webhook** ([`src/controllers/webhookController.js`](src/controllers/webhookController.js), [`src/routes/webhookRoutes.js`](src/routes/webhookRoutes.js)): `POST /api/webhooks/sendgrid`, **strict ECDSA signature** via `@sendgrid/eventwebhook` + env `SENDGRID_WEBHOOK_PUBLIC_KEY` (PEM; `\\n` in `.env` normalized).
- **Express** ([`src/index.js`](src/index.js)): `express.raw({ type: 'application/json' })` for webhook path **before** `express.json()` so signatures verify on raw bytes.
- **Event → status mapping**: `delivered`, `bounce` → `bounced`, `dropped` / `spamreport` → `failed`, `deferred`; `open` / `click` skipped in v1.
- **Message ID matching fix**: Mail API stores **short** `x-message-id`; webhooks send **long** `sg_message_id` (e.g. `id.recvd-...`). Handler matches **full id OR base segment before first `.`** so `findOneAndUpdate` hits existing logs (`processed` > 0).

### Completed: Phase 2B — DB-backed templates CRUD

- **templateUtils.js** ([`src/utils/templateUtils.js`](src/utils/templateUtils.js)): `processTemplate()` extracted from both `gmailService` and `sendgridService` into shared util. Both services now import from there.
- **Template model** ([`src/models/templateModel.js`](src/models/templateModel.js)): fields `name`, `description`, `kind` (`template`|`newsletter`), `format` (`html`|`text`), `subject`, `body` (raw HTML, stored uncompiled), `usageCount` (default 0), `createdBy` ref User, `service` (`gmail`|`sendgrid`|`both`), timestamps.
- **Template CRUD** ([`src/controllers/templateController.js`](src/controllers/templateController.js), [`src/routes/templateRoutes.js`](src/routes/templateRoutes.js)): `createTemplate`, `getAllTemplates`, `getTemplate`, `updateTemplate`, `deleteTemplate`. Mounted at `/api/templates`. Response envelope: `{ success: true, data }` / `{ success: false, message }`.
- **DB template lookup in send services**: both `gmailService` and `sendgridService` resolve `templateId` via `Template.findById()` — falls back to raw body if not found or no `templateId` provided. Hardcoded `getEmailTemplates` removed from `gmailService`.
- **emailController.js** ([`src/controllers/emailController.js`](src/controllers/emailController.js)): hardcoded template array removed, wired to `templateController.getAllTemplates`.
- **Seed script** ([`src/scripts/seedTemplates.js`](src/scripts/seedTemplates.js)): one-time script seeds the 3 existing HTML templates (Professional, Modern, Minimal) into the DB using upsert. Run via `npm run seed:templates`. All 3 confirmed in MongoDB Atlas.

GET `/api/templates` now returns DB templates (not hardcoded).
Bulk send with `templateId` resolves from DB. Body fallback preserved.

### Completed: Phase 3A — Contact Lists CRUD

- **Auth model change (param-based owner context):** contact list endpoints now use `:userId` route params for ownership scope (no session/cookie requirement), aligned with `sendBulkEmail/:id`.
- **Contact List model** ([`src/models/contactListModel.js`](src/models/contactListModel.js)): `name`, `description`, `ownerId`, `members` (`email`, `name`, `clientRefId`), `filters`, timestamps; indexes on `ownerId` and `ownerId + name`; email normalization to lowercase.
- **Contact List controller** ([`src/controllers/contactListController.js`](src/controllers/contactListController.js)): `createList`, `getAllLists`, `getList`, `getListMembers`, `updateList`, `deleteList` — all ownership-scoped to `req.params.userId`.
- **Contact List routes** ([`src/routes/contactListRoutes.js`](src/routes/contactListRoutes.js)): mounted at `/api/contact-lists` (wired in [`src/index.js`](src/index.js)); routes are param-based: `/:userId`, `/:userId/:id`, and `/:userId/:id/members`.
- **Note:** Manual API validation now uses route param ownership (`:userId`) and does not require session token/cookie headers.

#### Contact Lists CRUD curl commands (no session/token required)

```bash
# Base URL + owner user id
BASE_URL="http://localhost:5000"
USER_ID="PUT_VALID_USER_OBJECT_ID_HERE"
```

```bash
# 1) Create contact list
curl -i -X POST "$BASE_URL/api/contact-lists/$USER_ID" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "May Campaign List",
    "description": "Leads for May outreach",
    "members": [
      { "email": "alice@example.com", "name": "Alice", "clientRefId": "680123abc123" },
      { "email": "bob@example.com", "name": "Bob" },
      { "email": "alice@example.com", "name": "Alice Duplicate" }
    ],
    "filters": { "source": "crm", "tag": "warm-lead" }
  }'
```

```bash
# 2) Get all lists for owner
curl -i "$BASE_URL/api/contact-lists/$USER_ID"
```

```bash
# 3) Get one list by id (owned by USER_ID)
LIST_ID="PUT_LIST_ID_HERE"
curl -i "$BASE_URL/api/contact-lists/$USER_ID/$LIST_ID"
```

```bash
# 4) Get members by list id (recipient expansion endpoint)
curl -i "$BASE_URL/api/contact-lists/$USER_ID/$LIST_ID/members"
```

```bash
# 5) Update list
curl -i -X PATCH "$BASE_URL/api/contact-lists/$USER_ID/$LIST_ID" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "May Campaign List - Updated",
    "description": "Updated description",
    "members": [
      { "email": "charlie@example.com", "name": "Charlie" },
      { "email": "bob@example.com", "name": "Bob Updated" }
    ],
    "filters": { "source": "crm", "stage": "qualified" }
  }'
```

```bash
# 6) Delete list
curl -i -X DELETE "$BASE_URL/api/contact-lists/$USER_ID/$LIST_ID"
```

```bash
# Negative check: invalid userId -> expect 400
curl -i "$BASE_URL/api/contact-lists/not-a-valid-user-id"
```

```bash
# Negative check: invalid list id -> expect 400
curl -i "$BASE_URL/api/contact-lists/$USER_ID/not-a-valid-objectid"
```

### Small fixes bundled (same repo)

- [`src/controllers/bulkEmailControllers.js`](src/controllers/bulkEmailControllers.js): `getBulkEmailStatus` uses `req.params.id` (aligned with route); `getJobStatus` return includes `userId` and `service` for auth checks; `getQueueStats` imports and calls service correctly; `console.error` where `logger` was undefined.
- **Operational notes**: curl bulk requests use `--form-string` for HTML bodies; SendGrid webhooks need **HTTPS** public URL (e.g. ngrok), not raw `localhost`; domain authentication improves inbox vs spam vs single sender only.

### Completed: Phase 3B — hcc-admin-v2 Mailing UI assembly (April 2026)

- **Step 7 complete — bulk drawer upgrade** ([`src/components/subcomponents/drawers/bulkEmialDrawer.jsx`](src/components/subcomponents/drawers/bulkEmialDrawer.jsx)):
  - Added `service` selector (`gmail` / `sendgrid`) and includes it in `sendBulkEmail` payload.
  - Templates now load from `GET ${apiPath.prodPath3}/api/templates`.
  - Contact lists load from `GET ${apiPath.prodPath3}/api/contact-lists/:userId`, with member expansion via `GET ${apiPath.prodPath3}/api/contact-lists/:userId/:id/members`.
  - Fixed member-expansion parsing to use `r.data?.data?.members || []`.

- **Step 8 complete — Contact Lists UI**:
  - Added [`src/components/subcomponents/tables/contactListsTable.jsx`](src/components/subcomponents/tables/contactListsTable.jsx) with list fetch/refresh and create-entry point.
  - Added [`src/components/subcomponents/drawers/newContactListDrawer.jsx`](src/components/subcomponents/drawers/newContactListDrawer.jsx) with searchable client selection and create payload `{ name, description, members }`.
  - Client fetch now calls `GET ${apiPath.prodPath}/api/clients/allNewLeads` with params `fields=clientName,email,companyName`, `limit=100`, `page=1`.

- **Step 9 complete — Templates UI**:
  - Added [`src/components/subcomponents/tables/templatesTable.jsx`](src/components/subcomponents/tables/templatesTable.jsx) with card layout (`name`, `kind`, subject preview, `usageCount`) and create action.
  - Added [`src/components/subcomponents/drawers/templateBuilderDrawer.jsx`](src/components/subcomponents/drawers/templateBuilderDrawer.jsx) with:
    - fields `name`, `description`, `kind`, `subject`, `body`
    - merge-tag chips (`{{firstName}}`, `{{lastName}}`, `{{company}}`, `{{email}}`, `{{bookingLink}}`, `{{senderName}}`, `{{senderTitle}}`)
    - live preview via merge-tag sample substitution + HTML render
    - save payload `POST /api/templates` with `{ name, description, kind, format: "html", subject, body, service: "both" }`.

- **Step 10 complete — Bulk Jobs UI**:
  - Added [`src/components/subcomponents/tables/bulkJobsTable.jsx`](src/components/subcomponents/tables/bulkJobsTable.jsx) wired to `GET ${apiPath.prodPath3}/api/bulkEmail/getBulkEmailJobs/:userId`.
  - Parses jobs from `res.data.jobs`.
  - Includes KPI cards (total/completed/failed), status badges, subject, service, sent/total progress, created date.
  - Polling hardened:
    - interval is now `60000ms`
    - polling auto-stops after first API error
    - manual Refresh resets polling and refetches immediately.

- **Step 11 complete — Final tab assembly**:
  - Refactored [`src/components/mailingComp/index.jsx`](src/components/mailingComp/index.jsx) to 4-tab structure:
    - Tab 0 `Inbox` -> `InboxTable`
    - Tab 1 `Clients` -> `MailingTable`
    - Tab 2 `Bulk Email` -> sub-tabs `Contact Lists` / `Bulk Jobs`
    - Tab 3 `Templates` -> sub-tabs `Contact Lists` / `Templates & Newsletters`
  - Refactored [`src/app/(pages)/Mailing/page.js`](src/app/(pages)/Mailing/page.js) to render `MailingComp` directly (auth guard retained).
  - Google auth button and search/filter toolbar remain scoped to Tabs 0 and 1 only.

### Still not done (for next sessions)

- Activity feed POST to adam-backend (`activityLogger`, `ADAM_BACKEND_URL`)
- Remove deprecated `BulkJob.results[]` after delivery-log migration is fully validated in production
- End-to-end SendGrid webhook hardening in production (public HTTPS endpoint, replay safeguards, alerting)
- Retry/Pause UX controls in Bulk Jobs table (API wiring + user feedback states)

### Completed: Phase 3C — hcc-admin-v2 Templates UX and modal polish (April 2026, latest)

- **Drawer centering/sizing fixes**:
  - Updated template and contact-list create modals from `Drawer` to `Dialog` to avoid MUI Drawer transform/position overrides.
  - Files:
    - [`src/components/subcomponents/drawers/templateBuilderDrawer.jsx`](src/components/subcomponents/drawers/templateBuilderDrawer.jsx)
    - [`src/components/subcomponents/drawers/newContactListDrawer.jsx`](src/components/subcomponents/drawers/newContactListDrawer.jsx)
- **Modal viewport sizing standardization**:
  - Dialog paper now uses viewport sizing and constrained width (`90vw`/`1200px`, `90vh`) with overflow clipping for stable dark-theme shell rendering.
- **Internal panel overflow/layout fixes**:
  - Prevented save button/panel cutoff by using flex-based height distribution (`flex-1`, `min-h-0`, `overflow-hidden`) on the two-panel content region.
  - Ensured scrolling remains inside panel containers rather than overflowing outside modal bounds.
- **Templates preview modal added in cards table** ([`src/components/subcomponents/tables/templatesTable.jsx`](src/components/subcomponents/tables/templatesTable.jsx)):
  - Template cards are now clickable and open a centered preview `Dialog`.
  - Click handler resets preview tab state each open:
    - `onClick={() => { setPreviewTemplate(template); setPreviewTab("rendered"); }}`
  - Added left metadata panel (name, kind, subject, description, usageCount, created date via `moment`).
  - Added merge-tag extraction chips from template body using `{{word}}` regex scan.
  - Added right preview tabs:
    - **Rendered**: sandboxed `iframe` using raw `srcDoc` (no merge substitution).
    - **HTML Source**: raw template body in `<pre>`.
  - Styled with the same inline dark-theme gradient/border language as template builder dialog.

### Current frontend status summary (Mailing module)

- 4-tab Mailing architecture is in place and functional (`Inbox`, `Clients`, `Bulk Email`, `Templates`).
- Templates flow now supports:
  - create template dialog
  - templates card grid
  - full-screen preview modal with rendered/source switching
- Contact list creation and selection flow is functional and integrated with bulk-email compose path.

### Completed: Phase 3E — Inbox quick actions per row (April 2026, latest)

- **Inbox row Actions updated to inline quick actions** ([`src/components/subcomponents/tables/inboxTable.jsx`](src/components/subcomponents/tables/inboxTable.jsx)):
  - Replaced DropdownMenu actions with an inline dark-theme action group (`flex` row with `gap-1`).
  - Added **Open** as a compact ghost-style text button (`28x28`, bordered, themed background).
  - Added **Reply** icon button (`ReplyIcon`) that currently opens the same `MailDetails` flow as Open (`handleOpenModal(i)`), enabling future reply-flag wiring without UI changes.
  - Added **Add as Activity** icon button (`AddCircleOutlineIcon`) with temporary success toast:
    - `Swal.fire({ icon: "success", text: "Thread saved as activity", timer: 1500, showConfirmButton: false })`
  - Removed now-unused row action menu imports/icons (`DropdownMenu*`, `MoreVertIcon`).

- **MailDetails render placement corrected** ([`src/components/subcomponents/tables/inboxTable.jsx`](src/components/subcomponents/tables/inboxTable.jsx)):
  - Removed `MailDetails` from inside the `TableRow` map.
  - Rendered a single shared `MailDetails` instance after `</Table>` using:
    - `item={currentItems.find(i => i.id === empId)}`
  - This avoids duplicate per-row drawer mounts and matches handoff structure.

### Completed: Phase 3D — Mailing table/debug and bulk drawer template preview sync (April 2026, latest)

- **`MailingTable` API debugging instrumentation added** ([`src/components/subcomponents/tables/mailingTable.jsx`](src/components/subcomponents/tables/mailingTable.jsx)):
  - Added debug logging for `assignedTo` request param used in `GET /api/clients/allNewLeads`.
  - Added response-shape logs inside request `.then()`:
    - `res.data`
    - `res.data.data`
  - No filtering/assignment logic changes were made in this step (debug-only update).

- **`Email All` modal rendering bug fixed** ([`src/components/subcomponents/tables/mailingTable.jsx`](src/components/subcomponents/tables/mailingTable.jsx)):
  - Moved `SendBulkEmailViaGmail` render outside the `newClients.length > 0 && !loader` block.
  - Result: bulk-email drawer can now open even when there are no table rows.
  - Updated prop fallback to avoid undefined list handling:
    - `newClients={newClients || []}`

- **Bulk drawer template body fetch + preview fallback added** ([`src/components/subcomponents/drawers/bulkEmialDrawer.jsx`](src/components/subcomponents/drawers/bulkEmialDrawer.jsx)):
  - Added local state:
    - `templateBody`
  - Added `fetchTemplateBody(templateIdValue)` to retrieve selected template HTML:
    - `GET ${apiPath.prodPath3}/api/templates/:templateId`
    - Sets `templateBody` from `r.data?.data?.body || ""`
  - Template select now triggers both:
    - `setTemplateId(e.target.value)`
    - `fetchTemplateBody(e.target.value)`
  - Live preview iframe now prefers editor body, then fetched template body:
    - `srcDoc={body || templateBody || ""}`

### Completed: Phase 3E — Contact Lists row-level bulk send flow (April 2026, latest)

- **Row-level bulk action added in Contact Lists table** ([`src/components/subcomponents/tables/contactListsTable.jsx`](src/components/subcomponents/tables/contactListsTable.jsx)):
  - Added a `Bulk Send` table column with a `Send Bulk` button on each contact-list row.
  - Row action now opens `SendBulkEmailViaGmail` and passes the clicked list context.
  - Added local UI state to support flow:
    - `bulkDrawerOpen`
    - `selectedList`
  - Drawer is rendered from the Contact Lists table with:
    - `emails={[]}`
    - `newClients={[]}`
    - `preselectedListId={selectedList._id}`

- **Bulk drawer preselection support added** ([`src/components/subcomponents/drawers/bulkEmialDrawer.jsx`](src/components/subcomponents/drawers/bulkEmialDrawer.jsx)):
  - Added new optional prop:
    - `preselectedListId = ""`
  - Added open-time sync effect:
    - when `open && preselectedListId`, set `selectedContactListId(preselectedListId)`
  - Result: opening from a Contact List row auto-selects that list in the bulk-email compose drawer without extra user selection.
