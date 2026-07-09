# Jiva Farm OS Role-Based Usage Manual

Version: v0.10
Status: Draft  
Last updated: 09 Jul 2026  
Owner: Jiva Farm OS Admin / Management  
Audience: Internal Jiva Farm OS users  

## 1. How To Use This Manual

This is a practical ready-reckoner for day-to-day Jiva Farm OS use. It shows what each role can see, what each role should do, where work moves next, and where not to take action.

This manual will be updated as Jiva Farm OS workflows, role permissions, modules, and operating practices evolve.

Use it when:

- onboarding a new internal user
- deciding which menu to use for a task
- checking whether a user should create, update, approve, or only view
- explaining how workflows move between teams

## Version history

| Version | Date | Status | Notes |
|---|---|---|---|
| v0.10 | 09 Jul 2026 | Draft | Adds in-app Help / SOP role-wise training guide alignment, including daily checklists, main pages, handoffs, avoid lists, and escalation points for each role. |
| v0.9 | 09 Jul 2026 | Draft | Final launch polish: updates sidebar navigation groups, session/password guidance, Marketing deadline workflow notes, brief document link guidance, and soft-delete/restore training notes. |
| v0.8 | 09 Jul 2026 | Draft | Adds Admin/Management System Health for KPI cache, dispatch aging, installation aging, pilot visit risk, marketing risk, and deleted-record visibility. |
| v0.7 | 09 Jul 2026 | Draft | Adds Admin/Management Data Quality warnings for duplicate, incomplete, dispatch-readiness, pilot setup, and marketing workflow review. |
| v0.6 | 09 Jul 2026 | Draft | Adds My Pending Work as a live role-scoped action list for Sales, Dispatch, Pilots & Visits, and Marketing. |
| v0.5 | 09 Jul 2026 | Draft | Adds soft-delete audit trail, delete reason capture, Admin-only deleted-record views, and restore guidance for Dealers, Institutional Partners, and Pilots. |
| v0.4 | 09 Jul 2026 | Draft | Adds paid farmer sale dispatch vs free pilot dispatch routing, device pool rules, and dispatch handoff guidance. |
| v0.3 | 09 Jul 2026 | Draft | Adds controlled soft-delete guidance for Dealers, Institutional Partners, and Pilots. |
| v0.2 | 09 Jul 2026 | Draft | Adds Marketing Requests module, Marketing Head and Designer role guidance, and marketing request workflow/access rules. |
| v0.1 | 09 Jul 2026 | Draft | Initial role-based ready-reckoner covering menu access, workflows, role guides, status references, and items to confirm. |

## 2. Role Legend

| Role | Department / function | Primary responsibility in the system |
|---|---|---|
| Admin | System administration | Full app administration, user setup, master access, emergency correction |
| Management | Leadership | Company-wide visibility, pilot oversight where allowed, dashboard review |
| Sales Head | Sales leadership | Sales pipeline, dealer/institution oversight, RSM/region review, KPI refresh |
| RSM | Regional sales | Region/state pipeline, dealer progress, installations, follow-ups |
| Salesperson | Field sales | Farmer leads, follow-ups, sales-linked installations |
| Agronomist | Agronomy / technical | Pilot visibility, technical oversight, visit/report review, field guidance |
| Research Assistant | Field research | My Visits, visit reports, pilot observations, field evidence |
| R&D Head | R&D leadership | Pilot review, R&D approval, reports, agronomy performance |
| Marketing Head | Marketing leadership | Review, assign, progress, and deliver Marketing Requests |
| Designer | Marketing execution | Work assigned Marketing Requests, share draft/final links, and add comments |
| Accounts | Finance | Payment confirmation, device/dispatch finance checks |
| Stock / Dispatch | Customer Service Team | Devices, dispatches, operational installation support |
| HR & Legal | Legal / compliance | Dealer and institution legal approval workflows |
| Viewer | Read-only observer | Read-only visibility across permitted operational modules |

## 3. Access Symbol Legend

| Symbol | Meaning |
|---|---|
| ⭐ | Primary work area |
| ✅ | Full / broad access for that role |
| ✏️ | Can create or update records |
| 👁 | View only |
| ⚠️ | Limited or scope-based access |
| 🔒 | No access / hidden |

Notes:

- Secondary roles add access. They do not remove the primary role's access.
- Viewer remains read-only.
- Help / SOP and Change Password are available to signed-in users.
- First-login password-change users see only Change Password and Sign out until password is changed.
- If a user's session expires, they should log in again and return to the page they were using. The app separates expired-session messages from permission-denied messages.
- Marketing Head and Designer use Marketing Requests as their role home page.

## 4. Master Role-Menu Access Matrix

### Sidebar Navigation Groups

| Group | Menus | Training notes |
|---|---|---|
| Daily Work | Dashboard; My Pending Work; My Visits | Daily action areas. Visit Reports are submitted through My Visits or Pilot detail, not as a standalone sidebar page. |
| Sales & Partners | Farmer Leads; Dealers; Institutional Partners | Contacts and meetings are managed inside Institutional Partner detail where available. |
| R&D | Pilots | Pilots stay under R&D only. |
| Operations | Devices; Dispatches; Installations; Post Installation Follow-ups | Device movement, dispatch, installation, and after-installation work stay under Operations only. |
| Team Workflows | Marketing Requests | Creative request workflow for briefs, deadlines, draft links, comments, and final OneDrive links. |
| Management | KPI Dashboard; Data Quality; System Health; Regions; Internal Users | Visibility is role-controlled; most items are Admin/Management-only. |
| Support | Help / SOP; Change Password | Support items are available to signed-in users; Change Password remains available during forced first-login password change. |

### In-App Help / SOP Training Guide

The Help / SOP page is the short in-app training version of this manual. It is organized role-wise and includes:

- role purpose
- daily checklist
- main pages to use
- key handoffs owned
- what not to do
- escalation points

The current user's primary and secondary role sections appear first where available. Help / SOP is guidance only; it does not change permissions, RLS, or workflow authority.

### Operations Menus

| Role | Home | My Pending Work | Farmer Leads | Dealers | Institutional Partners | Pilots | My Visits | Dispatches | Installations | Post Installation Follow-ups | Devices | KPI Dashboard | System Health | Data Quality | Marketing Requests |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Admin | ✅ | ✅ | ✅ ✏️ | ✅ ✏️ | ✅ ✏️ | ✅ ✏️ | ✅ | ✅ ✏️ | ✅ ✏️ | ✅ ✏️ | ✅ ✏️ | ✅ | ✅ | ✅ | ✅ ✏️ |
| Management | ✅ | ✅ | 👁 | 👁 | 👁 | ⚠️ ✏️ | ⚠️ | 🔒 | 👁 | 👁 | 👁 | ✅ | ✅ | ✅ | ✅ ✏️ |
| Sales Head | ✅ | ✅ | ⭐ ✏️ | ⭐ ✏️ | ⭐ ✏️ | 👁 | 👁 | 👁 | ✏️ | ✏️ | 👁 | ✅ | 🔒 | 🔒 | ✏️ ⚠️ |
| RSM | ✅ | ✅ | ⭐ ✏️ ⚠️ | ⭐ ✏️ ⚠️ | ⭐ ✏️ ⚠️ | 👁 ⚠️ | 👁 ⚠️ | 👁 ⚠️ | ✏️ ⚠️ | ✏️ ⚠️ | 🔒 | ✅ ⚠️ | 🔒 | 🔒 | ✏️ ⚠️ |
| Salesperson | ✅ | ✅ | ⭐ ✏️ ⚠️ | 👁 ⚠️ | 🔒 | 👁 ⚠️ | 👁 ⚠️ | 🔒 | ✏️ ⚠️ | ✏️ ⚠️ | 🔒 | 👁 ⚠️ | 🔒 | 🔒 | ✏️ ⚠️ |
| Agronomist | ✅ | ✅ | 👁 | 👁 | ✏️ ⚠️ | ⭐ ✏️ | ⭐ ⚠️ | 👁 | 👁 | ✏️ | 👁 | ✅ | 🔒 | 🔒 | ✏️ ⚠️ |
| Research Assistant | ✅ | ✅ | ✏️ ⚠️ | 🔒 | 🔒 | ⭐ ✏️ ⚠️ | ⭐ ✏️ | 🔒 | 🔒 | ✏️ ⚠️ | 🔒 | ✅ ⚠️ | 🔒 | 🔒 | ✏️ ⚠️ |
| R&D Head | ✅ | ✅ | 👁 | 👁 | 👁 | ⭐ ✏️ | 👁 | 👁 | 👁 | 👁 | 👁 | ✅ | 🔒 | 🔒 | ✏️ ⚠️ |
| Marketing Head | ✅ | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ⭐ ✅ ✏️ |
| Designer | ✅ | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ⭐ ✏️ ⚠️ |
| Accounts | ✅ | ✅ | 👁 ⚠️ | 🔒 | 🔒 | 🔒 | 🔒 | ⭐ ✏️ | 🔒 | 🔒 | ✏️ | ✅ | 🔒 | 🔒 | 🔒 |
| Stock / Dispatch | ✅ | ✅ | ✏️ ⚠️ | 🔒 | 🔒 | 🔒 | 🔒 | ⭐ ✏️ | ⭐ ✏️ | 🔒 | ⭐ ✏️ | ✅ | 🔒 | 🔒 | 🔒 |
| HR & Legal | 🔒 | ✅ | 🔒 | ⚠️ ✏️ | ⚠️ ✏️ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |
| Viewer | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 🔒 | 🔒 | 🔒 |

### Team And Utility Menus

| Role | Regions | Internal Users | Help / SOP | Change Password |
|---|---:|---:|---:|---:|
| Admin | ✅ ✏️ | ✅ ✏️ | ✅ | ✅ |
| Management | 👁 | 🔒 | ✅ | ✅ |
| Sales Head | ✏️ | 🔒 | ✅ | ✅ |
| RSM | 🔒 | 🔒 | ✅ | ✅ |
| Salesperson | 🔒 | 🔒 | ✅ | ✅ |
| Agronomist | 🔒 | 🔒 | ✅ | ✅ |
| Research Assistant | 🔒 | 🔒 | ✅ | ✅ |
| R&D Head | 🔒 | 🔒 | ✅ | ✅ |
| Marketing Head | 🔒 | 🔒 | ✅ | ✅ |
| Designer | 🔒 | 🔒 | ✅ | ✅ |
| Accounts | 🔒 | 🔒 | ✅ | ✅ |
| Stock / Dispatch | 🔒 | 🔒 | ✅ | ✅ |
| HR & Legal | 🔒 | 🔒 | ✅ | ✅ |
| Viewer | 🔒 | 🔒 | ✅ | ✅ |

## 5. Role Ready-Reckoners

### Role: Admin

#### Daily purpose

Keep the whole operating system clean, correct, and usable.

#### Primary menus

| Menu | What Admin does there | Access |
|---|---|---|
| Internal Users | Create users, assign roles, activate/deactivate users | ⭐ ✅ ✏️ |
| Regions | Maintain region and RSM setup | ⭐ ✅ ✏️ |
| All operational menus | Review, correct, and unblock workflows | ✅ ✏️ |
| KPI Dashboard | Refresh cached company KPI dashboard | ✅ |

#### Daily workflow map

```mermaid
flowchart LR
  A["System issue"] --> B["Check affected module"]
  B --> C["Correct user / region / workflow data"]
  C --> D["Refresh KPI Dashboard if needed"]
  D --> E["Confirm with responsible team"]
```

#### Do

- Keep roles and secondary roles accurate.
- Use Regions before assigning RSM-based work.
- Refresh KPI Dashboard after major data corrections.
- Use Help / SOP to guide users before changing permissions.

#### Don't

- Do not bypass workflows by changing statuses randomly.
- Do not use QA seed in production.
- Do not weaken RLS or use service-role access in app code.

#### Common statuses they will see

| Status | Meaning | What Admin should do |
|---|---|---|
| Inactive user | User cannot work in app | Reactivate or replace only after business confirmation |
| Device Installed | Workflow-controlled stage | Confirm installation record exists |
| KPI cache stale | Saved KPI dashboard needs refresh | Refresh from KPI Dashboard |

#### Escalate to

Harsha / Management for business-rule decisions.

---

### Role: Management

#### Daily purpose

Review company-wide progress and major pilot/dealer/institution outcomes.

#### Primary menus

| Menu | What Management does there | Access |
|---|---|---|
| Home | Quick operating overview | ✅ |
| KPI Dashboard | Company KPI review | ✅ |
| Pilots | Oversight and management-level pilot work | ⚠️ ✏️ |
| Leads / Dealers / Institutions / Devices / Installations | Review operational state | 👁 |

#### Daily workflow map

```mermaid
flowchart LR
  A["Open Home / KPI Dashboard"] --> B["Review sales, pilots, stock, installations"]
  B --> C["Open module detail"]
  C --> D["Ask role owner to act"]
```

#### Do

- Use KPI Dashboard for company-wide review.
- Use details pages to understand blockers.
- Ask Sales Head, R&D Head, or Admin to update source records.

#### Don't

- Do not use Management role as day-to-day data-entry role unless the page explicitly allows it.
- Do not refresh or change data outside the intended workflow.

#### Common statuses they will see

| Status | Meaning | What user should do |
|---|---|---|
| Follow-up Due | Team owes a follow-up | Ask Sales/RSM owner |
| Final Report Pending | Pilot needs R&D review | Ask R&D Head |
| Dormant Dealer | Dealer needs review or closure | Ask Sales Head/RSM |

#### Escalate to

Sales Head for sales/dealer; R&D Head for pilots; Admin for access/data issues.

---

### Role: Sales Head

#### Daily purpose

Own sales pipeline, dealer growth, institution opportunities, regional progress, and KPI refresh.

#### Primary menus

| Menu | What Sales Head does there | Access |
|---|---|---|
| Farmer Leads | Review and manage pipeline | ⭐ ✏️ |
| Dealers | Create dealer profiles and track progress | ⭐ ✏️ |
| Institutional Partners | Create/manage institution opportunities | ⭐ ✏️ |
| KPI Dashboard | Refresh cached dashboard and review sales KPIs | ⭐ ✅ |
| Regions | Maintain region setup where allowed | ✏️ |

#### Daily workflow map

```mermaid
flowchart LR
  A["Review KPI Dashboard"] --> B["Check Farmer Leads"]
  B --> C["Check Dealer / Institution pipeline"]
  C --> D["Assign or follow up through RSM"]
  D --> E["Review Dispatch / Installation movement"]
```

#### Do

- Create Dealer profiles when needed.
- Use Dealer review and next action to keep dealer progress moving.
- Use Institutions for partner opportunities and scale-up.
- Soft-delete Dealers or Institutional Partners only when they should be removed from active views; add a clear delete reason because Admin can audit and restore deleted records later.
- Refresh KPI Dashboard after data refresh cycles.

#### Don't

- Do not mark payment confirmed unless acting through allowed finance workflow.
- Do not manually mark workflow-derived milestones that are handled by Dispatch/Installation.

#### Common statuses they will see

| Status | Meaning | What user should do |
|---|---|---|
| Prospect | Dealer is early-stage | Push RSM for profile/review |
| Onboarding | Dealer setup is in progress | Track terms, training, agreement, first order |
| Payment Confirmed | Farmer lead is ready for dispatch planning | Coordinate Accounts/Dispatch |
| Ready for dispatch | Paid lead has payment confirmed and no active dispatch request | Stock / Dispatch creates Farmer Sale Dispatch |

#### Escalate to

Accounts for payment, Stock / Dispatch for dispatch, HR & Legal for agreements, Admin for access.

---

### Role: RSM

#### Daily purpose

Manage assigned region/state pipeline, dealer performance, installations, and follow-ups.

#### Primary menus

| Menu | What RSM does there | Access |
|---|---|---|
| Farmer Leads | Work assigned regional leads | ⭐ ✏️ ⚠️ |
| Dealers | Create/manage dealer records in scope | ⭐ ✏️ ⚠️ |
| Institutional Partners | Manage region-linked institution opportunities | ✏️ ⚠️ |
| Installations | Track and update region installations | ✏️ ⚠️ |
| KPI Dashboard | Live scoped RSM KPI view | ⭐ ⚠️ |

#### Daily workflow map

```mermaid
flowchart LR
  A["Open KPI Dashboard"] --> B["Review scoped leads / installations / dealers"]
  B --> C["Update Farmer Leads"]
  C --> D["Coordinate Dispatch / Installation"]
  D --> E["Complete follow-up"]
```

#### Do

- Keep lead owner, RSM, next action, and follow-up data current.
- Use Dealer review and next action to drive dealer progress.
- Use Installations and Follow-ups for field closure.
- Use live RSM KPI Dashboard for assigned scope.

#### Don't

- Do not expect company-wide KPI cache behavior; RSM dashboard is live and scoped.
- Do not update legal approval fields unless the workflow allows it.

#### Common statuses they will see

| Status | Meaning | What user should do |
|---|---|---|
| Follow-up Active | Sales follow-up is in progress | Update next action |
| Device Dispatched | Device is on the way | Coordinate installation |
| Follow-up Pending | Installation follow-up is due | Complete follow-up |

#### Escalate to

Sales Head for routing/targets, Accounts for payment, Stock / Dispatch for device movement.

---

### Role: Salesperson

#### Daily purpose

Capture and work farmer leads assigned to the salesperson.

#### Primary menus

| Menu | What Salesperson does there | Access |
|---|---|---|
| Farmer Leads | Create and update assigned leads | ⭐ ✏️ ⚠️ |
| Installations | Work sales-linked installation records | ✏️ ⚠️ |
| Post Installation Follow-ups | Complete assigned follow-ups | ✏️ ⚠️ |
| KPI Dashboard | Scoped visibility where available | 👁 ⚠️ |

#### Daily workflow map

```mermaid
flowchart LR
  A["Create Farmer Lead"] --> B["Follow-up Active"]
  B --> C["Payment Confirmed"]
  C --> D["Dispatch / Installation"]
  D --> E["Post Installation Follow-up"]
```

#### Do

- Capture accurate farmer, crop, location, product, and next action.
- Keep lead stage current until payment/dispatch handoff.
- Complete follow-ups assigned to you.

#### Don't

- Do not confirm payment unless Accounts/Admin handles it.
- Do not manually force Device Installed.

#### Common statuses they will see

| Status | Meaning | What user should do |
|---|---|---|
| Lead Captured | New lead exists | Complete first contact |
| Quotation / Estimate Shared | Commercial discussion is active | Follow up |
| Payment Confirmed | Finance checkpoint complete | Coordinate next workflow |

#### Escalate to

RSM for field routing, Sales Head for unresolved commercial decisions.

---

### Role: Agronomist

#### Daily purpose

Own technical pilot oversight and support Research Assistant field work.

#### Primary menus

| Menu | What Agronomist does there | Access |
|---|---|---|
| Pilots | Create/manage pilots and monitoring plans | ⭐ ✏️ |
| My Visits | View field visit flow where relevant | ⭐ ⚠️ |
| Visit Reports through Pilots | Review field notes, evidence, parameters | ⭐ |
| Farmer Leads / Devices / Installations / Follow-ups | Technical context and follow-up | 👁 / ✏️ where allowed |
| Institutional Partners | Manage technical institution profile fields | ✏️ ⚠️ |

#### Daily workflow map

```mermaid
flowchart LR
  A["Create / review Pilot"] --> B["Plan visits"]
  B --> C["Assign Research Assistant"]
  C --> D["Review Visit Reports"]
  D --> E["Recommend result / scale-up"]
```

#### Do

- Use Pilots as the main technical cockpit.
- Add planned visits with date, RA, crop stage, and parameters.
- Review observations and evidence.
- Soft-delete Pilots only when they should be removed from active views; add a clear delete reason because Admin can audit and restore deleted records later.
- Keep technical follow-ups clean.

#### Don't

- Do not use finance/admin-only fields.
- Do not treat pilot installation as farmer sale installation.

#### Common statuses they will see

| Status | Meaning | What user should do |
|---|---|---|
| Monitoring Active | Pilot is in field monitoring | Track visits/reports |
| Visit Report Pending | Field report is needed | Follow up with RA |
| Awaiting R&D Review | Final result needs R&D | Escalate to R&D Head |

#### Escalate to

R&D Head for result approval, Research Assistant for visit completion, Admin for access issues.

---

### Role: Research Assistant

#### Daily purpose

Complete assigned pilot visits and submit field visit reports.

#### Primary menus

| Menu | What Research Assistant does there | Access |
|---|---|---|
| My Visits | See assigned visits and submit reports | ⭐ ✏️ |
| Pilots | Create/update pilot work where allowed | ⭐ ✏️ ⚠️ |
| Visit Reports through Pilots/My Visits | Enter observations, notes, evidence | ⭐ ✏️ |
| Farmer Leads | Create/read eligible leads in assigned geography for pilot work | ✏️ ⚠️ |
| KPI Dashboard | Live user-specific KPI counts | 👁 ⚠️ |

#### Daily workflow map

```mermaid
flowchart LR
  A["Open My Visits"] --> B["Select assigned visit"]
  B --> C["Record parameter observations"]
  C --> D["Add Visit Report Notes"]
  D --> E["Upload evidence"]
  E --> F["Submit Visit Report"]
```

#### Do

- Start from My Visits in the field.
- Submit Visit Report Notes, parameter observations, photos, and data sheet when available.
- Keep evidence clear and factual.
- Use Farmer Leads only within assigned pilot/geography rules.

#### Don't

- Do not mark Pilot Device Installed.
- Do not approve reports for external sharing.
- Do not change R&D approval decisions.

#### Common statuses they will see

| Status | Meaning | What user should do |
|---|---|---|
| Assigned | Visit is assigned to you | Prepare for visit |
| In Progress | Visit work has started | Continue / Submit report |
| Needs report | Visit needs field report | Submit Visit Report |

#### Escalate to

Agronomist for technical guidance, R&D Head for review decisions.

---

### Role: R&D Head

#### Daily purpose

Review pilot evidence, field reports, technical outcomes, and scale-up readiness.

#### Primary menus

| Menu | What R&D Head does there | Access |
|---|---|---|
| Pilots | Review and manage R&D pilot workflows | ⭐ ✏️ |
| Visit Reports through Pilots | Review reports and evidence | ⭐ |
| KPI Dashboard | Review R&D and pilot KPIs | ✅ |
| Institutions / Dealers / Farmer Leads | View context | 👁 |

#### Daily workflow map

```mermaid
flowchart LR
  A["Review Pilot detail"] --> B["Check Visit Reports"]
  B --> C["Review evidence"]
  C --> D["Approve / request revision"]
  D --> E["Decide scale-up"]
```

#### Do

- Review final pilot reports and scale-up evidence.
- Use KPI Dashboard for R&D/Agronomist/RA performance.
- Approve external sharing only when appropriate.

#### Don't

- Do not use sales workflow statuses as technical conclusions.
- Do not let partner sharing approval mean the app has actually sent anything externally.

#### Common statuses they will see

| Status | Meaning | What user should do |
|---|---|---|
| Final Report Submitted | Ready for R&D review | Review and approve/request revision |
| Scale-up Recommended | Technical team recommends scale-up | Confirm business path |
| Approved for External Sharing | Internal approval to share evidence | Use only after review |

#### Escalate to

Management for strategic scale-up decisions; Admin for access/data issues.

---

### Role: Marketing Head

#### Daily purpose

Review, assign, and control Marketing Requests through draft, correction, final link, and delivery.

#### Primary menus

| Menu | What Marketing Head does there | Access |
|---|---|---|
| Marketing Requests | Review all requests, assign owner, update workflow, share links, deliver | ⭐ ✅ ✏️ |

#### Daily workflow map

```mermaid
flowchart LR
  A["Review new request"] --> B["Accept or ask clarification"]
  B --> C["Accept deadline or propose revised deadline"]
  C --> D["Assign Marketing Head / Designer"]
  D --> E["Share draft link"]
  E --> F["Handle corrections"]
  F --> G["Add final OneDrive link"]
  G --> H["Mark delivered"]
```

#### Do

- Keep deadline decision, status, assigned owner, draft link, and final OneDrive link current.
- Use comments for clarification, corrections, and delivery notes.
- Keep heavy design files in local drive / OneDrive, not in the app.

#### Don't

- Do not upload large design assets into Jiva Farm OS.
- Do not mark delivered without a final link when one is expected.

#### Escalate to

Management for priority conflicts; requester for missing brief details.

---

### Role: Designer

#### Daily purpose

Work assigned Marketing Requests and share draft/final links for review.

#### Primary menus

| Menu | What Designer does there | Access |
|---|---|---|
| Marketing Requests | Create requests, view own/assigned requests, update progress and links | ⭐ ✏️ ⚠️ |

#### Daily workflow map

```mermaid
flowchart LR
  A["Open assigned request"] --> B["Review brief"]
  B --> C["Work outside app"]
  C --> D["Add draft link"]
  D --> E["Handle corrections"]
  E --> F["Add final OneDrive link"]
```

#### Do

- Update progress when work moves to In Progress, Draft Shared, or Corrections Requested.
- Add draft and final links when available.
- Add comments when clarification is needed.

#### Don't

- Do not cancel or finally deliver requests unless you also have Marketing Head/Admin/Management access.
- Do not store heavy design files inside the app.

#### Escalate to

Marketing Head for acceptance, cancellation, delivery, deadline changes, or priority conflicts.

---

### Role: Accounts

#### Daily purpose

Confirm payment and support finance-controlled dispatch readiness.

#### Primary menus

| Menu | What Accounts does there | Access |
|---|---|---|
| Dispatches | Review payment-related dispatch readiness | ⭐ ✏️ |
| Devices | Device/stock visibility where allowed | ✏️ |
| Farmer Leads | View lead payment context | 👁 ⚠️ |
| KPI Dashboard | Operational KPI visibility | 👁 |

#### Daily workflow map

```mermaid
flowchart LR
  A["Review payment request"] --> B["Confirm payment"]
  B --> C["Dispatch can proceed"]
  C --> D["Stock / Dispatch moves device"]
```

#### Do

- Confirm payment only when verified.
- Keep payment evidence and references accurate.
- Coordinate with Stock / Dispatch after payment confirmation.

#### Don't

- Do not change sales ownership or field follow-up data.
- Do not mark installation or pilot statuses.

#### Common statuses they will see

| Status | Meaning | What user should do |
|---|---|---|
| Pending Payment Confirmation | Finance needs to verify | Confirm or hold |
| Approved for Dispatch | Payment/approval path complete | Hand off to Dispatch |
| On Hold | Cannot proceed | Clarify blocker |

#### Escalate to

Sales Head/RSM for commercial questions; Admin for system corrections.

---

### Role: Stock / Dispatch

#### Daily purpose

Manage device stock, dispatch movement, and installation handoff.

#### Primary menus

| Menu | What Stock / Dispatch does there | Access |
|---|---|---|
| Devices | Maintain device stock and status | ⭐ ✏️ |
| Dispatches | Create/update dispatch movement | ⭐ ✏️ |
| Installations | Support installation workflow | ⭐ ✏️ |
| Farmer Leads | Update operational lead workflow where allowed | ✏️ ⚠️ |
| KPI Dashboard | Stock and dispatch KPI visibility | 👁 |

#### Daily workflow map

```mermaid
flowchart LR
  A["Approved dispatch"] --> B["Select device"]
  B --> C["Dispatch"]
  C --> D["Delivered / Installation Pending"]
  D --> E["Installation"]
  E --> F["Device status updated"]
```

#### Do

- Keep serial number and device status accurate.
- Use Dispatches for device movement.
- Use Paid Farmer Sale for paid farmer leads and Free Pilot for free pilot movement.
- Use Fresh Sale devices for paid farmer sale dispatches.
- Use Pilot Stock devices for free pilot dispatches.
- Use Installations for field installation records.

#### Don't

- Do not confirm payment unless your role also permits it.
- Do not mark a Farmer Lead dispatched until dispatch status is `Dispatched`.
- Do not mark Pilot Device Installed from dispatch creation.
- Do not change pilot technical results.

#### Common statuses they will see

| Status | Meaning | What user should do |
|---|---|---|
| In Warehouse | Device available | Dispatch when approved |
| Dispatched | Device moved out | Track delivery |
| Installed at Farmer Site | Farmer sale installation complete | Close device movement |

#### Escalate to

Accounts for payment holds; RSM/Sales Head for destination or farmer issues.

---

### Role: HR & Legal

#### Daily purpose

Review and approve dealer and institution legal documents.

#### Primary menus

| Menu | What HR & Legal does there | Access |
|---|---|---|
| Dealers | Legal agreement review/approval | ⭐ ⚠️ ✏️ |
| Institutional Partners | MOU/legal approval review | ⭐ ⚠️ ✏️ |
| Help / SOP | Operating guidance | ✅ |
| Change Password | Account security | ✅ |

#### Daily workflow map

```mermaid
flowchart LR
  A["Open Dealer / Institution"] --> B["Review agreement or MOU"]
  B --> C["Approve / reject / comment"]
  C --> D["Sales team continues workflow"]
```

#### Do

- Update only legal approval fields and comments.
- Keep approval comments clear.
- Ask Sales Head/RSM for missing commercial context.

#### Don't

- Do not edit dealer performance, sales pipeline, or field workflows unless separately authorized.

#### Common statuses they will see

| Status | Meaning | What user should do |
|---|---|---|
| Under Review | Document needs legal review | Review document |
| Approved | Legal checkpoint complete | Sales can proceed |
| Rejected / Revision Required | Document needs changes | Add clear comments |

#### Escalate to

Sales Head for commercial questions; Admin for access/document issues.

---

### Role: Viewer

#### Daily purpose

Read operational information without changing records.

#### Primary menus

| Menu | What Viewer does there | Access |
|---|---|---|
| Operational modules | Read records and statuses | 👁 |
| KPI Dashboard | Read KPI summaries | 👁 |
| Help / SOP | Learn workflows | ✅ |
| Change Password | Account security | ✅ |

#### Daily workflow map

```mermaid
flowchart LR
  A["Open module"] --> B["Review status"]
  B --> C["Ask responsible role to update"]
```

#### Do

- Use details pages to understand status.
- Share questions with the responsible role.

#### Don't

- Do not expect create/edit buttons.
- Do not use Viewer as a data-entry role.

#### Common statuses they will see

| Status | Meaning | What user should do |
|---|---|---|
| Any operational status | Read-only information | Ask owner to act |

#### Escalate to

Module owner or Admin.

## 6. Core Workflow Maps

### Farmer Lead To Installation

```mermaid
flowchart LR
  A["Farmer Lead"] --> B["Follow-up"]
  B --> C{"Dealer / direct sales decision"}
  C --> D["Payment confirmation"]
  D --> E["Dispatch"]
  E --> F["Installation"]
  F --> G["Post Installation Follow-up"]
  G --> H["KPI impact"]
```

### Institution To Pilot To Scale-up

```mermaid
flowchart LR
  A["Institutional Partner"] --> B["Linked Farmer Lead"]
  B --> C["Pilot Created"]
  C --> D["Monitoring Plan"]
  D --> E["My Visits"]
  E --> F["Visit Reports"]
  F --> G["R&D Review"]
  G --> H["Scale-up Decision"]
```

### Dealer To Sales Performance

```mermaid
flowchart LR
  A["Dealer Profile"] --> B["Dealer Review / Next Action"]
  B --> C["Farmer Leads / Institution Opportunities"]
  C --> D["Dealer Farmer Installation"]
  D --> E["Dealer Performance"]
```

### Research Assistant Field Visit

```mermaid
flowchart LR
  A["My Visits"] --> B["Assigned Visit"]
  B --> C["Parameter Observations"]
  C --> D["Visit Report Notes"]
  D --> E["Evidence Uploads"]
  E --> F["Submit Visit Report"]
  F --> G["R&D Review"]
```

### Marketing Request Workflow

```mermaid
flowchart LR
  A["Request Created"] --> B["Marketing Review"]
  B --> C["Assigned Owner"]
  C --> D["Draft Shared"]
  D --> E["Corrections"]
  E --> F["Final OneDrive Link"]
  F --> G["Delivered"]
```

Rules:

- Requesters provide the brief in the app and may add an optional brief document link when extra context lives outside the app.
- Admin, Management, and Marketing Head can accept the requested deadline or propose a revised working deadline.
- Designers work from assigned requests and update draft/final links; they do not control final deadline acceptance unless they also have a management/marketing-head role.
- Heavy design files stay outside the app; Jiva Farm OS stores the request, links, comments, and status trail.

### My Pending Work Triage

```mermaid
flowchart LR
  A["Open My Pending Work"] --> B["Review grouped pending items"]
  B --> C["Open source record"]
  C --> D["Complete action in source module"]
  D --> E["Pending item clears when source data changes"]
```

Rules:

- My Pending Work is a live view, not a stored notification table.
- It uses existing records, permissions, RLS-safe queries, and role-scope helpers.
- It groups pending work into Sales, Dispatch, Pilots & Visits, and Marketing.
- Updating the source record is what clears the pending item.

### Data Quality Review

```mermaid
flowchart LR
  A["Open Data Quality"] --> B["Review warnings"]
  B --> C["Open source record"]
  C --> D["Correct record through normal workflow"]
  D --> E["Warning clears when source data is corrected"]
```

Rules:

- Data Quality is visible to Admin and Management only.
- It is a live warning page, not a blocking validator.
- It does not merge, delete, or modify records.
- It checks duplicates, missing assignments, dispatch readiness, pilot setup, and marketing workflow completeness.

### System Health Review

```mermaid
flowchart LR
  A["Open System Health"] --> B["Review operational risk sections"]
  B --> C["Open source record"]
  C --> D["Unblock the process in the source module"]
  D --> E["Health item clears when the bottleneck is resolved"]
```

Rules:

- System Health is visible to Admin and Management only.
- It is read-only and does not change source records.
- It focuses on process bottlenecks: KPI cache, dispatch aging, installation aging, pilot/visit risk, marketing risk, and deleted-record visibility.
- It is separate from Data Quality, which focuses on duplicate and incomplete records.

### Dispatch To Installation

```mermaid
flowchart LR
  A["Dispatch"] --> B["Device movement"]
  B --> C["Installation"]
  C --> D["Device status"]
  D --> E["Post Installation Follow-up"]
```

### Paid Farmer Sale Dispatch

```mermaid
flowchart LR
  A["Payment Confirmed Farmer Lead"] --> B["Stock / Dispatch creates Farmer Sale Dispatch"]
  B --> C["Fresh Sale Device selected"]
  C --> D["Dispatch Requested"]
  D --> E["Dispatched"]
  E --> F["Farmer Lead marked Device Dispatched"]
```

Rules:

- Farmer Sale Dispatch must be created from a selected paid Farmer Lead.
- The Farmer Lead must have `payment_confirmed = true`, `device_dispatched = false`, and no active non-cancelled dispatch.
- Farmer destination details come from the selected Farmer Lead.
- Manual farmer destination entry is not part of the normal paid sale path.
- `device_dispatched` changes only when dispatch status becomes `Dispatched`.

### Free Pilot Dispatch

```mermaid
flowchart LR
  A["Active Pilot"] --> B["Stock / Dispatch creates Pilot Dispatch"]
  B --> C["Pilot Stock Device selected"]
  C --> D["Dispatch Requested"]
  D --> E["Dispatched"]
  E --> F["Pilot continues to installation / monitoring workflow"]
```

Rules:

- Pilot Dispatch must be created from a selected active Pilot.
- Pilot dispatch does not require payment.
- Pilot dispatch uses Pilot Stock devices only.
- Dispatch creation does not mark Pilot Device Installed.
- If a non-cancelled pilot dispatch already exists, create another only after business review.

### Pilot Authority Map

```mermaid
flowchart TD
  A["Pilot workflow"] --> B["Research Assistant"]
  A --> C["Agronomist / R&D Head / Admin"]
  A --> D["Admin / Management / R&D Head"]
  B --> B1["Submit Visit Reports"]
  B --> B2["Cannot mark Pilot Device Installed"]
  B --> B3["Cannot approve external sharing"]
  C --> C1["Manage pilot and device-installed authority where allowed"]
  D --> D1["Can set Approved for External Sharing"]
```

## 7. Menu-By-Menu Guide

### Home

| Item | Detail |
|---|---|
| Purpose | Quick operating overview for the role. |
| Used by | Most operational roles except HR & Legal. |
| Primary actions | Review current workload and open modules. |
| Important rules | Use source modules to update records; Home is not the source of truth. |

### My Pending Work

| Item | Detail |
|---|---|
| Purpose | Show role-scoped records that need the user's action or attention. |
| Used by | All signed-in roles. |
| Primary actions | Open pending items and continue work in the source module. |
| Important rules | This is a live view only. It does not send notifications, store notification rows, or change record permissions. |

### Data Quality

| Item | Detail |
|---|---|
| Purpose | Surface duplicate, incomplete, or handoff-risk records before they affect reporting or operations. |
| Used by | Admin and Management. |
| Primary actions | Review warnings, open the source record, and correct through the normal module workflow. |
| Important rules | Warnings only. No hard constraints, no merge/delete actions, no workflow blocking, and no SQL/RLS changes. |

### System Health

| Item | Detail |
|---|---|
| Purpose | Monitor operational risk, process bottlenecks, stale KPI/cache signals, aging handoffs, and deleted-record visibility. |
| Used by | Admin and Management. |
| Primary actions | Review health sections, open source records, and unblock work in the source module. |
| Important rules | Read-only. No cleanup buttons, no workflow blocking, no stored alert table, and no SQL/RLS changes. |

### Farmer Leads

| Item | Detail |
|---|---|
| Purpose | Capture, track, and convert farmer sales opportunities. |
| Used by | Admin, Management, Sales Head, RSM, Salesperson, Research Assistant, Agronomist, Accounts, Stock / Dispatch, R&D Head, Viewer. |
| Primary actions | Create leads, update funnel stage, track follow-ups, confirm payment where allowed, link dealer/institution/pilot context. |
| Important rules | Device Installed is workflow-controlled. Payment confirmation is Admin/Accounts. Research Assistant lead selection for pilots is geography-scoped. |

### Dealers

| Item | Detail |
|---|---|
| Purpose | Manage dealer profiles, onboarding, reviews, and dealer-linked performance. |
| Used by | Admin, Sales Head, RSM, Salesperson, Management, Agronomist, R&D Head, HR & Legal, Viewer. |
| Primary actions | Create dealer, update review/next action, manage institution opportunities, legal approval where allowed. |
| Important rules | Sales Head can create and soft-delete Dealer profiles. Soft-deleted dealers are removed from active views, but linked history is preserved. Delete reason and deleted-by are captured. Admin can view deleted dealers explicitly and restore them. Dealer performance counts dealer-linked Dealer Farmer Installations. |

### Institutional Partners

| Item | Detail |
|---|---|
| Purpose | Manage institution relationships, pilots, proposals, MOU/legal status, and scale-up opportunity. |
| Used by | Admin, Management, Sales Head, RSM, R&D Head, Agronomist, HR & Legal, Viewer. |
| Primary actions | Create/manage institution profile, contacts/meetings, pilot opportunity, MOU/legal approval where allowed. |
| Important rules | Sales Head can soft-delete Institutional Partners. Soft-deleted institutions are removed from active views, but contacts, meetings, linked pilots, and history are preserved. Delete reason and deleted-by are captured. Admin can view deleted institutions explicitly and restore them. Proposal and MOU fields remain. |

### Pilots

| Item | Detail |
|---|---|
| Purpose | Track trials, monitoring visits, results, and scale-up proof. |
| Used by | Admin, Management, R&D Head, Agronomist, Research Assistant, Sales Head, RSM, Salesperson, Viewer. |
| Primary actions | Create pilot, add monitoring plan, assign visits, submit reports, review result, mark Pilot Device Installed where allowed. |
| Important rules | R&D Head can soft-delete Pilots. Admin and Management can also soft-delete Pilots. Visit plans, reports, and linked context are preserved. Delete reason and deleted-by are captured. Admin can view deleted pilots explicitly and restore them. Research Assistant cannot mark Pilot Device Installed. |

### My Visits

| Item | Detail |
|---|---|
| Purpose | Field visit workbench for assigned planned pilot visits. |
| Used by | Roles with Pilot access, especially Research Assistant. |
| Primary actions | Start/continue visit, submit Visit Report, upload evidence, complete observations. |
| Important rules | Needs report excludes future planned/assigned visits; In Progress means report is pending. |

### Dispatches

| Item | Detail |
|---|---|
| Purpose | Move devices from stock to farmer/dealer/institution/pilot destination. |
| Used by | Admin, Accounts, Stock / Dispatch, Sales Head, RSM, Agronomist, R&D Head, Viewer. |
| Primary actions | Request/approve/dispatch/deliver devices, track payment requirement. |
| Important rules | Dispatched workflow depends on payment/approval rules and Stock / Dispatch authority. |

Dispatch creation routes:

- Paid Farmer Sale: selected paid Farmer Lead, Fresh Sale device only.
- Free Pilot: selected active Pilot, Pilot Stock device only.
- Manual dispatch — admin exception: Admin-only for unusual movement.

### Installations

| Item | Detail |
|---|---|
| Purpose | Record device installation at farmer, dealer farmer, pilot, institution, replacement, or trial site. |
| Used by | Admin, Sales Head, RSM, Salesperson, Stock / Dispatch, Management, Agronomist, R&D Head, Viewer. |
| Primary actions | Create/update installation, confirm field details, trigger follow-up. |
| Important rules | Farmer Sale and Dealer Farmer Installations can drive Farmer Lead Device Installed state. Pilot Installation does not count as farmer sale. |

### Post Installation Follow-ups

| Item | Detail |
|---|---|
| Purpose | Track post-installation and technical follow-up work. |
| Used by | Admin, Management, R&D Head, Sales Head, RSM, Salesperson, Research Assistant, Agronomist, Viewer. |
| Primary actions | Complete follow-up, capture issue, create technical report where allowed. |
| Important rules | Technical report creation is Admin, Management, R&D Head, Agronomist, or Research Assistant. |

### Devices

| Item | Detail |
|---|---|
| Purpose | Manage stock, serial numbers, status, location, and device lifecycle. |
| Used by | Admin, Management, Sales Head, Accounts, Stock / Dispatch, Agronomist, R&D Head, Viewer. |
| Primary actions | Add/update device status, track warehouse/dealer/farmer/pilot/device return. |
| Important rules | Agronomist is view-only for Devices. Stock / Dispatch owns operational stock movement. |

Device pool:

- Fresh Sale Device: used for paid farmer-sale dispatches.
- Pilot Device: used for free pilot dispatches.
- Admin and Stock / Dispatch can set the device pool on device create/edit.

### KPI Dashboard

| Item | Detail |
|---|---|
| Purpose | KPI summary by role and scope. |
| Used by | All operational roles except HR & Legal. |
| Primary actions | Review KPIs; Admin/Management/Sales Head can refresh cached dashboard. |
| Important rules | Admin/Management/Sales Head use cached company dashboard. RSM uses live scoped KPIs. Research Assistant uses live user-specific KPI counts. |

### Marketing Requests

| Item | Detail |
|---|---|
| Purpose | Track marketing briefs, brief document links, requested/final deadlines, assignment, corrections, draft links, final OneDrive links, and delivery status. |
| Used by | Admin, Management, Sales Head, RSM, Salesperson, Agronomist, Research Assistant, R&D Head, Marketing Head, Designer. |
| Primary actions | Create request, review brief, assign owner, share draft/final links, add comments, mark delivered where allowed. |
| Important rules | Heavy design files stay outside the app. The in-app brief is required; the brief document link is optional. Admin, Management, and Marketing Head can accept the requested deadline or propose a revised working deadline. OneDrive link is optional until delivery. Accounts, Stock / Dispatch, HR & Legal, and Viewer do not create requests by default. |

### Regions

| Item | Detail |
|---|---|
| Purpose | Manage active regions, assigned RSM, state, and annual targets. |
| Used by | Admin, Management, Sales Head. |
| Primary actions | Create/update regions and RSM assignment. |
| Important rules | Region setup affects assignment, filtering, and scoped visibility. |

### Internal Users

| Item | Detail |
|---|---|
| Purpose | Manage user profile, role, secondary role, activation, and reporting structure. |
| Used by | Admin. |
| Primary actions | Create users, set role/secondary role, activate/deactivate, set manager/region. |
| Important rules | First-login password change is enforced through `must_change_password`. |

### Help / SOP

| Item | Detail |
|---|---|
| Purpose | In-app operating guidance. |
| Used by | All signed-in users. |
| Primary actions | Read role and workflow guidance. |
| Important rules | Help does not change records. |

### Change Password

| Item | Detail |
|---|---|
| Purpose | Change logged-in password and clear temporary-password requirement. |
| Used by | All signed-in users. |
| Primary actions | Enter new password and confirm password. |
| Important rules | Users with temporary password must change it before using other app areas. |

## 8. Status Quick Reference

### Farmer Lead Statuses

| Status | Meaning | Who acts next | Menu |
|---|---|---|---|
| Open | Lead is active | Salesperson / RSM | Farmer Leads |
| Won | Sale completed | Dispatch / Installation | Farmer Leads, Dispatches, Installations |
| Lost | Lead is lost | Sales Head / RSM review | Farmer Leads |
| Parked | Lead is paused | Sales Head / RSM review | Farmer Leads |

### Farmer Lead Funnel Stages

| Status | Meaning | Who acts next | Menu |
|---|---|---|---|
| Lead Captured | New lead entered | Salesperson / RSM | Farmer Leads |
| First Contact Done | Initial contact complete | Salesperson / RSM | Farmer Leads |
| Product Recommended | Product proposed | Salesperson / RSM | Farmer Leads |
| Quotation / Estimate Shared | Commercial details shared | Salesperson / RSM | Farmer Leads |
| Follow-up Active | Sales follow-up running | Salesperson / RSM | Farmer Leads |
| Payment Confirmed | Finance checkpoint complete | Dispatch team | Farmer Leads / Dispatches |
| Pilot Agreed | Farmer agreed to pilot | Agronomist / RA / R&D | Farmer Leads / Pilots |
| Pilot Active | Pilot is active | Agronomist / RA | Pilots |
| Pilot Completed - Sales Follow-up | Pilot done, sales follow-up needed | Salesperson / RSM | Farmer Leads |
| Device Dispatched | Device sent | Stock / Dispatch | Dispatches |
| Device Installed | Installation workflow completed | Installation / Follow-up owner | Installations / Follow-ups |
| 15-Day Follow-up Completed | Post-installation follow-up done | RSM / Sales Head | Follow-ups |
| Repeat / Referral Opportunity | Future sales opportunity | Salesperson / RSM | Farmer Leads |
| Won | Sale won | Dispatch / Installation | Farmer Leads |
| Lost | Lead lost | RSM / Sales Head | Farmer Leads |
| Parked | Lead paused | RSM / Sales Head | Farmer Leads |

### Dealer Statuses

| Status | Meaning | Who acts next | Menu |
|---|---|---|---|
| Prospect | Dealer is being evaluated | RSM / Sales Head | Dealers |
| Onboarding | Dealer setup in progress | RSM / Sales Head / HR & Legal | Dealers |
| Active | Dealer is operational | RSM | Dealers |
| Dormant | Dealer is inactive or stuck | RSM / Sales Head | Dealers |
| Dropped | Dealer opportunity stopped | Sales Head | Dealers |

### Pilot Statuses

| Status | Meaning | Who acts next | Menu |
|---|---|---|---|
| Planned | Pilot created but not active | Agronomist / R&D | Pilots |
| Approved | Pilot approved | Agronomist / RA | Pilots |
| Device Assigned | Device selected | Stock / Dispatch / Agronomist | Pilots / Devices |
| Device Dispatched | Device sent for pilot | Stock / Dispatch | Dispatches / Pilots |
| Device Installed | Pilot device installed | Agronomist / R&D / Admin | Pilots |
| Monitoring Active | Field monitoring is active | RA / Agronomist | My Visits / Pilots |
| Visit Report Pending | Report needed | Research Assistant | My Visits |
| Final Report Pending | Final review needed | R&D Head | Pilots |
| Final Report Submitted | Submitted for review | R&D Head | Pilots |
| Final Report Reviewed | R&D review done | R&D Head / Management | Pilots |
| Scale-up Recommended | Scale-up suggested | Sales Head / Management | Pilots / Institutions |
| Closed - Successful | Pilot closed positively | R&D / Management | Pilots |
| Closed - Failed | Pilot closed negatively | R&D | Pilots |
| Closed - Inconclusive | Pilot closed without clear result | R&D | Pilots |
| Parked | Pilot paused | Agronomist / R&D | Pilots |
| Cancelled | Pilot stopped | R&D / Admin | Pilots |

### Planned Visit Statuses

| Status | Meaning | Who acts next | Menu |
|---|---|---|---|
| Planned | Visit scheduled | Research Assistant | My Visits |
| Assigned | Visit assigned | Research Assistant | My Visits |
| Due | Visit is due | Research Assistant | My Visits |
| In Progress | Visit started, report pending | Research Assistant | My Visits |
| Completed | Visit/report complete | Agronomist / R&D | Pilots |
| Rescheduled | Visit date changed | Agronomist / RA | Pilots |
| Cancelled | Visit cancelled | Agronomist / R&D | Pilots |
| Unable to Complete | Visit could not be done | Agronomist / RA | My Visits / Pilots |

### Visit Report Statuses

| Status | Meaning | Who acts next | Menu |
|---|---|---|---|
| Draft | Report not final | Research Assistant | My Visits / Pilots |
| Submitted | Report submitted | Agronomist / R&D | Pilots |
| Reviewed | Review complete | R&D / Agronomist | Pilots |
| Revision Required | Needs correction | Research Assistant | Pilots / My Visits |
| Approved | Approved internally | R&D Head | Pilots |
| Archived | Historical record | Viewer / Admin | Pilots |

### Dispatch Statuses

| Status | Meaning | Who acts next | Menu |
|---|---|---|---|
| Dispatch Requested | Dispatch request created | Accounts / Dispatch | Dispatches |
| Pending Payment Confirmation | Payment check needed | Accounts | Dispatches |
| Pending Approval | Approval needed | Admin / Sales Head / Accounts | Dispatches |
| Approved for Dispatch | Ready to dispatch | Stock / Dispatch | Dispatches |
| Dispatched | Device sent | Stock / Dispatch | Dispatches |
| Delivered | Device delivered | Installation owner | Dispatches / Installations |
| Installation Pending | Installation not done yet | RSM / Installation owner | Installations |
| Installed | Installation done | Follow-up owner | Installations / Follow-ups |
| On Hold | Blocked | Responsible owner | Dispatches |
| Cancelled | Dispatch stopped | Admin / Dispatch | Dispatches |

### Installation Statuses

| Status | Meaning | Who acts next | Menu |
|---|---|---|---|
| Planned | Installation planned | RSM / Stock / Dispatch | Installations |
| Installed | Installation completed | Follow-up owner | Installations |
| Verified | Installation verified | Admin / RSM | Installations |
| Follow-up Pending | Follow-up needed | Follow-up owner | Follow-ups |
| Issue Reported | Problem found | Agronomist / RSM / Dispatch | Installations |
| Closed | Installation workflow closed | Admin / RSM | Installations |
| Cancelled | Installation stopped | Admin / RSM | Installations |

### Post-installation Follow-up Statuses

| Status | Meaning | Who acts next | Menu |
|---|---|---|---|
| Due | Follow-up due | Assigned owner | Follow-ups |
| Completed | Follow-up done | RSM / Sales Head | Follow-ups |
| Missed | Follow-up missed | Owner / RSM | Follow-ups |
| Rescheduled | Follow-up date changed | Owner | Follow-ups |
| Cancelled | Follow-up cancelled | Admin / Owner | Follow-ups |
| Escalated | Needs higher attention | RSM / Sales Head / Agronomist | Follow-ups |

### Device Statuses

| Status | Meaning | Who acts next | Menu |
|---|---|---|---|
| In Warehouse | Available stock | Stock / Dispatch | Devices |
| Reserved | Held for workflow | Stock / Dispatch | Devices |
| Dispatch Approved | Ready for dispatch | Stock / Dispatch | Devices / Dispatches |
| Dispatched | Sent out | Stock / Dispatch | Dispatches |
| With Dealer | Dealer holds stock | RSM / Dealer owner | Dealers / Devices |
| With Farmer | Farmer has device | Installation/follow-up owner | Devices |
| Installed at Farmer Site | Farmer installation complete | Follow-up owner | Installations / Follow-ups |
| Installed for Pilot | Pilot device installed | Agronomist / R&D | Pilots |
| Returned | Device returned | Stock / Dispatch | Devices |
| Replacement | Replacement device | Stock / Dispatch | Devices |
| Reinstalled | Reinstalled device | Installation owner | Installations |
| Damaged | Damaged stock | Stock / Dispatch / Admin | Devices |
| Hold | Temporarily blocked | Stock / Dispatch | Devices |
| Lost | Lost device | Admin / Stock | Devices |
| Retired | Retired device | Admin / Stock | Devices |

## 9. Role-Specific Important Rules

| Rule | Confirmed source |
|---|---|
| Sales Head can create Dealer profiles. | `canCreateDealer` includes Admin, Sales Head, RSM. |
| Dealer statuses are Prospect, Onboarding, Active, Dormant, Dropped. | Dealer options. |
| Dealer sales performance counts dealer-linked Dealer Farmer Installations only. | Dealer performance logic and project status notes. |
| Research Assistant Farmer Lead selection for Pilot creation is assigned region/state scoped. | Pilot Farmer Lead option logic and RLS migration note. |
| Research Assistant can see eligible Farmer Leads in assigned geography for Pilot creation. | Pilot Farmer Lead option logic. |
| Research Assistant cannot mark Pilot Device Installed. | Pilot form/action authority excludes RA. |
| Admin, R&D Head, and Agronomist can mark Pilot Device Installed. | Pilot form/action authority. |
| Visit Report Notes replace the previous eight narrative fields. | Visit report form/data mapping. |
| Evidence Uploads includes Report photos and Report data sheet. | Visit report form. |
| Approved for External Sharing is hidden from Research Assistant. | Visit report form. |
| Only Admin, Management, and R&D Head can set/change approved_for_partner_sharing. | Pilot actions server-side guard. |
| RSM KPI Dashboard uses live scoped KPIs. | KPI Dashboard page. |
| Research Assistant KPI Dashboard uses live user-specific KPI counts. | KPI Dashboard page. |
| Admin/Management/Sales Head KPI Dashboard uses cached company dashboard. | KPI Dashboard page/cache RPC path. |

## 10. Items To Confirm With Harsha

| Item | Why it needs confirmation |
|---|---|
| Management write access in Pilots | Code permits Management in Pilot write roles, but day-to-day ownership appears R&D/Agronomist-led. |
| Salesperson KPI Dashboard content | Salesperson can view KPI Dashboard, but current visible KPI sections may be limited compared with RSM/RA. |
| HR & Legal Home access | Code does not include HR & Legal in Home/Dashboard view roles; they still get Help and Change Password. |
| Viewer My Visits usefulness | Viewer can see Pilot module and My Visits menu because My Visits uses Pilot access, but it remains read-only. |
