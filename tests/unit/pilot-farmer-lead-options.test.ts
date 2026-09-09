import { describe, expect, it } from "vitest";
import {
  loadPilotFarmerLeadOptions
} from "@/lib/pilots/farmer-lead-options";
import type { PilotFarmerLeadOption } from "@/lib/pilots/types";

function farmerLead(index: number): PilotFarmerLeadOption {
  return {
    id: `lead-${String(index).padStart(4, "0")}`,
    lead_code: `JFD-${index}`,
    farmer_name: `Farmer ${index}`,
    mobile_number: String(9000000000 + index),
    state: "Tamil Nadu",
    district: "Coimbatore",
    taluk: null,
    village: "Test Village",
    primary_crop: "Rice / Paddy",
    other_primary_crop: null,
    crop_stage: null,
    irrigation_type: "Drip",
    water_source: null,
    soil_type: null,
    crop_area_acres: null,
    linked_dealer_id: null,
    linked_institution_id: null,
    linked_pilot_id: null,
    lead_status: "Open",
    funnel_stage: "Lead Captured",
    rsm_user_id: "rsm-user",
    region_id: "tamil-nadu-region"
  };
}

function fakeSupabase(rows: PilotFarmerLeadOption[]) {
  const requestedRanges: Array<[number, number]> = [];

  const client = {
    from: () => {
      const query = {
        select: () => query,
        is: () => query,
        not: () => query,
        order: () => query,
        range: (from: number, to: number) => {
          requestedRanges.push([from, to]);
          return Promise.resolve({
            data: rows.slice(from, to + 1),
            error: null
          });
        }
      };

      return query;
    }
  };

  return { client, requestedRanges };
}

describe("loadPilotFarmerLeadOptions", () => {
  it("keeps eligible leads searchable beyond the first 500 records", async () => {
    const rows = Array.from({ length: 802 }, (_, index) => farmerLead(index + 1));
    const { client, requestedRanges } = fakeSupabase(rows);

    const result = await loadPilotFarmerLeadOptions(client as never, {
      user: {
        id: "research-assistant",
        role: "Research Assistant",
        secondary_role: null,
        region_id: "tamil-nadu-region",
        state: null
      }
    });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(802);
    expect(result.data.at(-1)?.id).toBe("lead-0802");
    expect(requestedRanges).toEqual([
      [0, 499],
      [500, 999]
    ]);
  });
});
