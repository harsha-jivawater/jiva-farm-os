"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  contactPayloadFromForm,
  institutionPayloadFromForm,
  meetingPayloadFromForm,
  shouldUpdateMainContact,
  validateContactPayload,
  validateInstitutionPayload,
  validateMeetingPayload
} from "@/lib/institutions/form-data";
import type {
  ContactFormPayload,
  InstitutionContactInsert,
  InstitutionContactUpdate,
  InstitutionInsert,
  InstitutionMeetingInsert,
  InstitutionMeetingUpdate,
  InstitutionUpdate,
} from "@/lib/institutions/types";
import { createClient } from "@/lib/supabase/server";
import { applyUploadedFilesToPayload } from "@/lib/uploads/server";
import {
  canApproveLegalDocuments,
  canManageInstitutionProfile,
  hasRole
} from "@/lib/users/permissions";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function getCurrentProfile(supabase: SupabaseClient, errorPath: string) {
  return requireModuleWriteAccess(
    supabase,
    errorPath,
    "institutional-partners"
  );
}

function assertCanManageInstitutionProfile(
  profile: Awaited<ReturnType<typeof getCurrentProfile>>,
  errorPath: string
) {
  if (!canManageInstitutionProfile(profile)) {
    redirectWithError(
      errorPath,
      "HR & Legal can approve institutional documents but cannot change institution profile details."
    );
  }
}

async function revalidateInstitution(id: string) {
  revalidatePath("/institutional-partners");
  revalidatePath(`/institutional-partners/${id}`);
  revalidatePath(`/institutional-partners/${id}/edit`);
}

async function updateMeetingRollup(
  supabase: SupabaseClient,
  institutionId: string,
  latestSummary?: string | null,
  nextActionDate?: string | null
) {
  const [{ count }, { data: latestMeeting }] = await Promise.all([
    supabase
      .from("institution_meetings")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", institutionId),
    supabase
      .from("institution_meetings")
      .select("meeting_date")
      .eq("institution_id", institutionId)
      .order("meeting_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const updatePayload: InstitutionUpdate = {
    meeting_count: count ?? 0,
    last_meeting_date: latestMeeting?.meeting_date ?? null
  };

  if (latestSummary) {
    updatePayload.notes_from_last_interaction = latestSummary;
  }

  if (nextActionDate) {
    updatePayload.next_action_date = nextActionDate;
  }

  await supabase
    .from("institutions")
    .update(updatePayload)
    .eq("id", institutionId);
}

export async function createInstitutionAction(formData: FormData) {
  const supabase = await createClient();
  const errorPath = "/institutional-partners/new";
  const profile = await getCurrentProfile(supabase, errorPath);
  const institutionId = crypto.randomUUID();

  assertCanManageInstitutionProfile(profile, errorPath);

  const payload = institutionPayloadFromForm(formData);

  if (hasRole(profile, "R&D Head") && !payload.rd_head_user_id) {
    payload.rd_head_user_id = profile.id;
  }

  if (hasRole(profile, "Agronomist") && !payload.technical_owner_user_id) {
    payload.technical_owner_user_id = profile.id;
  }

  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "proposal_link", kind: "document" },
        { fieldName: "mou_agreement_link", kind: "document" }
      ],
      folder: "institutions",
      formData,
      payload,
      recordId: institutionId,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  const validationError = validateInstitutionPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const insertPayload: InstitutionInsert = {
    ...payload,
    id: institutionId,
    created_by_user_id: profile.id
  } as InstitutionInsert;

  const { data, error } = await supabase
    .from("institutions")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(
      errorPath,
      error?.message ?? "Institution was not created."
    );
  }

  revalidatePath("/institutional-partners");
  redirect(`/institutional-partners/${data.id}`);
}

export async function updateInstitutionAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${id}/edit`;
  const profile = await getCurrentProfile(supabase, errorPath);

  const { data: existing, error: existingError } = await supabase
    .from("institutions")
    .select("id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (existingError || !existing) {
    redirectWithError(errorPath, "Institution was not found.");
  }

  const legalApprovalOnly =
    canApproveLegalDocuments(profile) &&
    !hasRole(profile, "Admin") &&
    !hasRole(profile, "Sales Head") &&
    !hasRole(profile, "RSM") &&
    !hasRole(profile, "Agronomist") &&
    !hasRole(profile, "R&D Head");

  if (legalApprovalOnly) {
    const updatePayload: InstitutionUpdate = {
      mou_approval_status: String(formData.get("mou_approval_status") ?? "Pending"),
      mou_hr_legal_comments:
        String(formData.get("mou_hr_legal_comments") ?? "").trim() || null
    };
    try {
      await applyUploadedFilesToPayload({
        fields: [{ fieldName: "mou_agreement_link", kind: "document" }],
        folder: "institutions",
        formData,
        payload: updatePayload,
        recordId: id,
        supabase
      });
    } catch (error) {
      redirectWithError(
        errorPath,
        error instanceof Error ? error.message : "File upload failed."
      );
    }

    if (
      updatePayload.mou_approval_status === "Approved" ||
      updatePayload.mou_approval_status === "Rejected"
    ) {
      if (
        updatePayload.mou_approval_status === "Approved" &&
        !updatePayload.mou_agreement_link
      ) {
        const { data: existingMou } = await supabase
          .from("institutions")
          .select("mou_agreement_link")
          .eq("id", id)
          .single();

        if (!existingMou?.mou_agreement_link) {
          redirectWithError(
            errorPath,
            "Upload the MOU agreement file before approving it."
          );
        }
      }
      updatePayload.mou_approved_by_user_id = profile.id;
      updatePayload.mou_approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("institutions")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      redirectWithError(errorPath, error.message);
    }

    await revalidateInstitution(id);
    redirect(`/institutional-partners/${id}`);
  }

  assertCanManageInstitutionProfile(profile, errorPath);

  const payload = institutionPayloadFromForm(formData);
  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "proposal_link", kind: "document" },
        { fieldName: "mou_agreement_link", kind: "document" }
      ],
      folder: "institutions",
      formData,
      payload,
      recordId: id,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  const validationError = validateInstitutionPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const updatePayload = payload as InstitutionUpdate;

  if (
    canApproveLegalDocuments(profile) &&
    (updatePayload.mou_approval_status === "Approved" ||
      updatePayload.mou_approval_status === "Rejected")
  ) {
    if (
      updatePayload.mou_approval_status === "Approved" &&
      !updatePayload.mou_agreement_link
    ) {
      redirectWithError(
        errorPath,
        "Upload the MOU agreement file before approving it."
      );
    }
    updatePayload.mou_approved_by_user_id = profile.id;
    updatePayload.mou_approved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("institutions")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await revalidateInstitution(id);
  redirect(`/institutional-partners/${id}`);
}

export async function updateInstitutionReviewAction(
  institutionId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${institutionId}`;
  const profile = await getCurrentProfile(supabase, errorPath);
  assertCanManageInstitutionProfile(profile, errorPath);

  const priority = String(formData.get("priority") ?? "").trim();
  const nextActionDate = String(formData.get("next_action_date") ?? "").trim();
  const updatePayload: InstitutionUpdate = {
    priority,
    next_action_date: nextActionDate,
    support_required:
      String(formData.get("support_required") ?? "").trim() || undefined,
    notes_from_last_interaction:
      String(formData.get("notes_from_last_interaction") ?? "").trim() ||
      undefined,
    remarks: String(formData.get("remarks") ?? "").trim() || undefined
  };

  if (!updatePayload.priority) {
    redirectWithError(errorPath, "Priority is required.");
  }

  if (!updatePayload.next_action_date) {
    redirectWithError(errorPath, "Next action date is required.");
  }

  const { error } = await supabase
    .from("institutions")
    .update(updatePayload)
    .eq("id", institutionId)
    .is("deleted_at", null);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await revalidateInstitution(institutionId);
  redirect(`/institutional-partners/${institutionId}?saved=review`);
}

export async function createInstitutionContactAction(
  institutionId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${institutionId}`;
  const profile = await getCurrentProfile(supabase, errorPath);
  assertCanManageInstitutionProfile(profile, errorPath);
  const payload = contactPayloadFromForm(formData);
  const validationError = validateContactPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  if (payload.is_primary_contact) {
    await supabase
      .from("institution_contacts")
      .update({ is_primary_contact: false })
      .eq("institution_id", institutionId)
      .is("deleted_at", null);
  }

  const insertPayload: InstitutionContactInsert = {
    ...payload,
    institution_id: institutionId,
    created_by_user_id: profile.id
  } as InstitutionContactInsert;

  const { error } = await supabase
    .from("institution_contacts")
    .insert(insertPayload);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  if (payload.is_primary_contact && shouldUpdateMainContact(formData)) {
    await updateInstitutionMainContact(supabase, institutionId, payload);
  }

  await revalidateInstitution(institutionId);
  redirect(errorPath);
}

export async function updateInstitutionContactAction(
  institutionId: string,
  contactId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${institutionId}/contacts/${contactId}/edit`;
  const profile = await getCurrentProfile(supabase, errorPath);
  assertCanManageInstitutionProfile(profile, errorPath);
  const payload = contactPayloadFromForm(formData);
  const validationError = validateContactPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  if (payload.is_primary_contact) {
    await supabase
      .from("institution_contacts")
      .update({ is_primary_contact: false })
      .eq("institution_id", institutionId)
      .neq("id", contactId)
      .is("deleted_at", null);
  }

  const { error } = await supabase
    .from("institution_contacts")
    .update(payload as InstitutionContactUpdate)
    .eq("id", contactId)
    .eq("institution_id", institutionId);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  if (payload.is_primary_contact && shouldUpdateMainContact(formData)) {
    await updateInstitutionMainContact(supabase, institutionId, payload);
  }

  await revalidateInstitution(institutionId);
  redirect(`/institutional-partners/${institutionId}`);
}

export async function deleteInstitutionContactAction(
  institutionId: string,
  contactId: string
) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${institutionId}`;
  const profile = await getCurrentProfile(supabase, errorPath);
  assertCanManageInstitutionProfile(profile, errorPath);

  const { error } = await supabase
    .from("institution_contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", contactId)
    .eq("institution_id", institutionId);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await revalidateInstitution(institutionId);
  redirect(errorPath);
}

async function updateInstitutionMainContact(
  supabase: SupabaseClient,
  institutionId: string,
  payload: ContactFormPayload
) {
  const updatePayload: InstitutionUpdate = {
    main_contact_person: payload.contact_name ?? "",
    main_contact_designation: payload.designation ?? null,
    main_contact_number: payload.phone ?? "",
    main_contact_email: payload.email ?? null
  };

  if (updatePayload.main_contact_person && updatePayload.main_contact_number) {
    await supabase
      .from("institutions")
      .update(updatePayload)
      .eq("id", institutionId);
  }
}

export async function createInstitutionMeetingAction(
  institutionId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${institutionId}`;
  const profile = await getCurrentProfile(supabase, errorPath);
  assertCanManageInstitutionProfile(profile, errorPath);
  const meetingId = crypto.randomUUID();
  const payload = meetingPayloadFromForm(formData);
  try {
    await applyUploadedFilesToPayload({
      fields: [{ fieldName: "notes_link", kind: "document" }],
      folder: "institution-meetings",
      formData,
      payload,
      recordId: meetingId,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  const validationError = validateMeetingPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const insertPayload: InstitutionMeetingInsert = {
    ...payload,
    id: meetingId,
    institution_id: institutionId,
    created_by_user_id: profile.id
  } as InstitutionMeetingInsert;

  const { error } = await supabase
    .from("institution_meetings")
    .insert(insertPayload);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await updateMeetingRollup(
    supabase,
    institutionId,
    payload.meeting_summary,
    payload.next_action_date
  );
  await revalidateInstitution(institutionId);
  redirect(errorPath);
}

export async function updateInstitutionMeetingAction(
  institutionId: string,
  meetingId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${institutionId}/meetings/${meetingId}/edit`;
  const profile = await getCurrentProfile(supabase, errorPath);
  assertCanManageInstitutionProfile(profile, errorPath);
  const payload = meetingPayloadFromForm(formData);
  try {
    await applyUploadedFilesToPayload({
      fields: [{ fieldName: "notes_link", kind: "document" }],
      folder: "institution-meetings",
      formData,
      payload,
      recordId: meetingId,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  const validationError = validateMeetingPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const { error } = await supabase
    .from("institution_meetings")
    .update(payload as InstitutionMeetingUpdate)
    .eq("id", meetingId)
    .eq("institution_id", institutionId);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await updateMeetingRollup(
    supabase,
    institutionId,
    payload.meeting_summary,
    payload.next_action_date
  );
  await revalidateInstitution(institutionId);
  redirect(`/institutional-partners/${institutionId}`);
}
