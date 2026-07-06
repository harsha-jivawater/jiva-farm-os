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
import {
  canApproveLegalDocuments,
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

  if (hasRole(profile, "HR & Legal")) {
    redirectWithError(
      errorPath,
      "HR & Legal can approve institutional documents but cannot create institutions."
    );
  }

  const payload = institutionPayloadFromForm(formData);
  const validationError = validateInstitutionPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const insertPayload: InstitutionInsert = {
    ...payload,
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

    if (
      updatePayload.mou_approval_status === "Approved" ||
      updatePayload.mou_approval_status === "Rejected"
    ) {
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

  const payload = institutionPayloadFromForm(formData);
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

export async function createInstitutionContactAction(
  institutionId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${institutionId}`;
  const profile = await getCurrentProfile(supabase, errorPath);
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
  await getCurrentProfile(supabase, errorPath);
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
  await getCurrentProfile(supabase, errorPath);

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
  const payload = meetingPayloadFromForm(formData);
  const validationError = validateMeetingPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const insertPayload: InstitutionMeetingInsert = {
    ...payload,
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
  await getCurrentProfile(supabase, errorPath);
  const payload = meetingPayloadFromForm(formData);
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
