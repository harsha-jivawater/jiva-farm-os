import { createPilotAction } from "@/app/(app)/pilots/actions";
import { PageHeader } from "@/components/page-header";
import { PilotForm } from "@/components/pilots/pilot-form";
import type {
  PilotDealerOption,
  PilotDeviceOption,
  PilotFarmerLeadOption,
  PilotInstitutionOption,
  RegionOption,
  UserOption
} from "@/lib/pilots/types";
import { loadPilotFarmerLeadOptions } from "@/lib/pilots/farmer-lead-options";
import { createClient } from "@/lib/supabase/server";
import { requireModuleWriteAccess } from "@/lib/users/server-permissions";

type NewPilotPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewPilotPage({ searchParams }: NewPilotPageProps) {
  const query = await searchParams;
  const supabase = await createClient();
  const currentUser = await requireModuleWriteAccess(
    supabase,
    "/pilots",
    "pilots",
    "You do not have permission to create pilots."
  );
  const [
    { data: farmerLeads, error: farmerLeadsError },
    { data: devices },
    { data: users },
    { data: regions },
    { data: institutions },
    { data: dealers }
  ] = await Promise.all([
    loadPilotFarmerLeadOptions(supabase, { user: currentUser }),
    supabase
      .from("devices")
      .select("id, serial_number, device_code, product_model, device_status")
      .is("deleted_at", null)
      .order("serial_number", { ascending: true })
      .limit(200),
    supabase
      .from("users")
      .select("id, full_name, role, secondary_role")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("regions")
      .select("id, region_name, state")
      .eq("is_active", true)
      .order("region_name", { ascending: true }),
    supabase
      .from("institutions")
      .select("id, institution_code, organization_name")
      .is("deleted_at", null)
      .order("organization_name", { ascending: true })
      .limit(200),
    supabase
      .from("dealers")
      .select("id, dealer_code, dealer_name, firm_name")
      .is("deleted_at", null)
      .order("dealer_name", { ascending: true })
      .limit(200)
  ]);
  const farmerLeadLoadError = farmerLeadsError
    ? "Unable to load farmer leads for pilot creation. Please contact Admin."
    : null;

  if (farmerLeadsError) {
    console.error("[pilots] Farmer Lead option load failed", farmerLeadsError);
  }

  return (
    <section>
      <PageHeader
        eyebrow="R&D and field validation"
        title="Add New Pilot"
        description="Create a pilot for one farmer, crop, location, and device."
      />
      <PilotForm
        action={createPilotAction}
        cancelHref="/pilots"
        dealers={(dealers ?? []) as PilotDealerOption[]}
        devices={(devices ?? []) as PilotDeviceOption[]}
        error={query.error ?? farmerLeadLoadError}
        farmerLeads={(farmerLeads ?? []) as PilotFarmerLeadOption[]}
        institutions={(institutions ?? []) as PilotInstitutionOption[]}
        currentUser={{
          role: currentUser.role,
          secondary_role: currentUser.secondary_role
        }}
        regions={(regions ?? []) as RegionOption[]}
        users={(users ?? []) as UserOption[]}
      />
    </section>
  );
}
