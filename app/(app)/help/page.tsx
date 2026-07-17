import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { getEffectiveRoles, type UserRole } from "@/lib/users/permissions";

type RoleSopSection = {
  role: UserRole;
  title: string;
  purpose: string;
  dailyChecklist: readonly string[];
  mainPages: readonly string[];
  handoffs: readonly string[];
  avoid: readonly string[];
  escalation: string;
};

type ChecklistItem = {
  label: string;
  status: "ready" | "action" | "review";
  helper: string;
};

const rolesRequiringRegionOrState: readonly UserRole[] = [
  "Sales Head",
  "RSM",
  "Salesperson",
  "Research Assistant"
];

const firstActionsByRole: Record<UserRole, readonly string[]> = {
  Admin: [
    "Review Internal Users.",
    "Check Data Quality.",
    "Check System Health.",
    "Confirm regions and roles are assigned correctly."
  ],
  Management: [
    "Review KPI Dashboard.",
    "Check Data Quality and System Health.",
    "Review My Work for operational bottlenecks."
  ],
  "Sales Head": [
    "Check My Work.",
    "Review Farmer Leads ready for dispatch.",
    "Review Dealers and Institutional Partners needing action.",
    "Ensure Sales team users have correct region/state assignments."
  ],
  RSM: [
    "Check My Work.",
    "Review assigned farmer leads.",
    "Follow up overdue leads.",
    "Support Salespersons in assigned region/state."
  ],
  Salesperson: [
    "Check My Work.",
    "Add or update Farmer Leads.",
    "Record follow-ups.",
    "Confirm payment only when proof/process is complete if your role supports it."
  ],
  "R&D Head": [
    "Check Pilots and My Work.",
    "Review pilots needing device installation or monitoring.",
    "Review reports needing approval or review."
  ],
  Agronomist: [
    "Check Pilots and My Work.",
    "Plan and monitor pilot activity.",
    "Review field observations and reports."
  ],
  "Research Assistant": [
    "Check My Visits.",
    "Submit Visit Reports.",
    "Check assigned pilot work.",
    "Do not mark Pilot Device Installed."
  ],
  "Stock / Dispatch": [
    "Check My Work.",
    "Create dispatches from paid farmer leads or active pilots only.",
    "Use the correct device pool.",
    "Mark dispatch only when a serial-numbered device is assigned."
  ],
  Accounts: [
    "Check payment and dispatch-readiness workflows where visible.",
    "Support paid farmer sale handoff.",
    "Do not change field trial data unless explicitly responsible."
  ],
  "Marketing Head": [
    "Open Marketing Requests.",
    "Review new requests.",
    "Accept or revise deadlines.",
    "Assign Designer.",
    "Upload or review Marketing Library material."
  ],
  Designer: [
    "Open Marketing Requests.",
    "Check assigned work.",
    "Add draft/final links and progress updates.",
    "Upload or review Marketing Library material."
  ],
  "HR & Legal": [
    "Review relevant Dealer or Institutional Partner records where visible.",
    "Keep access/profile corrections routed through Admin."
  ],
  Viewer: [
    "Use dashboards and permitted pages for read-only visibility.",
    "Use Marketing Library for approved customer and internal material.",
    "Do not expect edit buttons."
  ]
};

const roleSopSections: readonly RoleSopSection[] = [
  {
    role: "Admin",
    title: "Admin",
    purpose: "Keep users, regions, access, data hygiene, and operational recovery under control.",
    dailyChecklist: [
      "Check My Work, KPI Dashboard, Data Quality, and System Health.",
      "Review user, role, region, and access requests.",
      "Restore deleted Dealers, Institutional Partners, or Pilots only after business confirmation.",
      "Use Help / SOP to train users before changing access."
    ],
    mainPages: [
      "My Work",
      "KPI Dashboard",
      "Data Quality",
      "System Health",
      "Regions",
      "Internal Users"
    ],
    handoffs: [
      "User setup and role corrections.",
      "Region/RSM setup before sales routing.",
      "Deleted-record review and restore where needed."
    ],
    avoid: [
      "Do not bypass normal workflows unless correcting an admin issue.",
      "Do not edit production data directly outside the app.",
      "Do not use Admin as a routine field-data entry role."
    ],
    escalation: "Escalate business-rule decisions to Management or Harsha."
  },
  {
    role: "Management",
    title: "Management",
    purpose: "Review company progress, bottlenecks, data quality, and KPI health.",
    dailyChecklist: [
      "Open My Work and KPI Dashboard for company-level review.",
      "Check My Work for leadership actions.",
      "Review Data Quality and System Health for risks.",
      "Open source records before asking the team to correct them."
    ],
    mainPages: [
      "My Work",
      "My Work",
      "KPI Dashboard",
      "Data Quality",
      "System Health"
    ],
    handoffs: [
      "Sales issues to Sales Head or RSM.",
      "Pilot/report issues to R&D Head or Agronomist.",
      "Access/data setup issues to Admin."
    ],
    avoid: [
      "Do not use KPI cards as the source of truth for edits.",
      "Do not change source records unless the page explicitly allows it.",
      "Do not treat Data Quality warnings as automatic blockers."
    ],
    escalation: "Escalate unresolved operational risk to the responsible department head."
  },
  {
    role: "Sales Head",
    title: "Sales Head",
    purpose: "Lead sales pipeline, dealer progress, institutional opportunities, and sales KPI review.",
    dailyChecklist: [
      "Check My Work and KPI Dashboard.",
      "Review Farmer Leads, Dealers, and Institutional Partners.",
      "Make sure paid leads are ready for dispatch handoff.",
      "Keep dealer/institution next actions current."
    ],
    mainPages: [
      "My Work",
      "Farmer Leads",
      "Dealers",
      "Institutional Partners",
      "KPI Dashboard"
    ],
    handoffs: [
      "Paid Farmer Leads to Stock / Dispatch for farmer sale dispatch.",
      "Dealer legal documents to HR & Legal.",
      "Institution pilot opportunities to R&D/Agronomy."
    ],
    avoid: [
      "Do not manually create farmer sale dispatches outside the approved path.",
      "Do not mark workflow-derived milestones manually.",
      "Do not soft-delete records without a clear reason."
    ],
    escalation: "Escalate payment blockers to Accounts and setup/access issues to Admin."
  },
  {
    role: "RSM",
    title: "RSM",
    purpose: "Own regional sales execution, dealer progress, installations, and follow-ups.",
    dailyChecklist: [
      "Check My Work first.",
      "Update Farmer Leads and follow-ups after calls or visits.",
      "Review Dealer review dates and institution opportunities.",
      "Track dispatch and installation movement for your region."
    ],
    mainPages: [
      "My Work",
      "Farmer Leads",
      "Dealers",
      "Institutional Partners",
      "Installations",
      "Post Installation Follow-ups"
    ],
    handoffs: [
      "Payment verification to Accounts.",
      "Ready dispatches to Stock / Dispatch.",
      "Technical or crop issues to Agronomist."
    ],
    avoid: [
      "Do not create duplicate leads or dealers.",
      "Do not mark payment confirmed unless your role is allowed and proof is verified.",
      "Do not use manual dispatch paths for normal farmer sales."
    ],
    escalation: "Escalate region/routing issues to Sales Head or Admin."
  },
  {
    role: "Salesperson",
    title: "Salesperson",
    purpose: "Capture farmer opportunities, keep follow-ups current, and move sales records forward.",
    dailyChecklist: [
      "Check My Work.",
      "Add or update Farmer Leads immediately after field activity.",
      "Record every follow-up with the next follow-up date.",
      "Confirm payment only when the app and your role allow it and proof is available."
    ],
    mainPages: [
      "My Work",
      "Farmer Leads",
      "Installations",
      "Post Installation Follow-ups"
    ],
    handoffs: [
      "Payment proof to Accounts.",
      "Won/paid lead readiness to RSM or Sales Head.",
      "Field installation issues to RSM or Agronomist."
    ],
    avoid: [
      "Do not create dispatches manually.",
      "Do not change device or stock records.",
      "Do not duplicate farmer leads for the same farmer/phone."
    ],
    escalation: "Escalate pricing, payment, or region questions to RSM or Sales Head."
  },
  {
    role: "R&D Head",
    title: "R&D Head",
    purpose: "Oversee pilots, monitoring quality, visit reports, and final pilot decisions.",
    dailyChecklist: [
      "Check My Work for reports or pilot review items.",
      "Review active Pilots and overdue Monitoring Plan items.",
      "Review Visit Reports and final pilot outcomes.",
      "Coordinate with Agronomist and Research Assistants on missing evidence."
    ],
    mainPages: [
      "My Work",
      "Pilots",
      "My Visits",
      "KPI Dashboard"
    ],
    handoffs: [
      "Assigned visits to Research Assistants.",
      "Technical review to Agronomist.",
      "Scale-up/sales follow-up context to Sales Head."
    ],
    avoid: [
      "Do not use sales statuses to record pilot result decisions.",
      "Do not mark field evidence as complete without reports.",
      "Do not remove pilot records unless soft-delete is business-approved."
    ],
    escalation: "Escalate pilot workflow or access issues to Admin."
  },
  {
    role: "Agronomist",
    title: "Agronomist",
    purpose: "Guide agronomy work, pilots, installations, technical follow-ups, and field reporting quality.",
    dailyChecklist: [
      "Check My Work and Pilots.",
      "Review planned visits, visit reports, and technical observations.",
      "Support installation and post-installation technical issues.",
      "Guide Research Assistants on parameters and field evidence."
    ],
    mainPages: [
      "My Work",
      "Pilots",
      "My Visits",
      "Installations",
      "Post Installation Follow-ups"
    ],
    handoffs: [
      "Assigned visit execution to Research Assistants.",
      "Final pilot review to R&D Head.",
      "Sales-related farmer follow-up to RSM/Sales Head."
    ],
    avoid: [
      "Do not edit Devices; Agronomist access is view-only there.",
      "Do not confirm payments.",
      "Do not change sales ownership or finance fields."
    ],
    escalation: "Escalate device movement to Stock / Dispatch and pilot decisions to R&D Head."
  },
  {
    role: "Research Assistant",
    title: "Research Assistant",
    purpose: "Complete assigned field visits and submit accurate Visit Reports with observations.",
    dailyChecklist: [
      "Check My Visits and My Work.",
      "Start or continue assigned visits from My Visits.",
      "Submit Visit Report after the field visit.",
      "Add parameter observations, notes, photos, and data sheets where available."
    ],
    mainPages: [
      "My Visits",
      "My Work",
      "Pilots",
      "Post Installation Follow-ups"
    ],
    handoffs: [
      "Completed Visit Reports to Agronomist/R&D Head.",
      "Field blockers to Agronomist.",
      "Device or dispatch issues to Stock / Dispatch through the team."
    ],
    avoid: [
      "Do not mark Pilot Device Installed.",
      "Do not approve partner sharing.",
      "Do not change sales/payment/dispatch decisions."
    ],
    escalation: "Escalate missed visits, field blockers, or missing context to Agronomist."
  },
  {
    role: "Stock / Dispatch",
    title: "Stock / Dispatch",
    purpose: "Manage devices, dispatch movement, installation handoff, and stock accuracy.",
    dailyChecklist: [
      "Check My Work and Dispatches.",
      "Create farmer sale dispatches only from paid Farmer Leads.",
      "Create pilot dispatches only from active Pilots.",
      "Assign serial-numbered devices before marking dispatch progress."
    ],
    mainPages: [
      "My Work",
      "Devices",
      "Dispatches",
      "Installations"
    ],
    handoffs: [
      "Payment readiness from Accounts/Sales.",
      "Delivered dispatches to installation workflow.",
      "Device issues to Admin or responsible operations owner."
    ],
    avoid: [
      "Do not use Fresh Sale stock for pilot dispatch.",
      "Do not use Pilot Stock for paid farmer sale dispatch.",
      "Do not mark dispatched before the device is actually assigned/sent."
    ],
    escalation: "Escalate destination/payment blockers to RSM, Sales Head, or Accounts."
  },
  {
    role: "Accounts",
    title: "Accounts",
    purpose: "Verify payment context and support dispatch readiness without changing sales ownership.",
    dailyChecklist: [
      "Check My Work for payment or dispatch-readiness items.",
      "Review relevant Farmer Leads and Dispatches.",
      "Confirm payment only when proof is verified.",
      "Coordinate payment holds with Sales Head/RSM."
    ],
    mainPages: [
      "My Work",
      "Farmer Leads",
      "Dispatches",
      "Devices",
      "KPI Dashboard"
    ],
    handoffs: [
      "Payment-confirmed leads to Stock / Dispatch.",
      "Commercial questions to Sales Head/RSM.",
      "Correction requests to Admin."
    ],
    avoid: [
      "Do not change farmer follow-up or sales ownership data.",
      "Do not mark installations or pilot statuses.",
      "Do not create marketing or legal workflow records."
    ],
    escalation: "Escalate unclear payment proof to Sales Head/RSM."
  },
  {
    role: "Marketing Head",
    title: "Marketing Head",
    purpose: "Review, assign, control deadlines, and deliver Marketing Requests.",
    dailyChecklist: [
      "Open Marketing Requests and My Work.",
      "Review new requests and brief document links.",
      "Accept the requested deadline or propose a revised working deadline.",
      "Assign Designer and review draft/final OneDrive links."
    ],
    mainPages: [
      "Marketing Requests",
      "My Work"
    ],
    handoffs: [
      "Assigned design work to Designer.",
      "Clarification requests back to requester.",
      "Final OneDrive link back to requester/team."
    ],
    avoid: [
      "Do not store heavy design files in the app.",
      "Do not leave requests unassigned once accepted.",
      "Do not mark delivered before the final link is ready."
    ],
    escalation: "Escalate unclear priorities to Management or the requester."
  },
  {
    role: "Designer",
    title: "Designer",
    purpose: "Work assigned Marketing Requests and keep draft/final links and progress comments updated.",
    dailyChecklist: [
      "Check Marketing Requests and My Work.",
      "Work only on own or assigned requests.",
      "Add draft links, final links, and progress comments.",
      "Respond to corrections requested by Marketing Head/requester."
    ],
    mainPages: [
      "Marketing Requests",
      "My Work"
    ],
    handoffs: [
      "Draft links to Marketing Head/requester for review.",
      "Final OneDrive links to Marketing Head for delivery.",
      "Clarification needs back through comments."
    ],
    avoid: [
      "Do not accept or revise deadlines.",
      "Do not cancel requests unless your role also allows it.",
      "Do not upload heavy design files into the app."
    ],
    escalation: "Escalate priority conflicts or unclear briefs to Marketing Head."
  },
  {
    role: "HR & Legal",
    title: "HR & Legal",
    purpose: "Review and update legal approval checkpoints for Dealers and Institutional Partners.",
    dailyChecklist: [
      "Check My Work when legal review is needed.",
      "Open Dealer or Institutional Partner records assigned for legal review.",
      "Review agreement/MOU context and update legal approval fields.",
      "Add clear comments when revisions are needed."
    ],
    mainPages: [
      "My Work",
      "Dealers",
      "Institutional Partners",
      "Help / SOP"
    ],
    handoffs: [
      "Approved legal checkpoints back to Sales Head/RSM.",
      "Revision requests back to the business owner.",
      "Access issues to Admin."
    ],
    avoid: [
      "Do not edit sales performance or field workflow data.",
      "Do not create Marketing Requests by default.",
      "Do not change dealer/institution ownership unless separately authorized."
    ],
    escalation: "Escalate missing document context to Sales Head/RSM or Admin."
  },
  {
    role: "Viewer",
    title: "Viewer",
    purpose: "Read permitted operational information without changing records.",
    dailyChecklist: [
      "Open permitted modules to review status.",
      "Use Help / SOP to understand workflow meaning.",
      "Ask the responsible role to update records.",
      "Keep account password secure."
    ],
    mainPages: [
      "My Work",
      "My Work",
      "Permitted operational modules",
      "Help / SOP"
    ],
    handoffs: [
      "Questions to module owner.",
      "Access issues to Admin.",
      "Workflow concerns to Management."
    ],
    avoid: [
      "Do not expect create/edit buttons.",
      "Do not ask for Viewer to be used as a data-entry role.",
      "Do not share screenshots containing sensitive data outside approved channels."
    ],
    escalation: "Escalate record corrections to the responsible module owner."
  }
] as const;

function slugForRole(role: string) {
  return `role-${role.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function accountReadinessItems(
  currentUser: Awaited<ReturnType<typeof getCurrentInternalUser>>,
  effectiveRoles: UserRole[]
): ChecklistItem[] {
  const needsRegionOrState = effectiveRoles.some((role) =>
    rolesRequiringRegionOrState.includes(role)
  );
  const hasRegionOrState = Boolean(currentUser.region_id || currentUser.state);

  return [
    {
      label: "Name present",
      status: currentUser.full_name ? "ready" : "action",
      helper: currentUser.full_name
        ? "Your profile name is set."
        : "Ask Admin to update your profile."
    },
    {
      label: "Role present",
      status: currentUser.role ? "ready" : "action",
      helper: currentUser.role
        ? `Your role is ${currentUser.role}.`
        : "Ask Admin to update your profile."
    },
    {
      label: "Region/state present",
      status: !needsRegionOrState || hasRegionOrState ? "ready" : "action",
      helper: needsRegionOrState
        ? hasRegionOrState
          ? "Your field routing profile has region/state context."
          : "Ask Admin to update your profile."
        : "Not required for your current role."
    },
    {
      label: "Password ready",
      status: currentUser.must_change_password ? "action" : "ready",
      helper: currentUser.must_change_password
        ? "Change your temporary password before using the app."
        : "Your password is ready."
    },
    {
      label: "Read your role SOP",
      status: "review",
      helper: "Open your role section below and review the daily checklist."
    },
    {
      label: "Open My Work",
      status: "review",
      helper: "Use it as your live action list when your role has pending items."
    },
    {
      label: "Know escalation path",
      status: "review",
      helper: "For access or profile corrections, contact Admin."
    }
  ];
}

export default async function HelpPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/help");
  const effectiveRoles = getEffectiveRoles(currentUser);
  const orderedSections = [
    ...roleSopSections.filter((section) => effectiveRoles.includes(section.role)),
    ...roleSopSections.filter((section) => !effectiveRoles.includes(section.role))
  ];

  return (
    <section>
      <PageHeader
        eyebrow="Support"
        title="Help / SOP"
        description="Role-wise operating guide for Jiva Farm OS."
      />

      <div className="mb-6 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-6 text-brand-900">
        Start with your role section, then open the relevant source page to update
        records. This guide explains what to do and what to avoid; it does not
        change your permissions.
      </div>

      <section
        className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        id="getting-started"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-700">
              Getting Started
            </p>
            <h2 className="text-xl font-semibold text-slate-950">
              Account readiness and first steps
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Use this checklist to confirm your profile is ready and know what
              to open first.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href="/my-pending-work"
          >
            Open My Work
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Account readiness
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {accountReadinessItems(currentUser, effectiveRoles).map((item) => (
                <ChecklistStatusCard item={item} key={item.label} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              First actions for your role
            </h3>
            <div className="mt-3 space-y-3">
              {effectiveRoles.map((role) => (
                <div
                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                  key={role}
                >
                  <p className="text-sm font-semibold text-slate-950">{role}</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                    {firstActionsByRole[role].map((action) => (
                      <li className="flex gap-2" key={action}>
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
                        />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="Role SOP quick links"
        className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <p className="text-sm font-semibold text-slate-950">Jump to role</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {orderedSections.map((section) => {
            const isCurrentRole = effectiveRoles.includes(section.role);

            return (
              <Link
                className={[
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                  isCurrentRole
                    ? "border-brand-200 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                ].join(" ")}
                href={`#${slugForRole(section.role)}`}
                key={section.role}
              >
                {section.title}
                {isCurrentRole ? " · Your role" : ""}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="space-y-4">
        {orderedSections.map((section) => {
          const isCurrentRole = effectiveRoles.includes(section.role);

          return (
            <details
              className={[
                "group rounded-lg border bg-white p-4 shadow-sm",
                isCurrentRole ? "border-brand-200" : "border-slate-200"
              ].join(" ")}
              id={slugForRole(section.role)}
              key={section.role}
              open={isCurrentRole}
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-950">
                      {section.title}
                    </h2>
                    {isCurrentRole ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                        Your role
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {section.purpose}
                  </p>
                </div>
                <span className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 group-open:hidden">
                  Open
                </span>
                <span className="hidden shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 group-open:inline">
                  Close
                </span>
              </summary>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <SopList title="Daily checklist" items={section.dailyChecklist} />
                <SopList title="Main pages to use" items={section.mainPages} />
                <SopList title="Key handoffs owned" items={section.handoffs} />
                <SopList title="What not to do" items={section.avoid} />
              </div>

              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                <span className="font-semibold text-slate-950">Escalation:</span>{" "}
                {section.escalation}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function SopList({
  title,
  items
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span
              aria-hidden="true"
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChecklistStatusCard({ item }: { item: ChecklistItem }) {
  const statusStyles = {
    ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
    action: "border-amber-200 bg-amber-50 text-amber-700",
    review: "border-slate-200 bg-slate-50 text-slate-700"
  } satisfies Record<ChecklistItem["status"], string>;
  const statusLabel = {
    ready: "Ready",
    action: "Action needed",
    review: "Review"
  } satisfies Record<ChecklistItem["status"], string>;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-950">{item.label}</p>
        <span
          className={[
            "rounded-full border px-2 py-0.5 text-xs font-semibold",
            statusStyles[item.status]
          ].join(" ")}
        >
          {statusLabel[item.status]}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.helper}</p>
    </div>
  );
}
