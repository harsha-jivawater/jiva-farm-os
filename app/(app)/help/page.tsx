import { PageHeader } from "@/components/page-header";

const helpSections = [
  {
    title: "Getting Started",
    items: [
      "Login using your @jivawater.com email.",
      "Use the temporary password given by Admin.",
      "Change your password after first login.",
      "Use only your own account.",
      "Contact Admin if you cannot access a module."
    ]
  },
  {
    title: "Roles and Responsibilities",
    items: [
      "Admin: full system access, user and region setup, and override permissions.",
      "Management / Sales Head: overall visibility, KPIs, sales review, and operations review.",
      "RSM: manage regional sales activity, leads, dealers, installations, and team progress.",
      "Salesperson: create and update farmer leads, follow-ups, and sales progress.",
      "Agronomist: manage pilots and Research Assistant work.",
      "Research Assistant: support field pilots, visits, reports, and follow-ups.",
      "R&D Head: review pilots, approve final pilot reports, and oversee institutional/R&D work.",
      "Accounts: view relevant business, payment, and accounting records.",
      "Customer Service Team: manage dispatch, device, installation, and customer support workflow.",
      "System note: the database role may be Stock / Dispatch, but the app should show Customer Service Team where this role is user-facing."
    ]
  },
  {
    title: "Recommended Daily Workflow",
    items: [
      "Check Home dashboard.",
      "Review pending leads and follow-ups.",
      "Update records immediately after calls or field visits.",
      "Keep status fields accurate.",
      "Avoid duplicate entries.",
      "Use notes fields for context."
    ]
  },
  {
    title: "Farmer Leads SOP",
    items: [
      "Create a lead when a farmer enquiry or field opportunity is identified.",
      "Fill farmer name, phone, state or region, crop, and lead source.",
      "Move funnel stage as progress happens.",
      "Use follow-ups for every call or visit.",
      "Mark payment confirmed only when verified.",
      "Mark installation completed only after installation is actually done."
    ]
  },
  {
    title: "Dealers SOP",
    items: [
      "Create dealer profile with region and contact details.",
      "Track active, dormant, and trained status.",
      "Keep dealer stock and dealer-linked installations accurate.",
      "Avoid duplicate dealer names."
    ]
  },
  {
    title: "Devices SOP",
    items: [
      "Add device only when serial and device details are known.",
      "Keep device status current.",
      "Do not reuse serial numbers.",
      "Warehouse stock means available stock.",
      "Dispatched means sent out.",
      "Installed Farmer / Installed Pilot means deployed in field.",
      "Damaged / Hold should be used only for blocked devices."
    ]
  },
  {
    title: "Dispatches SOP",
    items: [
      "Create dispatch when device is sent to farmer, dealer, pilot, or location.",
      "Select correct device and destination.",
      "Update dispatch status when shipped or delivered.",
      "Dispatch should be created before installation when possible."
    ]
  },
  {
    title: "Installations SOP",
    items: [
      "Create installation after device is installed.",
      "Link to correct lead, dispatch, and device.",
      "Fill installation date, product/device, and location details.",
      "Do not mark as installed until field installation is complete."
    ]
  },
  {
    title: "Post Installation Follow-ups SOP",
    items: [
      "Record 15-day and later follow-ups.",
      "Capture farmer feedback, crop/device performance, and issues.",
      "Escalate problems to Customer Service Team or Agronomist where needed.",
      "Keep follow-up status updated."
    ]
  },
  {
    title: "Pilots SOP",
    items: [
      "Create pilots for structured trials only.",
      "Link farmer, institution, and device where applicable.",
      "Record objective, crop, comparison type, and responsible team.",
      "Add pilot visits.",
      "Submit visit reports.",
      "R&D Head approves final pilot reports."
    ]
  },
  {
    title: "Institutional Partners SOP",
    items: [
      "Create institutional partner record.",
      "Add contacts and meetings.",
      "Track proposal shared, pilot started, scale-up opportunity, and parked/lost status.",
      "Keep meeting notes clear."
    ]
  },
  {
    title: "KPI Dashboard SOP",
    items: [
      "KPI Dashboard is for review, not data entry.",
      "Numbers depend on accurate module data.",
      "Use filters by date, region, RSM, product, and crop.",
      "If KPI looks wrong, first check whether underlying records are updated."
    ]
  },
  {
    title: "Password and Account Help",
    items: [
      "Use Change Password after first login.",
      "Use Forgot Password on login page if needed.",
      "Contact Admin if email does not arrive.",
      "Password should not be shared."
    ]
  },
  {
    title: "Data Quality Rules",
    items: [
      "Do not create duplicate farmers, dealers, or devices.",
      "Use correct region.",
      "Keep statuses updated.",
      "Add notes after calls and visits.",
      "Do not delete data unless Admin approves.",
      "Use real dates.",
      "Use official @jivawater.com accounts only."
    ]
  },
  {
    title: "What Not To Touch",
    items: [
      "Do not change Supabase settings.",
      "Do not change Vercel settings.",
      "Do not share passwords.",
      "Do not use another user's account.",
      "Do not edit production database directly unless Admin approves."
    ]
  },
  {
    title: "Support / Escalation",
    items: [
      "For login or access issue: contact Admin.",
      "For device, dispatch, or installation issue: contact Customer Service Team.",
      "For pilot or R&D issue: contact Agronomist or R&D Head.",
      "For sales or lead issue: contact RSM or Sales Head."
    ]
  }
] as const;

export default function HelpPage() {
  return (
    <section>
      <PageHeader
        eyebrow="Help"
        title="Help and SOP"
        description="This Help section explains how the Jiva Water team should use Jiva Farm OS in daily operations."
      />

      <div className="mb-6 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-6 text-brand-900">
        This is an internal operating guide. When in doubt, update the record
        immediately and add clear notes.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {helpSections.map((section) => (
          <article
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            key={section.title}
          >
            <h2 className="text-base font-semibold text-slate-950">
              {section.title}
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {section.items.map((item) => (
                <li className="flex gap-2" key={item}>
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
