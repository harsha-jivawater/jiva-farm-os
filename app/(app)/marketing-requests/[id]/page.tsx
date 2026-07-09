import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowUpRight, Pencil } from "lucide-react";
import {
  addMarketingRequestUpdateAction,
  updateMarketingWorkflowAction
} from "@/app/(app)/marketing-requests/actions";
import {
  MarketingStatusPill,
  PriorityPill
} from "@/components/marketing-requests/marketing-status-pill";
import { PageHeader } from "@/components/page-header";
import { loadMarketingRequestFormOptions } from "@/lib/marketing-requests/load-options";
import {
  labelFor,
  marketingDeadlineStatusOptions,
  marketingRequestStatusOptions,
  marketingRequestUpdateTypeOptions
} from "@/lib/marketing-requests/options";
import {
  canCommentOnMarketingRequest,
  canEditMarketingRequestBrief,
  canUpdateMarketingWorkflow,
  canViewMarketingRequest
} from "@/lib/marketing-requests/permissions";
import {
  display,
  formatDate,
  formatDateTime,
  type MarketingRequest,
  type MarketingRequestHistory,
  type RelatedOption,
  type UserOption
} from "@/lib/marketing-requests/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canManageMarketingRequests,
  hasRole
} from "@/lib/users/permissions";

type MarketingRequestDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    comment_saved?: string;
    error?: string;
    saved?: string;
  }>;
};

function SectionPanel({
  children,
  description,
  title
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="break-words text-sm font-semibold leading-6 text-slate-950 sm:max-w-[65%] sm:text-right">
        {value}
      </div>
    </div>
  );
}

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function userLabel(
  userMap: Map<string, UserOption>,
  userId: string | null | undefined
) {
  if (!userId) {
    return "Not assigned";
  }

  const user = userMap.get(userId);
  return user?.email ? `${user.full_name} (${user.email})` : display(user?.full_name);
}

function relatedLabel(
  options: RelatedOption[],
  id: string | null | undefined
) {
  if (!id) {
    return "Not linked";
  }

  const option = options.find((item) => item.id === id);
  return option?.detail ? `${option.label} - ${option.detail}` : option?.label ?? id;
}

function currentAction(request: MarketingRequest) {
  const today = new Date().toISOString().slice(0, 10);
  const open = !["Delivered", "Cancelled"].includes(request.marketing_status);
  const deadline = finalWorkingDeadline(request);

  if (request.marketing_status === "Delivered") {
    return {
      helper: "Final OneDrive link delivered.",
      label: "Delivered",
      tone: "success"
    } as const;
  }

  if (request.marketing_status === "Needs Clarification") {
    return {
      helper: "Requester should answer the clarification in comments or edit the brief.",
      label: "Needs clarification",
      tone: "warning"
    } as const;
  }

  if (open && deadline < today) {
    return {
      helper: "Deadline has passed. Marketing owner should update status or delivery link.",
      label: "Overdue",
      tone: "danger"
    } as const;
  }

  if (request.marketing_status === "Draft Shared") {
    return {
      helper: "Requester should review the draft and add corrections if needed.",
      label: "Draft review",
      tone: "neutral"
    } as const;
  }

  if (request.assigned_to_user_id) {
    return {
      helper: "Assigned owner should progress the request and share draft or final links.",
      label: "Work in progress",
      tone: "neutral"
    } as const;
  }

  return {
    helper: "Marketing Head should review and assign this request.",
    label: "Marketing review",
    tone: "warning"
  } as const;
}

function finalWorkingDeadline(request: MarketingRequest) {
  if (
    request.deadline_status === "Revised" &&
    request.revised_deadline_date
  ) {
    return request.revised_deadline_date;
  }

  if (
    request.deadline_status === "Accepted" &&
    request.accepted_deadline_date
  ) {
    return request.accepted_deadline_date;
  }

  return request.deadline_date;
}

function LinkValue({
  href,
  label
}: {
  href: string | null | undefined;
  label: string;
}) {
  if (!href) {
    return <span>{display(null)}</span>;
  }

  return (
    <a
      className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {label}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

export default async function MarketingRequestDetailPage({
  params,
  searchParams
}: MarketingRequestDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(
    supabase,
    "/marketing-requests"
  );

  const [{ data, error }, { data: updatesData }, options] = await Promise.all([
    supabase
      .from("marketing_requests")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("marketing_request_updates")
      .select("*")
      .eq("marketing_request_id", id)
      .order("created_at", { ascending: false }),
    loadMarketingRequestFormOptions(supabase)
  ]);

  if (error || !data) {
    notFound();
  }

  const request = data as MarketingRequest;

  if (!canViewMarketingRequest(currentUser, request)) {
    notFound();
  }

  const updates = (updatesData ?? []) as MarketingRequestHistory[];
  const userMap = new Map(options.users.map((user) => [user.id, user]));
  const regionMap = new Map(
    options.regions.map((region) => [region.id, region.region_name])
  );
  const action = currentAction(request);
  const workingDeadline = finalWorkingDeadline(request);
  const canManage = canManageMarketingRequests(currentUser);
  const canWorkflow = canUpdateMarketingWorkflow(currentUser, request);
  const canEditBrief = canEditMarketingRequestBrief(currentUser, request);
  const canComment = canCommentOnMarketingRequest(currentUser, request);
  const marketingUsers = options.users.filter(
    (user) =>
      user.role === "Marketing Head" ||
      user.role === "Designer" ||
      user.secondary_role === "Marketing Head" ||
      user.secondary_role === "Designer"
  );
  const marketingHeads = options.users.filter(
    (user) =>
      user.role === "Marketing Head" ||
      user.secondary_role === "Marketing Head"
  );
  const workflowAction = updateMarketingWorkflowAction.bind(null, request.id);
  const commentAction = addMarketingRequestUpdateAction.bind(null, request.id);
  const workflowStatusOptions = canManage
    ? marketingRequestStatusOptions
    : marketingRequestStatusOptions.filter((option) =>
        ["In Progress", "Draft Shared", "Corrections Requested"].includes(
          option.value
        )
      );

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Marketing Requests"
        title={request.title}
        description={`${request.request_code} · ${request.request_type}`}
      />
      {canEditBrief ? (
        <div className="-mt-3 flex justify-end">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            href={`/marketing-requests/${request.id}/edit`}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit brief
          </Link>
        </div>
      ) : null}

      {query.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {query.error}
        </div>
      ) : null}
      {query.saved ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Marketing Request updated.
        </div>
      ) : null}
      {query.comment_saved ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Comment added.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr]">
        <div
          className={[
            "rounded-lg border p-5 shadow-sm",
            action.tone === "danger"
              ? "border-red-200 bg-red-50"
              : action.tone === "warning"
              ? "border-amber-200 bg-amber-50"
              : action.tone === "success"
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-white"
          ].join(" ")}
        >
          <p className="text-sm font-medium text-slate-500">Current action</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {action.label}
          </p>
          <p className="mt-2 text-sm text-slate-600">{action.helper}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Final working deadline
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatDate(workingDeadline)}
          </p>
          <div className="mt-3">
            <PriorityPill priority={request.priority} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Assigned To</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {userLabel(userMap, request.assigned_to_user_id)}
          </p>
          <div className="mt-3">
            <MarketingStatusPill status={request.marketing_status} />
          </div>
        </div>
      </div>

      <SectionPanel title="Deadline decision">
        <div>
          <InfoRow
            label="Requested deadline"
            value={formatDate(request.deadline_date)}
          />
          <InfoRow
            label="Deadline decision"
            value={labelFor(
              marketingDeadlineStatusOptions,
              request.deadline_status
            )}
          />
          <InfoRow
            label="Final working deadline"
            value={formatDate(workingDeadline)}
          />
          {request.deadline_revision_note ? (
            <InfoRow
              label="Revision reason"
              value={request.deadline_revision_note}
            />
          ) : null}
        </div>
      </SectionPanel>

      <SectionPanel title="Brief">
        <div className="space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {request.brief}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow label="Target audience" value={display(request.target_audience)} />
            <InfoRow label="Key message" value={display(request.key_message)} />
            <InfoRow
              label="Required size / format"
              value={display(request.required_size_or_format)}
            />
            <InfoRow
              label="Campaign / event"
              value={display(request.campaign_or_event_name)}
            />
            <InfoRow
              label="Brief document"
              value={
                <LinkValue
                  href={request.brief_document_link}
                  label="Open brief document"
                />
              }
            />
          </div>
        </div>
      </SectionPanel>

      {canWorkflow ? (
        <SectionPanel
          title="Marketing action panel"
          description="Update ownership, status, draft links, final OneDrive link, and delivery progress."
        >
          <form action={workflowAction} className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </span>
              <select
                className={inputClassName()}
                defaultValue={request.marketing_status}
                name="marketing_status"
              >
                {workflowStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {canManage ? (
              <>
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Marketing Head
                  </span>
                  <select
                    className={inputClassName()}
                    defaultValue={request.marketing_head_user_id ?? ""}
                    name="marketing_head_user_id"
                  >
                    <option value="">Not assigned</option>
                    {marketingHeads.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Assigned owner
                  </span>
                  <select
                    className={inputClassName()}
                    defaultValue={request.assigned_to_user_id ?? ""}
                    name="assigned_to_user_id"
                  >
                    <option value="">Not assigned</option>
                    {marketingUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Requested deadline
                  </span>
                  <input
                    className={inputClassName()}
                    defaultValue={request.deadline_date}
                    disabled
                    type="date"
                  />
                </label>
                <input
                  name="deadline_date"
                  type="hidden"
                  value={request.deadline_date}
                />
                <fieldset className="md:col-span-2">
                  <legend className="mb-2 block text-sm font-medium text-slate-700">
                    Deadline decision
                  </legend>
                  <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 sm:grid-cols-3">
                    <label className="flex items-center gap-2">
                      <input
                        defaultChecked={request.deadline_status === "Pending"}
                        name="deadline_status"
                        type="radio"
                        value="Pending"
                      />
                      Keep pending
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        defaultChecked={request.deadline_status === "Accepted"}
                        name="deadline_status"
                        type="radio"
                        value="Accepted"
                      />
                      Accept requested deadline
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        defaultChecked={request.deadline_status === "Revised"}
                        name="deadline_status"
                        type="radio"
                        value="Revised"
                      />
                      Propose revised deadline
                    </label>
                  </div>
                </fieldset>
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Revised deadline date
                  </span>
                  <input
                    className={inputClassName()}
                    defaultValue={request.revised_deadline_date ?? ""}
                    name="revised_deadline_date"
                    type="date"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Revision reason
                  </span>
                  <input
                    className={inputClassName()}
                    defaultValue={request.deadline_revision_note ?? ""}
                    name="deadline_revision_note"
                    placeholder="Optional reason or comment"
                    type="text"
                  />
                </label>
              </>
            ) : (
              <>
                <input
                  name="deadline_date"
                  type="hidden"
                  value={request.deadline_date}
                />
                <input
                  name="deadline_status"
                  type="hidden"
                  value={request.deadline_status}
                />
                <input
                  name="marketing_head_user_id"
                  type="hidden"
                  value={request.marketing_head_user_id ?? ""}
                />
                <input
                  name="assigned_to_user_id"
                  type="hidden"
                  value={request.assigned_to_user_id ?? ""}
                />
              </>
            )}
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Draft link
              </span>
              <input
                className={inputClassName()}
                defaultValue={request.draft_link ?? ""}
                name="draft_link"
                type="url"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Final OneDrive link
              </span>
              <input
                className={inputClassName()}
                defaultValue={request.final_onedrive_link ?? ""}
                name="final_onedrive_link"
                type="url"
              />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Internal notes
              </span>
              <textarea
                className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                defaultValue={request.internal_notes ?? ""}
                name="internal_notes"
              />
            </label>
            <div className="md:col-span-2">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                type="submit"
              >
                Save workflow
              </button>
            </div>
          </form>
        </SectionPanel>
      ) : null}

      <SectionPanel title="Links">
        <div>
          <InfoRow
            label="Reference link"
            value={<LinkValue href={request.reference_link} label="Open reference" />}
          />
          <InfoRow
            label="Draft link"
            value={<LinkValue href={request.draft_link} label="Open draft" />}
          />
          <InfoRow
            label="Final OneDrive link"
            value={
              <LinkValue
                href={request.final_onedrive_link}
                label="Open final OneDrive link"
              />
            }
          />
        </div>
      </SectionPanel>

      <SectionPanel title="Corrections, comments, and history">
        {canComment ? (
          <form action={commentAction} className="mb-5 grid gap-3 md:grid-cols-[14rem_1fr_auto]">
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Update type
              </span>
              <select
                className={inputClassName()}
                defaultValue={
                  hasRole(currentUser, "Marketing Head")
                    ? "Status Update"
                    : "Comment"
                }
                name="update_type"
              >
                {marketingRequestUpdateTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Note
              </span>
              <input
                className={inputClassName()}
                name="note"
                placeholder="Add clarification, correction, or delivery note"
                required
              />
            </label>
            <div className="flex items-end">
              <button
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:w-auto"
                type="submit"
              >
                Add note
              </button>
            </div>
          </form>
        ) : null}

        <div className="divide-y divide-slate-100 rounded-md border border-slate-200">
          {updates.map((update) => (
            <div className="p-4" key={update.id}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-950">
                  {labelFor(
                    marketingRequestUpdateTypeOptions,
                    update.update_type
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {userLabel(userMap, update.created_by_user_id)} ·{" "}
                  {formatDateTime(update.created_at)}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {update.note}
              </p>
            </div>
          ))}
          {!updates.length ? (
            <div className="p-4 text-sm text-slate-500">
              No comments or history yet.
            </div>
          ) : null}
        </div>
      </SectionPanel>

      <SectionPanel title="Related business context">
        <div>
          <InfoRow
            label="Requested By"
            value={userLabel(userMap, request.requested_by_user_id)}
          />
          <InfoRow
            label="Related region"
            value={
              request.requested_for_region_id
                ? regionMap.get(request.requested_for_region_id) ??
                  request.requested_for_region_id
                : "Not linked"
            }
          />
          <InfoRow
            label="Related dealer"
            value={relatedLabel(options.dealers, request.related_dealer_id)}
          />
          <InfoRow
            label="Related institution"
            value={relatedLabel(
              options.institutions,
              request.related_institution_id
            )}
          />
          <InfoRow
            label="Related farmer lead"
            value={relatedLabel(
              options.farmerLeads,
              request.related_farmer_lead_id
            )}
          />
          <InfoRow
            label="Related pilot"
            value={relatedLabel(options.pilots, request.related_pilot_id)}
          />
        </div>
      </SectionPanel>
    </section>
  );
}
