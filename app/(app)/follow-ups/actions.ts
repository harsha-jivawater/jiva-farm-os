"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  followupPayloadFromForm,
  validateFollowupPayload
} from "@/lib/follow-ups/form-data";
import { farmerSaleFollowupType } from "@/lib/follow-ups/options";
import type {
  FarmerLeadUpdate,
  Followup,
  FollowupFormPayload,
  FollowupUpdate,
  VisitReportInsert
} from "@/lib/follow-ups/types";
import { createClient } from "@/lib/supabase/server";
import { canCreateTechnicalReport } from "@/lib/users/permissions";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

async function getCurrentProfile(supabase: SupabaseClient, errorPath: string) {
  return requireModuleWriteAccess(supabase, errorPath, "follow-ups");
}

async function getFollowup(
  supabase: SupabaseClient,
  id: string,
  errorPath: string
) {
  const { data, error } = await supabase
    .from("followups")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    redirectWithError(errorPath, "Follow-up was not found.");
  }

  return data as Followup;
}

function mergedValue<T extends keyof FollowupFormPayload>(
  payload: FollowupFormPayload,
  existing: Followup,
  key: T
) {
  return payload[key] ?? existing[key as keyof Followup];
}

async function createFarmerSaleVisitReport({
  existing,
  payload,
  profileId,
  supabase
}: {
  existing: Followup;
  payload: FollowupFormPayload;
  profileId: string;
  supabase: SupabaseClient;
}) {
  const reportLinkValue = mergedValue(payload, existing, "report_link");
  const reportLink = typeof reportLinkValue === "string" ? reportLinkValue : "";

  if (!reportLink) {
    throw new Error(
      "Report link is required before completing this farmer sale 15-day follow-up."
    );
  }

  const visitReportPayload: VisitReportInsert = {
    report_type: "Farmer Sale 15-Day Follow-up",
    report_status: "Submitted",
    report_date: todayDate(),
    submitted_by_user_id: profileId,
    farmer_lead_id: existing.farmer_lead_id,
    installation_id: existing.installation_id,
    report_title: `15-Day Follow-up - ${existing.followup_code}`,
    report_summary: String(mergedValue(payload, existing, "followup_summary")),
    farmer_feedback: String(mergedValue(payload, existing, "farmer_feedback")),
    fitment_inspection_status: mergedValue(
      payload,
      existing,
      "fitment_inspection_status"
    ) as string | null,
    issue_observed: Boolean(mergedValue(payload, existing, "issue_observed")),
    issue_details: mergedValue(payload, existing, "issue_details") as
      | string
      | null,
    recommendation: mergedValue(payload, existing, "next_action") as
      | string
      | null,
    next_action: mergedValue(payload, existing, "next_action") as string | null,
    next_visit_date: mergedValue(payload, existing, "next_action_date") as
      | string
      | null,
    report_link: reportLink,
    photo_folder_link: mergedValue(payload, existing, "photo_folder_link") as
      | string
      | null
  };

  const { data, error } = await supabase
    .from("visit_reports")
    .insert(visitReportPayload)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Visit report was not created.");
  }

  return data.id as string;
}

async function saveFollowup({
  completing,
  formData,
  id
}: {
  completing: boolean;
  formData: FormData;
  id: string;
}) {
  const supabase = await createClient();
  const errorPath = completing
    ? `/follow-ups/${id}/complete`
    : `/follow-ups/${id}/edit`;
  const profile = await getCurrentProfile(supabase, errorPath);
  const existing = await getFollowup(supabase, id, errorPath);
  const payload = followupPayloadFromForm(formData, {
    forceCompleted: completing
  });

  if (completing) {
    payload.followup_type = existing.followup_type;
  }

  const validationError = validateFollowupPayload(payload, existing, {
    completing
  });

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const updatePayload: FollowupUpdate = {
    ...payload
  };

  if (payload.followup_status === "Completed") {
    updatePayload.followup_completed_date =
      existing.followup_completed_date ?? todayDate();

    if (existing.followup_type === farmerSaleFollowupType) {
      if (!existing.visit_report_id) {
        if (!canCreateTechnicalReport(profile)) {
          redirectWithError(
            errorPath,
            "Only Admin, Management, R&D Head, Agronomist, or Research Assistant can create technical follow-up reports."
          );
        }

        try {
          updatePayload.visit_report_id = await createFarmerSaleVisitReport({
            existing,
            payload,
            profileId: profile.id,
            supabase
          });
        } catch (error) {
          redirectWithError(
            errorPath,
            error instanceof Error
              ? error.message
              : "Visit report was not created."
          );
        }
      }

      updatePayload.report_link =
        payload.report_link ?? existing.report_link ?? null;
    }
  }

  const { error } = await supabase
    .from("followups")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  if (
    payload.followup_status === "Completed" &&
    existing.followup_type === farmerSaleFollowupType &&
    existing.farmer_lead_id
  ) {
    const leadPayload: FarmerLeadUpdate = {
      funnel_stage: "15-Day Follow-up Completed",
      followup_completed: true,
      followup_completed_date: updatePayload.followup_completed_date
    };

    const { error: leadError } = await supabase
      .from("farmer_leads")
      .update(leadPayload)
      .eq("id", existing.farmer_lead_id);

    if (leadError) {
      redirectWithError(errorPath, leadError.message);
    }
  }

  revalidatePath("/follow-ups");
  revalidatePath(`/follow-ups/${id}`);
  revalidatePath("/farmer-leads");
  redirect(`/follow-ups/${id}`);
}

export async function updateFollowupAction(id: string, formData: FormData) {
  await saveFollowup({
    completing: false,
    formData,
    id
  });
}

export async function completeFollowupAction(id: string, formData: FormData) {
  await saveFollowup({
    completing: true,
    formData,
    id
  });
}
