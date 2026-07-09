"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  dealerPayloadFromForm,
  validateDealerPayload
} from "@/lib/dealers/form-data";
import type {
  Dealer,
  DealerInsert,
  DealerReviewInsert,
  DealerUpdate
} from "@/lib/dealers/types";
import type { DealerInstitutionLinkInsert } from "@/lib/dealers/types";
import { createClient } from "@/lib/supabase/server";
import { applyUploadedFilesToPayload } from "@/lib/uploads/server";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";
import {
  canApproveLegalDocuments,
  canEditDealerProfile,
  canSoftDeleteDealer,
  hasRole
} from "@/lib/users/permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function redirectWithReviewError(dealerId: string, message: string): never {
  redirect(`/dealers/${dealerId}?review_error=${encodeURIComponent(message)}`);
}

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function numberValue(formData: FormData, key: string) {
  const value = textValue(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function localDateValue() {
  return new Date().toISOString().slice(0, 10);
}

async function getCurrentProfile(supabase: SupabaseClient, errorPath: string) {
  return requireModuleWriteAccess(supabase, errorPath, "dealers");
}

export async function createDealerAction(formData: FormData) {
  const supabase = await createClient();
  const errorPath = "/dealers/new";
  const profile = await getCurrentProfile(supabase, errorPath);
  const dealerId = crypto.randomUUID();

  if (hasRole(profile, "HR & Legal")) {
    redirectWithError(
      errorPath,
      "Your role can review dealer legal documents but cannot create dealer profiles."
    );
  }

  const payload = dealerPayloadFromForm(formData);
  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "agreement_link", kind: "document" },
        { fieldName: "dealer_documents_folder_link", kind: "zip" }
      ],
      folder: "dealers",
      formData,
      payload,
      recordId: dealerId,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  const validationError = validateDealerPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const insertPayload: DealerInsert = {
    ...payload,
    id: dealerId,
    created_by_user_id: profile.id
  } as DealerInsert;

  const { data, error } = await supabase
    .from("dealers")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(errorPath, error?.message ?? "Dealer was not created.");
  }

  revalidatePath("/dealers");
  redirect(`/dealers/${data.id}`);
}

export async function updateDealerAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const errorPath = `/dealers/${id}/edit`;
  const profile = await getCurrentProfile(supabase, errorPath);

  const { data: existingData, error: existingError } = await supabase
    .from("dealers")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (existingError || !existingData) {
    redirectWithError(errorPath, "Dealer was not found.");
  }

  const existing = existingData as Dealer;
  const payload = dealerPayloadFromForm(formData);
  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "agreement_link", kind: "document" },
        { fieldName: "dealer_documents_folder_link", kind: "zip" }
      ],
      folder: "dealers",
      formData,
      payload,
      recordId: existing.id,
      supabase
    });
  } catch (error) {
    redirectWithError(
      errorPath,
      error instanceof Error ? error.message : "File upload failed."
    );
  }
  const validationError = validateDealerPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const dealerProfileEditor = canEditDealerProfile(profile);
  const salesHeadApprovalOnly = hasRole(profile, "Sales Head") && !dealerProfileEditor;
  const legalApprovalOnly =
    canApproveLegalDocuments(profile) && !dealerProfileEditor && !hasRole(profile, "Sales Head");
  const updatePayload: DealerUpdate = legalApprovalOnly
    ? {
        dealer_agreement_approval_status:
          String(formData.get("dealer_agreement_approval_status") ?? "Pending"),
        dealer_agreement_hr_legal_comments:
          String(formData.get("dealer_agreement_hr_legal_comments") ?? "").trim() ||
          null,
        agreement_link: payload.agreement_link ?? existing.agreement_link,
        dealer_documents_folder_link:
          payload.dealer_documents_folder_link ??
          existing.dealer_documents_folder_link,
        training_material_shared_link:
          payload.training_material_shared_link ??
          existing.training_material_shared_link
      }
    : salesHeadApprovalOnly
    ? {
        dealer_status: payload.dealer_status,
        commercial_terms_shared: payload.commercial_terms_shared,
        dealer_agreement_status: payload.dealer_agreement_status,
        training_status: payload.training_status,
        credit_terms: payload.credit_terms,
        priority: payload.priority,
        monthly_installation_target: payload.monthly_installation_target,
        quarterly_installation_target: payload.quarterly_installation_target,
        annual_installation_target: payload.annual_installation_target,
        next_action_date: payload.next_action_date,
        last_dealer_review_date: payload.last_dealer_review_date,
        next_dealer_review_date: payload.next_dealer_review_date,
        support_required: payload.support_required,
        remarks: payload.remarks
      }
    : {
        ...payload,
        training_material_shared_link: existing.training_material_shared_link
      };

  if (
    updatePayload.dealer_agreement_approval_status === "Approved" ||
    updatePayload.dealer_agreement_approval_status === "Rejected"
  ) {
    if (
      updatePayload.dealer_agreement_approval_status === "Approved" &&
      !(payload.agreement_link ?? existing.agreement_link)
    ) {
      redirectWithError(
        errorPath,
        "Upload the dealer agreement file before approving it."
      );
    }
    updatePayload.dealer_agreement_approved_by_user_id = profile.id;
    updatePayload.dealer_agreement_approved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("dealers")
    .update(updatePayload)
    .eq("id", existing.id);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  revalidatePath("/dealers");
  revalidatePath(`/dealers/${id}`);
  redirect(`/dealers/${id}`);
}

export async function updateDealerReviewAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const errorPath = `/dealers/${id}`;
  const profile = await getCurrentProfile(supabase, errorPath);

  if (
    !hasRole(profile, "Admin") &&
    !hasRole(profile, "Sales Head") &&
    !hasRole(profile, "RSM")
  ) {
    redirectWithReviewError(
      id,
      "You can view dealer review notes but cannot update them."
    );
  }

  const payload: DealerUpdate = {
    last_dealer_review_date: textValue(formData, "last_dealer_review_date"),
    next_dealer_review_date: textValue(formData, "next_dealer_review_date"),
    next_action_date: textValue(formData, "next_action_date"),
    support_required: textValue(formData, "support_required"),
    remarks: textValue(formData, "remarks"),
    priority: textValue(formData, "priority")
  } as DealerUpdate;

  const { error } = await supabase
    .from("dealers")
    .update(payload)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    redirectWithReviewError(id, error.message);
  }

  const submittedReviewDate = textValue(formData, "last_dealer_review_date");
  const submittedPriority = textValue(formData, "priority");
  const submittedConcern = textValue(formData, "support_required");
  const submittedNextAction = textValue(formData, "next_action");
  const submittedNextActionDate = textValue(formData, "next_action_date");
  const submittedNextReviewDate = textValue(formData, "next_dealer_review_date");
  const submittedRemarks = textValue(formData, "remarks");
  const reviewSnapshot: DealerReviewInsert = {
    dealer_id: id,
    reviewed_by_user_id: profile.id,
    review_date: submittedReviewDate ?? localDateValue(),
    priority: submittedPriority,
    concern_or_blocker: submittedConcern,
    next_action: submittedNextAction,
    next_action_date: submittedNextActionDate,
    next_review_date: submittedNextReviewDate,
    remarks: submittedRemarks
  };
  const hasMeaningfulReview = Boolean(
    submittedReviewDate ||
      submittedPriority ||
      submittedConcern ||
      submittedNextAction ||
      submittedNextActionDate ||
      submittedNextReviewDate ||
      submittedRemarks
  );

  if (hasMeaningfulReview) {
    const { error: reviewError } = await supabase
      .from("dealer_reviews")
      .insert(reviewSnapshot);

    if (reviewError) {
      redirectWithReviewError(id, reviewError.message);
    }
  }

  revalidatePath("/dealers");
  revalidatePath(`/dealers/${id}`);
  redirect(`/dealers/${id}?review_saved=1`);
}

export async function deleteDealerAction(id: string) {
  const supabase = await createClient();
  const errorPath = `/dealers/${id}`;
  const profile = await getCurrentProfile(supabase, errorPath);

  if (!canSoftDeleteDealer(profile)) {
    redirectWithError(
      errorPath,
      "Only Admin or Sales Head can delete dealer profiles."
    );
  }

  const { error } = await supabase
    .from("dealers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  revalidatePath("/dealers");
  revalidatePath(`/dealers/${id}`);
  redirect("/dealers?deleted=1");
}

export async function createDealerInstitutionLinkAction(
  dealerId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/dealers/${dealerId}/institution-connections/new`;
  const profile = await getCurrentProfile(supabase, errorPath);

  if (
    !hasRole(profile, "Admin") &&
    !hasRole(profile, "Sales Head") &&
    !hasRole(profile, "RSM")
  ) {
    redirectWithError(
      errorPath,
      "You can view dealer institution connections but cannot create them."
    );
  }

  const institutionId = textValue(formData, "institution_id");

  if (!institutionId) {
    redirectWithError(errorPath, "Select an institution to connect.");
  }

  const { data: dealer, error: dealerError } = await supabase
    .from("dealers")
    .select("id, dealer_owner_user_id, rsm_user_id")
    .eq("id", dealerId)
    .is("deleted_at", null)
    .single();

  if (dealerError || !dealer) {
    redirectWithError(errorPath, "Dealer was not found.");
  }

  const payload: DealerInstitutionLinkInsert = {
    dealer_id: dealerId,
    institution_id: institutionId,
    relationship_status:
      textValue(formData, "relationship_status") ?? "Introduced",
    opportunity_name: textValue(formData, "opportunity_name"),
    expected_devices: numberValue(formData, "expected_devices"),
    next_action_date: textValue(formData, "next_action_date"),
    concern_or_blocker: textValue(formData, "concern_or_blocker"),
    notes: textValue(formData, "notes"),
    created_by_user_id: profile.id,
    owner_user_id:
      textValue(formData, "owner_user_id") ?? dealer.dealer_owner_user_id,
    rsm_user_id: textValue(formData, "rsm_user_id") ?? dealer.rsm_user_id
  };

  const { error } = await supabase
    .from("dealer_institution_links")
    .insert(payload);

  if (error) {
    redirectWithError(
      errorPath,
      error.code === "23505"
        ? "This institution is already connected to this dealer."
        : error.message
    );
  }

  revalidatePath("/dealers");
  revalidatePath(`/dealers/${dealerId}`);
  revalidatePath(`/institutional-partners/${institutionId}`);
  redirect(`/dealers/${dealerId}`);
}
