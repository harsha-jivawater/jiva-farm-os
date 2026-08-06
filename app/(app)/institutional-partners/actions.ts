"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  contactPayloadFromForm,
  institutionPayloadFromForm,
  institutionSaleOrderLinePayloadFromForm,
  institutionSaleOrderPayloadFromForm,
  meetingPayloadFromForm,
  shouldUpdateMainContact,
  validateContactPayload,
  validateInstitutionPayload,
  validateInstitutionSaleOrderLinePayload,
  validateInstitutionSaleOrderPayload,
  validateMeetingPayload
} from "@/lib/institutions/form-data";
import {
  isInstitutionSalePaymentReady,
  rollupInstitutionSaleOrderStatus
} from "@/lib/institutions/sale-orders";
import type {
  ContactFormPayload,
  Institution,
  InstitutionContactInsert,
  InstitutionContactUpdate,
  InstitutionInsert,
  InstitutionMeetingInsert,
  InstitutionMeetingUpdate,
  InstitutionReviewInsert,
  InstitutionSaleOrderInsert,
  InstitutionSaleOrderLineInsert,
  InstitutionSaleOrderUpdate,
  InstitutionUpdate
} from "@/lib/institutions/types";
import { createClient } from "@/lib/supabase/server";
import { applyUploadedFilesToPayload } from "@/lib/uploads/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import {
  canApproveLegalDocuments,
  canConfirmPayment,
  canManageInstitutionProfile,
  canSoftDeleteInstitution,
  hasAnyRole,
  hasRole,
  isAdmin
} from "@/lib/users/permissions";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function localDateValue() {
  return new Date().toISOString().slice(0, 10);
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

function assertCanManageInstitutionSales(
  profile: Awaited<ReturnType<typeof getCurrentProfile>>,
  errorPath: string
) {
  if (!hasAnyRole(profile, ["Admin", "Sales Head", "RSM"])) {
    redirectWithError(
      errorPath,
      "Only Admin, Sales Head, or RSM can manage institution-funded sales."
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

async function updateInstitutionSaleOrderRollup(
  supabase: SupabaseClient,
  orderId: string
) {
  const [{ data: order }, { data: lines }] = await Promise.all([
    supabase
      .from("institution_sale_orders")
      .select("id, payment_status")
      .eq("id", orderId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("institution_sale_order_lines")
      .select("allocation_status")
      .eq("order_id", orderId)
      .is("deleted_at", null)
  ]);

  if (!order) {
    return;
  }

  const orderStatus = rollupInstitutionSaleOrderStatus({
    lineStatuses: (lines ?? []).map((line) => line.allocation_status),
    paymentStatus: order.payment_status
  });

  await supabase
    .from("institution_sale_orders")
    .update({ order_status: orderStatus })
    .eq("id", orderId);
}

async function getInstitutionForSaleOrder(
  supabase: SupabaseClient,
  institutionId: string,
  errorPath: string
) {
  const { data, error } = await supabase
    .from("institutions")
    .select(
      [
        "id",
        "business_sector",
        "account_owner_user_id",
        "rsm_user_id",
        "sales_head_user_id"
      ].join(",")
    )
    .eq("id", institutionId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    redirectWithError(errorPath, "Institution was not found.");
  }

  return data as unknown as Pick<
    Institution,
    | "id"
    | "business_sector"
    | "account_owner_user_id"
    | "rsm_user_id"
    | "sales_head_user_id"
  >;
}

function institutionSalePaymentStatusFromForm(formData: FormData) {
  return String(formData.get("payment_status") ?? "Confirmed").trim();
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

  const { error } = await supabase
    .from("institutions")
    .insert(insertPayload);

  if (error) {
    redirectWithError(
      errorPath,
      error.message
    );
  }

  revalidatePath("/institutional-partners");
  revalidatePath(`/institutional-partners/${institutionId}`);
  redirect(`/institutional-partners/${institutionId}`);
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
  assertCanManageInstitutionSales(profile, errorPath);

  const priority = textValue(formData, "priority");
  const nextActionDate = textValue(formData, "next_action_date");
  const supportRequired = textValue(formData, "support_required");
  const notesFromLastInteraction = textValue(
    formData,
    "notes_from_last_interaction"
  );
  const remarks = textValue(formData, "remarks");
  const updatePayload: InstitutionUpdate = {
    priority: priority ?? undefined,
    next_action_date: nextActionDate ?? undefined,
    support_required: supportRequired,
    notes_from_last_interaction: notesFromLastInteraction,
    remarks
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

  const reviewSnapshot: InstitutionReviewInsert = {
    institution_id: institutionId,
    reviewed_by_user_id: profile.id,
    review_date: localDateValue(),
    priority,
    support_required: supportRequired,
    notes_from_last_interaction: notesFromLastInteraction,
    next_action_date: nextActionDate,
    remarks
  };

  const { error: reviewError } = await supabase
    .from("institution_reviews")
    .insert(reviewSnapshot);

  if (reviewError) {
    redirectWithError(errorPath, reviewError.message);
  }

  await revalidateInstitution(institutionId);
  redirect(`/institutional-partners/${institutionId}?saved=review`);
}

export async function createInstitutionSaleOrderAction(
  institutionId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${institutionId}`;
  const profile = await getCurrentProfile(supabase, errorPath);
  assertCanManageInstitutionSales(profile, errorPath);

  const institution = await getInstitutionForSaleOrder(
    supabase,
    institutionId,
    errorPath
  );
  const payload = institutionSaleOrderPayloadFromForm(formData);
  const validationError = validateInstitutionSaleOrderPayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const paymentStatus = payload.payment_status ?? "Pending";
  const insertPayload: InstitutionSaleOrderInsert = {
    ...payload,
    institution_id: institution.id,
    business_sector: institution.business_sector ?? "Agriculture",
    owner_user_id:
      institution.account_owner_user_id ??
      institution.sales_head_user_id ??
      profile.id,
    rsm_user_id: institution.rsm_user_id ?? null,
    payment_status: paymentStatus,
    payment_received_date: isInstitutionSalePaymentReady(paymentStatus)
      ? localDateValue()
      : null,
    payment_confirmed_by_user_id: isInstitutionSalePaymentReady(paymentStatus)
      ? profile.id
      : null,
    order_status: isInstitutionSalePaymentReady(paymentStatus)
      ? "Payment Confirmed"
      : "Pending Payment",
    created_by_user_id: profile.id
  };

  if (
    isInstitutionSalePaymentReady(insertPayload.payment_status) &&
    !canConfirmPayment(profile)
  ) {
    redirectWithError(
      errorPath,
      "Only Accounts or Admin can create an order as payment confirmed."
    );
  }

  const { data: order, error } = await supabase
    .from("institution_sale_orders")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !order) {
    redirectWithError(errorPath, error?.message ?? "Institution order was not saved.");
  }

  await updateInstitutionSaleOrderRollup(supabase, order.id);
  await revalidateInstitution(institutionId);
  revalidatePath("/my-pending-work");
  redirect(`${errorPath}?saved=institution_sale_order`);
}

export async function confirmInstitutionSaleOrderPaymentAction(
  institutionId: string,
  orderId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${institutionId}`;
  const profile = await getCurrentInternalUser(supabase, errorPath);

  if (!canConfirmPayment(profile)) {
    redirectWithError(
      errorPath,
      "Only Accounts or Admin can confirm institution payments."
    );
  }

  const { data: order, error } = await supabase
    .from("institution_sale_orders")
    .select("id, payment_status")
    .eq("id", orderId)
    .eq("institution_id", institutionId)
    .is("deleted_at", null)
    .single();

  if (error || !order) {
    redirectWithError(errorPath, "Institution sale order was not found.");
  }

  const paymentStatus = institutionSalePaymentStatusFromForm(formData);
  const paymentDate = textValue(formData, "payment_received_date") ?? localDateValue();
  const updatePayload: InstitutionSaleOrderUpdate = {
    payment_status: paymentStatus,
    payment_received_date: isInstitutionSalePaymentReady(paymentStatus)
      ? paymentDate
      : null,
    payment_confirmed_by_user_id: isInstitutionSalePaymentReady(paymentStatus)
      ? profile.id
      : null
  };

  const { error: updateError } = await supabase
    .from("institution_sale_orders")
    .update(updatePayload)
    .eq("id", orderId)
    .eq("institution_id", institutionId)
    .is("deleted_at", null);

  if (updateError) {
    redirectWithError(errorPath, updateError.message);
  }

  await updateInstitutionSaleOrderRollup(supabase, orderId);
  await revalidateInstitution(institutionId);
  revalidatePath("/dispatches");
  revalidatePath("/my-pending-work");
  redirect(`${errorPath}?saved=institution_payment`);
}

export async function createInstitutionSaleOrderLineAction(
  institutionId: string,
  orderId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${institutionId}`;
  const profile = await getCurrentProfile(supabase, errorPath);
  assertCanManageInstitutionProfile(profile, errorPath);
  const payload = institutionSaleOrderLinePayloadFromForm(formData);
  const validationError = validateInstitutionSaleOrderLinePayload(payload);

  if (validationError) {
    redirectWithError(errorPath, validationError);
  }

  const { data: order, error: orderError } = await supabase
    .from("institution_sale_orders")
    .select("id, institution_id, product_model, ordered_quantity")
    .eq("id", orderId)
    .eq("institution_id", institutionId)
    .is("deleted_at", null)
    .single();

  if (orderError || !order) {
    redirectWithError(errorPath, "Institution sale order was not found.");
  }

  const [{ count: activeLineCount }, { data: farmerLead }, { data: existingLine }] =
    await Promise.all([
      supabase
        .from("institution_sale_order_lines")
        .select("id", { count: "exact", head: true })
        .eq("order_id", orderId)
        .is("deleted_at", null)
        .neq("allocation_status", "Cancelled"),
      supabase
        .from("farmer_leads")
        .select("id, farmer_name, lead_code, linked_institution_id, product_recommended")
        .eq("id", payload.farmer_lead_id ?? "")
        .is("deleted_at", null)
        .single(),
      supabase
        .from("institution_sale_order_lines")
        .select("id")
        .eq("order_id", orderId)
        .eq("farmer_lead_id", payload.farmer_lead_id ?? "")
        .is("deleted_at", null)
        .neq("allocation_status", "Cancelled")
        .maybeSingle()
    ]);

  if ((activeLineCount ?? 0) >= order.ordered_quantity) {
    redirectWithError(
      errorPath,
      "This order already has allocations equal to its ordered quantity."
    );
  }

  if (!farmerLead) {
    redirectWithError(errorPath, "Selected farmer lead was not found.");
  }

  if (existingLine) {
    redirectWithError(
      errorPath,
      "This farmer is already allocated under this institution sale order."
    );
  }

  if (
    farmerLead.linked_institution_id &&
    farmerLead.linked_institution_id !== institutionId
  ) {
    redirectWithError(
      errorPath,
      "This farmer lead is already linked to a different institution."
    );
  }

  if (!farmerLead.linked_institution_id) {
    const { error: leadUpdateError } = await supabase
      .from("farmer_leads")
      .update({ linked_institution_id: institutionId })
      .eq("id", farmerLead.id);

    if (leadUpdateError) {
      redirectWithError(errorPath, leadUpdateError.message);
    }
  }

  const insertPayload: InstitutionSaleOrderLineInsert = {
    ...payload,
    order_id: order.id,
    institution_id: institutionId,
    farmer_lead_id: payload.farmer_lead_id ?? "",
    product_model:
      payload.product_model ?? order.product_model ?? farmerLead.product_recommended,
    allocation_status: "Ready for Dispatch",
    created_by_user_id: profile.id
  };
  const { error } = await supabase
    .from("institution_sale_order_lines")
    .insert(insertPayload);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await updateInstitutionSaleOrderRollup(supabase, orderId);
  await revalidateInstitution(institutionId);
  revalidatePath("/farmer-leads");
  revalidatePath(`/farmer-leads/${farmerLead.id}`);
  revalidatePath("/dispatches");
  redirect(`${errorPath}?saved=institution_sale_line`);
}

export async function deleteInstitutionAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${id}`;
  const profile = await getCurrentProfile(supabase, errorPath);
  const deletionReason = String(formData.get("deletion_reason") ?? "").trim();

  if (!canSoftDeleteInstitution(profile)) {
    redirectWithError(
      errorPath,
      "Only Admin or Sales Head can delete institutional partners."
    );
  }

  if (!deletionReason) {
    redirectWithError(
      errorPath,
      "Add a delete reason before deleting this institutional partner."
    );
  }

  const { error } = await supabase
    .from("institutions")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by_user_id: profile.id,
      deletion_reason: deletionReason
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  revalidatePath("/institutional-partners");
  revalidatePath(`/institutional-partners/${id}`);
  redirect("/institutional-partners?deleted=1");
}

export async function restoreInstitutionAction(id: string) {
  const supabase = await createClient();
  const errorPath = `/institutional-partners/${id}`;
  const profile = await getCurrentProfile(supabase, errorPath);

  if (!isAdmin(profile)) {
    redirectWithError(
      errorPath,
      "Only Admin can restore deleted institutional partners."
    );
  }

  const { error } = await supabase
    .from("institutions")
    .update({
      deleted_at: null,
      restored_at: new Date().toISOString(),
      restored_by_user_id: profile.id
    })
    .eq("id", id)
    .not("deleted_at", "is", null);

  if (error) {
    redirectWithError(errorPath, error.message);
  }

  await revalidateInstitution(id);
  redirect(`/institutional-partners/${id}?restored=1`);
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
