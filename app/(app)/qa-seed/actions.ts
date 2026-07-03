"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isQaSeedEnabled } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { isAdmin } from "@/lib/users/permissions";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type Tables = Database["public"]["Tables"];
type Device = Tables["devices"]["Row"];
type DeviceInsert = Tables["devices"]["Insert"];
type FarmerLead = Tables["farmer_leads"]["Row"];
type FarmerLeadInsert = Tables["farmer_leads"]["Insert"];
type Followup = Tables["followups"]["Row"];
type FollowupInsert = Tables["followups"]["Insert"];
type Installation = Tables["installations"]["Row"];
type InstallationInsert = Tables["installations"]["Insert"];
type Pilot = Tables["pilots"]["Row"];
type PilotInsert = Tables["pilots"]["Insert"];
type PilotVisit = Tables["pilot_visits"]["Row"];
type PilotVisitInsert = Tables["pilot_visits"]["Insert"];
type Region = Tables["regions"]["Row"];
type User = Tables["users"]["Row"];
type VisitReport = Tables["visit_reports"]["Row"];
type VisitReportInsert = Tables["visit_reports"]["Insert"];

type RequiredUsers = {
  admin: User;
  agronomist: User;
  rdHead: User;
  researchAssistant: User;
  rsm: User;
  salesperson: User;
};

const QA_STATE = "Karnataka";
const QA_DISTRICT = "Bangalore Urban";
const QA_VILLAGE = "QA Village";
const QA_PHOTO_LINK = "https://example.com/qa-installation-photo";

function redirectWithMessage(kind: "created" | "error", message: string): never {
  redirect(`/qa-seed?${kind}=${encodeURIComponent(message)}`);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function todayDate() {
  return formatDate(new Date());
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(year, month - 1, day);
  nextDate.setDate(nextDate.getDate() + days);

  return formatDate(nextDate);
}

function qaMobile(seed: number) {
  return `9900${String(seed).padStart(6, "0")}`;
}

function nextAvailableValue(existingValues: string[], prefix: string) {
  const existing = new Set(existingValues);

  for (let index = 1; index < 1000; index += 1) {
    const value = `${prefix}${String(index).padStart(3, "0")}`;

    if (!existing.has(value)) {
      return value;
    }
  }

  throw new Error(`Could not find an available QA value for ${prefix}.`);
}

function maybeNote(log: string[], message: string) {
  log.push(message);
}

async function requireAdminProfile(supabase: SupabaseClient) {
  const profile = await getCurrentInternalUser(supabase, "/qa-seed");

  if (!isAdmin(profile)) {
    redirectWithMessage("error", "Only Admin users can create QA seed data.");
  }

  return profile as User;
}

async function requireActiveUser(
  supabase: SupabaseClient,
  email: string,
  expectedRole: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load ${email}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Missing internal QA user: ${email}.`);
  }

  if (!data.is_active) {
    throw new Error(`QA user is inactive: ${email}.`);
  }

  if (data.role !== expectedRole) {
    throw new Error(`${email} must have role ${expectedRole}.`);
  }

  return data as User;
}

async function loadRequiredUsers(
  supabase: SupabaseClient,
  adminProfile: User
): Promise<RequiredUsers> {
  const [rsm, salesperson, researchAssistant, agronomist, rdHead] =
    await Promise.all([
      requireActiveUser(supabase, "raju@jivawater.com", "RSM"),
      requireActiveUser(supabase, "sabareesan@jivawater.com", "Salesperson"),
      requireActiveUser(
        supabase,
        "research.test@jivawater.com",
        "Research Assistant"
      ),
      requireActiveUser(supabase, "kirankalyan@jivawater.com", "Agronomist"),
      requireActiveUser(supabase, "abhishek@jivawater.com", "R&D Head")
    ]);

  return {
    admin: adminProfile,
    agronomist,
    rdHead,
    researchAssistant,
    rsm,
    salesperson
  };
}

async function ensureResearchAssistantReportsToAgronomist({
  log,
  supabase,
  users
}: {
  log: string[];
  supabase: SupabaseClient;
  users: RequiredUsers;
}) {
  if (users.researchAssistant.reports_to_user_id === users.agronomist.id) {
    return;
  }

  const { error } = await supabase
    .from("users")
    .update({ reports_to_user_id: users.agronomist.id })
    .eq("id", users.researchAssistant.id);

  if (error) {
    throw new Error(
      `Could not assign Research Assistant to Agronomist: ${error.message}`
    );
  }

  users.researchAssistant = {
    ...users.researchAssistant,
    reports_to_user_id: users.agronomist.id
  };
  maybeNote(
    log,
    "Updated QA reporting line: research.test@jivawater.com now reports to kirankalyan@jivawater.com."
  );
}

async function ensureKarnatakaRegion(
  supabase: SupabaseClient,
  rsm: User
): Promise<Region> {
  const { data, error } = await supabase
    .from("regions")
    .select("*")
    .eq("state", QA_STATE)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load Karnataka region: ${error.message}`);
  }

  if (data) {
    return data as Region;
  }

  const { data: created, error: createError } = await supabase
    .from("regions")
    .insert({
      region_name: "QA Karnataka Region",
      state: QA_STATE,
      rsm_user_id: rsm.id,
      annual_device_target: 0,
      is_active: true
    })
    .select("*")
    .single();

  if (createError || !created) {
    throw new Error(
      `Could not create QA Karnataka region: ${createError?.message ?? ""}`
    );
  }

  return created as Region;
}

async function ensureWarehouseDevice({
  log,
  supabase,
  user
}: {
  log: string[];
  supabase: SupabaseClient;
  user: User;
}) {
  const { data: available, error: availableError } = await supabase
    .from("devices")
    .select("*")
    .ilike("serial_number", "QA-WH-DEVICE-%")
    .eq("device_status", "In Warehouse")
    .eq("current_holder_type", "Warehouse")
    .is("linked_installation_id", null)
    .is("deleted_at", null)
    .order("serial_number", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (availableError) {
    throw new Error(
      `Could not find available QA warehouse device: ${availableError.message}`
    );
  }

  if (available) {
    maybeNote(log, `Clean warehouse device ready: ${available.serial_number}.`);
    return available as Device;
  }

  const { data: existingSerials, error: serialError } = await supabase
    .from("devices")
    .select("serial_number")
    .ilike("serial_number", "QA-WH-DEVICE-%");

  if (serialError) {
    throw new Error(`Could not check QA device serials: ${serialError.message}`);
  }

  const serialNumber = nextAvailableValue(
    (existingSerials ?? []).map((row) => row.serial_number),
    "QA-WH-DEVICE-"
  );
  const payload: DeviceInsert = {
    serial_number: serialNumber,
    product_model: "Vipasa",
    device_status: "In Warehouse",
    current_holder_type: "Warehouse",
    stock_entry_source: "Production",
    stock_entry_date: todayDate(),
    stock_entered_by_user_id: user.id,
    created_by_user_id: user.id,
    current_state: QA_STATE,
    current_district: QA_DISTRICT,
    remarks: "QA test device for RLS installation flow"
  };

  const { data, error } = await supabase
    .from("devices")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Could not create QA warehouse device: ${error?.message}`);
  }

  maybeNote(log, `Created clean warehouse device: ${serialNumber}.`);
  return data as Device;
}

async function ensureNamedDevice({
  admin,
  code,
  holderName,
  supabase
}: {
  admin: User;
  code: string;
  holderName: string;
  supabase: SupabaseClient;
}) {
  const serialNumber = `QA-${code}-DEVICE-001`;
  const { data: existing, error: existingError } = await supabase
    .from("devices")
    .select("*")
    .eq("serial_number", serialNumber)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Could not load ${serialNumber}: ${existingError.message}`);
  }

  if (existing) {
    return existing as Device;
  }

  const payload: DeviceInsert = {
    serial_number: serialNumber,
    product_model: "Vipasa",
    device_status: "Installed at Farmer Site",
    current_holder_type: "Farmer",
    current_holder_name_snapshot: holderName,
    current_location_text: `${QA_VILLAGE}, ${QA_DISTRICT}, ${QA_STATE}`,
    current_state: QA_STATE,
    current_district: QA_DISTRICT,
    stock_entry_source: "Production",
    stock_entry_date: todayDate(),
    installation_date: todayDate(),
    stock_entered_by_user_id: admin.id,
    created_by_user_id: admin.id,
    remarks: `QA device for ${code} follow-up flow`
  };

  const { data, error } = await supabase
    .from("devices")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Could not create ${serialNumber}: ${error?.message}`);
  }

  return data as Device;
}

async function nextLeadCode(supabase: SupabaseClient, prefix: string) {
  const { data, error } = await supabase
    .from("farmer_leads")
    .select("lead_code")
    .ilike("lead_code", `${prefix}%`);

  if (error) {
    throw new Error(`Could not check QA lead codes: ${error.message}`);
  }

  return nextAvailableValue(
    (data ?? []).map((row) => row.lead_code),
    prefix
  );
}

async function findOpenLead(
  supabase: SupabaseClient,
  prefix: string,
  ownerId: string,
  createdById?: string
) {
  let query = supabase
    .from("farmer_leads")
    .select("*")
    .ilike("lead_code", `${prefix}%`)
    .eq("owner_user_id", ownerId)
    .is("linked_installation_id", null)
    .is("deleted_at", null)
    .order("lead_code", { ascending: true })
    .limit(1);

  if (createdById) {
    query = query.eq("created_by_user_id", createdById);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Could not load QA farmer lead: ${error.message}`);
  }

  return data as FarmerLead | null;
}

async function ensureFarmerLead({
  createdBy,
  farmerName,
  leadCodePrefix,
  owner,
  region,
  rsm,
  source,
  supabase
}: {
  createdBy: User;
  farmerName: string;
  leadCodePrefix: string;
  owner: User;
  region: Region;
  rsm: User;
  source: string;
  supabase: SupabaseClient;
}) {
  const existing = await findOpenLead(
    supabase,
    leadCodePrefix,
    owner.id,
    createdBy.id
  );

  if (existing) {
    return existing;
  }

  const leadCode = await nextLeadCode(supabase, leadCodePrefix);
  const suffix = Number(leadCode.slice(-3)) || 1;
  const payload: FarmerLeadInsert = {
    lead_code: leadCode,
    lead_type: "New Farmer Lead",
    lead_source: source,
    created_by_user_id: createdBy.id,
    owner_user_id: owner.id,
    rsm_user_id: rsm.id,
    region_id: region.id,
    farmer_name: farmerName,
    mobile_number: qaMobile(100 + suffix),
    state: QA_STATE,
    district: QA_DISTRICT,
    taluk: "QA Taluk",
    village: QA_VILLAGE,
    full_address: `${QA_VILLAGE}, ${QA_DISTRICT}, ${QA_STATE}`,
    primary_crop: "Paddy",
    crop_stage: "Vegetative",
    irrigation_type: "Drip",
    water_source: "Borewell",
    product_recommended: "Vipasa",
    quantity_potential: 1,
    funnel_stage: "Lead Captured",
    lead_status: "Open",
    next_action_date: addDays(todayDate(), 7),
    followup_priority: "Medium",
    remarks: `QA farmer lead for ${farmerName} RLS testing`
  };

  const { data, error } = await supabase
    .from("farmer_leads")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Could not create QA farmer lead: ${error?.message}`);
  }

  return data as FarmerLead;
}

async function ensureInstallation({
  admin,
  device,
  followupOwner,
  installationCode,
  lead,
  supabase
}: {
  admin: User;
  device: Device;
  followupOwner: User;
  installationCode: string;
  lead: FarmerLead;
  supabase: SupabaseClient;
}) {
  const { data: existing, error: existingError } = await supabase
    .from("installations")
    .select("*")
    .eq("installation_code", installationCode)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Could not load QA installation ${installationCode}: ${existingError.message}`
    );
  }

  if (existing) {
    return existing as Installation;
  }

  const payload: InstallationInsert = {
    installation_code: installationCode,
    installation_date: todayDate(),
    installation_type: "Farmer Sale Installation",
    installation_status: "Installed",
    created_by_user_id: admin.id,
    installed_by_user_id: admin.id,
    farmer_lead_id: lead.id,
    device_id: device.id,
    rsm_user_id: lead.rsm_user_id,
    region_id: lead.region_id,
    farmer_name_snapshot: lead.farmer_name,
    farmer_mobile_snapshot: lead.mobile_number,
    state: lead.state,
    district: lead.district,
    taluk: lead.taluk,
    village: lead.village,
    installation_address: lead.full_address,
    gps_latitude: 12.9716,
    gps_longitude: 77.5946,
    product_model: device.product_model,
    serial_number_snapshot: device.serial_number,
    previous_holder_type: "Warehouse",
    installation_method: "New Installation",
    irrigation_line_type: "Drip Line",
    fitment_status: "Good",
    farmer_confirmation: "Yes",
    installation_photo_link: QA_PHOTO_LINK,
    installation_notes: `QA installation for ${installationCode}`,
    followup_due_date: todayDate(),
    followup_owner_user_id: followupOwner.id
  };

  const { data, error } = await supabase
    .from("installations")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Could not create QA installation: ${error?.message}`);
  }

  await supabase
    .from("devices")
    .update({
      current_holder_type: "Farmer",
      current_holder_id: lead.id,
      current_holder_name_snapshot: lead.farmer_name,
      current_location_text: `${lead.village}, ${lead.district}, ${lead.state}`,
      linked_farmer_lead_id: lead.id,
      linked_installation_id: data.id,
      installation_date: payload.installation_date
    })
    .eq("id", device.id);

  await supabase
    .from("farmer_leads")
    .update({
      linked_installation_id: data.id,
      installation_completed: true,
      funnel_stage: "Device Installed"
    })
    .eq("id", lead.id);

  return data as Installation;
}

async function ensureDueFollowup({
  admin,
  codePrefix,
  device,
  installation,
  lead,
  owner,
  supabase
}: {
  admin: User;
  codePrefix: string;
  device: Device;
  installation: Installation;
  lead: FarmerLead | null;
  owner: User;
  supabase: SupabaseClient;
}) {
  const { data: existingDue, error: dueError } = await supabase
    .from("followups")
    .select("*")
    .ilike("followup_code", `${codePrefix}%`)
    .eq("followup_owner_user_id", owner.id)
    .eq("followup_status", "Due")
    .is("deleted_at", null)
    .order("followup_code", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (dueError) {
    throw new Error(`Could not load QA follow-up: ${dueError.message}`);
  }

  if (existingDue) {
    return existingDue as Followup;
  }

  const { data: existingCodes, error: codeError } = await supabase
    .from("followups")
    .select("followup_code")
    .ilike("followup_code", `${codePrefix}%`);

  if (codeError) {
    throw new Error(`Could not check QA follow-up codes: ${codeError.message}`);
  }

  const followupCode = nextAvailableValue(
    (existingCodes ?? []).map((row) => row.followup_code),
    codePrefix
  );
  const payload: FollowupInsert = {
    followup_code: followupCode,
    followup_type: "Farmer Sale 15-Day Follow-up",
    followup_status: "Due",
    followup_due_date: todayDate(),
    created_by_user_id: admin.id,
    followup_owner_user_id: owner.id,
    farmer_lead_id: lead?.id ?? null,
    installation_id: installation.id,
    device_id: device.id,
    followup_method: "Field Visit",
    farmer_feedback: `QA farmer feedback starter for ${followupCode}`,
    farmer_satisfaction: "Satisfied",
    fitment_inspection_status: "Good",
    device_working_status: "Working",
    issue_observed: false,
    repeat_purchase_interest: "Not Discussed",
    referral_interest: "Not Discussed",
    followup_summary: `QA due follow-up for ${owner.email}`,
    outcome: "Follow-up Required",
    next_action_required: false
  };

  const { data, error } = await supabase
    .from("followups")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Could not create QA follow-up: ${error?.message}`);
  }

  await supabase
    .from("installations")
    .update({ linked_followup_id: data.id })
    .eq("id", installation.id);

  return data as Followup;
}

async function ensurePilot({
  region,
  supabase,
  users
}: {
  region: Region;
  supabase: SupabaseClient;
  users: RequiredUsers;
}) {
  const lead = await ensureFarmerLead({
    createdBy: users.researchAssistant,
    farmerName: "QA Pilot Farmer",
    leadCodePrefix: "QA-PILOT-LEAD-",
    owner: users.rsm,
    region,
    rsm: users.rsm,
    source: "Research Assistant Field Visit",
    supabase
  });

  const { data: existing, error: existingError } = await supabase
    .from("pilots")
    .select("*")
    .eq("pilot_name", "QA Pilot - RA Agronomist RLS")
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Could not load QA pilot: ${existingError.message}`);
  }

  if (existing) {
    return {
      lead,
      pilot: existing as Pilot
    };
  }

  const payload: PilotInsert = {
    pilot_name: "QA Pilot - RA Agronomist RLS",
    pilot_type: "Farmer Validation Pilot",
    pilot_objective: "QA pilot for Research Assistant, Agronomist, and R&D Head role testing.",
    pilot_status: "Monitoring Active",
    created_by_user_id: users.admin.id,
    pilot_owner_user_id: users.agronomist.id,
    research_assistant_user_id: users.researchAssistant.id,
    agronomist_user_id: users.agronomist.id,
    rd_head_user_id: users.rdHead.id,
    rsm_user_id: users.rsm.id,
    region_id: region.id,
    farmer_lead_id: lead.id,
    farmer_name_snapshot: lead.farmer_name,
    farmer_mobile_snapshot: lead.mobile_number,
    state: lead.state,
    district: lead.district,
    taluk: lead.taluk,
    village: lead.village,
    location_or_cluster_name: "QA Pilot Cluster",
    crop: "Paddy",
    crop_stage_at_start: "Vegetative",
    pilot_area_acres: 1,
    control_area_acres: 1,
    irrigation_type: "Drip",
    water_source: "Borewell",
    treatment_plot_description: "QA treatment plot for Vipasa.",
    control_plot_description: "QA control plot beside treatment plot.",
    control_available: true,
    control_farmer_same: true,
    control_crop_same: true,
    control_irrigation_same: true,
    comparison_method: "Same Farmer - Adjacent Plot",
    product_model: "Vipasa",
    monitoring_start_date: todayDate(),
    expected_monitoring_end_date: addDays(todayDate(), 45),
    monitoring_frequency: "Weekly",
    next_visit_due_date: todayDate(),
    total_visits_planned: 1,
    track_farmer_feedback: true,
    pilot_result_status: "Ongoing",
    result_summary: "QA pilot result is ongoing.",
    pilot_folder_link: "https://example.com/qa-pilot-folder"
  };

  const { data, error } = await supabase
    .from("pilots")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Could not create QA pilot: ${error?.message}`);
  }

  await supabase
    .from("farmer_leads")
    .update({ linked_pilot_id: data.id })
    .eq("id", lead.id);

  return {
    lead,
    pilot: data as Pilot
  };
}

async function ensurePilotVisit({
  pilot,
  supabase,
  users
}: {
  pilot: Pilot;
  supabase: SupabaseClient;
  users: RequiredUsers;
}) {
  const { data: existing, error: existingError } = await supabase
    .from("pilot_visits")
    .select("*")
    .eq("pilot_id", pilot.id)
    .eq("visit_status", "Planned")
    .eq("visit_report_required", true)
    .is("visit_report_id", null)
    .order("visit_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Could not load QA pilot visit: ${existingError.message}`);
  }

  if (existing) {
    return existing as PilotVisit;
  }

  const payload: PilotVisitInsert = {
    pilot_id: pilot.id,
    visit_date: todayDate(),
    visit_number: 1,
    visit_type: "Monitoring Visit",
    visit_status: "Planned",
    visited_by_user_id: users.researchAssistant.id,
    accompanied_by_user_id: users.agronomist.id,
    rd_head_user_id: users.rdHead.id,
    visit_summary: "QA planned monitoring visit requiring a report.",
    visit_report_required: true,
    action_required: false
  };

  const { data, error } = await supabase
    .from("pilot_visits")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Could not create QA pilot visit: ${error?.message}`);
  }

  return data as PilotVisit;
}

async function ensureSubmittedFinalPilotReport({
  pilot,
  supabase,
  users
}: {
  pilot: Pilot;
  supabase: SupabaseClient;
  users: RequiredUsers;
}) {
  const { data: existing, error: existingError } = await supabase
    .from("visit_reports")
    .select("*")
    .eq("pilot_id", pilot.id)
    .eq("report_type", "Final Pilot Report")
    .eq("report_status", "Submitted")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Could not load QA final pilot report: ${existingError.message}`
    );
  }

  if (existing) {
    return existing as VisitReport;
  }

  const payload: VisitReportInsert = {
    report_type: "Final Pilot Report",
    report_status: "Submitted",
    submitted_by_user_id: users.agronomist.id,
    reviewed_by_user_id: users.rdHead.id,
    pilot_id: pilot.id,
    farmer_lead_id: pilot.farmer_lead_id,
    crop: "Paddy",
    report_title: "QA Final Pilot Report Approval Test",
    report_summary: "QA submitted final pilot report for R&D Head approval testing.",
    report_link: "https://example.com/qa-final-pilot-report",
    recommendation: "QA approval test only."
  };

  const { data, error } = await supabase
    .from("visit_reports")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Could not create QA final report: ${error?.message}`);
  }

  return data as VisitReport;
}

export async function createQaSeedDataAction() {
  if (!isQaSeedEnabled()) {
    redirectWithMessage("error", "QA seed tools are disabled in this environment.");
  }

  const supabase = await createClient();
  const adminProfile = await requireAdminProfile(supabase);
  const log: string[] = [];
  let successMessage = "";

  try {
    const users = await loadRequiredUsers(supabase, adminProfile);
    await ensureResearchAssistantReportsToAgronomist({
      log,
      supabase,
      users
    });
    const region = await ensureKarnatakaRegion(supabase, users.rsm);
    const cleanWarehouseDevice = await ensureWarehouseDevice({
      log,
      supabase,
      user: users.admin
    });

    const rsmInstallLead = await ensureFarmerLead({
      createdBy: users.admin,
      farmerName: "QA RSM Installation Farmer",
      leadCodePrefix: "QA-RSM-INSTALL-LEAD-",
      owner: users.rsm,
      region,
      rsm: users.rsm,
      source: "Management Reference",
      supabase
    });

    const salespersonLead = await ensureFarmerLead({
      createdBy: users.admin,
      farmerName: "QA Salesperson Follow-up Farmer",
      leadCodePrefix: "QA-SP-FU-LEAD-",
      owner: users.salesperson,
      region,
      rsm: users.rsm,
      source: "Salesperson Field Visit",
      supabase
    });
    const rsmFollowupLead = await ensureFarmerLead({
      createdBy: users.admin,
      farmerName: "QA RSM Follow-up Farmer",
      leadCodePrefix: "QA-RSM-FU-LEAD-",
      owner: users.rsm,
      region,
      rsm: users.rsm,
      source: "Management Reference",
      supabase
    });
    const researchLead = await ensureFarmerLead({
      createdBy: users.researchAssistant,
      farmerName: "QA Research Assistant Follow-up Farmer",
      leadCodePrefix: "QA-RA-FU-LEAD-",
      owner: users.rsm,
      region,
      rsm: users.rsm,
      source: "Research Assistant Field Visit",
      supabase
    });
    const agronomistLead = await ensureFarmerLead({
      createdBy: users.researchAssistant,
      farmerName: "QA Agronomist Follow-up Farmer",
      leadCodePrefix: "QA-AGRO-FU-LEAD-",
      owner: users.rsm,
      region,
      rsm: users.rsm,
      source: "Research Assistant Field Visit",
      supabase
    });

    const salespersonDevice = await ensureNamedDevice({
      admin: users.admin,
      code: "SP-FU",
      holderName: salespersonLead.farmer_name,
      supabase
    });
    const rsmDevice = await ensureNamedDevice({
      admin: users.admin,
      code: "RSM-FU",
      holderName: rsmFollowupLead.farmer_name,
      supabase
    });
    const researchDevice = await ensureNamedDevice({
      admin: users.admin,
      code: "RA-FU",
      holderName: researchLead.farmer_name,
      supabase
    });
    const agronomistDevice = await ensureNamedDevice({
      admin: users.admin,
      code: "AGRO-FU",
      holderName: agronomistLead.farmer_name,
      supabase
    });

    const salespersonInstallation = await ensureInstallation({
      admin: users.admin,
      device: salespersonDevice,
      followupOwner: users.salesperson,
      installationCode: "QA-SP-FU-INSTALL-001",
      lead: salespersonLead,
      supabase
    });
    const rsmInstallation = await ensureInstallation({
      admin: users.admin,
      device: rsmDevice,
      followupOwner: users.rsm,
      installationCode: "QA-RSM-FU-INSTALL-001",
      lead: rsmFollowupLead,
      supabase
    });
    const researchInstallation = await ensureInstallation({
      admin: users.admin,
      device: researchDevice,
      followupOwner: users.researchAssistant,
      installationCode: "QA-RA-FU-INSTALL-001",
      lead: researchLead,
      supabase
    });
    const agronomistInstallation = await ensureInstallation({
      admin: users.admin,
      device: agronomistDevice,
      followupOwner: users.agronomist,
      installationCode: "QA-AGRO-FU-INSTALL-001",
      lead: agronomistLead,
      supabase
    });

    const salespersonFollowup = await ensureDueFollowup({
      admin: users.admin,
      codePrefix: "QA-FU-SP-",
      device: salespersonDevice,
      installation: salespersonInstallation,
      lead: salespersonLead,
      owner: users.salesperson,
      supabase
    });
    const rsmFollowup = await ensureDueFollowup({
      admin: users.admin,
      codePrefix: "QA-FU-RSM-",
      device: rsmDevice,
      installation: rsmInstallation,
      lead: rsmFollowupLead,
      owner: users.rsm,
      supabase
    });
    const researchFollowup = await ensureDueFollowup({
      admin: users.admin,
      codePrefix: "QA-FU-RA-",
      device: researchDevice,
      installation: researchInstallation,
      lead: researchLead,
      owner: users.researchAssistant,
      supabase
    });
    const agronomistFollowup = await ensureDueFollowup({
      admin: users.admin,
      codePrefix: "QA-FU-AGRO-",
      device: agronomistDevice,
      installation: agronomistInstallation,
      lead: agronomistLead,
      owner: users.agronomist,
      supabase
    });

    const { pilot } = await ensurePilot({
      region,
      supabase,
      users
    });
    const pilotVisit = await ensurePilotVisit({
      pilot,
      supabase,
      users
    });
    const finalReport = await ensureSubmittedFinalPilotReport({
      pilot,
      supabase,
      users
    });

    await supabase
      .from("farmer_leads")
      .update({
        remarks: `QA RSM installation flow lead. Use warehouse device ${cleanWarehouseDevice.serial_number}.`
      })
      .eq("id", rsmInstallLead.id);

    revalidatePath("/devices");
    revalidatePath("/farmer-leads");
    revalidatePath("/follow-ups");
    revalidatePath("/installations");
    revalidatePath("/pilots");

    successMessage = [
      `Warehouse device: ${cleanWarehouseDevice.serial_number}`,
      `RSM installation lead: ${rsmInstallLead.lead_code}`,
      `Follow-ups: ${salespersonFollowup.followup_code}, ${rsmFollowup.followup_code}, ${researchFollowup.followup_code}, ${agronomistFollowup.followup_code}`,
      `Pilot: ${pilot.pilot_code}`,
      `Pilot visit: ${pilotVisit.visit_code}`,
      `Final report: ${finalReport.visit_report_code}`,
      ...log
    ].join(" | ");
  } catch (error) {
    redirectWithMessage(
      "error",
      error instanceof Error ? error.message : "QA seed data was not created."
    );
  }

  redirectWithMessage("created", successMessage);
}
