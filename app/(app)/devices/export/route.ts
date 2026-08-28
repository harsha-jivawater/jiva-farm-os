import {
  approvalStatusOptions,
  deviceStatusOptions,
  holderTypeOptions,
  inventoryPoolOptions,
  labelFor,
  productModelOptions,
  returnDecisionOptions,
  stockEntrySourceOptions
} from "@/lib/devices/options";
import type { Device, DeviceFilters } from "@/lib/devices/types";
import {
  csvDate,
  csvDisplay,
  csvResponse,
  yesNo
} from "@/lib/export/csv";
import { applyLocationFilter } from "@/lib/filters/location";
import { createClient } from "@/lib/supabase/server";
import { getCurrentInternalUser } from "@/lib/users/current-user";
import { canViewModule } from "@/lib/users/permissions";
import { deviceScope } from "@/lib/users/record-scope";

type UserRow = {
  full_name: string;
  id: string;
  role: string;
};

const filterColumns = [
  "product_model",
  "inventory_pool",
  "device_status",
  "current_holder_type"
] as const;

const exportSelectColumns = [
  "id",
  "device_code",
  "serial_number",
  "product_model",
  "device_status",
  "inventory_pool",
  "stock_entry_source",
  "stock_entered_by_user_id",
  "created_by_user_id",
  "remarks",
  "current_holder_type",
  "current_holder_id",
  "current_holder_name_snapshot",
  "current_location_text",
  "current_state",
  "current_district",
  "linked_farmer_lead_id",
  "linked_dealer_id",
  "linked_institution_id",
  "linked_pilot_id",
  "linked_dispatch_id",
  "linked_installation_id",
  "stock_entry_date",
  "reserved_date",
  "dispatch_date",
  "installation_date",
  "return_date",
  "return_decision",
  "return_reason",
  "return_photo_link",
  "return_approval_status",
  "return_approved_by_user_id",
  "return_approved_at",
  "return_approval_comments",
  "manual_adjustment_reason",
  "manual_adjustment_approval_status",
  "manual_adjustment_approved_by_user_id",
  "manual_adjustment_approved_at",
  "manual_adjustment_approval_comments",
  "last_movement_date",
  "created_at",
  "updated_at",
  "deleted_at"
].join(",");

const deviceExportPageSize = 1_000;
const maxDeviceExportRows = 50_000;

function paramValue(value: string | null) {
  return value ?? "";
}

function optionFilterValue(
  value: string | null,
  options: ReadonlyArray<{ value: string; label: string }>
) {
  const filterValue = paramValue(value);

  return filterValue &&
    options.some((option) => option.value === filterValue)
    ? filterValue
    : "";
}

function readFilters(searchParams: URLSearchParams): DeviceFilters {
  return {
    current_district: paramValue(searchParams.get("current_district")),
    current_holder_type: optionFilterValue(
      searchParams.get("current_holder_type"),
      holderTypeOptions
    ),
    current_state: paramValue(searchParams.get("current_state")),
    device_status: optionFilterValue(
      searchParams.get("device_status"),
      deviceStatusOptions
    ),
    inventory_pool: optionFilterValue(
      searchParams.get("inventory_pool"),
      inventoryPoolOptions
    ),
    product_model: optionFilterValue(
      searchParams.get("product_model"),
      productModelOptions
    ),
    q: paramValue(searchParams.get("q"))
  };
}

function searchValue(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function userLabel(userMap: Map<string, UserRow>, id: string | null) {
  if (!id) {
    return "";
  }

  const user = userMap.get(id);
  return user ? `${user.full_name} · ${user.role}` : id;
}

async function loadDevicesForExport({
  filters,
  scope,
  supabase
}: {
  filters: DeviceFilters;
  scope: Awaited<ReturnType<typeof deviceScope>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const cleanedSearch = searchValue(filters.q);
  const devices: Device[] = [];

  if (scope.noRecords) {
    return devices;
  }

  for (
    let from = 0;
    from < maxDeviceExportRows;
    from += deviceExportPageSize
  ) {
    let query = supabase
      .from("devices")
      .select(exportSelectColumns)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + deviceExportPageSize - 1);

    if (scope.orFilter) {
      query = query.or(scope.orFilter);
    }

    if (cleanedSearch) {
      query = query.or(
        [
          `serial_number.ilike.%${cleanedSearch}%`,
          `device_code.ilike.%${cleanedSearch}%`,
          `current_holder_name_snapshot.ilike.%${cleanedSearch}%`
        ].join(",")
      );
    }

    for (const column of filterColumns) {
      if (filters[column]) {
        query = query.eq(column, filters[column]);
      }
    }

    query = applyLocationFilter(query, "current_state", filters.current_state);
    query = applyLocationFilter(
      query,
      "current_district",
      filters.current_district
    );

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const pageRows = (data ?? []) as unknown as Device[];
    devices.push(...pageRows);

    if (pageRows.length < deviceExportPageSize) {
      break;
    }
  }

  return devices;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = readFilters(url.searchParams);
  const supabase = await createClient();
  const currentUser = await getCurrentInternalUser(supabase, "/devices");

  if (!canViewModule(currentUser, "inventory")) {
    return new Response("Access denied", { status: 403 });
  }

  const scope = await deviceScope(supabase, currentUser);

  try {
    const [{ data: users }, devices] = await Promise.all([
      supabase.from("users").select("id, full_name, role").limit(1000),
      loadDevicesForExport({ filters, scope, supabase })
    ]);
    const userMap = new Map(
      ((users ?? []) as UserRow[]).map((user) => [user.id, user])
    );

    return csvResponse({
      columns: [
        { header: "Serial number", value: (device) => device.serial_number },
        { header: "Device code", value: (device) => csvDisplay(device.device_code) },
        {
          header: "Product model",
          value: (device) => labelFor(device.product_model, productModelOptions)
        },
        {
          header: "Inventory pool",
          value: (device) => labelFor(device.inventory_pool, inventoryPoolOptions)
        },
        {
          header: "Device status",
          value: (device) => labelFor(device.device_status, deviceStatusOptions)
        },
        {
          header: "Stock entry source",
          value: (device) =>
            labelFor(device.stock_entry_source, stockEntrySourceOptions)
        },
        {
          header: "Stock entry date",
          value: (device) => csvDate(device.stock_entry_date)
        },
        {
          header: "Stock entered by",
          value: (device) =>
            userLabel(userMap, device.stock_entered_by_user_id)
        },
        {
          header: "Created by",
          value: (device) => userLabel(userMap, device.created_by_user_id)
        },
        {
          header: "Current holder type",
          value: (device) =>
            labelFor(device.current_holder_type, holderTypeOptions)
        },
        {
          header: "Current holder ID",
          value: (device) => csvDisplay(device.current_holder_id)
        },
        {
          header: "Current holder name",
          value: (device) =>
            csvDisplay(device.current_holder_name_snapshot)
        },
        {
          header: "Current location",
          value: (device) => csvDisplay(device.current_location_text)
        },
        {
          header: "Current district",
          value: (device) => csvDisplay(device.current_district)
        },
        {
          header: "Current state",
          value: (device) => csvDisplay(device.current_state)
        },
        {
          header: "Linked farmer lead ID",
          value: (device) => csvDisplay(device.linked_farmer_lead_id)
        },
        {
          header: "Linked dealer ID",
          value: (device) => csvDisplay(device.linked_dealer_id)
        },
        {
          header: "Linked institution ID",
          value: (device) => csvDisplay(device.linked_institution_id)
        },
        {
          header: "Linked pilot ID",
          value: (device) => csvDisplay(device.linked_pilot_id)
        },
        {
          header: "Linked dispatch ID",
          value: (device) => csvDisplay(device.linked_dispatch_id)
        },
        {
          header: "Linked installation ID",
          value: (device) => csvDisplay(device.linked_installation_id)
        },
        {
          header: "Reserved date",
          value: (device) => csvDate(device.reserved_date)
        },
        {
          header: "Dispatch date",
          value: (device) => csvDate(device.dispatch_date)
        },
        {
          header: "Installation date",
          value: (device) => csvDate(device.installation_date)
        },
        {
          header: "Return date",
          value: (device) => csvDate(device.return_date)
        },
        {
          header: "Return decision",
          value: (device) =>
            labelFor(device.return_decision, returnDecisionOptions)
        },
        {
          header: "Return reason",
          value: (device) => csvDisplay(device.return_reason)
        },
        {
          header: "Return photo link",
          value: (device) => csvDisplay(device.return_photo_link)
        },
        {
          header: "Return approval status",
          value: (device) =>
            labelFor(device.return_approval_status, approvalStatusOptions)
        },
        {
          header: "Return approved by",
          value: (device) =>
            userLabel(userMap, device.return_approved_by_user_id)
        },
        {
          header: "Return approved at",
          value: (device) => csvDate(device.return_approved_at)
        },
        {
          header: "Return approval comments",
          value: (device) =>
            csvDisplay(device.return_approval_comments)
        },
        {
          header: "Manual adjustment reason",
          value: (device) =>
            csvDisplay(device.manual_adjustment_reason)
        },
        {
          header: "Manual adjustment approval status",
          value: (device) =>
            labelFor(
              device.manual_adjustment_approval_status,
              approvalStatusOptions
            )
        },
        {
          header: "Manual adjustment approved by",
          value: (device) =>
            userLabel(
              userMap,
              device.manual_adjustment_approved_by_user_id
            )
        },
        {
          header: "Manual adjustment approved at",
          value: (device) =>
            csvDate(device.manual_adjustment_approved_at)
        },
        {
          header: "Manual adjustment approval comments",
          value: (device) =>
            csvDisplay(device.manual_adjustment_approval_comments)
        },
        {
          header: "Last movement date",
          value: (device) => csvDate(device.last_movement_date)
        },
        { header: "Remarks", value: (device) => csvDisplay(device.remarks) },
        {
          header: "Created date",
          value: (device) => csvDate(device.created_at)
        },
        {
          header: "Updated date",
          value: (device) => csvDate(device.updated_at)
        },
        {
          header: "Deleted",
          value: (device) => yesNo(Boolean(device.deleted_at))
        },
        { header: "Record link", value: (device) => `/devices/${device.id}` }
      ],
      filenameBase: "inventory-devices",
      rows: devices
    });
  } catch (error) {
    console.error("[Inventory Export] Export failed", error);
    return new Response("Could not export Inventory.", { status: 500 });
  }
}
