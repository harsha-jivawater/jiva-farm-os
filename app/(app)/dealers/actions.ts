"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  dealerPayloadFromForm,
  validateDealerPayload
} from "@/lib/dealers/form-data";
import type { Dealer, DealerInsert, DealerUpdate } from "@/lib/dealers/types";
import { createClient } from "@/lib/supabase/server";
import { applyUploadedFilesToPayload } from "@/lib/uploads/server";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";
import {
  canApproveLegalDocuments,
  canEditDealerProfile,
  hasRole
} from "@/lib/users/permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function getCurrentProfile(supabase: SupabaseClient, errorPath: string) {
  return requireModuleWriteAccess(supabase, errorPath, "dealers");
}

export async function createDealerAction(formData: FormData) {
  const supabase = await createClient();
  const errorPath = "/dealers/new";
  const profile = await getCurrentProfile(supabase, errorPath);
  const dealerId = crypto.randomUUID();

  if (hasRole(profile, "Sales Head") || hasRole(profile, "HR & Legal")) {
    redirectWithError(
      errorPath,
      "Your role can review dealers but cannot create dealer profiles."
    );
  }

  const payload = dealerPayloadFromForm(formData);
  try {
    await applyUploadedFilesToPayload({
      fields: [
        { fieldName: "agreement_link", kind: "document" },
        { fieldName: "dealer_documents_folder_link", kind: "zip" },
        { fieldName: "training_material_shared_link", kind: "document" }
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
        { fieldName: "dealer_documents_folder_link", kind: "zip" },
        { fieldName: "training_material_shared_link", kind: "document" }
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
        next_action_date: payload.next_action_date
      }
    : {
        ...payload
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
