


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."agreement_status" AS ENUM (
    'Not Started',
    'Draft Shared',
    'Under Review',
    'Signed',
    'Not Required',
    'Dropped'
);


ALTER TYPE "public"."agreement_status" OWNER TO "postgres";


CREATE TYPE "public"."comparison_method" AS ENUM (
    'Same Farmer - Adjacent Plot',
    'Same Farmer - Different Plot',
    'Nearby Farmer - Similar Crop',
    'Historical Baseline',
    'Before / After Only',
    'No Control Available',
    'Other'
);


ALTER TYPE "public"."comparison_method" OWNER TO "postgres";


CREATE TYPE "public"."credit_terms" AS ENUM (
    '100% Advance',
    'Approved Exception',
    'Not Applicable'
);


ALTER TYPE "public"."credit_terms" OWNER TO "postgres";


CREATE TYPE "public"."crop_option" AS ENUM (
    'Sugarcane',
    'Banana',
    'Coconut',
    'Turmeric',
    'Vegetables',
    'Gherkins',
    'Arecanut',
    'Paddy',
    'Grapes',
    'Floriculture',
    'Coffee',
    'Tea',
    'Spices',
    'Seed Production',
    'Mixed Crops',
    'Other',
    'Unknown',
    'Wheat',
    'Maize',
    'Sorghum (Jowar)',
    'Pearl millet (Bajra)',
    'Finger millet (Ragi)',
    'Barley',
    'Small millets (Foxtail, Little, Kodo, Barnyard, Proso)',
    'Chickpea (Gram)',
    'Pigeon pea (Red gram/Tur)',
    'Green gram (Moong)',
    'Black gram (Urad)',
    'Field pea',
    'Cowpea',
    'Horse gram',
    'Lablab bean',
    'Groundnut',
    'Soybean',
    'Mustard',
    'Sesame',
    'Sunflower',
    'Castor',
    'Oil palm',
    'Cotton',
    'Tobacco',
    'Jute',
    'Mesta',
    'Sunn hemp',
    'Cashew',
    'Rubber',
    'Cocoa',
    'Silver oak',
    'Napier grass',
    'Sorghum (fodder)',
    'Maize (fodder)',
    'Cowpea (fodder)',
    'Coriander',
    'Cumin',
    'Fenugreek',
    'Mango',
    'Citrus',
    'Guava',
    'Pomegranate',
    'Papaya',
    'Pineapple',
    'Sapota',
    'Aonla',
    'Watermelon',
    'Muskmelon',
    'Avocado',
    'Strawberry',
    'Tomato',
    'Brinjal (Eggplant)',
    'Okra',
    'Chilli',
    'Capsicum',
    'Cucumber',
    'Bitter gourd',
    'Bottle gourd',
    'Ridge gourd',
    'Sponge gourd',
    'Snake gourd',
    'Pumpkin',
    'Ash gourd',
    'Cabbage',
    'Cauliflower',
    'Broccoli',
    'Knol-khol',
    'Potato',
    'Onion',
    'Garlic',
    'Carrot',
    'Beetroot',
    'Radish',
    'Turnip',
    'Sweet potato',
    'Tapioca (Cassava)',
    'Elephant foot yam',
    'Hyacinth bean',
    'French bean',
    'Cluster bean',
    'Dolichos bean',
    'Garden pea',
    'Broad bean',
    'Spinach',
    'Amaranthus',
    'Lettuce',
    'Celery',
    'Marigold',
    'Rose',
    'Jasmine',
    'Chrysanthemum',
    'Tuberose',
    'Gerbera',
    'Carnation',
    'Orchid',
    'Gladiolus',
    'Lilium',
    'Ginger'
);


ALTER TYPE "public"."crop_option" OWNER TO "postgres";


CREATE TYPE "public"."crop_stage" AS ENUM (
    'Pre-sowing',
    'Sowing / Planting',
    'Vegetative',
    'Flowering',
    'Fruiting',
    'Maturity',
    'Harvest',
    'Perennial / Standing Crop',
    'Unknown'
);


ALTER TYPE "public"."crop_stage" OWNER TO "postgres";


CREATE TYPE "public"."customer_base_type" AS ENUM (
    'Small Farmers',
    'Medium Farmers',
    'Large Farmers',
    'Plantation Farmers',
    'Progressive Farmers',
    'FPO Farmers',
    'Contract Farming Farmers',
    'Mixed',
    'Unknown'
);


ALTER TYPE "public"."customer_base_type" OWNER TO "postgres";


CREATE TYPE "public"."dealer_status" AS ENUM (
    'Prospect',
    'Onboarding',
    'Active',
    'Dormant',
    'Dropped',
    'Potential Dealer',
    'First Discussion Done',
    'Profile Collected',
    'Territory Assessed',
    'Commercial Terms Shared',
    'Training Completed',
    'First Order Expected',
    'First Order Received',
    'Dealer Stock Dispatched',
    'First Farmer Installation Done',
    'Active Dealer',
    'Dormant Dealer'
);


ALTER TYPE "public"."dealer_status" OWNER TO "postgres";


CREATE TYPE "public"."dealer_status_legacy_20260708" AS ENUM (
    'Potential Dealer',
    'First Discussion Done',
    'Profile Collected',
    'Territory Assessed',
    'Commercial Terms Shared',
    'Training Completed',
    'First Order Expected',
    'First Order Received',
    'Dealer Stock Dispatched',
    'First Farmer Installation Done',
    'Active Dealer',
    'Dormant Dealer',
    'Dropped'
);


ALTER TYPE "public"."dealer_status_legacy_20260708" OWNER TO "postgres";


CREATE TYPE "public"."dealer_type" AS ENUM (
    'Agri Input Dealer',
    'Irrigation Dealer',
    'Farm Equipment Dealer',
    'Nursery / Plantation Dealer',
    'FPO-linked Dealer',
    'Distributor',
    'Influencer Dealer',
    'Other'
);


ALTER TYPE "public"."dealer_type" OWNER TO "postgres";


CREATE TYPE "public"."decision_maker" AS ENUM (
    'Farmer',
    'Family Member',
    'Farm Manager',
    'Dealer',
    'Institution',
    'Other',
    'Unknown'
);


ALTER TYPE "public"."decision_maker" OWNER TO "postgres";


CREATE TYPE "public"."decision_role" AS ENUM (
    'Decision Maker',
    'Influencer',
    'Technical Evaluator',
    'Finance Approver',
    'Field Coordinator',
    'Gatekeeper',
    'Unknown'
);


ALTER TYPE "public"."decision_role" OWNER TO "postgres";


CREATE TYPE "public"."department" AS ENUM (
    'Management',
    'Agronomy',
    'Procurement',
    'CSR',
    'Sustainability',
    'Finance',
    'Operations',
    'Field Team',
    'Research',
    'Technical',
    'Other'
);


ALTER TYPE "public"."department" OWNER TO "postgres";


CREATE TYPE "public"."destination_type" AS ENUM (
    'Farmer',
    'Dealer',
    'Institution',
    'Pilot',
    'Internal Transfer',
    'Replacement',
    'Other'
);


ALTER TYPE "public"."destination_type" OWNER TO "postgres";


CREATE TYPE "public"."device_condition" AS ENUM (
    'Good',
    'Needs Inspection',
    'Damaged',
    'Lost',
    'Unknown'
);


ALTER TYPE "public"."device_condition" OWNER TO "postgres";


CREATE TYPE "public"."device_inventory_pool" AS ENUM (
    'Fresh Sale',
    'Pilot Stock'
);


ALTER TYPE "public"."device_inventory_pool" OWNER TO "postgres";


CREATE TYPE "public"."device_status" AS ENUM (
    'In Warehouse',
    'Reserved',
    'Dispatch Approved',
    'Dispatched',
    'With Dealer',
    'With Farmer',
    'Installed at Farmer Site',
    'Installed for Pilot',
    'Returned',
    'Replacement',
    'Reinstalled',
    'Damaged',
    'Hold',
    'Lost',
    'Retired'
);


ALTER TYPE "public"."device_status" OWNER TO "postgres";


CREATE TYPE "public"."device_working_status" AS ENUM (
    'Working',
    'Issue Reported',
    'Needs Inspection',
    'Not Checked',
    'Not Applicable'
);


ALTER TYPE "public"."device_working_status" OWNER TO "postgres";


CREATE TYPE "public"."dispatch_status" AS ENUM (
    'Dispatch Requested',
    'Pending Payment Confirmation',
    'Pending Approval',
    'Approved for Dispatch',
    'Dispatched',
    'Delivered',
    'Installation Pending',
    'Installed',
    'On Hold',
    'Cancelled'
);


ALTER TYPE "public"."dispatch_status" OWNER TO "postgres";


CREATE TYPE "public"."dispatch_type" AS ENUM (
    'Farmer Sale Dispatch',
    'Dealer Stock Dispatch',
    'Pilot Dispatch',
    'Institution Dispatch',
    'Replacement Dispatch',
    'Internal Transfer',
    'Other'
);


ALTER TYPE "public"."dispatch_type" OWNER TO "postgres";


CREATE TYPE "public"."expected_commercial_model" AS ENUM (
    'Direct Purchase by Institution',
    'Farmer Purchase',
    'CSR Funded',
    'Shared Cost Model',
    'Dealer-Led Sale',
    'Government Program',
    'Pilot First, Commercial Later',
    'Not Yet Clear'
);


ALTER TYPE "public"."expected_commercial_model" OWNER TO "postgres";


CREATE TYPE "public"."farmer_confirmation" AS ENUM (
    'Yes',
    'No',
    'Pending',
    'Not Applicable'
);


ALTER TYPE "public"."farmer_confirmation" OWNER TO "postgres";


CREATE TYPE "public"."farmer_relationship_type" AS ENUM (
    'Contract Farming',
    'Direct Procurement',
    'Farmer Advisory',
    'Input Distribution',
    'CSR Livelihood Program',
    'FPO Network',
    'Government Program',
    'Demonstration / Extension Network',
    'Research / Validation',
    'Unknown',
    'Other'
);


ALTER TYPE "public"."farmer_relationship_type" OWNER TO "postgres";


CREATE TYPE "public"."farmer_satisfaction" AS ENUM (
    'Very Satisfied',
    'Satisfied',
    'Neutral',
    'Unsatisfied',
    'Very Unsatisfied',
    'Not Available'
);


ALTER TYPE "public"."farmer_satisfaction" OWNER TO "postgres";


CREATE TYPE "public"."fitment_inspection_status" AS ENUM (
    'Good',
    'Needs Correction',
    'Issue Found',
    'Not Checked',
    'Not Applicable'
);


ALTER TYPE "public"."fitment_inspection_status" OWNER TO "postgres";


CREATE TYPE "public"."followup_method" AS ENUM (
    'Phone Call',
    'WhatsApp',
    'Field Visit',
    'Dealer Visit',
    'Institution Meeting',
    'Other'
);


ALTER TYPE "public"."followup_method" OWNER TO "postgres";


CREATE TYPE "public"."followup_outcome" AS ENUM (
    'Positive',
    'Neutral',
    'Issue Found',
    'No Response',
    'Follow-up Required',
    'Escalated',
    'Closed'
);


ALTER TYPE "public"."followup_outcome" OWNER TO "postgres";


CREATE TYPE "public"."followup_priority" AS ENUM (
    'High',
    'Medium',
    'Low'
);


ALTER TYPE "public"."followup_priority" OWNER TO "postgres";


CREATE TYPE "public"."followup_status" AS ENUM (
    'Due',
    'Completed',
    'Missed',
    'Rescheduled',
    'Cancelled',
    'Escalated'
);


ALTER TYPE "public"."followup_status" OWNER TO "postgres";


CREATE TYPE "public"."followup_type" AS ENUM (
    'Farmer Sale 15-Day Follow-up',
    'Dealer Follow-up',
    'Institution Follow-up',
    'Pilot Follow-up',
    'Issue Follow-up',
    'Other'
);


ALTER TYPE "public"."followup_type" OWNER TO "postgres";


CREATE TYPE "public"."funnel_stage" AS ENUM (
    'Lead Captured',
    'First Contact Done',
    'Product Recommended',
    'Quotation / Estimate Shared',
    'Follow-up Active',
    'Payment Confirmed',
    'Device Dispatched',
    'Device Installed',
    '15-Day Follow-up Completed',
    'Repeat / Referral Opportunity',
    'Won',
    'Lost',
    'Parked',
    'Pilot Agreed',
    'Pilot Active',
    'Pilot Completed - Sales Follow-up'
);


ALTER TYPE "public"."funnel_stage" OWNER TO "postgres";


CREATE TYPE "public"."holder_type" AS ENUM (
    'Warehouse',
    'Dealer',
    'Farmer',
    'Pilot',
    'Institution',
    'Stock / Dispatch Team',
    'Returned Stock',
    'Damaged Stock',
    'Other'
);


ALTER TYPE "public"."holder_type" OWNER TO "postgres";


CREATE TYPE "public"."influence_level" AS ENUM (
    'High',
    'Medium',
    'Low',
    'Unknown'
);


ALTER TYPE "public"."influence_level" OWNER TO "postgres";


CREATE TYPE "public"."installation_method" AS ENUM (
    'New Installation',
    'Replacement',
    'Reinstallation',
    'Fitment Correction',
    'Other'
);


ALTER TYPE "public"."installation_method" OWNER TO "postgres";


CREATE TYPE "public"."installation_status" AS ENUM (
    'Planned',
    'Installed',
    'Verified',
    'Follow-up Pending',
    'Issue Reported',
    'Closed',
    'Cancelled'
);


ALTER TYPE "public"."installation_status" OWNER TO "postgres";


CREATE TYPE "public"."installation_type" AS ENUM (
    'Farmer Sale Installation',
    'Dealer Farmer Installation',
    'Pilot Installation',
    'Institution Installation',
    'Replacement Installation',
    'Reinstallation',
    'Internal Trial Installation',
    'Other'
);


ALTER TYPE "public"."installation_type" OWNER TO "postgres";


CREATE TYPE "public"."institution_status" AS ENUM (
    'Identified',
    'Decision Maker Identified',
    'First Meeting Done',
    'Farmer Network Mapped',
    'Crop / Geography Fit Confirmed',
    'Jiva Proposal Shared',
    'Pilot Proposal Shared',
    'Pilot Approved',
    'Pilot Installed',
    'Pilot Monitoring Active',
    'Pilot Report Submitted',
    'Scale-up Discussion',
    'PO / MoU / Commercial Discussion',
    'Scale-up Order Received',
    'Scale-up Installation Started',
    'Active Account',
    'Parked',
    'Lost'
);


ALTER TYPE "public"."institution_status" OWNER TO "postgres";


CREATE TYPE "public"."interest_level" AS ENUM (
    'Yes',
    'Maybe',
    'No',
    'Not Discussed'
);


ALTER TYPE "public"."interest_level" OWNER TO "postgres";


CREATE TYPE "public"."involvement_status" AS ENUM (
    'Yes',
    'No',
    'Maybe',
    'Already Involved'
);


ALTER TYPE "public"."involvement_status" OWNER TO "postgres";


CREATE TYPE "public"."irrigation_line_type" AS ENUM (
    'Mainline',
    'Sub-main',
    'Drip Line',
    'Sprinkler Line',
    'Flood Irrigation Line',
    'Other',
    'Unknown'
);


ALTER TYPE "public"."irrigation_line_type" OWNER TO "postgres";


CREATE TYPE "public"."irrigation_type" AS ENUM (
    'Drip',
    'Flood',
    'Sprinkler',
    'Rainfed',
    'Mixed',
    'Unknown'
);


ALTER TYPE "public"."irrigation_type" OWNER TO "postgres";


CREATE TYPE "public"."lead_source" AS ENUM (
    'Website',
    'WhatsApp',
    'Phone Call',
    'Influencer Reference',
    'Salesperson Field Visit',
    'Research Assistant Field Visit',
    'Agronomist Field Visit',
    'Intern Field Visit',
    'Exhibition / Stall',
    'Dealer Referral',
    'Corporate Referral',
    'NGO / CSR / FPO Referral',
    'Existing Farmer Referral',
    'Management Reference',
    'Other',
    'Exhibition'
);


ALTER TYPE "public"."lead_source" OWNER TO "postgres";


CREATE TYPE "public"."lead_status" AS ENUM (
    'Open',
    'Won',
    'Lost',
    'Parked'
);


ALTER TYPE "public"."lead_status" OWNER TO "postgres";


CREATE TYPE "public"."lead_type" AS ENUM (
    'New Farmer Lead',
    'Repeat Farmer Opportunity',
    'Referral Lead',
    'Dealer Generated Lead',
    'Institution Generated Lead',
    'Research Assistant Generated Lead',
    'Pilot Linked Lead',
    'Other'
);


ALTER TYPE "public"."lead_type" OWNER TO "postgres";


CREATE TYPE "public"."marketing_request_priority" AS ENUM (
    'Low',
    'Normal',
    'High',
    'Urgent'
);


ALTER TYPE "public"."marketing_request_priority" OWNER TO "postgres";


CREATE TYPE "public"."marketing_request_status" AS ENUM (
    'Requested',
    'Needs Clarification',
    'Accepted',
    'In Progress',
    'Draft Shared',
    'Corrections Requested',
    'Delivered',
    'Cancelled',
    'Completed'
);


ALTER TYPE "public"."marketing_request_status" OWNER TO "postgres";


CREATE TYPE "public"."marketing_request_type" AS ENUM (
    'Flyer',
    'Standee',
    'Brochure',
    'Presentation',
    'Social Media Creative',
    'Other'
);


ALTER TYPE "public"."marketing_request_type" OWNER TO "postgres";


CREATE TYPE "public"."marketing_request_update_type" AS ENUM (
    'Comment',
    'Clarification Requested',
    'Correction Requested',
    'Status Update',
    'Link Shared',
    'Delivery Note'
);


ALTER TYPE "public"."marketing_request_update_type" OWNER TO "postgres";


CREATE TYPE "public"."meeting_mode" AS ENUM (
    'Online',
    'In-person',
    'Phone Call',
    'Field Visit',
    'Other'
);


ALTER TYPE "public"."meeting_mode" OWNER TO "postgres";


CREATE TYPE "public"."meeting_outcome" AS ENUM (
    'Positive',
    'Neutral',
    'Negative',
    'Follow-up Required',
    'Proposal Required',
    'Pilot Proposed',
    'Pilot Approved',
    'Commercial Discussion Required',
    'Parked',
    'Lost'
);


ALTER TYPE "public"."meeting_outcome" OWNER TO "postgres";


CREATE TYPE "public"."meeting_type" AS ENUM (
    'Introductory Meeting',
    'Technical Discussion',
    'Pilot Discussion',
    'Commercial Discussion',
    'Scale-up Discussion',
    'Review Meeting',
    'Field Visit Meeting',
    'Management Meeting',
    'Other'
);


ALTER TYPE "public"."meeting_type" OWNER TO "postgres";


CREATE TYPE "public"."monitoring_frequency" AS ENUM (
    'Weekly',
    'Fortnightly',
    'Monthly',
    'Crop Stage Based',
    'Before / After Irrigation',
    'Harvest Only',
    'Custom'
);


ALTER TYPE "public"."monitoring_frequency" OWNER TO "postgres";


CREATE TYPE "public"."movement_status" AS ENUM (
    'Pending',
    'Completed',
    'Cancelled'
);


ALTER TYPE "public"."movement_status" OWNER TO "postgres";


CREATE TYPE "public"."movement_type" AS ENUM (
    'Stock Entry',
    'Reserved',
    'Dispatch',
    'Delivered',
    'Installed',
    'Returned',
    'Replacement',
    'Reinstalled',
    'Transferred to Dealer',
    'Transferred to Warehouse',
    'Marked Damaged',
    'Put on Hold',
    'Retired',
    'Other'
);


ALTER TYPE "public"."movement_type" OWNER TO "postgres";


CREATE TYPE "public"."opportunity_type" AS ENUM (
    'Pilot',
    'Validation',
    'Direct Purchase',
    'CSR Deployment',
    'Dealer / Channel Partnership',
    'Farmer Cluster Scale-up',
    'Government / Institutional Program',
    'Research Collaboration',
    'Other'
);


ALTER TYPE "public"."opportunity_type" OWNER TO "postgres";


CREATE TYPE "public"."organization_type" AS ENUM (
    'Corporate',
    'FMCG Company',
    'Food Processing Company',
    'Sugar Factory',
    'Contract Farming Company',
    'Seed Company',
    'Agri Input Company',
    'NGO',
    'CSR Program',
    'FPO',
    'Government Body',
    'Research Institution',
    'Dealer Network',
    'Other'
);


ALTER TYPE "public"."organization_type" OWNER TO "postgres";


CREATE TYPE "public"."overall_pilot_status" AS ENUM (
    'No Pilot Yet',
    'Pilot Proposed',
    'Pilot Approved',
    'Multiple Pilots Active',
    'Pilot Reports Pending',
    'Pilot Results Under Review',
    'Pilot Successful',
    'Pilot Inconclusive',
    'Pilot Failed',
    'Scale-up Discussion Active',
    'Scale-up Started',
    'Not Applicable'
);


ALTER TYPE "public"."overall_pilot_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_requirement_type" AS ENUM (
    'Payment Required',
    'Paid Pilot',
    'Unpaid Pilot',
    'Management Exception',
    'Internal Transfer',
    'Replacement / No Charge'
);


ALTER TYPE "public"."payment_requirement_type" OWNER TO "postgres";


CREATE TYPE "public"."pilot_result_status" AS ENUM (
    'Not Started',
    'Ongoing',
    'Awaiting R&D Review',
    'Successful',
    'Inconclusive',
    'Failed',
    'Not Yet Evaluated'
);


ALTER TYPE "public"."pilot_result_status" OWNER TO "postgres";


CREATE TYPE "public"."pilot_status" AS ENUM (
    'Planned',
    'Approved',
    'Device Assigned',
    'Device Dispatched',
    'Device Installed',
    'Monitoring Active',
    'Visit Report Pending',
    'Final Report Pending',
    'Final Report Submitted',
    'Final Report Reviewed',
    'Scale-up Recommended',
    'Closed - Successful',
    'Closed - Failed',
    'Closed - Inconclusive',
    'Parked',
    'Cancelled'
);


ALTER TYPE "public"."pilot_status" OWNER TO "postgres";


CREATE TYPE "public"."pilot_type" AS ENUM (
    'Institution Pilot',
    'Dealer Pilot',
    'Internal Research Pilot',
    'Farmer Validation Pilot',
    'R&D Trial',
    'Other'
);


ALTER TYPE "public"."pilot_type" OWNER TO "postgres";


CREATE TYPE "public"."priority_level" AS ENUM (
    'High',
    'Medium',
    'Low',
    'Parked'
);


ALTER TYPE "public"."priority_level" OWNER TO "postgres";


CREATE TYPE "public"."product_model" AS ENUM (
    'Vipasa',
    'Jahnavi',
    'Dihanga',
    'Not Decided'
);


ALTER TYPE "public"."product_model" OWNER TO "postgres";


CREATE TYPE "public"."product_model_strict" AS ENUM (
    'Vipasa',
    'Jahnavi',
    'Dihanga'
);


ALTER TYPE "public"."product_model_strict" OWNER TO "postgres";


CREATE TYPE "public"."rd_involvement_status" AS ENUM (
    'Yes',
    'No',
    'Already Involved',
    'Not Required'
);


ALTER TYPE "public"."rd_involvement_status" OWNER TO "postgres";


CREATE TYPE "public"."report_status" AS ENUM (
    'Draft',
    'Submitted',
    'Reviewed',
    'Revision Required',
    'Approved',
    'Archived'
);


ALTER TYPE "public"."report_status" OWNER TO "postgres";


CREATE TYPE "public"."report_type" AS ENUM (
    'Farmer Sale 15-Day Follow-up',
    'Pilot Monitoring Visit Report',
    'Technical Fitment Inspection Report',
    'Issue Visit Report',
    'Harvest / Final Observation Report',
    'Institution Visit Report',
    'Final Pilot Report',
    'Other'
);


ALTER TYPE "public"."report_type" OWNER TO "postgres";


CREATE TYPE "public"."scale_up_status" AS ENUM (
    'Not Started',
    'Discussion Active',
    'Proposal Shared',
    'Commercial Negotiation',
    'PO / Approval Pending',
    'Order Received',
    'Installation Started',
    'Active Scale-up',
    'Parked',
    'Lost'
);


ALTER TYPE "public"."scale_up_status" OWNER TO "postgres";


CREATE TYPE "public"."stock_entry_source" AS ENUM (
    'Production',
    'Return',
    'Replacement Stock',
    'Manual Adjustment',
    'Other'
);


ALTER TYPE "public"."stock_entry_source" OWNER TO "postgres";


CREATE TYPE "public"."training_status" AS ENUM (
    'Not Trained',
    'Training Scheduled',
    'Training Completed',
    'Refresher Needed'
);


ALTER TYPE "public"."training_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'Admin',
    'Management',
    'Sales Head',
    'RSM',
    'Salesperson',
    'Agronomist',
    'Research Assistant',
    'R&D Head',
    'Stock / Dispatch',
    'Accounts',
    'Viewer',
    'HR & Legal',
    'Marketing Head',
    'Designer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."visit_status" AS ENUM (
    'Planned',
    'Completed',
    'Missed',
    'Rescheduled',
    'Cancelled'
);


ALTER TYPE "public"."visit_status" OWNER TO "postgres";


CREATE TYPE "public"."visit_type" AS ENUM (
    'Baseline Visit',
    'Installation Visit',
    'Monitoring Visit',
    'Issue Visit',
    'Harvest Visit',
    'Final Observation Visit',
    'Partner Review Visit',
    'Other'
);


ALTER TYPE "public"."visit_type" OWNER TO "postgres";


CREATE TYPE "public"."water_source" AS ENUM (
    'Borewell',
    'Open Well',
    'Canal',
    'River',
    'Tank / Pond',
    'Municipal / Supplied Water',
    'Mixed Source',
    'Unknown'
);


ALTER TYPE "public"."water_source" OWNER TO "postgres";


CREATE TYPE "public"."yes_no_pending_na" AS ENUM (
    'Yes',
    'No',
    'Pending',
    'Not Applicable'
);


ALTER TYPE "public"."yes_no_pending_na" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."backfill_dispatch_work_items_batch"("p_after_created_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_after_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 1000) RETURNS TABLE("processed_count" integer, "next_created_at" timestamp with time zone, "next_id" "uuid", "has_more" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  source_row record;
  safe_limit integer := least(greatest(coalesce(p_limit, 1000), 1), 1000);
  seen_count integer := 0;
begin
  processed_count := 0;
  next_created_at := p_after_created_at;
  next_id := p_after_id;
  has_more := false;

  for source_row in
    select d.id, d.created_at
    from public.dispatches d
    where (
      p_after_created_at is null
      or d.created_at > p_after_created_at
      or (
        d.created_at = p_after_created_at
        and (p_after_id is null or d.id > p_after_id)
      )
    )
    order by d.created_at asc, d.id asc
    limit safe_limit + 1
  loop
    seen_count := seen_count + 1;

    if seen_count > safe_limit then
      has_more := true;
      exit;
    end if;

    perform public.project_dispatch_work_items(source_row.id);
    processed_count := processed_count + 1;
    next_created_at := source_row.created_at;
    next_id := source_row.id;
  end loop;

  return next;
end;
$$;


ALTER FUNCTION "public"."backfill_dispatch_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."backfill_dispatch_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) IS 'Bounded, idempotent keyset backfill for Dispatch work-item shadow proof. Process at most 1000 rows per call.';



CREATE OR REPLACE FUNCTION "public"."backfill_farmer_lead_work_items_batch"("p_after_created_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_after_id" "uuid" DEFAULT NULL::"uuid", "p_batch_size" integer DEFAULT 1000) RETURNS TABLE("processed_count" integer, "next_created_at" timestamp with time zone, "next_id" "uuid", "has_more" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  lead_row record;
  processed integer := 0;
  last_created_at timestamptz := null;
  last_id uuid := null;
  more_rows boolean := false;
begin
  if p_batch_size < 1 or p_batch_size > 1000 then
    raise exception 'p_batch_size must be between 1 and 1000';
  end if;

  for lead_row in
    select fl.id, fl.created_at
    from public.farmer_leads fl
    where (
        p_after_created_at is null
        or (fl.created_at, fl.id) > (p_after_created_at, coalesce(p_after_id, '00000000-0000-0000-0000-000000000000'::uuid))
      )
    order by fl.created_at asc, fl.id asc
    limit p_batch_size
  loop
    perform public.project_farmer_lead_work_items(lead_row.id);
    processed := processed + 1;
    last_created_at := lead_row.created_at;
    last_id := lead_row.id;
  end loop;

  if last_created_at is not null then
    select exists (
      select 1
      from public.farmer_leads fl
      where (fl.created_at, fl.id) > (last_created_at, last_id)
    ) into more_rows;
  end if;

  return query select processed, last_created_at, last_id, more_rows;
end;
$$;


ALTER FUNCTION "public"."backfill_farmer_lead_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_batch_size" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."backfill_farmer_lead_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_batch_size" integer) IS 'Internal bounded, restartable shadow backfill. Invoke one batch per transaction; maximum 1000 rows.';



CREATE OR REPLACE FUNCTION "public"."backfill_pilot_dispatch_work_items_batch"("p_after_created_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_after_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 1000) RETURNS TABLE("processed_count" integer, "next_created_at" timestamp with time zone, "next_id" "uuid", "has_more" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  source_row record;
  safe_limit integer := least(greatest(coalesce(p_limit, 1000), 1), 1000);
  seen_count integer := 0;
begin
  processed_count := 0;
  next_created_at := p_after_created_at;
  next_id := p_after_id;
  has_more := false;

  for source_row in
    select p.id, p.created_at
    from public.pilots p
    where (
      p_after_created_at is null
      or p.created_at > p_after_created_at
      or (
        p.created_at = p_after_created_at
        and (p_after_id is null or p.id > p_after_id)
      )
    )
    order by p.created_at asc, p.id asc
    limit safe_limit + 1
  loop
    seen_count := seen_count + 1;

    if seen_count > safe_limit then
      has_more := true;
      exit;
    end if;

    perform public.project_pilot_dispatch_work_items(source_row.id);
    processed_count := processed_count + 1;
    next_created_at := source_row.created_at;
    next_id := source_row.id;
  end loop;

  return next;
end;
$$;


ALTER FUNCTION "public"."backfill_pilot_dispatch_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."backfill_pilot_dispatch_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) IS 'Bounded, idempotent keyset backfill for Pilot dispatch-ready shadow proof. Process at most 1000 rows per call.';



CREATE OR REPLACE FUNCTION "public"."backfill_pilot_installation_work_items_batch"("p_after_created_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_after_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 1000) RETURNS TABLE("processed_count" integer, "next_created_at" timestamp with time zone, "next_id" "uuid", "has_more" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  source_row record;
  safe_limit integer := least(greatest(coalesce(p_limit, 1000), 1), 1000);
  seen_count integer := 0;
begin
  processed_count := 0;
  next_created_at := p_after_created_at;
  next_id := p_after_id;
  has_more := false;

  for source_row in
    select p.id, p.created_at
    from public.pilots p
    where (
      p_after_created_at is null
      or p.created_at > p_after_created_at
      or (
        p.created_at = p_after_created_at
        and (p_after_id is null or p.id > p_after_id)
      )
    )
    order by p.created_at asc, p.id asc
    limit safe_limit + 1
  loop
    seen_count := seen_count + 1;

    if seen_count > safe_limit then
      has_more := true;
      exit;
    end if;

    perform public.project_pilot_installation_work_items(source_row.id);
    processed_count := processed_count + 1;
    next_created_at := source_row.created_at;
    next_id := source_row.id;
  end loop;

  return next;
end;
$$;


ALTER FUNCTION "public"."backfill_pilot_installation_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."backfill_pilot_installation_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) IS 'Bounded, idempotent keyset backfill for Pilot installation work items. Process at most 1000 rows per call.';



CREATE OR REPLACE FUNCTION "public"."backfill_planned_pilot_visit_work_items_batch"("p_after_created_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_after_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 1000) RETURNS TABLE("processed_count" integer, "next_created_at" timestamp with time zone, "next_id" "uuid", "has_more" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  source_row record;
  safe_limit integer := least(greatest(coalesce(p_limit, 1000), 1), 1000);
  seen_count integer := 0;
begin
  processed_count := 0;
  next_created_at := p_after_created_at;
  next_id := p_after_id;
  has_more := false;

  for source_row in
    select ppv.id, ppv.created_at
    from public.planned_pilot_visits ppv
    where (
      p_after_created_at is null
      or ppv.created_at > p_after_created_at
      or (
        ppv.created_at = p_after_created_at
        and (p_after_id is null or ppv.id > p_after_id)
      )
    )
    order by ppv.created_at asc, ppv.id asc
    limit safe_limit + 1
  loop
    seen_count := seen_count + 1;

    if seen_count > safe_limit then
      has_more := true;
      exit;
    end if;

    perform public.project_planned_pilot_visit_work_items(source_row.id);
    processed_count := processed_count + 1;
    next_created_at := source_row.created_at;
    next_id := source_row.id;
  end loop;

  return next;
end;
$$;


ALTER FUNCTION "public"."backfill_planned_pilot_visit_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."backfill_planned_pilot_visit_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) IS 'Bounded, idempotent keyset backfill for planned Pilot visit work items. Process at most 1000 rows per call.';



CREATE OR REPLACE FUNCTION "public"."backfill_visit_report_review_work_items_batch"("p_after_created_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_after_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 1000) RETURNS TABLE("processed_count" integer, "next_created_at" timestamp with time zone, "next_id" "uuid", "has_more" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  source_row record;
  safe_limit integer := least(greatest(coalesce(p_limit, 1000), 1), 1000);
  seen_count integer := 0;
begin
  processed_count := 0;
  next_created_at := p_after_created_at;
  next_id := p_after_id;
  has_more := false;

  for source_row in
    select vr.id, vr.created_at
    from public.visit_reports vr
    where (
      p_after_created_at is null
      or vr.created_at > p_after_created_at
      or (
        vr.created_at = p_after_created_at
        and (p_after_id is null or vr.id > p_after_id)
      )
    )
    order by vr.created_at asc, vr.id asc
    limit safe_limit + 1
  loop
    seen_count := seen_count + 1;

    if seen_count > safe_limit then
      has_more := true;
      exit;
    end if;

    perform public.project_visit_report_review_work_items(source_row.id);
    processed_count := processed_count + 1;
    next_created_at := source_row.created_at;
    next_id := source_row.id;
  end loop;

  return next;
end;
$$;


ALTER FUNCTION "public"."backfill_visit_report_review_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."backfill_visit_report_review_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) IS 'Bounded, idempotent keyset backfill for Visit Report review work items. Process at most 1000 rows per call.';



CREATE OR REPLACE FUNCTION "public"."can_current_user_update_farmer_lead_for_pilot_completion"("target_farmer_lead_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from public.pilots p
    where p.farmer_lead_id = target_farmer_lead_id
      and p.deleted_at is null
      and (
        public.is_admin()
        or public.is_management()
        or public.is_rd_head()
        or public.is_agronomist()
        or (
          public.is_research_assistant()
          and (
            p.pilot_owner_user_id = public.get_current_user_id()
            or p.research_assistant_user_id = public.get_current_user_id()
          )
        )
      )
  )
$$;


ALTER FUNCTION "public"."can_current_user_update_farmer_lead_for_pilot_completion"("target_farmer_lead_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_current_user_update_farmer_lead_for_pilot_completion"("target_farmer_lead_id" "uuid") IS 'Non-recursive pilot completion helper for farmer_leads RLS. It checks linked pilot role/assignment access without invoking pilots RLS.';



CREATE OR REPLACE FUNCTION "public"."can_read_work_item"("item_category" "text", "item_action_type" "text", "item_source_table" "text", "item_source_id" "uuid", "item_assignee_user_id" "uuid", "item_rsm_user_id" "uuid", "item_region_id" "uuid", "item_state" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  ctx record;
  visible boolean;
begin
  select *
  into ctx
  from public.current_work_item_user_context()
  limit 1;

  if not found or ctx.user_id is null then
    return false;
  end if;

  if ctx.is_admin then
    return true;
  end if;

  if ctx.is_management and item_category in ('sales', 'pilots') then
    return true;
  end if;

  if ctx.is_sales_head and item_category = 'sales' then
    return true;
  end if;

  if ctx.is_rsm
    and item_category = 'sales'
    and (
      item_rsm_user_id = ctx.user_id
      or item_region_id = ctx.region_id
      or lower(coalesce(item_state, '')) = lower(coalesce(ctx.state, ''))
    )
  then
    return true;
  end if;

  if ctx.is_salesperson
    and item_category = 'sales'
    and (
      item_assignee_user_id = ctx.user_id
      or item_rsm_user_id = ctx.user_id
    )
  then
    return true;
  end if;

  if ctx.is_stock_dispatch
    and (
      (item_category = 'sales' and item_action_type = 'dispatch_ready')
      or (
        item_category = 'dispatch'
        and item_action_type in ('dealer_dispatch_ready', 'dispatch_action')
      )
    )
  then
    return true;
  end if;

  if ctx.is_accounts
    and item_category = 'dispatch'
    and item_action_type in ('dealer_payment_confirm', 'dispatch_action')
  then
    return true;
  end if;

  if item_category <> 'pilots' then
    return false;
  end if;

  if ctx.is_rd_head then
    return true;
  end if;

  if item_source_table = 'pilots' then
    select exists (
      select 1
      from public.pilots p
      where p.id = item_source_id
        and p.deleted_at is null
        and (
          p.pilot_owner_user_id = ctx.user_id
          or p.research_assistant_user_id = ctx.user_id
          or p.agronomist_user_id = ctx.user_id
          or p.rsm_user_id = ctx.user_id
          or (
            ctx.is_rsm
            and (
              p.region_id = ctx.region_id
              or lower(coalesce(p.state, '')) = lower(coalesce(ctx.state, ''))
            )
          )
          or (
            ctx.is_agronomist
            and exists (
              select 1
              from public.users u
              where u.id = p.research_assistant_user_id
                and u.role = 'Research Assistant'
                and u.reports_to_user_id = ctx.user_id
                and u.is_active is true
            )
          )
        )
    )
    into visible;

    return coalesce(visible, false);
  end if;

  if item_source_table = 'planned_pilot_visits' then
    select exists (
      select 1
      from public.planned_pilot_visits ppv
      left join public.pilots p on p.id = ppv.pilot_id
      where ppv.id = item_source_id
        and ppv.deleted_at is null
        and (
          ctx.is_agronomist
          or ppv.assigned_user_id = ctx.user_id
          or p.pilot_owner_user_id = ctx.user_id
          or p.research_assistant_user_id = ctx.user_id
          or p.agronomist_user_id = ctx.user_id
          or p.rsm_user_id = ctx.user_id
          or (
            ctx.is_rsm
            and (
              p.region_id = ctx.region_id
              or lower(coalesce(p.state, '')) = lower(coalesce(ctx.state, ''))
            )
          )
        )
    )
    into visible;

    return coalesce(visible, false);
  end if;

  if item_source_table = 'visit_reports' then
    select exists (
      select 1
      from public.visit_reports vr
      left join public.planned_pilot_visits ppv on ppv.id = vr.planned_pilot_visit_id
      left join public.pilots p on p.id = coalesce(vr.pilot_id, ppv.pilot_id)
      where vr.id = item_source_id
        and vr.deleted_at is null
        and (
          vr.submitted_by_user_id = ctx.user_id
          or vr.reviewed_by_user_id = ctx.user_id
          or p.pilot_owner_user_id = ctx.user_id
          or p.research_assistant_user_id = ctx.user_id
          or p.agronomist_user_id = ctx.user_id
          or p.rsm_user_id = ctx.user_id
          or (
            ctx.is_rsm
            and (
              p.region_id = ctx.region_id
              or lower(coalesce(p.state, '')) = lower(coalesce(ctx.state, ''))
            )
          )
          or (
            ctx.is_agronomist
            and exists (
              select 1
              from public.users u
              where u.id = p.research_assistant_user_id
                and u.role = 'Research Assistant'
                and u.reports_to_user_id = ctx.user_id
                and u.is_active is true
            )
          )
        )
    )
    into visible;

    return coalesce(visible, false);
  end if;

  return false;
end;
$$;


ALTER FUNCTION "public"."can_read_work_item"("item_category" "text", "item_action_type" "text", "item_source_table" "text", "item_source_id" "uuid", "item_assignee_user_id" "uuid", "item_rsm_user_id" "uuid", "item_region_id" "uuid", "item_state" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_read_work_item"("item_category" "text", "item_action_type" "text", "item_source_table" "text", "item_source_id" "uuid", "item_assignee_user_id" "uuid", "item_rsm_user_id" "uuid", "item_region_id" "uuid", "item_state" "text") IS 'Evaluates work item read access inside a security-definer helper so My Work RLS does not invoke nested table policies.';



CREATE OR REPLACE FUNCTION "public"."current_region_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select u.region_id
  from public.users u
  where u.id = public.get_current_user_id()
    and u.is_active is true
  limit 1
$$;


ALTER FUNCTION "public"."current_region_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."current_region_id"() IS 'Returns the active internal user assigned region_id.';



CREATE OR REPLACE FUNCTION "public"."current_state"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select u.state
  from public.users u
  where u.id = public.get_current_user_id()
    and u.is_active is true
  limit 1
$$;


ALTER FUNCTION "public"."current_state"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."current_state"() IS 'Returns the active internal user assigned state.';



CREATE OR REPLACE FUNCTION "public"."current_user_has_role"("role_to_check" "public"."user_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select coalesce(role_to_check = any(public.get_current_user_roles()), false)
$$;


ALTER FUNCTION "public"."current_user_has_role"("role_to_check" "public"."user_role") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."current_user_has_role"("role_to_check" "public"."user_role") IS 'Returns true when the logged-in active internal user has the role as primary or secondary role.';



CREATE OR REPLACE FUNCTION "public"."current_work_item_user_context"() RETURNS TABLE("user_id" "uuid", "roles" "public"."user_role"[], "region_id" "uuid", "state" "text", "is_accounts" boolean, "is_admin" boolean, "is_agronomist" boolean, "is_management" boolean, "is_rd_head" boolean, "is_rsm" boolean, "is_sales_head" boolean, "is_salesperson" boolean, "is_stock_dispatch" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  with active_user as (
    select
      u.id,
      array_remove(array[u.role, u.secondary_role], null)::public.user_role[] as roles,
      u.region_id,
      u.state
    from public.users u
    where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and u.is_active is true
    limit 1
  )
  select
    active_user.id,
    active_user.roles,
    active_user.region_id,
    active_user.state,
    'Accounts'::public.user_role = any(active_user.roles) as is_accounts,
    'Admin'::public.user_role = any(active_user.roles) as is_admin,
    'Agronomist'::public.user_role = any(active_user.roles) as is_agronomist,
    'Management'::public.user_role = any(active_user.roles) as is_management,
    'R&D Head'::public.user_role = any(active_user.roles) as is_rd_head,
    'RSM'::public.user_role = any(active_user.roles) as is_rsm,
    'Sales Head'::public.user_role = any(active_user.roles) as is_sales_head,
    'Salesperson'::public.user_role = any(active_user.roles) as is_salesperson,
    'Stock / Dispatch'::public.user_role = any(active_user.roles) as is_stock_dispatch
  from active_user
$$;


ALTER FUNCTION "public"."current_work_item_user_context"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."current_work_item_user_context"() IS 'Returns the current authenticated user context once for work item RLS checks.';



CREATE OR REPLACE FUNCTION "public"."dispatch_work_item_candidates"("p_dispatch_id" "uuid") RETURNS TABLE("source_table" "text", "source_id" "uuid", "action_type" "text", "business_key" "text", "status" "text", "category" "text", "assignee_user_id" "uuid", "rsm_user_id" "uuid", "region_id" "uuid", "state" "text", "due_at" "date", "ui_payload" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    'dispatches'::text,
    d.id,
    'dealer_payment_confirm'::text,
    concat('dispatch:', d.id, ':dealer-payment'),
    'Open'::text,
    'dispatch'::text,
    null::uuid,
    null::uuid,
    null::uuid,
    d.destination_state,
    coalesce(d.expected_delivery_date, d.dispatch_date),
    jsonb_strip_nulls(jsonb_build_object(
      'dispatch_code', d.dispatch_code,
      'destination_name', d.destination_name_snapshot,
      'product_model', d.product_model
    ))
  from public.dispatches d
  where d.id = p_dispatch_id
    and d.deleted_at is null
    and d.dispatch_type = 'Dealer Stock Dispatch'
    and d.payment_requirement_type = 'Payment Required'
    and d.payment_confirmed is false
    and d.dispatch_status <> 'Cancelled'

  union all

  select
    'dispatches'::text,
    d.id,
    'dealer_dispatch_ready'::text,
    concat('dispatch:', d.id, ':dealer-ready'),
    'Open'::text,
    'dispatch'::text,
    null::uuid,
    null::uuid,
    null::uuid,
    d.destination_state,
    coalesce(d.expected_delivery_date, d.payment_confirmed_date),
    jsonb_strip_nulls(jsonb_build_object(
      'dispatch_code', d.dispatch_code,
      'destination_name', d.destination_name_snapshot,
      'product_model', d.product_model
    ))
  from public.dispatches d
  where d.id = p_dispatch_id
    and d.deleted_at is null
    and d.dispatch_type = 'Dealer Stock Dispatch'
    and d.payment_requirement_type = 'Payment Required'
    and d.payment_confirmed is true
    and d.dispatch_status in ('Approved for Dispatch', 'Dispatch Requested')

  union all

  select
    'dispatches'::text,
    d.id,
    'dispatch_action'::text,
    concat('dispatch:', d.id, ':action'),
    'Open'::text,
    'dispatch'::text,
    null::uuid,
    null::uuid,
    null::uuid,
    d.destination_state,
    coalesce(d.expected_delivery_date, d.dispatch_date),
    jsonb_strip_nulls(jsonb_build_object(
      'dispatch_code', d.dispatch_code,
      'dispatch_type', d.dispatch_type,
      'destination_name', d.destination_name_snapshot,
      'product_model', d.product_model,
      'dispatch_status', d.dispatch_status
    ))
  from public.dispatches d
  where d.id = p_dispatch_id
    and d.deleted_at is null
    and d.dispatch_type <> 'Dealer Stock Dispatch'
    and d.dispatch_status in (
      'Dispatch Requested',
      'Pending Payment Confirmation',
      'Pending Approval',
      'Approved for Dispatch',
      'Installation Pending',
      'On Hold'
    );
$$;


ALTER FUNCTION "public"."dispatch_work_item_candidates"("p_dispatch_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."dispatch_work_item_candidates"("p_dispatch_id" "uuid") IS 'Internal candidate function for Dispatch-sourced My Work shadow items.';



CREATE OR REPLACE FUNCTION "public"."farmer_lead_work_item_candidates"("p_lead_id" "uuid") RETURNS TABLE("source_table" "text", "source_id" "uuid", "action_type" "text", "business_key" "text", "status" "text", "category" "text", "assignee_user_id" "uuid", "rsm_user_id" "uuid", "region_id" "uuid", "state" "text", "due_at" "date", "ui_payload" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    'farmer_leads'::text,
    fl.id,
    'follow_up'::text,
    concat('farmer-lead:', fl.id, ':follow-up'),
    'Open'::text,
    'sales'::text,
    fl.owner_user_id,
    fl.rsm_user_id,
    fl.region_id,
    fl.state,
    fl.next_action_date,
    jsonb_build_object('farmer_name', fl.farmer_name, 'lead_code', fl.lead_code)
  from public.farmer_leads fl
  where fl.id = p_lead_id
    and fl.deleted_at is null
    and fl.next_action_date <= current_date
    and fl.lead_status::text not in ('Won', 'Lost', 'Parked')
    and fl.funnel_stage::text not in ('Won', 'Lost', 'Parked')

  union all

  select
    'farmer_leads'::text,
    fl.id,
    'dispatch_ready'::text,
    concat('farmer-lead:', fl.id, ':dispatch-ready'),
    'Open'::text,
    'sales'::text,
    fl.owner_user_id,
    fl.rsm_user_id,
    fl.region_id,
    fl.state,
    fl.payment_confirmed_date,
    jsonb_build_object('farmer_name', fl.farmer_name, 'lead_code', fl.lead_code)
  from public.farmer_leads fl
  where fl.id = p_lead_id
    and fl.deleted_at is null
    and fl.payment_confirmed is true
    and fl.device_dispatched is false
    and not exists (
      select 1
      from public.dispatches d
      where d.deleted_at is null
        and d.dispatch_status::text <> 'Cancelled'
        and (
          d.linked_farmer_lead_id = fl.id
          or d.destination_farmer_lead_id = fl.id
        )
    );
$$;


ALTER FUNCTION "public"."farmer_lead_work_item_candidates"("p_lead_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cached_kpi_dashboard_summary"("p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date", "p_state" "text" DEFAULT NULL::"text", "p_region_id" "uuid" DEFAULT NULL::"uuid", "p_rsm_user_id" "uuid" DEFAULT NULL::"uuid", "p_product_model" "text" DEFAULT NULL::"text", "p_crop" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
declare
  v_cache_key text;
  v_fallback_cache_key text;
  v_summary jsonb;
  v_required_sections text[] := array[
    'filters',
    'management',
    'sales',
    'dealers',
    'institutions',
    'pilots',
    'agronomist',
    'researchAssistant',
    'rdHead',
    'stock',
    'rsmRows',
    'charts'
  ];
  v_last_refreshed_at timestamptz;
  v_refresh_id uuid;
  v_dirty_sections text[] := '{}'::text[];
  v_is_dirty boolean := false;
  v_filters jsonb;
  v_message text;
begin
  v_cache_key := public.kpi_dashboard_cache_key(
    p_start_date,
    p_end_date,
    p_state,
    p_region_id,
    p_rsm_user_id,
    p_product_model,
    p_crop
  );
  v_filters := jsonb_build_object(
    'start_date', p_start_date,
    'end_date', p_end_date,
    'state', nullif(btrim(coalesce(p_state, '')), ''),
    'region_id', p_region_id,
    'rsm_user_id', p_rsm_user_id,
    'product_model', nullif(btrim(coalesce(p_product_model, '')), ''),
    'crop', nullif(btrim(coalesce(p_crop, '')), '')
  );

  select
    jsonb_object_agg(section_name, data),
    max(computed_at),
    (array_agg(refresh_id order by computed_at desc))[1]
  into v_summary, v_last_refreshed_at, v_refresh_id
  from public.kpi_dashboard_cache
  where cache_key = v_cache_key;

  select
    coalesce(array_agg(section_name order by section_name), '{}'::text[]),
    coalesce(bool_or(is_dirty), false)
  into v_dirty_sections, v_is_dirty
  from public.kpi_dashboard_dirty_flags
  where is_dirty is true;

  if v_summary is null or not (v_summary ?& v_required_sections) then
    select candidate.cache_key
    into v_fallback_cache_key
    from (
      select
        cache.cache_key,
        max(cache.computed_at) as latest_computed_at
      from public.kpi_dashboard_cache as cache
      where (cache.filters ->> 'start_date') is not distinct from (v_filters ->> 'start_date')
        and (cache.filters ->> 'state') is not distinct from (v_filters ->> 'state')
        and (cache.filters ->> 'region_id') is not distinct from (v_filters ->> 'region_id')
        and (cache.filters ->> 'rsm_user_id') is not distinct from (v_filters ->> 'rsm_user_id')
        and (cache.filters ->> 'product_model') is not distinct from (v_filters ->> 'product_model')
        and (cache.filters ->> 'crop') is not distinct from (v_filters ->> 'crop')
      group by cache.cache_key
      having count(distinct cache.section_name) filter (
        where cache.section_name = any(v_required_sections)
      ) = array_length(v_required_sections, 1)
      order by max(cache.computed_at) desc
      limit 1
    ) as candidate;

    if v_fallback_cache_key is not null then
      select
        jsonb_object_agg(section_name, data),
        max(computed_at),
        (array_agg(refresh_id order by computed_at desc))[1]
      into v_summary, v_last_refreshed_at, v_refresh_id
      from public.kpi_dashboard_cache
      where cache_key = v_fallback_cache_key
        and section_name = any(v_required_sections);

      v_message := 'Showing the latest complete KPI cache while this date range waits for refresh.';
    end if;
  end if;

  if v_summary is null or not (v_summary ?& v_required_sections) then
    return jsonb_build_object(
      'isReady', false,
      'summary', null,
      'lastRefreshedAt', null,
      'isDirty', v_is_dirty,
      'dirtySections', to_jsonb(v_dirty_sections),
      'refreshId', null,
      'cacheKey', v_cache_key,
      'fallbackCacheKey', null,
      'message', 'KPI Dashboard is preparing. Ask an admin to refresh it.'
    );
  end if;

  return jsonb_build_object(
    'isReady', true,
    'summary', v_summary,
    'lastRefreshedAt', v_last_refreshed_at,
    'isDirty', v_is_dirty,
    'dirtySections', to_jsonb(v_dirty_sections),
    'refreshId', v_refresh_id,
    'cacheKey', v_cache_key,
    'fallbackCacheKey', v_fallback_cache_key,
    'message', v_message
  );
end;
$$;


ALTER FUNCTION "public"."get_cached_kpi_dashboard_summary"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_cached_kpi_dashboard_summary"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") IS 'Returns the saved KPI Dashboard summary for a filter set. If the exact current-date key is not ready, it can serve the latest complete cache with matching non-date filters.';



CREATE OR REPLACE FUNCTION "public"."get_current_user_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select u.id
  from public.users u
  where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and u.is_active is true
  limit 1
$$;


ALTER FUNCTION "public"."get_current_user_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_user_id"() IS 'Returns the active public.users.id for the logged-in Supabase Auth email.';



CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select u.role
  from public.users u
  where u.id = public.get_current_user_id()
    and u.is_active is true
  limit 1
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_user_role"() IS 'Returns the active internal role for the logged-in Supabase Auth email.';



CREATE OR REPLACE FUNCTION "public"."get_current_user_roles"() RETURNS "public"."user_role"[]
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select array_remove(array[u.role, u.secondary_role], null)
  from public.users u
  where u.id = public.get_current_user_id()
    and u.is_active is true
  limit 1
$$;


ALTER FUNCTION "public"."get_current_user_roles"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_user_roles"() IS 'Returns active effective roles for the logged-in internal user: primary role plus optional secondary_role.';



CREATE OR REPLACE FUNCTION "public"."get_dashboard_home_counts"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select jsonb_build_object(
    'leadsNeedingFollowup', (
      select count(*)
      from public.farmer_leads
      where deleted_at is null
        and lead_status::text = 'Open'
        and (
          next_action_date <= current_date
          or followup_due_date <= current_date
        )
    ),
    'pendingPaymentConfirmation', (
      select count(*)
      from public.dispatches
      where deleted_at is null
        and payment_confirmed is false
    ),
    'approvedDispatchesWaiting', (
      select count(*)
      from public.dispatches
      where deleted_at is null
        and dispatch_status::text = 'Approved for Dispatch'
    ),
    'installationsPlanned', (
      select count(*)
      from public.installations
      where deleted_at is null
        and installation_status::text = 'Planned'
    ),
    'devicesInWarehouse', (
      select count(*)
      from public.devices
      where deleted_at is null
        and device_status::text = 'In Warehouse'
    ),
    'overduePostInstallationFollowups', (
      select count(*)
      from public.followups
      where deleted_at is null
        and followup_status::text in ('Due', 'Rescheduled', 'Escalated')
        and followup_due_date < current_date
    ),
    'activePilots', (
      select count(*)
      from public.pilots
      where deleted_at is null
        and pilot_status::text in (
          'Approved',
          'Device Assigned',
          'Device Dispatched',
          'Device Installed',
          'Monitoring Active',
          'Visit Report Pending',
          'Final Report Pending',
          'Final Report Submitted',
          'Final Report Reviewed',
          'Scale-up Recommended'
        )
    )
  );
$$;


ALTER FUNCTION "public"."get_dashboard_home_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_home_counts"("p_include_farmer_leads" boolean DEFAULT true, "p_include_dispatches" boolean DEFAULT true, "p_include_installations" boolean DEFAULT true, "p_include_devices" boolean DEFAULT true, "p_include_followups" boolean DEFAULT true, "p_include_pilots" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select jsonb_build_object(
    'leadsNeedingFollowup',
      case when p_include_farmer_leads then (
        select count(*)
        from public.farmer_leads
        where deleted_at is null
          and lead_status::text = 'Open'
          and (
            next_action_date <= current_date
            or followup_due_date <= current_date
          )
      ) else null end,
    'pendingPaymentConfirmation',
      case when p_include_dispatches then (
        select count(*)
        from public.dispatches
        where deleted_at is null
          and payment_confirmed is false
      ) else null end,
    'approvedDispatchesWaiting',
      case when p_include_dispatches then (
        select count(*)
        from public.dispatches
        where deleted_at is null
          and dispatch_status::text = 'Approved for Dispatch'
      ) else null end,
    'installationsPlanned',
      case when p_include_installations then (
        select count(*)
        from public.installations
        where deleted_at is null
          and installation_status::text = 'Planned'
      ) else null end,
    'devicesInWarehouse',
      case when p_include_devices then (
        select count(*)
        from public.devices
        where deleted_at is null
          and device_status::text = 'In Warehouse'
      ) else null end,
    'overduePostInstallationFollowups',
      case when p_include_followups then (
        select count(*)
        from public.followups
        where deleted_at is null
          and followup_status::text in ('Due', 'Rescheduled', 'Escalated')
          and followup_due_date < current_date
      ) else null end,
    'activePilots',
      case when p_include_pilots then (
        select count(*)
        from public.pilots
        where deleted_at is null
          and pilot_status::text in (
            'Approved',
            'Device Assigned',
            'Device Dispatched',
            'Device Installed',
            'Monitoring Active',
            'Visit Report Pending',
            'Final Report Pending',
            'Final Report Submitted',
            'Final Report Reviewed',
            'Scale-up Recommended'
          )
      ) else null end
  );
$$;


ALTER FUNCTION "public"."get_dashboard_home_counts"("p_include_farmer_leads" boolean, "p_include_dispatches" boolean, "p_include_installations" boolean, "p_include_devices" boolean, "p_include_followups" boolean, "p_include_pilots" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dispatch_work_item_shadow_drift"() RETURNS TABLE("discrepancy_type" "text", "source_table" "text", "source_id" "uuid", "action_type" "text", "business_key" "text", "details" "jsonb")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not ((select public.is_admin()) or (select public.is_management())) then
    raise exception 'Only Admin or Management can run Dispatch work-item reconciliation.';
  end if;

  return query
  with expected as (
    select candidate.*
    from public.dispatches d
    cross join lateral public.dispatch_work_item_candidates(d.id) candidate

    union all

    select candidate.*
    from public.pilots p
    cross join lateral public.pilot_dispatch_work_item_candidates(p.id) candidate
  ),
  actual as (
    select
      wi.source_table as actual_source_table,
      wi.source_id as actual_source_id,
      wi.action_type as actual_action_type,
      wi.business_key as actual_business_key,
      wi.status as actual_status,
      wi.category as actual_category,
      wi.assignee_user_id as actual_assignee_user_id,
      wi.rsm_user_id as actual_rsm_user_id,
      wi.region_id as actual_region_id,
      wi.state as actual_state,
      wi.due_at as actual_due_at,
      wi.ui_payload as actual_ui_payload,
      case
        when wi.source_table = 'dispatches' then exists (
          select 1 from public.dispatches d where d.id = wi.source_id
        )
        when wi.source_table = 'pilots' then exists (
          select 1 from public.pilots p where p.id = wi.source_id
        )
        else false
      end as actual_source_exists
    from public.work_items wi
    where wi.category = 'dispatch'
       or wi.source_table in ('dispatches', 'pilots')
       or wi.action_type in (
         'dealer_payment_confirm',
         'dealer_dispatch_ready',
         'dispatch_action',
         'pilot_dispatch_ready'
       )
  ),
  compared as (
    select
      e.source_table,
      e.source_id,
      e.action_type,
      e.business_key,
      e.status,
      e.category,
      e.assignee_user_id,
      e.rsm_user_id,
      e.region_id,
      e.state,
      e.due_at,
      e.ui_payload,
      a.actual_source_table,
      a.actual_source_id,
      a.actual_action_type,
      a.actual_business_key,
      a.actual_status,
      a.actual_category,
      a.actual_assignee_user_id,
      a.actual_rsm_user_id,
      a.actual_region_id,
      a.actual_state,
      a.actual_due_at,
      a.actual_ui_payload,
      a.actual_source_exists
    from expected e
    full outer join actual a
      on e.business_key = a.actual_business_key
  ),
  drift as (
    select
      case
        when c.actual_business_key is null then 'missing_shadow_item'
        when c.business_key is null and c.actual_source_exists is false then 'orphaned_shadow_item'
        when c.business_key is null then 'stale_shadow_item'
        when c.source_table is distinct from c.actual_source_table
          or c.source_id is distinct from c.actual_source_id then 'wrong_source'
        when c.action_type is distinct from c.actual_action_type then 'wrong_action_type'
        when c.status is distinct from c.actual_status then 'wrong_status'
        when c.category is distinct from c.actual_category then 'wrong_category'
        when c.assignee_user_id is distinct from c.actual_assignee_user_id then 'wrong_assignee'
        when c.rsm_user_id is distinct from c.actual_rsm_user_id then 'wrong_rsm'
        when c.region_id is distinct from c.actual_region_id then 'wrong_region'
        when c.state is distinct from c.actual_state then 'wrong_state'
        when c.due_at is distinct from c.actual_due_at then 'wrong_due_date'
        when c.ui_payload is distinct from c.actual_ui_payload then 'wrong_payload'
        else null
      end as discrepancy_type,
      coalesce(c.source_table, c.actual_source_table) as output_source_table,
      coalesce(c.source_id, c.actual_source_id) as output_source_id,
      coalesce(c.action_type, c.actual_action_type) as output_action_type,
      coalesce(c.business_key, c.actual_business_key) as output_business_key,
      jsonb_build_object(
        'expected', jsonb_build_object(
          'source_table', c.source_table,
          'source_id', c.source_id,
          'action_type', c.action_type,
          'status', c.status,
          'category', c.category,
          'assignee_user_id', c.assignee_user_id,
          'rsm_user_id', c.rsm_user_id,
          'region_id', c.region_id,
          'state', c.state,
          'due_at', c.due_at,
          'ui_payload', c.ui_payload
        ),
        'actual', jsonb_build_object(
          'source_table', c.actual_source_table,
          'source_id', c.actual_source_id,
          'action_type', c.actual_action_type,
          'status', c.actual_status,
          'category', c.actual_category,
          'assignee_user_id', c.actual_assignee_user_id,
          'rsm_user_id', c.actual_rsm_user_id,
          'region_id', c.actual_region_id,
          'state', c.actual_state,
          'due_at', c.actual_due_at,
          'ui_payload', c.actual_ui_payload
        )
      ) as output_details
    from compared c
  )
  select
    d.discrepancy_type,
    d.output_source_table,
    d.output_source_id,
    d.output_action_type,
    d.output_business_key,
    d.output_details
  from drift d
  where d.discrepancy_type is not null;
end;
$$;


ALTER FUNCTION "public"."get_dispatch_work_item_shadow_drift"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dispatch_work_item_shadow_drift"() IS 'Admin/Management-only read-only reconciliation for Dispatch work-item Stage A shadow proof.';



CREATE OR REPLACE FUNCTION "public"."get_farmer_lead_work_item_shadow_drift"() RETURNS TABLE("discrepancy_type" "text", "business_key" "text", "action_type" "text", "source_id" "uuid", "expected_assignee_user_id" "uuid", "actual_assignee_user_id" "uuid", "expected_rsm_user_id" "uuid", "actual_rsm_user_id" "uuid", "expected_region_id" "uuid", "actual_region_id" "uuid", "expected_state" "text", "actual_state" "text", "expected_due_at" "date", "actual_due_at" "date", "expected_payload" "jsonb", "actual_payload" "jsonb")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not (public.is_admin() or public.is_management()) then
    raise exception 'Only Admin or Management may run shadow reconciliation'
      using errcode = '42501';
  end if;

  return query
  with expected as (
    select candidate.*
    from public.farmer_leads fl
    cross join lateral public.farmer_lead_work_item_candidates(fl.id) candidate
  ),
  actual as (
    select
      wi.*,
      fl.id as source_lead_id,
      fl.deleted_at as source_deleted_at
    from public.work_items wi
    left join public.farmer_leads fl
      on fl.id = wi.source_id
    where wi.source_table = 'farmer_leads'
  ),
  compared as (
    select
      e.*,
      a.id as actual_work_item_id,
      a.source_table as actual_source_table,
      a.source_id as actual_source_id,
      a.action_type as actual_action_type,
      a.business_key as actual_business_key,
      a.status as actual_status,
      a.category as actual_category,
      a.assignee_user_id as actual_assignee_user_id,
      a.rsm_user_id as actual_rsm_user_id,
      a.region_id as actual_region_id,
      a.state as actual_state,
      a.due_at as actual_due_at,
      a.ui_payload as actual_payload,
      a.source_lead_id,
      a.source_deleted_at
    from expected e
    full join actual a
      on a.business_key = e.business_key
  )
  select
    case
      when c.source_table is null
        and c.source_lead_id is null
        then 'orphaned_shadow_item'

      when c.source_table is null
        then 'stale_shadow_item'

      when c.actual_work_item_id is null
        then 'missing_shadow_item'

      when c.source_table is distinct from c.actual_source_table
        or c.source_id is distinct from c.actual_source_id
        then 'wrong_source'

      when c.action_type is distinct from c.actual_action_type
        then 'wrong_action_type'

      when c.category is distinct from c.actual_category
        then 'wrong_category'

      when c.status is distinct from c.actual_status
        then 'wrong_status'

      when c.assignee_user_id is distinct from c.actual_assignee_user_id
        then 'wrong_assignee'

      when c.rsm_user_id is distinct from c.actual_rsm_user_id
        then 'wrong_rsm'

      when c.region_id is distinct from c.actual_region_id
        then 'wrong_region'

      when c.state is distinct from c.actual_state
        then 'wrong_state'

      when c.due_at is distinct from c.actual_due_at
        then 'wrong_due_date'

      when c.ui_payload is distinct from c.actual_payload
        then 'wrong_payload'

      else 'no_discrepancy'
    end::text as discrepancy_type,

    coalesce(c.business_key, c.actual_business_key)::text as business_key,
    coalesce(c.action_type, c.actual_action_type)::text as action_type,
    coalesce(c.source_id, c.actual_source_id)::uuid as source_id,

    c.assignee_user_id::uuid as expected_assignee_user_id,
    c.actual_assignee_user_id::uuid as actual_assignee_user_id,

    c.rsm_user_id::uuid as expected_rsm_user_id,
    c.actual_rsm_user_id::uuid as actual_rsm_user_id,

    c.region_id::uuid as expected_region_id,
    c.actual_region_id::uuid as actual_region_id,

    c.state::text as expected_state,
    c.actual_state::text as actual_state,

    c.due_at::date as expected_due_at,
    c.actual_due_at::date as actual_due_at,

    c.ui_payload::jsonb as expected_payload,
    c.actual_payload::jsonb as actual_payload

  from compared c
  where c.source_table is null
     or c.actual_work_item_id is null
     or c.source_table is distinct from c.actual_source_table
     or c.source_id is distinct from c.actual_source_id
     or c.action_type is distinct from c.actual_action_type
     or c.category is distinct from c.actual_category
     or c.status is distinct from c.actual_status
     or c.assignee_user_id is distinct from c.actual_assignee_user_id
     or c.rsm_user_id is distinct from c.actual_rsm_user_id
     or c.region_id is distinct from c.actual_region_id
     or c.state is distinct from c.actual_state
     or c.due_at is distinct from c.actual_due_at
     or c.ui_payload is distinct from c.actual_payload;
end;
$$;


ALTER FUNCTION "public"."get_farmer_lead_work_item_shadow_drift"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_farmer_leads_page_kpis"("p_q" "text" DEFAULT NULL::"text", "p_lead_status" "text" DEFAULT NULL::"text", "p_funnel_stage" "text" DEFAULT NULL::"text", "p_state" "text" DEFAULT NULL::"text", "p_district" "text" DEFAULT NULL::"text", "p_owner_user_id" "uuid" DEFAULT NULL::"uuid", "p_rsm_user_id" "uuid" DEFAULT NULL::"uuid", "p_lead_source" "text" DEFAULT NULL::"text", "p_primary_crop" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with scoped as (
    select fl.*
    from public.farmer_leads fl
    where (
      public.is_admin()
      or public.is_management()
      or public.is_sales_head()
      or public.is_accounts()
      or public.is_stock_dispatch()
      or public.is_rd_head()
      or public.is_viewer()
      or (
        public.is_rsm()
        and (
          fl.rsm_user_id = public.get_current_user_id()
          or fl.region_id = public.current_region_id()
          or fl.state = public.current_state()
        )
      )
      or (public.is_salesperson() and fl.owner_user_id = public.get_current_user_id())
      or (public.is_research_assistant() and fl.created_by_user_id = public.get_current_user_id())
      or (
        public.is_agronomist()
        and (
          exists (
            select 1
            from public.users u
            where u.id = fl.created_by_user_id
              and u.is_active is true
              and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
              and u.reports_to_user_id = public.get_current_user_id()
          )
          or exists (
            select 1
            from public.pilots p
            left join public.users u
              on u.id = p.research_assistant_user_id
            where p.id = fl.linked_pilot_id
              and p.deleted_at is null
              and (
                p.pilot_owner_user_id = public.get_current_user_id()
                or p.agronomist_user_id = public.get_current_user_id()
                or p.created_by_user_id = public.get_current_user_id()
                or (
                  u.is_active is true
                  and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                  and u.reports_to_user_id = public.get_current_user_id()
                )
              )
          )
        )
      )
    )
      and (
        nullif(trim(p_q), '') is null
        or fl.farmer_name ilike '%' || trim(p_q) || '%'
        or fl.mobile_number ilike '%' || trim(p_q) || '%'
        or fl.lead_code ilike '%' || trim(p_q) || '%'
        or fl.village ilike '%' || trim(p_q) || '%'
      )
      and (nullif(p_lead_status, '') is null or fl.lead_status::text = p_lead_status)
      and (nullif(p_funnel_stage, '') is null or fl.funnel_stage::text = p_funnel_stage)
      and (nullif(trim(p_state), '') is null or fl.state ilike '%' || trim(p_state) || '%')
      and (nullif(trim(p_district), '') is null or fl.district ilike '%' || trim(p_district) || '%')
      and (p_owner_user_id is null or fl.owner_user_id = p_owner_user_id)
      and (p_rsm_user_id is null or fl.rsm_user_id = p_rsm_user_id)
      and (nullif(p_lead_source, '') is null or fl.lead_source::text = p_lead_source)
      and (nullif(p_primary_crop, '') is null or fl.primary_crop::text = p_primary_crop)
  )
  select jsonb_build_object(
    'totalLeads', count(*),
    'openLeads', count(*) filter (where lead_status::text = 'Open'),
    'wonLeads', count(*) filter (where lead_status::text = 'Won'),
    'lostLeads', count(*) filter (where lead_status::text = 'Lost'),
    'followUpsDue', count(*) filter (where followup_due_date <= current_date),
    'paymentConfirmed', count(*) filter (where payment_confirmed is true),
    'deviceInstalled', count(*) filter (where installation_completed is true)
  )
  from scoped;
$$;


ALTER FUNCTION "public"."get_farmer_leads_page_kpis"("p_q" "text", "p_lead_status" "text", "p_funnel_stage" "text", "p_state" "text", "p_district" "text", "p_owner_user_id" "uuid", "p_rsm_user_id" "uuid", "p_lead_source" "text", "p_primary_crop" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_installations_page_kpis"("p_q" "text" DEFAULT NULL::"text", "p_installation_status" "text" DEFAULT NULL::"text", "p_installation_type" "text" DEFAULT NULL::"text", "p_product_model" "text" DEFAULT NULL::"text", "p_state" "text" DEFAULT NULL::"text", "p_district" "text" DEFAULT NULL::"text", "p_rsm_user_id" "uuid" DEFAULT NULL::"uuid", "p_region_id" "uuid" DEFAULT NULL::"uuid", "p_dealer_id" "uuid" DEFAULT NULL::"uuid", "p_institution_id" "uuid" DEFAULT NULL::"uuid", "p_pilot_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with scoped as (
    select i.*
    from public.installations i
    where i.deleted_at is null
      and (
        public.is_admin()
        or public.is_management()
        or public.is_sales_head()
        or public.is_stock_dispatch()
        or public.is_rd_head()
        or public.is_viewer()
        or (
          public.is_rsm()
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.region_id = public.current_region_id()
            or i.state = public.current_state()
          )
        )
        or (
          public.is_salesperson()
          and (
            i.installed_by_user_id = public.get_current_user_id()
            or exists (
              select 1
              from public.farmer_leads fl
              where fl.id = i.farmer_lead_id
                and fl.owner_user_id = public.get_current_user_id()
            )
          )
        )
        or (
          public.is_agronomist()
          and (
            exists (
              select 1
              from public.pilots p
              left join public.users u
                on u.id = p.research_assistant_user_id
              where p.id = i.pilot_id
                and p.deleted_at is null
                and (
                  p.pilot_owner_user_id = public.get_current_user_id()
                  or p.agronomist_user_id = public.get_current_user_id()
                  or p.created_by_user_id = public.get_current_user_id()
                  or (
                    u.is_active is true
                    and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                    and u.reports_to_user_id = public.get_current_user_id()
                  )
                )
            )
            or exists (
              select 1
              from public.farmer_leads fl
              join public.users u
                on u.id = fl.created_by_user_id
              where fl.id = i.farmer_lead_id
                and u.is_active is true
                and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                and u.reports_to_user_id = public.get_current_user_id()
            )
          )
        )
      )
      and (
        nullif(trim(p_q), '') is null
        or i.installation_code ilike '%' || trim(p_q) || '%'
        or i.farmer_name_snapshot ilike '%' || trim(p_q) || '%'
        or i.farmer_mobile_snapshot ilike '%' || trim(p_q) || '%'
        or i.serial_number_snapshot ilike '%' || trim(p_q) || '%'
        or i.village ilike '%' || trim(p_q) || '%'
      )
      and (nullif(p_installation_status, '') is null or i.installation_status::text = p_installation_status)
      and (nullif(p_installation_type, '') is null or i.installation_type::text = p_installation_type)
      and (nullif(p_product_model, '') is null or i.product_model::text = p_product_model)
      and (nullif(trim(p_state), '') is null or i.state ilike '%' || trim(p_state) || '%')
      and (nullif(trim(p_district), '') is null or i.district ilike '%' || trim(p_district) || '%')
      and (p_rsm_user_id is null or i.rsm_user_id = p_rsm_user_id)
      and (p_region_id is null or i.region_id = p_region_id)
      and (p_dealer_id is null or i.dealer_id = p_dealer_id)
      and (p_institution_id is null or i.institution_id = p_institution_id)
      and (p_pilot_id is null or i.pilot_id = p_pilot_id)
  )
  select jsonb_build_object(
    'totalInstallations', count(*),
    'installed', count(*) filter (where installation_status::text = 'Installed'),
    'verified', count(*) filter (where installation_status::text = 'Verified'),
    'followupPending', count(*) filter (where installation_status::text = 'Follow-up Pending'),
    'issueReported', count(*) filter (where installation_status::text = 'Issue Reported'),
    'closed', count(*) filter (where installation_status::text = 'Closed'),
    'pilotInstallations', count(*) filter (where installation_type::text = 'Pilot Installation'),
    'dealerFarmerInstallations', count(*) filter (where installation_type::text = 'Dealer Farmer Installation')
  )
  from scoped;
$$;


ALTER FUNCTION "public"."get_installations_page_kpis"("p_q" "text", "p_installation_status" "text", "p_installation_type" "text", "p_product_model" "text", "p_state" "text", "p_district" "text", "p_rsm_user_id" "uuid", "p_region_id" "uuid", "p_dealer_id" "uuid", "p_institution_id" "uuid", "p_pilot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_institutions_page_kpis"("p_q" "text" DEFAULT NULL::"text", "p_organization_type" "text" DEFAULT NULL::"text", "p_institution_status" "text" DEFAULT NULL::"text", "p_primary_state" "text" DEFAULT NULL::"text", "p_priority" "text" DEFAULT NULL::"text", "p_account_owner_user_id" "uuid" DEFAULT NULL::"uuid", "p_rsm_user_id" "uuid" DEFAULT NULL::"uuid", "p_rd_head_user_id" "uuid" DEFAULT NULL::"uuid", "p_scale_up_status" "text" DEFAULT NULL::"text", "p_opportunity_type" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with scoped as (
    select i.*
    from public.institutions i
    where i.deleted_at is null
      and (
        public.is_admin()
        or public.is_management()
        or public.is_sales_head()
        or public.is_viewer()
        or (
          public.is_rsm()
          and (
            i.rsm_user_id = public.get_current_user_id()
            or i.primary_region_id = public.current_region_id()
            or i.primary_state = public.current_state()
          )
        )
        or (public.is_rd_head() and i.rd_head_user_id = public.get_current_user_id())
        or (
          public.is_agronomist()
          and (
            i.technical_owner_user_id = public.get_current_user_id()
            or exists (
              select 1
              from public.pilots p
              left join public.users u
                on u.id = p.research_assistant_user_id
              where p.institution_id = i.id
                and p.deleted_at is null
                and (
                  p.pilot_owner_user_id = public.get_current_user_id()
                  or p.agronomist_user_id = public.get_current_user_id()
                  or p.created_by_user_id = public.get_current_user_id()
                  or (
                    u.is_active is true
                    and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                    and u.reports_to_user_id = public.get_current_user_id()
                  )
                )
            )
          )
        )
      )
      and (
        nullif(trim(p_q), '') is null
        or i.institution_code ilike '%' || trim(p_q) || '%'
        or i.organization_name ilike '%' || trim(p_q) || '%'
        or i.main_contact_person ilike '%' || trim(p_q) || '%'
        or i.main_contact_number ilike '%' || trim(p_q) || '%'
        or i.main_contact_email ilike '%' || trim(p_q) || '%'
        or i.primary_state ilike '%' || trim(p_q) || '%'
        or i.districts_covered ilike '%' || trim(p_q) || '%'
      )
      and (nullif(p_organization_type, '') is null or i.organization_type::text = p_organization_type)
      and (nullif(p_institution_status, '') is null or i.institution_status::text = p_institution_status)
      and (nullif(trim(p_primary_state), '') is null or i.primary_state ilike '%' || trim(p_primary_state) || '%')
      and (nullif(p_priority, '') is null or i.priority::text = p_priority)
      and (p_account_owner_user_id is null or i.account_owner_user_id = p_account_owner_user_id)
      and (p_rsm_user_id is null or i.rsm_user_id = p_rsm_user_id)
      and (p_rd_head_user_id is null or i.rd_head_user_id = p_rd_head_user_id)
      and (nullif(p_scale_up_status, '') is null or i.scale_up_status::text = p_scale_up_status)
      and (nullif(p_opportunity_type, '') is null or i.opportunity_type::text = p_opportunity_type)
  ),
  scoped_meetings as (
    select m.*
    from public.institution_meetings m
    join scoped i
      on i.id = m.institution_id
    where m.meeting_date >= date_trunc('month', current_date)::date
  )
  select jsonb_build_object(
    'total', (select count(*) from scoped),
    'active', (select count(*) from scoped where institution_status::text = 'Active Account'),
    'due', (
      select count(*)
      from scoped
      where next_action_date <= current_date
        and institution_status::text not in ('Parked', 'Lost')
    ),
    'meetingsThisMonth', (select count(*) from scoped_meetings),
    'rdHeadMeetings', (select count(*) from scoped_meetings where rd_head_user_id is not null),
    'pilotProposals', (
      select count(*)
      from scoped
      where institution_status::text = 'Pilot Proposal Shared'
        or proposal_shared::text = 'Yes'
    ),
    'scaleUp', (
      select count(*)
      from scoped
      where scale_up_status::text in (
        'Discussion Active',
        'Proposal Shared',
        'Commercial Negotiation',
        'PO / Approval Pending',
        'Order Received',
        'Installation Started',
        'Active Scale-up'
      )
    ),
    'parkedLost', (
      select count(*)
      from scoped
      where institution_status::text in ('Parked', 'Lost')
        or scale_up_status::text in ('Parked', 'Lost')
    )
  );
$$;


ALTER FUNCTION "public"."get_institutions_page_kpis"("p_q" "text", "p_organization_type" "text", "p_institution_status" "text", "p_primary_state" "text", "p_priority" "text", "p_account_owner_user_id" "uuid", "p_rsm_user_id" "uuid", "p_rd_head_user_id" "uuid", "p_scale_up_status" "text", "p_opportunity_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_kpi_dashboard_summary"("p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date", "p_state" "text" DEFAULT NULL::"text", "p_region_id" "uuid" DEFAULT NULL::"uuid", "p_rsm_user_id" "uuid" DEFAULT NULL::"uuid", "p_product_model" "text" DEFAULT NULL::"text", "p_crop" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
declare
  v_today date := current_date;
  v_start_date date := coalesce(p_start_date, date '2026-04-01');
  v_end_date date := coalesce(p_end_date, current_date);
  v_current_month_start date := date_trunc('month', current_date)::date;
  v_current_week_start date := (current_date - ((extract(dow from current_date)::int + 6) % 7))::date;
  v_fy_start date := date '2026-04-01';
  v_fy_end date := date '2027-03-31';
  v_fy_device_target integer := 20000;
  v_state_rsm_target integer := 10000;
begin
  return (
    with
    active_pilot_statuses(status_text) as (
      values
        ('Approved'::text),
        ('Device Assigned'::text),
        ('Device Dispatched'::text),
        ('Device Installed'::text),
        ('Monitoring Active'::text),
        ('Visit Report Pending'::text),
        ('Final Report Pending'::text),
        ('Final Report Submitted'::text),
        ('Final Report Reviewed'::text),
        ('Scale-up Recommended'::text)
    ),
    installed_statuses(status_text) as (
      values
        ('Installed'::text),
        ('Verified'::text),
        ('Follow-up Pending'::text),
        ('Issue Reported'::text),
        ('Closed'::text)
    ),
    active_institution_statuses(status_text) as (
      values
        ('Active Account'::text),
        ('Pilot Approved'::text),
        ('Pilot Installed'::text),
        ('Pilot Monitoring Active'::text),
        ('Pilot Report Submitted'::text),
        ('Scale-up Discussion'::text),
        ('PO / MoU / Commercial Discussion'::text),
        ('Scale-up Order Received'::text),
        ('Scale-up Installation Started'::text)
    ),
    scale_up_statuses(status_text) as (
      values
        ('Discussion Active'::text),
        ('Proposal Shared'::text),
        ('Commercial Negotiation'::text),
        ('PO / Approval Pending'::text),
        ('Order Received'::text),
        ('Installation Started'::text),
        ('Active Scale-up'::text)
    ),
    visible_users as (
      select *
      from public.users
    ),
    visible_regions as (
      select *
      from public.regions
    ),
    visible_leads as (
      select
        l.*,
        l.funnel_stage::text as funnel_stage_text,
        l.lead_status::text as lead_status_text,
        l.product_recommended::text as product_recommended_text,
        l.primary_crop::text as primary_crop_text
      from public.farmer_leads l
      where l.deleted_at is null
    ),
    visible_dealers as (
      select
        d.*,
        d.dealer_status::text as dealer_status_text,
        d.training_status::text as training_status_text
      from public.dealers d
      where d.deleted_at is null
    ),
    visible_institutions as (
      select
        i.*,
        i.institution_status::text as institution_status_text,
        i.proposal_shared::text as proposal_shared_text,
        i.scale_up_status::text as scale_up_status_text
      from public.institutions i
      where i.deleted_at is null
        and (
          not public.is_rd_head()
          or i.rd_head_user_id = public.get_current_user_id()
        )
        and (
          not public.is_agronomist()
          or i.technical_owner_user_id = public.get_current_user_id()
          or exists (
            select 1
            from public.pilots p
            join visible_users u
              on u.id = p.research_assistant_user_id
            where p.institution_id = i.id
              and p.deleted_at is null
              and (
                p.pilot_owner_user_id = public.get_current_user_id()
                or p.agronomist_user_id = public.get_current_user_id()
                or p.created_by_user_id = public.get_current_user_id()
                or (
                  u.reports_to_user_id = public.get_current_user_id()
                  and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                )
              )
          )
        )
    ),
    visible_pilots as (
      select
        p.*,
        p.pilot_status::text as pilot_status_text,
        p.product_model::text as product_model_text,
        p.crop::text as crop_text
      from public.pilots p
      where p.deleted_at is null
        and (
          not public.is_agronomist()
          or p.pilot_owner_user_id = public.get_current_user_id()
          or p.agronomist_user_id = public.get_current_user_id()
          or p.created_by_user_id = public.get_current_user_id()
          or exists (
            select 1
            from visible_users u
            where u.id = p.research_assistant_user_id
              and u.reports_to_user_id = public.get_current_user_id()
              and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
          )
        )
    ),
    visible_installations as (
      select
        i.*,
        i.installation_status::text as installation_status_text,
        i.installation_type::text as installation_type_text,
        i.product_model::text as product_model_text
      from public.installations i
      where i.deleted_at is null
    ),
    visible_devices as (
      select
        d.*,
        d.device_status::text as device_status_text,
        d.current_holder_type::text as current_holder_type_text,
        d.product_model::text as product_model_text
      from public.devices d
      where d.deleted_at is null
    ),
    visible_dispatches as (
      select
        dp.*,
        dp.dispatch_status::text as dispatch_status_text,
        dp.product_model::text as product_model_text
      from public.dispatches dp
      where dp.deleted_at is null
    ),
    visible_followups as (
      select
        f.*,
        f.followup_status::text as followup_status_text
      from public.followups f
      where f.deleted_at is null
    ),
    visible_meetings as (
      select m.*
      from public.institution_meetings m
      left join visible_institutions i
        on i.id = m.institution_id
      where (
        not public.is_rd_head()
        or m.rd_head_user_id = public.get_current_user_id()
        or i.rd_head_user_id = public.get_current_user_id()
      )
      and (
        not public.is_agronomist()
        or m.agronomist_user_id = public.get_current_user_id()
        or i.id is not null
      )
    ),
    visible_pilot_visits as (
      select
        v.*,
        v.visit_status::text as visit_status_text
      from public.pilot_visits v
      left join visible_pilots p
        on p.id = v.pilot_id
      where v.deleted_at is null
        and (
          not public.is_agronomist()
          or p.id is not null
          or exists (
            select 1
            from visible_users u
            where u.id = v.visited_by_user_id
              and (
                u.id = public.get_current_user_id()
                or u.reports_to_user_id = public.get_current_user_id()
              )
          )
        )
    ),
    visible_reports as (
      select
        r.*,
        r.report_type::text as report_type_text,
        r.report_status::text as report_status_text
      from public.visit_reports r
      left join visible_pilots p
        on p.id = r.pilot_id
      where r.deleted_at is null
        and (
          not public.is_agronomist()
          or p.id is not null
          or exists (
            select 1
            from visible_users u
            where u.id = r.submitted_by_user_id
              and (
                u.id = public.get_current_user_id()
                or u.reports_to_user_id = public.get_current_user_id()
              )
          )
        )
    ),
    matched_leads as (
      select l.*
      from visible_leads l
      where (p_state is null or l.state = p_state)
        and (p_region_id is null or l.region_id = p_region_id)
        and (p_rsm_user_id is null or l.rsm_user_id = p_rsm_user_id)
        and (p_crop is null or l.primary_crop_text = p_crop)
        and (p_product_model is null or l.product_recommended_text = p_product_model)
    ),
    matched_dealers as (
      select d.*
      from visible_dealers d
      where (p_state is null or d.state = p_state)
        and (p_region_id is null or d.region_id = p_region_id)
        and (p_rsm_user_id is null or d.rsm_user_id = p_rsm_user_id)
        and (
          p_crop is null
          or exists (
            select 1
            from unnest(coalesce(d.key_crops, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
        )
    ),
    matched_institutions as (
      select i.*
      from visible_institutions i
      where (p_state is null or i.primary_state = p_state)
        and (
          p_region_id is null
          or i.primary_region_id = p_region_id
          or p_region_id::text = any(coalesce(i.regions_covered, array[]::text[]))
        )
        and (p_rsm_user_id is null or i.rsm_user_id = p_rsm_user_id)
        and (
          p_crop is null
          or exists (
            select 1
            from unnest(coalesce(i.crop_focus, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
        )
    ),
    matched_pilots as (
      select p.*
      from visible_pilots p
      where (p_state is null or p.state = p_state)
        and (p_region_id is null or p.region_id = p_region_id)
        and (p_rsm_user_id is null or p.rsm_user_id = p_rsm_user_id)
        and (p_crop is null or p.crop_text = p_crop)
        and (p_product_model is null or p.product_model_text = p_product_model)
    ),
    matched_installations as (
      select i.*
      from visible_installations i
      left join visible_leads l
        on l.id = i.farmer_lead_id
      left join visible_pilots p
        on p.id = i.pilot_id
      where (p_state is null or i.state = p_state or l.state = p_state or p.state = p_state)
        and (
          p_region_id is null
          or i.region_id = p_region_id
          or l.region_id = p_region_id
          or p.region_id = p_region_id
        )
        and (
          p_rsm_user_id is null
          or i.rsm_user_id = p_rsm_user_id
          or l.rsm_user_id = p_rsm_user_id
          or p.rsm_user_id = p_rsm_user_id
        )
        and (p_crop is null or l.primary_crop_text = p_crop or p.crop_text = p_crop)
        and (p_product_model is null or i.product_model_text = p_product_model or p.product_model_text = p_product_model)
    ),
    matched_devices as (
      select d.*
      from visible_devices d
      left join visible_leads l
        on l.id = d.linked_farmer_lead_id
      left join visible_pilots p
        on p.id = d.linked_pilot_id
      left join visible_dealers dealer
        on dealer.id = d.linked_dealer_id
      left join visible_institutions inst
        on inst.id = d.linked_institution_id
      where (
          p_state is null
          or d.current_state = p_state
          or l.state = p_state
          or p.state = p_state
          or dealer.state = p_state
          or inst.primary_state = p_state
        )
        and (
          p_region_id is null
          or l.region_id = p_region_id
          or p.region_id = p_region_id
          or dealer.region_id = p_region_id
          or inst.primary_region_id = p_region_id
        )
        and (
          p_rsm_user_id is null
          or l.rsm_user_id = p_rsm_user_id
          or p.rsm_user_id = p_rsm_user_id
          or dealer.rsm_user_id = p_rsm_user_id
          or inst.rsm_user_id = p_rsm_user_id
        )
        and (
          p_crop is null
          or l.primary_crop_text = p_crop
          or p.crop_text = p_crop
          or exists (
            select 1
            from unnest(coalesce(dealer.key_crops, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
          or exists (
            select 1
            from unnest(coalesce(inst.crop_focus, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
        )
        and (p_product_model is null or d.product_model_text = p_product_model)
    ),
    matched_dispatches as (
      select dp.*
      from visible_dispatches dp
      left join visible_leads l
        on l.id = coalesce(dp.linked_farmer_lead_id, dp.destination_farmer_lead_id)
      left join visible_pilots p
        on p.id = coalesce(dp.linked_pilot_id, dp.destination_pilot_id)
      left join visible_dealers dealer
        on dealer.id = coalesce(dp.linked_dealer_id, dp.destination_dealer_id)
      left join visible_institutions inst
        on inst.id = coalesce(dp.linked_institution_id, dp.destination_institution_id)
      where (
          p_state is null
          or dp.destination_state = p_state
          or l.state = p_state
          or p.state = p_state
          or dealer.state = p_state
          or inst.primary_state = p_state
        )
        and (
          p_region_id is null
          or l.region_id = p_region_id
          or p.region_id = p_region_id
          or dealer.region_id = p_region_id
          or inst.primary_region_id = p_region_id
        )
        and (
          p_rsm_user_id is null
          or l.rsm_user_id = p_rsm_user_id
          or p.rsm_user_id = p_rsm_user_id
          or dealer.rsm_user_id = p_rsm_user_id
          or inst.rsm_user_id = p_rsm_user_id
        )
        and (
          p_crop is null
          or l.primary_crop_text = p_crop
          or p.crop_text = p_crop
          or exists (
            select 1
            from unnest(coalesce(dealer.key_crops, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
          or exists (
            select 1
            from unnest(coalesce(inst.crop_focus, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
        )
        and (p_product_model is null or dp.product_model_text = p_product_model or p.product_model_text = p_product_model)
    ),
    matched_followups as (
      select f.*
      from visible_followups f
      left join visible_leads l
        on l.id = f.farmer_lead_id
      left join visible_pilots p
        on p.id = f.pilot_id
      left join visible_dealers dealer
        on dealer.id = f.dealer_id
      left join visible_institutions inst
        on inst.id = f.institution_id
      where (
          p_state is null
          or l.state = p_state
          or p.state = p_state
          or dealer.state = p_state
          or inst.primary_state = p_state
        )
        and (
          p_region_id is null
          or l.region_id = p_region_id
          or p.region_id = p_region_id
          or dealer.region_id = p_region_id
          or inst.primary_region_id = p_region_id
        )
        and (
          p_rsm_user_id is null
          or l.rsm_user_id = p_rsm_user_id
          or p.rsm_user_id = p_rsm_user_id
          or dealer.rsm_user_id = p_rsm_user_id
          or inst.rsm_user_id = p_rsm_user_id
        )
        and (
          p_crop is null
          or l.primary_crop_text = p_crop
          or p.crop_text = p_crop
          or exists (
            select 1
            from unnest(coalesce(dealer.key_crops, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
          or exists (
            select 1
            from unnest(coalesce(inst.crop_focus, array[]::public.crop_option[])) as crop_value(value)
            where crop_value.value::text = p_crop
          )
        )
        and (p_product_model is null or p.product_model_text = p_product_model)
    ),
    matched_meetings as (
      select m.*
      from visible_meetings m
      join matched_institutions i
        on i.id = m.institution_id
    ),
    matched_visits as (
      select v.*
      from visible_pilot_visits v
      join matched_pilots p
        on p.id = v.pilot_id
    ),
    matched_reports as (
      select r.*
      from visible_reports r
      left join matched_pilots p
        on p.id = r.pilot_id
      left join matched_leads l
        on l.id = r.farmer_lead_id
      left join matched_institutions i
        on i.id = r.institution_id
      where p.id is not null
        or l.id is not null
        or i.id is not null
        or (
          r.pilot_id is null
          and r.farmer_lead_id is null
          and r.institution_id is null
        )
    ),
    range_leads as (
      select *
      from matched_leads
      where lead_date between v_start_date and v_end_date
    ),
    month_leads as (
      select *
      from matched_leads
      where lead_date between v_current_month_start and v_today
    ),
    fy_installations as (
      select *
      from matched_installations
      where installation_status_text in (select status_text from installed_statuses)
        and installation_date between v_fy_start and v_fy_end
    ),
    month_installations as (
      select *
      from matched_installations
      where installation_status_text in (select status_text from installed_statuses)
        and installation_date between v_current_month_start and v_today
    ),
    week_installations as (
      select *
      from matched_installations
      where installation_status_text in (select status_text from installed_statuses)
        and installation_date between v_current_week_start and v_today
    ),
    range_installations as (
      select *
      from matched_installations
      where installation_date between v_start_date and v_end_date
    ),
    range_dispatches as (
      select *
      from matched_dispatches
      where coalesce(dispatch_date, created_at::date) between v_start_date and v_end_date
    ),
    range_followups as (
      select *
      from matched_followups
      where followup_due_date between v_start_date and v_end_date
    ),
    range_pilots as (
      select *
      from matched_pilots
      where created_at::date between v_start_date and v_end_date
    ),
    range_visits as (
      select *
      from matched_visits
      where visit_date between v_start_date and v_end_date
    ),
    range_reports as (
      select *
      from matched_reports
      where report_date between v_start_date and v_end_date
    ),
    range_meetings as (
      select *
      from matched_meetings
      where meeting_date between v_start_date and v_end_date
    ),
    month_meetings as (
      select *
      from matched_meetings
      where meeting_date between v_current_month_start and v_today
    ),
    rsm_ids as (
      select distinct id
      from (
        select u.id
        from visible_users u
        where public.user_has_role(u.id, 'RSM'::public.user_role)
        union all select rsm_user_id from visible_leads where rsm_user_id is not null
        union all select rsm_user_id from visible_installations where rsm_user_id is not null
        union all select rsm_user_id from visible_dealers where rsm_user_id is not null
        union all select rsm_user_id from visible_pilots where rsm_user_id is not null
      ) ids
      where p_rsm_user_id is null or id = p_rsm_user_id
    ),
    rsm_region_targets as (
      select
        target_rows.user_id,
        coalesce(sum(target_rows.annual_device_target), 0) as annual_device_target
      from (
        select distinct
          u.id as user_id,
          vr.id as region_id,
          vr.annual_device_target
        from visible_users u
        join visible_regions vr
          on vr.rsm_user_id = u.id
          or vr.id = u.region_id
        where public.user_has_role(u.id, 'RSM'::public.user_role)
      ) target_rows
      group by target_rows.user_id
    ),
    rsm_rows as (
      select
        r.id,
        coalesce(u.full_name, 'Unassigned RSM') as rsm,
        coalesce(
          nullif(string_agg(distinct vr.region_name, ', '), ''),
          u.state,
          min(l.state),
          min(i.state),
          ''
        ) as region,
        case
          when coalesce(u.state, min(vr.state), min(l.state), min(i.state), '') in ('Karnataka', 'Tamil Nadu')
            then v_state_rsm_target
          else coalesce(rt.annual_device_target, 0)
        end as target,
        count(distinct fi.id) as installed,
        count(distinct rl.id) as leads,
        count(distinct rl.id) filter (where rl.sales_completed is true or rl.lead_status_text = 'Won') as sales,
        count(distinct fi.id) filter (
          where fi.dealer_id is not null
             or fi.installation_type_text = 'Dealer Farmer Installation'
        ) as dealer_installations,
        count(distinct mp.id) filter (where mp.institution_id is not null) as institutional_pilots
      from rsm_ids r
      left join visible_users u
        on u.id = r.id
      left join visible_regions vr
        on vr.rsm_user_id = r.id
        or vr.id = u.region_id
      left join rsm_region_targets rt
        on rt.user_id = r.id
      left join fy_installations fi
        on fi.rsm_user_id = r.id
      left join range_leads rl
        on rl.rsm_user_id = r.id
      left join visible_leads l
        on l.rsm_user_id = r.id
      left join visible_installations i
        on i.rsm_user_id = r.id
      left join matched_pilots mp
        on mp.rsm_user_id = r.id
      group by r.id, u.full_name, u.state, rt.annual_device_target
      having
        p_region_id is null
        or bool_or(vr.id = p_region_id or u.region_id = p_region_id)
    ),
    month_keys as (
      select generate_series(
        date_trunc('month', v_start_date)::date,
        date_trunc('month', v_end_date)::date,
        interval '1 month'
      )::date as month_start
      limit 24
    ),
    installations_by_month as (
      select
        to_char(m.month_start, 'Mon YYYY') as label,
        count(ri.id)::int as value
      from month_keys m
      left join range_installations ri
        on ri.installation_status_text in (select status_text from installed_statuses)
       and date_trunc('month', ri.installation_date)::date = m.month_start
      group by m.month_start
      order by m.month_start
    ),
    installations_by_product as (
      select coalesce(product_model_text, 'Not set') as label, count(*)::int as value
      from range_installations
      where installation_status_text in (select status_text from installed_statuses)
      group by coalesce(product_model_text, 'Not set')
      order by count(*) desc, coalesce(product_model_text, 'Not set')
    ),
    leads_by_funnel_stage as (
      select coalesce(funnel_stage_text, 'Not set') as label, count(*)::int as value
      from range_leads
      group by coalesce(funnel_stage_text, 'Not set')
      order by count(*) desc, coalesce(funnel_stage_text, 'Not set')
    ),
    devices_by_status as (
      select coalesce(device_status_text, 'Not set') as label, count(*)::int as value
      from matched_devices
      group by coalesce(device_status_text, 'Not set')
    ),
    pilots_by_status as (
      select coalesce(pilot_status_text, 'Not set') as label, count(*)::int as value
      from range_pilots
      group by coalesce(pilot_status_text, 'Not set')
      order by count(*) desc, coalesce(pilot_status_text, 'Not set')
    ),
    meetings_by_month as (
      select
        to_char(m.month_start, 'Mon YYYY') as label,
        count(rm.id)::int as value
      from month_keys m
      left join range_meetings rm
        on date_trunc('month', rm.meeting_date)::date = m.month_start
      group by m.month_start
      order by m.month_start
    ),
    current_ra_pilots as (
      select *
      from matched_pilots
      where pilot_owner_user_id = public.get_current_user_id()
         or research_assistant_user_id = public.get_current_user_id()
         or created_by_user_id = public.get_current_user_id()
    ),
    current_ra_pilot_ids as (
      select id from current_ra_pilots
    ),
    current_agronomist_team_ids as (
      select public.get_current_user_id() as id
      union
      select u.id
      from visible_users u
      where u.is_active is true
        and u.reports_to_user_id = public.get_current_user_id()
        and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
    ),
    current_agronomist_pilots as (
      select *
      from matched_pilots
      where pilot_owner_user_id = public.get_current_user_id()
         or agronomist_user_id = public.get_current_user_id()
         or created_by_user_id = public.get_current_user_id()
    ),
    current_agronomist_team_pilots as (
      select p.*
      from matched_pilots p
      where p.pilot_owner_user_id in (select id from current_agronomist_team_ids)
         or p.created_by_user_id in (select id from current_agronomist_team_ids)
         or p.research_assistant_user_id in (select id from current_agronomist_team_ids)
         or p.agronomist_user_id = public.get_current_user_id()
    ),
    agronomist_rows as (
      select
        u.id,
        u.full_name as name,
        count(distinct p.id) filter (where p.pilot_status_text in (select status_text from active_pilot_statuses)) as active_pilots,
        count(distinct v.id) filter (where v.visit_status_text = 'Completed') as visits_completed,
        count(distinct r.id) filter (where r.report_status_text = 'Submitted') as reports_submitted,
        count(distinct p.id) filter (
          where p.scale_up_recommended is true
             or p.pilot_status_text = 'Scale-up Recommended'
        ) as scale_up_recommended
      from visible_users u
      left join visible_users ra
        on ra.reports_to_user_id = u.id
       and public.user_has_role(ra.id, 'Research Assistant'::public.user_role)
      left join matched_pilots p
        on p.agronomist_user_id = u.id
        or p.pilot_owner_user_id = u.id
        or p.created_by_user_id = u.id
        or p.research_assistant_user_id = ra.id
      left join range_visits v
        on v.pilot_id = p.id
        or v.visited_by_user_id = u.id
        or v.visited_by_user_id = ra.id
      left join range_reports r
        on r.pilot_id = p.id
        or r.submitted_by_user_id = u.id
        or r.submitted_by_user_id = ra.id
      where u.is_active is true
        and public.user_has_role(u.id, 'Agronomist'::public.user_role)
      group by u.id, u.full_name
      order by u.full_name
    ),
    research_assistant_rows as (
      select
        u.id,
        u.full_name as name,
        coalesce(manager.full_name, 'Not set') as manager,
        count(distinct p.id) as assigned_pilots,
        count(distinct v.id) filter (where v.visit_status_text = 'Completed') as visits_completed,
        count(distinct r.id) filter (where r.report_status_text = 'Submitted') as reports_submitted
      from visible_users u
      left join visible_users manager
        on manager.id = u.reports_to_user_id
      left join matched_pilots p
        on p.research_assistant_user_id = u.id
        or p.pilot_owner_user_id = u.id
        or p.created_by_user_id = u.id
      left join range_visits v
        on v.pilot_id = p.id
        or v.visited_by_user_id = u.id
      left join range_reports r
        on r.pilot_id = p.id
        or r.submitted_by_user_id = u.id
      where u.is_active is true
        and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
      group by u.id, u.full_name, manager.full_name
      order by u.full_name
    )
    select jsonb_build_object(
      'filters', jsonb_build_object(
        'regions', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', id,
            'region_name', region_name,
            'is_active', is_active
          ) order by region_name)
          from visible_regions
          where is_active is true
        ), '[]'::jsonb),
        'rsmUsers', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', id,
            'full_name', full_name,
            'is_active', is_active
          ) order by full_name)
          from visible_users
          where is_active is true
            and public.user_has_role(id, 'RSM'::public.user_role)
        ), '[]'::jsonb)
      ),
      'management', jsonb_build_object(
        'fyDeviceTarget', v_fy_device_target,
        'fyEnd', v_fy_end,
        'devicesInstalledFy', (select count(*) from fy_installations),
        'monthlyInstallations', (select count(*) from month_installations),
        'weeklyInstallations', (select count(*) from week_installations),
        'warehouseStock', (select count(*) from matched_devices where device_status_text = 'In Warehouse'),
        'dealerStock', (select count(*) from matched_devices where device_status_text = 'With Dealer' or current_holder_type_text = 'Dealer'),
        'activePilots', (select count(*) from matched_pilots where pilot_status_text in (select status_text from active_pilot_statuses)),
        'activeDealers', (select count(*) from matched_dealers where dealer_status_text in ('Active', 'Active Dealer', 'First Farmer Installation Done')),
        'activeInstitutionalPartners', (
          select count(*)
          from matched_institutions
          where institution_status_text in (select status_text from active_institution_statuses)
             or scale_up_status_text = 'Active Scale-up'
        )
      ),
      'sales', jsonb_build_object(
        'newLeadsThisMonth', (select count(*) from month_leads),
        'openLeads', (select count(*) from range_leads where lead_status_text = 'Open'),
        'wonLeads', (select count(*) from range_leads where lead_status_text = 'Won'),
        'lostLeads', (select count(*) from range_leads where lead_status_text = 'Lost'),
        'paymentConfirmed', (select count(*) from range_leads where payment_confirmed is true),
        'deviceInstalledLeads', (select count(*) from range_leads where installation_completed is true),
        'followupsCompleted', (
          select count(*)
          from range_leads
          where followup_completed is true
             or funnel_stage_text = '15-Day Follow-up Completed'
        ),
        'followupsDue', (
          select count(*)
          from range_followups
          where followup_status_text = 'Due'
             or (followup_completed_date is null and followup_due_date <= v_today)
        )
      ),
      'dealers', jsonb_build_object(
        'totalDealers', (select count(*) from matched_dealers),
        'activeDealers', (select count(*) from matched_dealers where dealer_status_text in ('Active', 'Active Dealer', 'First Farmer Installation Done')),
        'dormantDealers', (select count(*) from matched_dealers where dealer_status_text in ('Dormant', 'Dormant Dealer')),
        'trainedDealers', (select count(*) from matched_dealers where training_status_text = 'Training Completed'),
        'dealerStock', (select count(*) from matched_devices where device_status_text = 'With Dealer' or current_holder_type_text = 'Dealer'),
        'dealerInstallations', (
          select count(*)
          from range_installations
          where dealer_id is not null
             or installation_type_text = 'Dealer Farmer Installation'
        ),
        'monthlyInstallations', (select count(*) from month_installations),
        'monthlyTarget', (select coalesce(sum(monthly_installation_target), 0) from matched_dealers)
      ),
      'institutions', jsonb_build_object(
        'totalInstitutions', (select count(*) from matched_institutions),
        'activeInstitutionalPartners', (
          select count(*)
          from matched_institutions
          where institution_status_text in (select status_text from active_institution_statuses)
             or scale_up_status_text = 'Active Scale-up'
        ),
        'institutionalMeetingsThisMonth', (select count(*) from month_meetings),
        'rdHeadMeetingsThisMonth', (select count(*) from month_meetings where rd_head_user_id is not null),
        'pilotProposalsShared', (
          select count(*)
          from matched_institutions
          where proposal_shared_text = 'Yes'
             or institution_status_text = 'Pilot Proposal Shared'
        ),
        'institutionalPilotsStarted', (select count(*) from matched_pilots where institution_id is not null),
        'scaleUpOpportunities', (
          select count(*)
          from matched_institutions
          where scale_up_status_text in (select status_text from scale_up_statuses)
             or coalesce(total_scale_up_potential_devices, 0) > 0
        ),
        'parkedLostInstitutions', (
          select count(*)
          from matched_institutions
          where institution_status_text in ('Parked', 'Lost')
             or scale_up_status_text in ('Parked', 'Lost')
        )
      ),
      'pilots', jsonb_build_object(
        'totalPilots', (select count(*) from matched_pilots),
        'activePilotsInRange', (select count(*) from range_pilots where pilot_status_text in (select status_text from active_pilot_statuses)),
        'pilotVisitsCompleted', (select count(*) from range_visits where visit_status_text = 'Completed'),
        'visitReportsSubmitted', (select count(*) from range_reports where report_status_text = 'Submitted'),
        'finalPilotReportsApproved', (
          select count(*)
          from range_reports
          where report_type_text = 'Final Pilot Report'
            and report_status_text = 'Approved'
        ),
        'reportsPending', (
          select count(*)
          from range_reports
          where report_status_text in ('Draft', 'Revision Required')
        ),
        'scaleUpRecommendedPilots', (
          select count(*)
          from matched_pilots
          where scale_up_recommended is true
             or pilot_status_text = 'Scale-up Recommended'
        ),
        'closedSuccessfulPilots', (select count(*) from matched_pilots where pilot_status_text = 'Closed - Successful')
      ),
      'agronomist', jsonb_build_object(
        'activeOwnPilots', (
          select count(*)
          from current_agronomist_pilots
          where pilot_status_text in (select status_text from active_pilot_statuses)
        ),
        'activeTeamPilots', (
          select count(*)
          from current_agronomist_team_pilots
          where pilot_status_text in (select status_text from active_pilot_statuses)
        ),
        'visitsCompleted', (
          select count(distinct v.id)
          from range_visits v
          left join current_agronomist_team_pilots p
            on p.id = v.pilot_id
          where v.visit_status_text = 'Completed'
            and (
              p.id is not null
              or v.visited_by_user_id in (select id from current_agronomist_team_ids)
            )
        ),
        'reportsSubmitted', (
          select count(distinct r.id)
          from range_reports r
          left join current_agronomist_team_pilots p
            on p.id = r.pilot_id
          where r.report_status_text = 'Submitted'
            and (
              p.id is not null
              or r.submitted_by_user_id in (select id from current_agronomist_team_ids)
            )
        ),
        'finalReportsPending', (
          select count(*)
          from current_agronomist_team_pilots
          where pilot_status_text = 'Final Report Pending'
        ),
        'scaleUpRecommended', (
          select count(*)
          from current_agronomist_team_pilots
          where scale_up_recommended is true
             or pilot_status_text = 'Scale-up Recommended'
        )
      ),
      'researchAssistant', jsonb_build_object(
        'leadsCreated', (select count(*) from range_leads where created_by_user_id = public.get_current_user_id()),
        'assignedPilots', (select count(*) from current_ra_pilots),
        'visitsCompleted', (
          select count(distinct v.id)
          from range_visits v
          where v.visit_status_text = 'Completed'
            and (
              v.visited_by_user_id = public.get_current_user_id()
              or v.pilot_id in (select id from current_ra_pilot_ids)
            )
        ),
        'reportsSubmitted', (
          select count(distinct r.id)
          from range_reports r
          where r.report_status_text = 'Submitted'
            and (
              r.submitted_by_user_id = public.get_current_user_id()
              or r.pilot_id in (select id from current_ra_pilot_ids)
            )
        ),
        'followupsCompleted', (
          select count(*)
          from range_followups
          where followup_owner_user_id = public.get_current_user_id()
            and followup_status_text = 'Completed'
        )
      ),
      'rdHead', jsonb_build_object(
        'totalActivePilots', (select count(*) from matched_pilots where pilot_status_text in (select status_text from active_pilot_statuses)),
        'finalReportsPendingReview', (
          select count(*)
          from range_reports
          where report_type_text = 'Final Pilot Report'
            and report_status_text <> 'Approved'
        ),
        'finalReportsApproved', (
          select count(*)
          from range_reports
          where report_type_text = 'Final Pilot Report'
            and report_status_text = 'Approved'
        ),
        'scaleUpRecommended', (
          select count(*)
          from matched_pilots
          where scale_up_recommended is true
             or pilot_status_text = 'Scale-up Recommended'
        ),
        'agronomistRows', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', id,
            'name', name,
            'activePilots', active_pilots,
            'visitsCompleted', visits_completed,
            'reportsSubmitted', reports_submitted,
            'scaleUpRecommended', scale_up_recommended
          ) order by name)
          from agronomist_rows
        ), '[]'::jsonb),
        'researchAssistantRows', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', id,
            'name', name,
            'manager', manager,
            'assignedPilots', assigned_pilots,
            'visitsCompleted', visits_completed,
            'reportsSubmitted', reports_submitted
          ) order by name)
          from research_assistant_rows
        ), '[]'::jsonb)
      ),
      'stock', jsonb_build_object(
        'total', (select count(*) from matched_devices),
        'warehouse', (select count(*) from matched_devices where device_status_text = 'In Warehouse'),
        'dealer', (select count(*) from matched_devices where device_status_text = 'With Dealer' or current_holder_type_text = 'Dealer'),
        'dispatched', (select count(*) from range_dispatches where dispatch_status_text = 'Dispatched'),
        'installedFarmer', (select count(*) from matched_devices where device_status_text = 'Installed at Farmer Site'),
        'installedPilot', (select count(*) from matched_devices where device_status_text = 'Installed for Pilot'),
        'returned', (select count(*) from matched_devices where device_status_text = 'Returned'),
        'damagedHold', (select count(*) from matched_devices where device_status_text in ('Damaged', 'Hold'))
      ),
      'rsmRows', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', id,
          'rsm', rsm,
          'region', region,
          'target', target,
          'installed', installed,
          'achievement', case when target > 0 then installed::numeric / target::numeric * 100 else 0 end,
          'leads', leads,
          'sales', sales,
          'dealerInstallations', dealer_installations,
          'institutionalPilots', institutional_pilots
        ) order by rsm)
        from rsm_rows
        where p_state is null or region ilike '%' || p_state || '%'
      ), '[]'::jsonb),
      'charts', jsonb_build_object(
        'installationsByMonth', coalesce((select jsonb_agg(to_jsonb(t)) from installations_by_month t), '[]'::jsonb),
        'installationsByProduct', coalesce((select jsonb_agg(to_jsonb(t)) from installations_by_product t), '[]'::jsonb),
        'leadsByFunnelStage', coalesce((select jsonb_agg(to_jsonb(t)) from leads_by_funnel_stage t), '[]'::jsonb),
        'devicesByStatus', coalesce((select jsonb_agg(to_jsonb(t)) from devices_by_status t), '[]'::jsonb),
        'pilotsByStatus', coalesce((select jsonb_agg(to_jsonb(t)) from pilots_by_status t), '[]'::jsonb),
        'institutionalMeetingsByMonth', coalesce((select jsonb_agg(to_jsonb(t)) from meetings_by_month t), '[]'::jsonb)
      )
    )
  );
end;
$$;


ALTER FUNCTION "public"."get_kpi_dashboard_summary"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_kpi_dashboard_summary"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") IS 'Returns aggregated KPI Dashboard JSON for the logged-in user. SECURITY INVOKER preserves table RLS and user scope.';



CREATE OR REPLACE FUNCTION "public"."get_my_visits_summary_counts"("p_assigned_user_id" "uuid", "p_today" "date") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select jsonb_build_object(
    'dueToday', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date = p_today
    ),
    'upcoming', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date > p_today
    ),
    'overdue', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date < p_today
    ),
    'needsReport', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and (planned_visit_date <= p_today or planned_visit_status = 'In Progress')
    ),
    'completed', count(*) filter (where linked_visit_report_id is not null)
  )
  from public.planned_pilot_visits
  where assigned_user_id = p_assigned_user_id
    and deleted_at is null;
$$;


ALTER FUNCTION "public"."get_my_visits_summary_counts"("p_assigned_user_id" "uuid", "p_today" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_work_oversight_summary_counts"("p_today" "date") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with viewer as (
    select
      public.get_current_user_id() as id,
      public.current_region_id() as region_id,
      public.current_state() as state,
      public.is_admin() as is_admin,
      public.is_management() as is_management,
      public.is_sales_head() as is_sales_head,
      public.is_rsm() as is_rsm,
      public.is_rd_head() as is_rd_head,
      public.is_agronomist() as is_agronomist,
      public.is_marketing_head() as is_marketing_head
  ),
  visible_pilots as (
    select p.id, p.pilot_owner_user_id
    from public.pilots p
    cross join viewer v
    where p.deleted_at is null
      and (
        v.is_admin
        or v.is_management
        or v.is_rd_head
        or (
          v.is_agronomist
          and (
            p.pilot_owner_user_id = v.id
            or p.agronomist_user_id = v.id
            or p.created_by_user_id = v.id
            or p.research_assistant_user_id = v.id
            or exists (
              select 1
              from public.users ra
              where ra.id = p.research_assistant_user_id
                and ra.is_active is true
                and ra.reports_to_user_id = v.id
                and public.user_has_role(ra.id, 'Research Assistant')
            )
          )
        )
      )
  ),
  sales_items as (
    select concat('farmer-lead:', fl.id, ':follow-up') as item_key
    from public.farmer_leads fl
    cross join viewer v
    where fl.deleted_at is null
      and fl.lead_status::text not in ('Won', 'Lost', 'Parked')
      and fl.funnel_stage::text not in ('Won', 'Lost', 'Parked')
      and fl.next_action_date <= p_today
      and fl.owner_user_id is distinct from v.id
      and fl.rsm_user_id is distinct from v.id
      and (
        v.is_admin
        or v.is_management
        or v.is_sales_head
        or (
          v.is_rsm
          and (
            fl.rsm_user_id = v.id
            or fl.region_id = v.region_id
            or lower(coalesce(fl.state, '')) = lower(coalesce(v.state, ''))
          )
        )
      )

    union all

    select concat('farmer-lead:', fl.id, ':dispatch-ready')
    from public.farmer_leads fl
    cross join viewer v
    where fl.deleted_at is null
      and fl.payment_confirmed is true
      and fl.device_dispatched is false
      and fl.owner_user_id is distinct from v.id
      and fl.rsm_user_id is distinct from v.id
      and not exists (
        select 1
        from public.dispatches d
        where d.deleted_at is null
          and d.dispatch_status::text <> 'Cancelled'
          and (
            d.linked_farmer_lead_id = fl.id
            or d.destination_farmer_lead_id = fl.id
          )
      )
      and (
        v.is_admin
        or v.is_management
        or v.is_sales_head
        or (
          v.is_rsm
          and (
            fl.rsm_user_id = v.id
            or fl.region_id = v.region_id
            or lower(coalesce(fl.state, '')) = lower(coalesce(v.state, ''))
          )
        )
      )

    union all

    select concat('dealer:', d.id, ':review')
    from public.dealers d
    cross join viewer v
    where d.deleted_at is null
      and (d.next_action_date <= p_today or d.next_dealer_review_date <= p_today)
      and d.dealer_owner_user_id is distinct from v.id
      and d.rsm_user_id is distinct from v.id
      and (
        v.is_admin
        or v.is_management
        or v.is_sales_head
        or (
          v.is_rsm
          and (
            d.rsm_user_id = v.id
            or d.region_id = v.region_id
            or lower(coalesce(d.state, '')) = lower(coalesce(v.state, ''))
          )
        )
      )

    union all

    select concat('institution:', i.id, ':review')
    from public.institutions i
    cross join viewer v
    where i.deleted_at is null
      and i.next_action_date <= p_today
      and i.account_owner_user_id is distinct from v.id
      and i.technical_owner_user_id is distinct from v.id
      and i.rsm_user_id is distinct from v.id
      and (
        v.is_admin
        or v.is_management
        or v.is_sales_head
        or (
          v.is_rsm
          and (
            i.rsm_user_id = v.id
            or i.primary_region_id = v.region_id
            or lower(coalesce(i.primary_state, '')) = lower(coalesce(v.state, ''))
          )
        )
      )
  ),
  dispatch_items as (
    -- Paid farmer leads are intentionally omitted here. For the only roles
    -- that have Dispatch grouped work (Admin and Management), Sales precedes
    -- Dispatch and owns the shared farmer-lead business key.
    select concat('pilot:', p.id, ':dispatch-ready') as item_key
    from public.pilots p
    cross join viewer v
    where (v.is_admin or v.is_management)
      and p.deleted_at is null
      and p.installation_completed is false
      and p.pilot_status::text in ('Planned', 'Approved', 'Device Assigned')
      and p.pilot_owner_user_id is distinct from v.id
      and not exists (
        select 1
        from public.dispatches d
        where d.deleted_at is null
          and d.dispatch_status::text <> 'Cancelled'
          and (d.linked_pilot_id = p.id or d.destination_pilot_id = p.id)
      )

    union all

    select concat('dispatch:', d.id, ':dealer-payment')
    from public.dispatches d
    cross join viewer v
    where v.is_admin
      and d.deleted_at is null
      and d.dispatch_type::text = 'Dealer Stock Dispatch'
      and d.payment_requirement_type::text = 'Payment Required'
      and d.payment_confirmed is false
      and d.dispatch_status::text <> 'Cancelled'

    union all

    select concat('dispatch:', d.id, ':dealer-ready')
    from public.dispatches d
    cross join viewer v
    where v.is_admin
      and d.deleted_at is null
      and d.dispatch_type::text = 'Dealer Stock Dispatch'
      and d.payment_requirement_type::text = 'Payment Required'
      and d.payment_confirmed is true
      and d.dispatch_status::text in ('Approved for Dispatch', 'Dispatch Requested')

    union all

    select concat('dispatch:', d.id, ':action')
    from public.dispatches d
    cross join viewer v
    where (v.is_admin or v.is_management)
      and d.deleted_at is null
      and d.dispatch_type::text <> 'Dealer Stock Dispatch'
      and d.dispatch_status::text in (
        'Dispatch Requested',
        'Pending Payment Confirmation',
        'Pending Approval',
        'Approved for Dispatch',
        'Installation Pending',
        'On Hold'
      )
  ),
  pilot_items as (
    select concat('pilot:', p.id, ':installation') as item_key
    from visible_pilots p
    cross join viewer v
    join public.pilots source_pilot on source_pilot.id = p.id
    where source_pilot.installation_completed is false
      and source_pilot.pilot_status::text = 'Device Dispatched'
      and p.pilot_owner_user_id is distinct from v.id

    union all

    select concat('planned-visit:', pv.id, ':report')
    from public.planned_pilot_visits pv
    join visible_pilots p on p.id = pv.pilot_id
    cross join viewer v
    where pv.deleted_at is null
      and pv.linked_visit_report_id is null
      and pv.planned_visit_status::text in (
        'Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled'
      )
      and (pv.planned_visit_date <= p_today or pv.planned_visit_status::text = 'In Progress')
      and pv.assigned_user_id is distinct from v.id

    union all

    select concat('visit-report:', vr.id, ':review')
    from public.visit_reports vr
    join visible_pilots p on p.id = vr.pilot_id
    where vr.deleted_at is null
      and vr.report_status::text = 'Submitted'
  ),
  marketing_items as (
    select distinct mr.id
    from public.marketing_requests mr
    cross join viewer v
    where (v.is_admin or v.is_management or v.is_marketing_head)
      and mr.deleted_at is null
      and mr.marketing_status::text in (
        'Requested',
        'Needs Clarification',
        'Accepted',
        'In Progress',
        'Draft Shared',
        'Corrections Requested'
      )
      and (
        (
          mr.marketing_status::text in ('Requested', 'Needs Clarification')
          and mr.marketing_head_user_id is distinct from v.id
          and mr.assigned_to_user_id is distinct from v.id
        )
        or (
          mr.deadline_date < p_today
          and mr.marketing_head_user_id is distinct from v.id
          and mr.assigned_to_user_id is distinct from v.id
        )
      )
  ),
  counts as (
    select
      (select count(*)::integer from sales_items) as sales,
      (select count(*)::integer from dispatch_items) as dispatch,
      (select count(*)::integer from pilot_items) as pilots,
      (select count(*)::integer from marketing_items) as marketing
  )
  select jsonb_build_object(
    'mode', case
      when v.is_admin or v.is_management then 'oversight'
      when v.is_sales_head or v.is_rsm or v.is_rd_head or v.is_agronomist or v.is_marketing_head then 'team-actions'
      else null
    end,
    'sales', c.sales,
    'dispatch', c.dispatch,
    'pilots', c.pilots,
    'marketing', c.marketing,
    'total', c.sales + c.dispatch + c.pilots + c.marketing
  )
  from viewer v
  cross join counts c;
$$;


ALTER FUNCTION "public"."get_my_work_oversight_summary_counts"("p_today" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pilot_monitoring_work_item_shadow_drift"() RETURNS TABLE("discrepancy_type" "text", "source_table" "text", "source_id" "uuid", "action_type" "text", "business_key" "text", "details" "jsonb")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not ((select public.is_admin()) or (select public.is_management())) then
    raise exception 'Only Admin or Management can run Pilot monitoring work-item reconciliation.';
  end if;

  return query
  with expected as (
    select candidate.*
    from public.pilots p
    cross join lateral public.pilot_installation_work_item_candidates(p.id) candidate

    union all

    select candidate.*
    from public.planned_pilot_visits ppv
    cross join lateral public.planned_pilot_visit_work_item_candidates(ppv.id) candidate

    union all

    select candidate.*
    from public.visit_reports vr
    cross join lateral public.visit_report_review_work_item_candidates(vr.id) candidate
  ),
  actual as (
    select
      wi.source_table as actual_source_table,
      wi.source_id as actual_source_id,
      wi.action_type as actual_action_type,
      wi.business_key as actual_business_key,
      wi.status as actual_status,
      wi.category as actual_category,
      wi.assignee_user_id as actual_assignee_user_id,
      wi.rsm_user_id as actual_rsm_user_id,
      wi.region_id as actual_region_id,
      wi.state as actual_state,
      wi.due_at as actual_due_at,
      wi.ui_payload as actual_ui_payload,
      case
        when wi.source_table = 'pilots' then exists (
          select 1 from public.pilots p where p.id = wi.source_id
        )
        when wi.source_table = 'planned_pilot_visits' then exists (
          select 1 from public.planned_pilot_visits ppv where ppv.id = wi.source_id
        )
        when wi.source_table = 'visit_reports' then exists (
          select 1 from public.visit_reports vr where vr.id = wi.source_id
        )
        else false
      end as actual_source_exists
    from public.work_items wi
    where wi.category = 'pilots'
       or wi.source_table in ('planned_pilot_visits', 'visit_reports')
       or wi.action_type in (
         'pilot_installation_confirm',
         'planned_visit_report_needed',
         'visit_report_review'
       )
  ),
  compared as (
    select
      e.source_table,
      e.source_id,
      e.action_type,
      e.business_key,
      e.status,
      e.category,
      e.assignee_user_id,
      e.rsm_user_id,
      e.region_id,
      e.state,
      e.due_at,
      e.ui_payload,
      a.actual_source_table,
      a.actual_source_id,
      a.actual_action_type,
      a.actual_business_key,
      a.actual_status,
      a.actual_category,
      a.actual_assignee_user_id,
      a.actual_rsm_user_id,
      a.actual_region_id,
      a.actual_state,
      a.actual_due_at,
      a.actual_ui_payload,
      a.actual_source_exists
    from expected e
    full outer join actual a
      on e.business_key = a.actual_business_key
  ),
  drift as (
    select
      case
        when c.actual_business_key is null then 'missing_shadow_item'
        when c.business_key is null and c.actual_source_exists is false then 'orphaned_shadow_item'
        when c.business_key is null then 'stale_shadow_item'
        when c.source_table is distinct from c.actual_source_table
          or c.source_id is distinct from c.actual_source_id then 'wrong_source'
        when c.action_type is distinct from c.actual_action_type then 'wrong_action_type'
        when c.status is distinct from c.actual_status then 'wrong_status'
        when c.category is distinct from c.actual_category then 'wrong_category'
        when c.assignee_user_id is distinct from c.actual_assignee_user_id then 'wrong_assignee'
        when c.rsm_user_id is distinct from c.actual_rsm_user_id then 'wrong_rsm'
        when c.region_id is distinct from c.actual_region_id then 'wrong_region'
        when c.state is distinct from c.actual_state then 'wrong_state'
        when c.due_at is distinct from c.actual_due_at then 'wrong_due_date'
        when c.ui_payload is distinct from c.actual_ui_payload then 'wrong_payload'
        else null
      end as discrepancy_type,
      coalesce(c.source_table, c.actual_source_table) as output_source_table,
      coalesce(c.source_id, c.actual_source_id) as output_source_id,
      coalesce(c.action_type, c.actual_action_type) as output_action_type,
      coalesce(c.business_key, c.actual_business_key) as output_business_key,
      jsonb_build_object(
        'expected', jsonb_build_object(
          'source_table', c.source_table,
          'source_id', c.source_id,
          'action_type', c.action_type,
          'status', c.status,
          'category', c.category,
          'assignee_user_id', c.assignee_user_id,
          'rsm_user_id', c.rsm_user_id,
          'region_id', c.region_id,
          'state', c.state,
          'due_at', c.due_at,
          'ui_payload', c.ui_payload
        ),
        'actual', jsonb_build_object(
          'source_table', c.actual_source_table,
          'source_id', c.actual_source_id,
          'action_type', c.actual_action_type,
          'status', c.actual_status,
          'category', c.actual_category,
          'assignee_user_id', c.actual_assignee_user_id,
          'rsm_user_id', c.actual_rsm_user_id,
          'region_id', c.actual_region_id,
          'state', c.actual_state,
          'due_at', c.actual_due_at,
          'ui_payload', c.actual_ui_payload
        )
      ) as output_details
    from compared c
  )
  select
    d.discrepancy_type,
    d.output_source_table,
    d.output_source_id,
    d.output_action_type,
    d.output_business_key,
    d.output_details
  from drift d
  where d.discrepancy_type is not null;
end;
$$;


ALTER FUNCTION "public"."get_pilot_monitoring_work_item_shadow_drift"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_pilot_monitoring_work_item_shadow_drift"() IS 'Admin/Management-only read-only reconciliation for Pilot monitoring work-item Stage A shadow proof.';



CREATE OR REPLACE FUNCTION "public"."get_pilots_page_kpis"("p_q" "text" DEFAULT NULL::"text", "p_pilot_type" "text" DEFAULT NULL::"text", "p_pilot_status" "text" DEFAULT NULL::"text", "p_pilot_result_status" "text" DEFAULT NULL::"text", "p_crop" "text" DEFAULT NULL::"text", "p_state" "text" DEFAULT NULL::"text", "p_district" "text" DEFAULT NULL::"text", "p_pilot_owner_user_id" "uuid" DEFAULT NULL::"uuid", "p_research_assistant_user_id" "uuid" DEFAULT NULL::"uuid", "p_agronomist_user_id" "uuid" DEFAULT NULL::"uuid", "p_rd_head_user_id" "uuid" DEFAULT NULL::"uuid", "p_institution_id" "uuid" DEFAULT NULL::"uuid", "p_dealer_id" "uuid" DEFAULT NULL::"uuid", "p_scale_up_recommended" boolean DEFAULT NULL::boolean) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with scoped as (
    select p.*
    from public.pilots p
    where p.deleted_at is null
      and (
        public.is_admin()
        or public.is_management()
        or public.is_sales_head()
        or public.is_rd_head()
        or public.is_viewer()
        or (
          public.is_research_assistant()
          and (
            p.pilot_owner_user_id = public.get_current_user_id()
            or p.research_assistant_user_id = public.get_current_user_id()
            or p.created_by_user_id = public.get_current_user_id()
          )
        )
        or (
          public.is_agronomist()
          and (
            p.pilot_owner_user_id = public.get_current_user_id()
            or p.agronomist_user_id = public.get_current_user_id()
            or p.created_by_user_id = public.get_current_user_id()
            or exists (
              select 1
              from public.users u
              where u.id = p.research_assistant_user_id
                and u.is_active is true
                and public.user_has_role(u.id, 'Research Assistant'::public.user_role)
                and u.reports_to_user_id = public.get_current_user_id()
            )
          )
        )
        or (
          public.is_rsm()
          and (
            p.rsm_user_id = public.get_current_user_id()
            or p.region_id = public.current_region_id()
            or p.state = public.current_state()
            or exists (
              select 1
              from public.farmer_leads fl
              where fl.id = p.farmer_lead_id
                and (
                  fl.rsm_user_id = public.get_current_user_id()
                  or fl.region_id = public.current_region_id()
                  or fl.state = public.current_state()
                )
            )
          )
        )
        or (
          public.is_salesperson()
          and exists (
            select 1
            from public.farmer_leads fl
            where fl.id = p.farmer_lead_id
              and fl.owner_user_id = public.get_current_user_id()
          )
        )
      )
      and (
        nullif(trim(p_q), '') is null
        or p.pilot_code ilike '%' || trim(p_q) || '%'
        or p.pilot_name ilike '%' || trim(p_q) || '%'
        or p.farmer_name_snapshot ilike '%' || trim(p_q) || '%'
        or p.farmer_mobile_snapshot ilike '%' || trim(p_q) || '%'
        or p.village ilike '%' || trim(p_q) || '%'
        or p.location_or_cluster_name ilike '%' || trim(p_q) || '%'
      )
      and (nullif(p_pilot_type, '') is null or p.pilot_type::text = p_pilot_type)
      and (nullif(p_pilot_status, '') is null or p.pilot_status::text = p_pilot_status)
      and (nullif(p_pilot_result_status, '') is null or p.pilot_result_status::text = p_pilot_result_status)
      and (nullif(p_crop, '') is null or p.crop::text = p_crop)
      and (nullif(trim(p_state), '') is null or p.state ilike '%' || trim(p_state) || '%')
      and (nullif(trim(p_district), '') is null or p.district ilike '%' || trim(p_district) || '%')
      and (p_pilot_owner_user_id is null or p.pilot_owner_user_id = p_pilot_owner_user_id)
      and (p_research_assistant_user_id is null or p.research_assistant_user_id = p_research_assistant_user_id)
      and (p_agronomist_user_id is null or p.agronomist_user_id = p_agronomist_user_id)
      and (p_rd_head_user_id is null or p.rd_head_user_id = p_rd_head_user_id)
      and (p_institution_id is null or p.institution_id = p_institution_id)
      and (p_dealer_id is null or p.dealer_id = p_dealer_id)
      and (p_scale_up_recommended is null or p.scale_up_recommended = p_scale_up_recommended)
  )
  select jsonb_build_object(
    'total', count(*),
    'active', count(*) filter (
      where pilot_status::text in (
        'Approved',
        'Device Assigned',
        'Device Dispatched',
        'Device Installed',
        'Monitoring Active',
        'Visit Report Pending',
        'Final Report Pending',
        'Final Report Submitted'
      )
    ),
    'installed', count(*) filter (where installation_completed is true),
    'visitPending', count(*) filter (where pilot_status::text = 'Visit Report Pending'),
    'finalPending', count(*) filter (where pilot_status::text = 'Final Report Pending'),
    'finalReviewed', count(*) filter (where pilot_status::text = 'Final Report Reviewed'),
    'scaleUp', count(*) filter (where scale_up_recommended is true),
    'successful', count(*) filter (where pilot_status::text = 'Closed - Successful')
  )
  from scoped;
$$;


ALTER FUNCTION "public"."get_pilots_page_kpis"("p_q" "text", "p_pilot_type" "text", "p_pilot_status" "text", "p_pilot_result_status" "text", "p_crop" "text", "p_state" "text", "p_district" "text", "p_pilot_owner_user_id" "uuid", "p_research_assistant_user_id" "uuid", "p_agronomist_user_id" "uuid", "p_rd_head_user_id" "uuid", "p_institution_id" "uuid", "p_dealer_id" "uuid", "p_scale_up_recommended" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_visible_pilot_work_item_count"("p_today" "date") RETURNS integer
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select count(*)::integer
  from public.work_items wi
  where wi.status = 'Open'
    and wi.category = 'pilots'
    and (
      wi.action_type in ('pilot_installation_confirm', 'visit_report_review')
      or (
        wi.action_type = 'planned_visit_report_needed'
        and (
          wi.due_at <= p_today
          or wi.ui_payload ->> 'planned_visit_status' = 'In Progress'
        )
      )
    );
$$;


ALTER FUNCTION "public"."get_visible_pilot_work_item_count"("p_today" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_visible_pilot_work_item_count"("p_today" "date") IS 'RLS-preserving lightweight My Work count for visible Pilot monitoring work items.';



CREATE OR REPLACE FUNCTION "public"."get_visible_planned_visit_counts"("p_today" "date") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select jsonb_build_object(
    'total', count(*),
    'upcoming', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date > p_today
    ),
    'dueWeek', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date >= p_today
        and planned_visit_date <= p_today + 7
    ),
    'overdue', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date < p_today
    ),
    'due', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
        and planned_visit_date <= p_today
    ),
    'pendingReport', count(*) filter (
      where linked_visit_report_id is null
        and planned_visit_status in ('Planned', 'Assigned', 'Due', 'In Progress', 'Rescheduled')
    ),
    'completed', count(*) filter (
      where planned_visit_status = 'Completed'
    )
  )
  from public.planned_pilot_visits
  where deleted_at is null;
$$;


ALTER FUNCTION "public"."get_visible_planned_visit_counts"("p_today" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_accounts"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.current_user_has_role('Accounts')
$$;


ALTER FUNCTION "public"."is_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.current_user_has_role('Admin')
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_agronomist"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.current_user_has_role('Agronomist')
$$;


ALTER FUNCTION "public"."is_agronomist"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_designer"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from public.users u
    where u.id = public.get_current_user_id()
      and u.is_active is true
      and (u.role::text = 'Designer' or u.secondary_role::text = 'Designer')
  )
$$;


ALTER FUNCTION "public"."is_designer"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_hr_legal"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.users u
    where lower(u.email) = lower((auth.jwt() ->> 'email'))
      and u.is_active = true
      and (u.role::text = 'HR & Legal' or u.secondary_role::text = 'HR & Legal')
  )
$$;


ALTER FUNCTION "public"."is_hr_legal"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_hr_legal"() IS 'Returns true when the logged-in active internal user has HR & Legal as primary or secondary role.';



CREATE OR REPLACE FUNCTION "public"."is_management"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.current_user_has_role('Management')
$$;


ALTER FUNCTION "public"."is_management"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_marketing_head"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from public.users u
    where u.id = public.get_current_user_id()
      and u.is_active is true
      and (u.role::text = 'Marketing Head' or u.secondary_role::text = 'Marketing Head')
  )
$$;


ALTER FUNCTION "public"."is_marketing_head"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_rd_head"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.current_user_has_role('R&D Head')
$$;


ALTER FUNCTION "public"."is_rd_head"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_research_assistant"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.current_user_has_role('Research Assistant')
$$;


ALTER FUNCTION "public"."is_research_assistant"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_rsm"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.current_user_has_role('RSM')
$$;


ALTER FUNCTION "public"."is_rsm"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_sales_head"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.current_user_has_role('Sales Head')
$$;


ALTER FUNCTION "public"."is_sales_head"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_salesperson"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.current_user_has_role('Salesperson')
$$;


ALTER FUNCTION "public"."is_salesperson"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_stock_dispatch"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.current_user_has_role('Stock / Dispatch')
$$;


ALTER FUNCTION "public"."is_stock_dispatch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_viewer"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.current_user_has_role('Viewer')
$$;


ALTER FUNCTION "public"."is_viewer"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."kpi_dashboard_cache_key"("p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date", "p_state" "text" DEFAULT NULL::"text", "p_region_id" "uuid" DEFAULT NULL::"uuid", "p_rsm_user_id" "uuid" DEFAULT NULL::"uuid", "p_product_model" "text" DEFAULT NULL::"text", "p_crop" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select md5(
    jsonb_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date,
      'state', nullif(btrim(coalesce(p_state, '')), ''),
      'region_id', p_region_id,
      'rsm_user_id', p_rsm_user_id,
      'product_model', nullif(btrim(coalesce(p_product_model, '')), ''),
      'crop', nullif(btrim(coalesce(p_crop, '')), '')
    )::text
  )
$$;


ALTER FUNCTION "public"."kpi_dashboard_cache_key"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."kpi_dashboard_cache_key"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") IS 'Builds a stable cache key for a KPI Dashboard filter set.';



CREATE OR REPLACE FUNCTION "public"."make_year_code"("prefix" "text", "seq_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  n bigint;
BEGIN
  EXECUTE format('SELECT nextval(%L)', seq_name) INTO n;
  RETURN prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
END;
$$;


ALTER FUNCTION "public"."make_year_code"("prefix" "text", "seq_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_current_user_password_changed"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.users
  set must_change_password = false
  where id = public.get_current_user_id()
    and is_active = true;
end;
$$;


ALTER FUNCTION "public"."mark_current_user_password_changed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_kpi_dashboard_sections_dirty"("section_names" "text"[], "reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_sections text[];
begin
  if not (public.is_admin() or public.is_management() or public.is_sales_head()) then
    raise exception 'Only Admin, Management, or Sales Head can mark KPI Dashboard sections dirty.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct nullif(btrim(section_name), '')), '{}'::text[])
  into v_sections
  from unnest(coalesce(section_names, '{}'::text[])) as section_item(section_name);

  if array_length(v_sections, 1) is null then
    return jsonb_build_object(
      'marked', false,
      'sections', '[]'::jsonb,
      'message', 'No KPI sections were provided.'
    );
  end if;

  insert into public.kpi_dashboard_dirty_flags (
    section_name,
    is_dirty,
    dirty_reason,
    last_marked_dirty_at,
    updated_at
  )
  select
    section_name,
    true,
    reason,
    now(),
    now()
  from unnest(v_sections) as section_item(section_name)
  on conflict (section_name)
  do update set
    is_dirty = true,
    dirty_reason = excluded.dirty_reason,
    last_marked_dirty_at = excluded.last_marked_dirty_at,
    updated_at = now();

  return jsonb_build_object(
    'marked', true,
    'sections', to_jsonb(v_sections),
    'reason', reason
  );
end;
$$;


ALTER FUNCTION "public"."mark_kpi_dashboard_sections_dirty"("section_names" "text"[], "reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_kpi_dashboard_sections_dirty"("section_names" "text"[], "reason" "text") IS 'Phase 1 manual dirty flag helper for future incremental KPI refresh integration. No automatic triggers call this yet.';



CREATE OR REPLACE FUNCTION "public"."pilot_dispatch_work_item_candidates"("p_pilot_id" "uuid") RETURNS TABLE("source_table" "text", "source_id" "uuid", "action_type" "text", "business_key" "text", "status" "text", "category" "text", "assignee_user_id" "uuid", "rsm_user_id" "uuid", "region_id" "uuid", "state" "text", "due_at" "date", "ui_payload" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    'pilots'::text,
    p.id,
    'pilot_dispatch_ready'::text,
    concat('pilot:', p.id, ':dispatch-ready'),
    'Open'::text,
    'dispatch'::text,
    p.pilot_owner_user_id,
    p.rsm_user_id,
    p.region_id,
    p.state,
    null::date,
    jsonb_strip_nulls(jsonb_build_object(
      'pilot_code', p.pilot_code,
      'pilot_name', p.pilot_name,
      'farmer_name', p.farmer_name_snapshot,
      'pilot_status', p.pilot_status
    ))
  from public.pilots p
  where p.id = p_pilot_id
    and p.deleted_at is null
    and p.installation_completed is false
    and p.pilot_status in ('Planned', 'Approved', 'Device Assigned')
    and not exists (
      select 1
      from public.dispatches d
      where d.deleted_at is null
        and d.dispatch_status <> 'Cancelled'
        and (
          d.linked_pilot_id = p.id
          or d.destination_pilot_id = p.id
        )
    );
$$;


ALTER FUNCTION "public"."pilot_dispatch_work_item_candidates"("p_pilot_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."pilot_dispatch_work_item_candidates"("p_pilot_id" "uuid") IS 'Internal candidate function for Pilot dispatch-ready My Work shadow items. This preserves current My Work visibility and does not grant Stock / Dispatch Pilot work visibility.';



CREATE OR REPLACE FUNCTION "public"."pilot_installation_work_item_candidates"("p_pilot_id" "uuid") RETURNS TABLE("source_table" "text", "source_id" "uuid", "action_type" "text", "business_key" "text", "status" "text", "category" "text", "assignee_user_id" "uuid", "rsm_user_id" "uuid", "region_id" "uuid", "state" "text", "due_at" "date", "ui_payload" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    'pilots'::text,
    p.id,
    'pilot_installation_confirm'::text,
    concat('pilot:', p.id, ':installation-confirm'),
    'Open'::text,
    'pilots'::text,
    p.pilot_owner_user_id,
    p.rsm_user_id,
    p.region_id,
    p.state,
    p.next_visit_due_date,
    jsonb_strip_nulls(jsonb_build_object(
      'pilot_code', p.pilot_code,
      'pilot_name', p.pilot_name,
      'farmer_name', p.farmer_name_snapshot,
      'pilot_status', p.pilot_status,
      'product_model', p.product_model
    ))
  from public.pilots p
  where p.id = p_pilot_id
    and p.deleted_at is null
    and p.installation_completed is false
    and p.pilot_status = 'Device Dispatched';
$$;


ALTER FUNCTION "public"."pilot_installation_work_item_candidates"("p_pilot_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."pilot_installation_work_item_candidates"("p_pilot_id" "uuid") IS 'Internal candidate function for Pilot device-installation confirmation work items.';



CREATE OR REPLACE FUNCTION "public"."planned_pilot_visit_work_item_candidates"("p_planned_visit_id" "uuid") RETURNS TABLE("source_table" "text", "source_id" "uuid", "action_type" "text", "business_key" "text", "status" "text", "category" "text", "assignee_user_id" "uuid", "rsm_user_id" "uuid", "region_id" "uuid", "state" "text", "due_at" "date", "ui_payload" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    'planned_pilot_visits'::text,
    ppv.id,
    'planned_visit_report_needed'::text,
    concat('planned-pilot-visit:', ppv.id, ':report-needed'),
    'Open'::text,
    'pilots'::text,
    ppv.assigned_user_id,
    p.rsm_user_id,
    p.region_id,
    p.state,
    ppv.planned_visit_date,
    jsonb_strip_nulls(jsonb_build_object(
      'pilot_id', p.id,
      'pilot_code', p.pilot_code,
      'pilot_name', p.pilot_name,
      'farmer_name', p.farmer_name_snapshot,
      'visit_number', ppv.visit_number,
      'visit_type', ppv.visit_type,
      'crop_stage_timing', ppv.crop_stage_timing,
      'planned_visit_status', ppv.planned_visit_status
    ))
  from public.planned_pilot_visits ppv
  join public.pilots p on p.id = ppv.pilot_id
  where ppv.id = p_planned_visit_id
    and ppv.deleted_at is null
    and p.deleted_at is null
    and ppv.linked_visit_report_id is null
    and ppv.planned_visit_status in (
      'Planned',
      'Assigned',
      'Due',
      'In Progress',
      'Rescheduled'
    );
$$;


ALTER FUNCTION "public"."planned_pilot_visit_work_item_candidates"("p_planned_visit_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."planned_pilot_visit_work_item_candidates"("p_planned_visit_id" "uuid") IS 'Internal candidate function for planned Pilot visits that still need visit reports.';



CREATE OR REPLACE FUNCTION "public"."project_dispatch_work_items"("p_dispatch_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.work_items (
    source_table, source_id, action_type, business_key, status, category,
    assignee_user_id, rsm_user_id, region_id, state, due_at, ui_payload
  )
  select
    candidate.source_table, candidate.source_id, candidate.action_type,
    candidate.business_key, candidate.status, candidate.category,
    candidate.assignee_user_id, candidate.rsm_user_id, candidate.region_id,
    candidate.state, candidate.due_at, candidate.ui_payload
  from public.dispatch_work_item_candidates(p_dispatch_id) candidate
  on conflict (business_key) do update
  set
    source_table = excluded.source_table,
    source_id = excluded.source_id,
    action_type = excluded.action_type,
    status = excluded.status,
    category = excluded.category,
    assignee_user_id = excluded.assignee_user_id,
    rsm_user_id = excluded.rsm_user_id,
    region_id = excluded.region_id,
    state = excluded.state,
    due_at = excluded.due_at,
    ui_payload = excluded.ui_payload
  where work_items.source_table is distinct from excluded.source_table
     or work_items.source_id is distinct from excluded.source_id
     or work_items.action_type is distinct from excluded.action_type
     or work_items.status is distinct from excluded.status
     or work_items.category is distinct from excluded.category
     or work_items.assignee_user_id is distinct from excluded.assignee_user_id
     or work_items.rsm_user_id is distinct from excluded.rsm_user_id
     or work_items.region_id is distinct from excluded.region_id
     or work_items.state is distinct from excluded.state
     or work_items.due_at is distinct from excluded.due_at
     or work_items.ui_payload is distinct from excluded.ui_payload;

  delete from public.work_items wi
  where wi.source_table = 'dispatches'
    and wi.source_id = p_dispatch_id
    and wi.category = 'dispatch'
    and not exists (
      select 1
      from public.dispatch_work_item_candidates(p_dispatch_id) candidate
      where candidate.business_key = wi.business_key
    );
end;
$$;


ALTER FUNCTION "public"."project_dispatch_work_items"("p_dispatch_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."project_dispatch_work_items"("p_dispatch_id" "uuid") IS 'Projects one Dispatch row into dispatch-category work_items. Operational Dispatch remains the source of truth.';



CREATE OR REPLACE FUNCTION "public"."project_farmer_lead_work_items"("p_lead_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.work_items (
    source_table, source_id, action_type, business_key, status, category,
    assignee_user_id, rsm_user_id, region_id, state, due_at, ui_payload
  )
  select
    candidate.source_table, candidate.source_id, candidate.action_type,
    candidate.business_key, candidate.status, candidate.category,
    candidate.assignee_user_id, candidate.rsm_user_id, candidate.region_id,
    candidate.state, candidate.due_at, candidate.ui_payload
  from public.farmer_lead_work_item_candidates(p_lead_id) candidate
  on conflict (business_key) do update
  set
    source_table = excluded.source_table,
    source_id = excluded.source_id,
    action_type = excluded.action_type,
    status = excluded.status,
    category = excluded.category,
    assignee_user_id = excluded.assignee_user_id,
    rsm_user_id = excluded.rsm_user_id,
    region_id = excluded.region_id,
    state = excluded.state,
    due_at = excluded.due_at,
    ui_payload = excluded.ui_payload
  where work_items.source_table is distinct from excluded.source_table
     or work_items.source_id is distinct from excluded.source_id
     or work_items.action_type is distinct from excluded.action_type
     or work_items.status is distinct from excluded.status
     or work_items.category is distinct from excluded.category
     or work_items.assignee_user_id is distinct from excluded.assignee_user_id
     or work_items.rsm_user_id is distinct from excluded.rsm_user_id
     or work_items.region_id is distinct from excluded.region_id
     or work_items.state is distinct from excluded.state
     or work_items.due_at is distinct from excluded.due_at
     or work_items.ui_payload is distinct from excluded.ui_payload;

  delete from public.work_items wi
  where wi.source_table = 'farmer_leads'
    and wi.source_id = p_lead_id
    and not exists (
      select 1
      from public.farmer_lead_work_item_candidates(p_lead_id) candidate
      where candidate.business_key = wi.business_key
    );
end;
$$;


ALTER FUNCTION "public"."project_farmer_lead_work_items"("p_lead_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."project_farmer_lead_work_items"("p_lead_id" "uuid") IS 'Internal shadow projection for the approved Farmer Lead follow-up and dispatch-ready actions only.';



CREATE OR REPLACE FUNCTION "public"."project_pilot_dispatch_work_items"("p_pilot_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.work_items (
    source_table, source_id, action_type, business_key, status, category,
    assignee_user_id, rsm_user_id, region_id, state, due_at, ui_payload
  )
  select
    candidate.source_table, candidate.source_id, candidate.action_type,
    candidate.business_key, candidate.status, candidate.category,
    candidate.assignee_user_id, candidate.rsm_user_id, candidate.region_id,
    candidate.state, candidate.due_at, candidate.ui_payload
  from public.pilot_dispatch_work_item_candidates(p_pilot_id) candidate
  on conflict (business_key) do update
  set
    source_table = excluded.source_table,
    source_id = excluded.source_id,
    action_type = excluded.action_type,
    status = excluded.status,
    category = excluded.category,
    assignee_user_id = excluded.assignee_user_id,
    rsm_user_id = excluded.rsm_user_id,
    region_id = excluded.region_id,
    state = excluded.state,
    due_at = excluded.due_at,
    ui_payload = excluded.ui_payload
  where work_items.source_table is distinct from excluded.source_table
     or work_items.source_id is distinct from excluded.source_id
     or work_items.action_type is distinct from excluded.action_type
     or work_items.status is distinct from excluded.status
     or work_items.category is distinct from excluded.category
     or work_items.assignee_user_id is distinct from excluded.assignee_user_id
     or work_items.rsm_user_id is distinct from excluded.rsm_user_id
     or work_items.region_id is distinct from excluded.region_id
     or work_items.state is distinct from excluded.state
     or work_items.due_at is distinct from excluded.due_at
     or work_items.ui_payload is distinct from excluded.ui_payload;

  delete from public.work_items wi
  where wi.source_table = 'pilots'
    and wi.source_id = p_pilot_id
    and wi.action_type = 'pilot_dispatch_ready'
    and wi.category = 'dispatch'
    and not exists (
      select 1
      from public.pilot_dispatch_work_item_candidates(p_pilot_id) candidate
      where candidate.business_key = wi.business_key
    );
end;
$$;


ALTER FUNCTION "public"."project_pilot_dispatch_work_items"("p_pilot_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."project_pilot_dispatch_work_items"("p_pilot_id" "uuid") IS 'Projects one Pilot row into dispatch-category work_items for the existing Free Pilot dispatch-ready My Work action.';



CREATE OR REPLACE FUNCTION "public"."project_pilot_installation_work_items"("p_pilot_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.work_items (
    source_table, source_id, action_type, business_key, status, category,
    assignee_user_id, rsm_user_id, region_id, state, due_at, ui_payload
  )
  select
    candidate.source_table, candidate.source_id, candidate.action_type,
    candidate.business_key, candidate.status, candidate.category,
    candidate.assignee_user_id, candidate.rsm_user_id, candidate.region_id,
    candidate.state, candidate.due_at, candidate.ui_payload
  from public.pilot_installation_work_item_candidates(p_pilot_id) candidate
  on conflict (business_key) do update
  set
    source_table = excluded.source_table,
    source_id = excluded.source_id,
    action_type = excluded.action_type,
    status = excluded.status,
    category = excluded.category,
    assignee_user_id = excluded.assignee_user_id,
    rsm_user_id = excluded.rsm_user_id,
    region_id = excluded.region_id,
    state = excluded.state,
    due_at = excluded.due_at,
    ui_payload = excluded.ui_payload
  where work_items.source_table is distinct from excluded.source_table
     or work_items.source_id is distinct from excluded.source_id
     or work_items.action_type is distinct from excluded.action_type
     or work_items.status is distinct from excluded.status
     or work_items.category is distinct from excluded.category
     or work_items.assignee_user_id is distinct from excluded.assignee_user_id
     or work_items.rsm_user_id is distinct from excluded.rsm_user_id
     or work_items.region_id is distinct from excluded.region_id
     or work_items.state is distinct from excluded.state
     or work_items.due_at is distinct from excluded.due_at
     or work_items.ui_payload is distinct from excluded.ui_payload;

  delete from public.work_items wi
  where wi.source_table = 'pilots'
    and wi.source_id = p_pilot_id
    and wi.action_type = 'pilot_installation_confirm'
    and wi.category = 'pilots'
    and not exists (
      select 1
      from public.pilot_installation_work_item_candidates(p_pilot_id) candidate
      where candidate.business_key = wi.business_key
    );
end;
$$;


ALTER FUNCTION "public"."project_pilot_installation_work_items"("p_pilot_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."project_pilot_installation_work_items"("p_pilot_id" "uuid") IS 'Projects one Pilot row into pilots-category work_items for installation confirmation.';



CREATE OR REPLACE FUNCTION "public"."project_planned_pilot_visit_work_items"("p_planned_visit_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.work_items (
    source_table, source_id, action_type, business_key, status, category,
    assignee_user_id, rsm_user_id, region_id, state, due_at, ui_payload
  )
  select
    candidate.source_table, candidate.source_id, candidate.action_type,
    candidate.business_key, candidate.status, candidate.category,
    candidate.assignee_user_id, candidate.rsm_user_id, candidate.region_id,
    candidate.state, candidate.due_at, candidate.ui_payload
  from public.planned_pilot_visit_work_item_candidates(p_planned_visit_id) candidate
  on conflict (business_key) do update
  set
    source_table = excluded.source_table,
    source_id = excluded.source_id,
    action_type = excluded.action_type,
    status = excluded.status,
    category = excluded.category,
    assignee_user_id = excluded.assignee_user_id,
    rsm_user_id = excluded.rsm_user_id,
    region_id = excluded.region_id,
    state = excluded.state,
    due_at = excluded.due_at,
    ui_payload = excluded.ui_payload
  where work_items.source_table is distinct from excluded.source_table
     or work_items.source_id is distinct from excluded.source_id
     or work_items.action_type is distinct from excluded.action_type
     or work_items.status is distinct from excluded.status
     or work_items.category is distinct from excluded.category
     or work_items.assignee_user_id is distinct from excluded.assignee_user_id
     or work_items.rsm_user_id is distinct from excluded.rsm_user_id
     or work_items.region_id is distinct from excluded.region_id
     or work_items.state is distinct from excluded.state
     or work_items.due_at is distinct from excluded.due_at
     or work_items.ui_payload is distinct from excluded.ui_payload;

  delete from public.work_items wi
  where wi.source_table = 'planned_pilot_visits'
    and wi.source_id = p_planned_visit_id
    and wi.action_type = 'planned_visit_report_needed'
    and wi.category = 'pilots'
    and not exists (
      select 1
      from public.planned_pilot_visit_work_item_candidates(p_planned_visit_id) candidate
      where candidate.business_key = wi.business_key
    );
end;
$$;


ALTER FUNCTION "public"."project_planned_pilot_visit_work_items"("p_planned_visit_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."project_planned_pilot_visit_work_items"("p_planned_visit_id" "uuid") IS 'Projects one planned Pilot visit row into pilots-category work_items for report-needed monitoring.';



CREATE OR REPLACE FUNCTION "public"."project_visit_report_review_work_items"("p_visit_report_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.work_items (
    source_table, source_id, action_type, business_key, status, category,
    assignee_user_id, rsm_user_id, region_id, state, due_at, ui_payload
  )
  select
    candidate.source_table, candidate.source_id, candidate.action_type,
    candidate.business_key, candidate.status, candidate.category,
    candidate.assignee_user_id, candidate.rsm_user_id, candidate.region_id,
    candidate.state, candidate.due_at, candidate.ui_payload
  from public.visit_report_review_work_item_candidates(p_visit_report_id) candidate
  on conflict (business_key) do update
  set
    source_table = excluded.source_table,
    source_id = excluded.source_id,
    action_type = excluded.action_type,
    status = excluded.status,
    category = excluded.category,
    assignee_user_id = excluded.assignee_user_id,
    rsm_user_id = excluded.rsm_user_id,
    region_id = excluded.region_id,
    state = excluded.state,
    due_at = excluded.due_at,
    ui_payload = excluded.ui_payload
  where work_items.source_table is distinct from excluded.source_table
     or work_items.source_id is distinct from excluded.source_id
     or work_items.action_type is distinct from excluded.action_type
     or work_items.status is distinct from excluded.status
     or work_items.category is distinct from excluded.category
     or work_items.assignee_user_id is distinct from excluded.assignee_user_id
     or work_items.rsm_user_id is distinct from excluded.rsm_user_id
     or work_items.region_id is distinct from excluded.region_id
     or work_items.state is distinct from excluded.state
     or work_items.due_at is distinct from excluded.due_at
     or work_items.ui_payload is distinct from excluded.ui_payload;

  delete from public.work_items wi
  where wi.source_table = 'visit_reports'
    and wi.source_id = p_visit_report_id
    and wi.action_type = 'visit_report_review'
    and wi.category = 'pilots'
    and not exists (
      select 1
      from public.visit_report_review_work_item_candidates(p_visit_report_id) candidate
      where candidate.business_key = wi.business_key
    );
end;
$$;


ALTER FUNCTION "public"."project_visit_report_review_work_items"("p_visit_report_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."project_visit_report_review_work_items"("p_visit_report_id" "uuid") IS 'Projects one Visit Report row into pilots-category work_items for report review.';



CREATE OR REPLACE FUNCTION "public"."refresh_kpi_dashboard_cache_full"("p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date", "p_state" "text" DEFAULT NULL::"text", "p_region_id" "uuid" DEFAULT NULL::"uuid", "p_rsm_user_id" "uuid" DEFAULT NULL::"uuid", "p_product_model" "text" DEFAULT NULL::"text", "p_crop" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "statement_timeout" TO '60s'
    AS $$
declare
  v_refresh_id uuid;
  v_requested_by uuid;
  v_summary jsonb;
  v_cache_key text;
  v_filters jsonb;
  v_sections text[];
begin
  if not (public.is_admin() or public.is_management() or public.is_sales_head()) then
    raise exception 'Only Admin, Management, or Sales Head can refresh the KPI Dashboard.'
      using errcode = '42501';
  end if;

  v_requested_by := public.get_current_user_id();
  v_cache_key := public.kpi_dashboard_cache_key(
    p_start_date,
    p_end_date,
    p_state,
    p_region_id,
    p_rsm_user_id,
    p_product_model,
    p_crop
  );
  v_filters := jsonb_build_object(
    'start_date', p_start_date,
    'end_date', p_end_date,
    'state', nullif(btrim(coalesce(p_state, '')), ''),
    'region_id', p_region_id,
    'rsm_user_id', p_rsm_user_id,
    'product_model', nullif(btrim(coalesce(p_product_model, '')), ''),
    'crop', nullif(btrim(coalesce(p_crop, '')), '')
  );

  insert into public.kpi_dashboard_refresh_log (
    refresh_type,
    requested_by,
    status
  )
  values ('full', v_requested_by, 'Running')
  returning refresh_id into v_refresh_id;

  v_summary := public.get_kpi_dashboard_summary(
    p_start_date,
    p_end_date,
    p_state,
    p_region_id,
    p_rsm_user_id,
    p_product_model,
    p_crop
  );

  select array_agg(key order by key)
  into v_sections
  from jsonb_each(v_summary);

  insert into public.kpi_dashboard_cache (
    cache_key,
    section_name,
    filters,
    data,
    computed_at,
    refresh_id,
    source_version,
    updated_at
  )
  select
    v_cache_key,
    section_item.key,
    v_filters,
    section_item.value,
    now(),
    v_refresh_id,
    'kpi-dashboard-v1',
    now()
  from jsonb_each(v_summary) as section_item(key, value)
  on conflict (cache_key, section_name)
  do update set
    filters = excluded.filters,
    data = excluded.data,
    computed_at = excluded.computed_at,
    refresh_id = excluded.refresh_id,
    source_version = excluded.source_version,
    updated_at = now();

  update public.kpi_dashboard_dirty_flags
  set
    is_dirty = false,
    dirty_reason = null,
    last_refreshed_at = now(),
    updated_at = now()
  where is_dirty is true;

  update public.kpi_dashboard_refresh_log
  set
    finished_at = now(),
    status = 'Succeeded',
    sections_refreshed = coalesce(v_sections, '{}'::text[])
  where refresh_id = v_refresh_id;

  return public.get_cached_kpi_dashboard_summary(
    p_start_date,
    p_end_date,
    p_state,
    p_region_id,
    p_rsm_user_id,
    p_product_model,
    p_crop
  );
exception
  when others then
    if v_refresh_id is not null then
      update public.kpi_dashboard_refresh_log
      set
        finished_at = now(),
        status = 'Failed',
        error_message = sqlerrm
      where refresh_id = v_refresh_id;
    end if;

    raise;
end;
$$;


ALTER FUNCTION "public"."refresh_kpi_dashboard_cache_full"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."refresh_kpi_dashboard_cache_full"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") IS 'Manually rebuilds KPI Dashboard cache for a filter set by running the existing live KPI summary RPC once. Restricted to Admin, Management, and Sales Head.';



CREATE OR REPLACE FUNCTION "public"."reports_to_current_user"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from public.users u
    where u.id = user_id
      and u.reports_to_user_id = public.get_current_user_id()
      and u.is_active is true
  )
$$;


ALTER FUNCTION "public"."reports_to_current_user"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reports_to_current_user"("user_id" "uuid") IS 'Returns true when the given active internal user reports to the current user.';



CREATE OR REPLACE FUNCTION "public"."research_assistant_reports_to_current_user"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from public.users u
    where u.id = user_id
      and u.is_active is true
      and u.reports_to_user_id = public.get_current_user_id()
      and public.user_has_role(u.id, 'Research Assistant')
  )
$$;


ALTER FUNCTION "public"."research_assistant_reports_to_current_user"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."research_assistant_reports_to_current_user"("user_id" "uuid") IS 'Returns true when an active Research Assistant primary/secondary user reports to the current user.';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_dispatch_farmer_lead_work_items"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  related_lead_id uuid;
begin
  if tg_op = 'INSERT' then
    for related_lead_id in
      select distinct related.lead_id
      from unnest(array[
        new.linked_farmer_lead_id,
        new.destination_farmer_lead_id
      ]) as related(lead_id)
      where related.lead_id is not null
    loop
      perform public.project_farmer_lead_work_items(related_lead_id);
    end loop;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    for related_lead_id in
      select distinct related.lead_id
      from unnest(array[
        old.linked_farmer_lead_id,
        old.destination_farmer_lead_id,
        new.linked_farmer_lead_id,
        new.destination_farmer_lead_id
      ]) as related(lead_id)
      where related.lead_id is not null
    loop
      perform public.project_farmer_lead_work_items(related_lead_id);
    end loop;

    return new;
  end if;

  if tg_op = 'DELETE' then
    for related_lead_id in
      select distinct related.lead_id
      from unnest(array[
        old.linked_farmer_lead_id,
        old.destination_farmer_lead_id
      ]) as related(lead_id)
      where related.lead_id is not null
    loop
      perform public.project_farmer_lead_work_items(related_lead_id);
    end loop;

    return old;
  end if;

  raise exception 'Unsupported Dispatch trigger operation: %', tg_op;
end;
$$;


ALTER FUNCTION "public"."sync_dispatch_farmer_lead_work_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_dispatch_work_items"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  related_pilot_id uuid;
begin
  if tg_op = 'INSERT' then
    perform public.project_dispatch_work_items(new.id);

    for related_pilot_id in
      select distinct related.pilot_id
      from unnest(array[
        new.linked_pilot_id,
        new.destination_pilot_id
      ]) as related(pilot_id)
      where related.pilot_id is not null
    loop
      perform public.project_pilot_dispatch_work_items(related_pilot_id);
    end loop;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    perform public.project_dispatch_work_items(new.id);

    for related_pilot_id in
      select distinct related.pilot_id
      from unnest(array[
        old.linked_pilot_id,
        old.destination_pilot_id,
        new.linked_pilot_id,
        new.destination_pilot_id
      ]) as related(pilot_id)
      where related.pilot_id is not null
    loop
      perform public.project_pilot_dispatch_work_items(related_pilot_id);
    end loop;

    return new;
  end if;

  if tg_op = 'DELETE' then
    perform public.project_dispatch_work_items(old.id);

    for related_pilot_id in
      select distinct related.pilot_id
      from unnest(array[
        old.linked_pilot_id,
        old.destination_pilot_id
      ]) as related(pilot_id)
      where related.pilot_id is not null
    loop
      perform public.project_pilot_dispatch_work_items(related_pilot_id);
    end loop;

    return old;
  end if;

  raise exception 'Unsupported Dispatch trigger operation: %', tg_op;
end;
$$;


ALTER FUNCTION "public"."sync_dispatch_work_items"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_dispatch_work_items"() IS 'Synchronizes Dispatch-category work_items after Dispatch source changes and refreshes related Pilot dispatch-ready projections. Does not refresh Farmer Lead work_items; that is handled by the existing Farmer Lead Stage B trigger.';



CREATE OR REPLACE FUNCTION "public"."sync_farmer_lead_work_items"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'INSERT' then
    perform public.project_farmer_lead_work_items(new.id);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    perform public.project_farmer_lead_work_items(new.id);
    return new;
  end if;

  if tg_op = 'DELETE' then
    perform public.project_farmer_lead_work_items(old.id);
    return old;
  end if;

  raise exception 'Unsupported Farmer Lead trigger operation: %', tg_op;
end;
$$;


ALTER FUNCTION "public"."sync_farmer_lead_work_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_pilot_dispatch_work_items"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'INSERT' then
    perform public.project_pilot_dispatch_work_items(new.id);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    perform public.project_pilot_dispatch_work_items(new.id);
    return new;
  end if;

  if tg_op = 'DELETE' then
    perform public.project_pilot_dispatch_work_items(old.id);
    return old;
  end if;

  raise exception 'Unsupported Pilot trigger operation: %', tg_op;
end;
$$;


ALTER FUNCTION "public"."sync_pilot_dispatch_work_items"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_pilot_dispatch_work_items"() IS 'Synchronizes Pilot dispatch-ready work_items after Pilot source changes.';



CREATE OR REPLACE FUNCTION "public"."sync_pilot_monitoring_pilot_work_items"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  planned_visit_id uuid;
  report_id uuid;
  source_pilot_id uuid;
begin
  source_pilot_id := case when tg_op = 'DELETE' then old.id else new.id end;

  perform public.project_pilot_installation_work_items(source_pilot_id);

  for planned_visit_id in
    select ppv.id
    from public.planned_pilot_visits ppv
    where ppv.pilot_id = source_pilot_id
  loop
    perform public.project_planned_pilot_visit_work_items(planned_visit_id);
  end loop;

  for report_id in
    select distinct vr.id
    from public.visit_reports vr
    left join public.planned_pilot_visits ppv
      on ppv.id = vr.planned_pilot_visit_id
    where vr.pilot_id = source_pilot_id
       or ppv.pilot_id = source_pilot_id
  loop
    perform public.project_visit_report_review_work_items(report_id);
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."sync_pilot_monitoring_pilot_work_items"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_pilot_monitoring_pilot_work_items"() IS 'Synchronizes pilots-category work_items after Pilot source changes and refreshes related planned visits and submitted reports.';



CREATE OR REPLACE FUNCTION "public"."sync_planned_pilot_visit_work_items"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  report_id uuid;
begin
  if tg_op = 'DELETE' then
    perform public.project_planned_pilot_visit_work_items(old.id);

    for report_id in
      select distinct related.report_id
      from unnest(array[old.linked_visit_report_id]) as related(report_id)
      where related.report_id is not null

      union

      select vr.id
      from public.visit_reports vr
      where vr.planned_pilot_visit_id = old.id
    loop
      perform public.project_visit_report_review_work_items(report_id);
    end loop;

    return old;
  end if;

  perform public.project_planned_pilot_visit_work_items(new.id);

  for report_id in
    select distinct related.report_id
    from unnest(array[
      case when tg_op = 'UPDATE' then old.linked_visit_report_id else null end,
      new.linked_visit_report_id
    ]) as related(report_id)
    where related.report_id is not null

    union

    select vr.id
    from public.visit_reports vr
    where vr.planned_pilot_visit_id = new.id
  loop
    perform public.project_visit_report_review_work_items(report_id);
  end loop;

  return new;
end;
$$;


ALTER FUNCTION "public"."sync_planned_pilot_visit_work_items"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_planned_pilot_visit_work_items"() IS 'Synchronizes pilots-category work_items after planned Pilot visit source changes and refreshes linked reports.';



CREATE OR REPLACE FUNCTION "public"."sync_visit_report_review_work_items"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'DELETE' then
    perform public.project_visit_report_review_work_items(old.id);
    return old;
  end if;

  perform public.project_visit_report_review_work_items(new.id);
  return new;
end;
$$;


ALTER FUNCTION "public"."sync_visit_report_review_work_items"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_visit_report_review_work_items"() IS 'Synchronizes pilots-category work_items after Visit Report source changes.';



CREATE OR REPLACE FUNCTION "public"."touch_dealer_institution_links_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_dealer_institution_links_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_dealer_reviews_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_dealer_reviews_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_farmer_lead_followups_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_farmer_lead_followups_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_role"("user_id" "uuid", "role_to_check" "public"."user_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.users u
    where u.id = user_id
      and u.is_active is true
      and (u.role = role_to_check or u.secondary_role = role_to_check)
  )
$$;


ALTER FUNCTION "public"."user_has_role"("user_id" "uuid", "role_to_check" "public"."user_role") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_has_role"("user_id" "uuid", "role_to_check" "public"."user_role") IS 'Returns true when an active internal user has the role as primary or secondary role.';



CREATE OR REPLACE FUNCTION "public"."visit_report_review_work_item_candidates"("p_visit_report_id" "uuid") RETURNS TABLE("source_table" "text", "source_id" "uuid", "action_type" "text", "business_key" "text", "status" "text", "category" "text", "assignee_user_id" "uuid", "rsm_user_id" "uuid", "region_id" "uuid", "state" "text", "due_at" "date", "ui_payload" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    'visit_reports'::text,
    vr.id,
    'visit_report_review'::text,
    concat('visit-report:', vr.id, ':review'),
    'Open'::text,
    'pilots'::text,
    vr.reviewed_by_user_id,
    p.rsm_user_id,
    p.region_id,
    p.state,
    vr.report_date,
    jsonb_strip_nulls(jsonb_build_object(
      'pilot_id', p.id,
      'pilot_code', p.pilot_code,
      'pilot_name', p.pilot_name,
      'visit_report_code', vr.visit_report_code,
      'report_title', vr.report_title,
      'report_status', vr.report_status
    ))
  from public.visit_reports vr
  left join public.planned_pilot_visits ppv
    on ppv.id = vr.planned_pilot_visit_id
  join public.pilots p
    on p.id = coalesce(vr.pilot_id, ppv.pilot_id)
  where vr.id = p_visit_report_id
    and vr.deleted_at is null
    and p.deleted_at is null
    and vr.report_status = 'Submitted';
$$;


ALTER FUNCTION "public"."visit_report_review_work_item_candidates"("p_visit_report_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."visit_report_review_work_item_candidates"("p_visit_report_id" "uuid") IS 'Internal candidate function for submitted Pilot visit reports awaiting review.';



CREATE SEQUENCE IF NOT EXISTS "public"."dealer_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dealer_code_seq" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."dealer_institution_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dealer_id" "uuid" NOT NULL,
    "institution_id" "uuid" NOT NULL,
    "relationship_status" "text" DEFAULT 'Introduced'::"text" NOT NULL,
    "opportunity_name" "text",
    "expected_devices" integer,
    "next_action_date" "date",
    "concern_or_blocker" "text",
    "notes" "text",
    "created_by_user_id" "uuid" NOT NULL,
    "owner_user_id" "uuid",
    "rsm_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "dealer_institution_links_expected_devices_check" CHECK ((("expected_devices" IS NULL) OR ("expected_devices" >= 0))),
    CONSTRAINT "dealer_institution_links_status_check" CHECK (("relationship_status" = ANY (ARRAY['Introduced'::"text", 'Contact Established'::"text", 'Discussion Active'::"text", 'Proposal Shared'::"text", 'Converted'::"text", 'Dormant'::"text", 'Dropped'::"text"])))
);


ALTER TABLE "public"."dealer_institution_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dealer_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dealer_id" "uuid" NOT NULL,
    "reviewed_by_user_id" "uuid",
    "review_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "priority" "text",
    "concern_or_blocker" "text",
    "next_action" "text",
    "next_action_date" "date",
    "next_review_date" "date",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "dealer_reviews_priority_check" CHECK ((("priority" IS NULL) OR ("priority" = ANY (ARRAY['High'::"text", 'Medium'::"text", 'Low'::"text", 'Parked'::"text"]))))
);


ALTER TABLE "public"."dealer_reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."dealer_reviews" IS 'Append-only Dealer review snapshots. Current review state remains on public.dealers.';



COMMENT ON COLUMN "public"."dealer_reviews"."next_action" IS 'Optional text summary of the next action agreed during a Dealer review. Phase 1 stores this only when provided by the app.';



CREATE TABLE IF NOT EXISTS "public"."dealers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dealer_code" "text" DEFAULT "public"."make_year_code"('DL'::"text", 'public.dealer_code_seq'::"text") NOT NULL,
    "dealer_name" "text" NOT NULL,
    "firm_name" "text",
    "contact_number" "text" NOT NULL,
    "alternate_contact_number" "text",
    "email" "text",
    "dealer_type" "public"."dealer_type" NOT NULL,
    "dealer_status" "public"."dealer_status" DEFAULT 'Prospect'::"public"."dealer_status" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "dealer_owner_user_id" "uuid" NOT NULL,
    "rsm_user_id" "uuid" NOT NULL,
    "region_id" "uuid" NOT NULL,
    "state" "text" NOT NULL,
    "district" "text" NOT NULL,
    "taluk_or_territory" "text",
    "primary_market_area" "text",
    "villages_covered" "text",
    "dealer_address" "text",
    "gps_latitude" numeric(10,7),
    "gps_longitude" numeric(10,7),
    "key_crops" "public"."crop_option"[] DEFAULT '{}'::"public"."crop_option"[],
    "other_key_crops" "text",
    "approx_farmer_network" integer,
    "existing_customer_base_type" "public"."customer_base_type",
    "strong_farmer_segments" "text",
    "commercial_terms_shared" "public"."yes_no_pending_na" DEFAULT 'Pending'::"public"."yes_no_pending_na" NOT NULL,
    "dealer_agreement_status" "public"."agreement_status" DEFAULT 'Not Started'::"public"."agreement_status" NOT NULL,
    "training_status" "public"."training_status" DEFAULT 'Not Trained'::"public"."training_status" NOT NULL,
    "first_order_target_date" "date",
    "credit_terms" "public"."credit_terms" DEFAULT '100% Advance'::"public"."credit_terms" NOT NULL,
    "commercial_terms_remarks" "text",
    "agreement_required" boolean DEFAULT true NOT NULL,
    "agreement_exception_approved" boolean DEFAULT false NOT NULL,
    "agreement_exception_reason" "text",
    "monthly_installation_target" integer DEFAULT 0 NOT NULL,
    "quarterly_installation_target" integer,
    "annual_installation_target" integer,
    "leads_generated_this_month" integer,
    "farmer_meetings_this_month" integer,
    "demos_conducted_this_month" integer,
    "dealer_stock_balance" integer,
    "last_farmer_installation_date" "date",
    "last_dealer_review_date" "date",
    "next_dealer_review_date" "date",
    "support_required" "text",
    "next_action_date" "date" NOT NULL,
    "last_interaction_date" "date",
    "last_interaction_note" "text",
    "priority" "public"."priority_level" DEFAULT 'Medium'::"public"."priority_level" NOT NULL,
    "agreement_link" "text",
    "dealer_documents_folder_link" "text",
    "training_material_shared_link" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "dealer_agreement_approval_status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "dealer_agreement_approved_by_user_id" "uuid",
    "dealer_agreement_approved_at" timestamp with time zone,
    "dealer_agreement_hr_legal_comments" "text",
    "districts" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "deleted_by_user_id" "uuid",
    "deletion_reason" "text",
    "restored_at" timestamp with time zone,
    "restored_by_user_id" "uuid",
    "business_sector" "text" DEFAULT 'Agriculture'::"text" NOT NULL,
    CONSTRAINT "business_sector_allowed" CHECK (("business_sector" = ANY (ARRAY['Agriculture'::"text", 'Poultry'::"text", 'Dairy'::"text"]))),
    CONSTRAINT "dealer_active_requires_signed_agreement" CHECK (((("dealer_status")::"text" <> ALL (ARRAY['Active'::"text", 'Active Dealer'::"text"])) OR ("dealer_agreement_status" = 'Signed'::"public"."agreement_status") OR ("agreement_exception_approved" = true))),
    CONSTRAINT "dealers_agreement_approval_status_check" CHECK (("dealer_agreement_approval_status" = ANY (ARRAY['Pending'::"text", 'Approved'::"text", 'Rejected'::"text"])))
);


ALTER TABLE "public"."dealers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."dealers"."dealer_status" IS 'Simplified dealer lifecycle/health status shown in the app: Prospect, Onboarding, Active, Dormant, Dropped. Legacy enum values remain temporarily valid for compatibility but should not be used by the app.';



COMMENT ON COLUMN "public"."dealers"."districts" IS 'Districts covered by the dealer. Legacy district remains as the first selected district for compatibility during transition.';



COMMENT ON COLUMN "public"."dealers"."deleted_by_user_id" IS 'Internal user who soft-deleted this dealer record.';



COMMENT ON COLUMN "public"."dealers"."deletion_reason" IS 'Business reason captured when this dealer was soft-deleted.';



COMMENT ON COLUMN "public"."dealers"."restored_at" IS 'Timestamp when this dealer was restored from soft-delete.';



COMMENT ON COLUMN "public"."dealers"."restored_by_user_id" IS 'Internal user who restored this dealer record.';



COMMENT ON COLUMN "public"."dealers"."business_sector" IS 'Commercial sector: Agriculture, Poultry, or Dairy.';



CREATE SEQUENCE IF NOT EXISTS "public"."device_movement_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."device_movement_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "movement_code" "text" DEFAULT "public"."make_year_code"('DM'::"text", 'public.device_movement_code_seq'::"text") NOT NULL,
    "device_id" "uuid" NOT NULL,
    "serial_number_snapshot" "text" NOT NULL,
    "movement_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "movement_type" "public"."movement_type" NOT NULL,
    "movement_status" "public"."movement_status" DEFAULT 'Completed'::"public"."movement_status" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "from_holder_type" "public"."holder_type",
    "from_holder_id" "uuid",
    "from_holder_name_snapshot" "text",
    "from_location_text" "text",
    "to_holder_type" "public"."holder_type" NOT NULL,
    "to_holder_id" "uuid",
    "to_holder_name_snapshot" "text" NOT NULL,
    "to_location_text" "text",
    "dispatch_id" "uuid",
    "installation_id" "uuid",
    "farmer_lead_id" "uuid",
    "dealer_id" "uuid",
    "institution_id" "uuid",
    "pilot_id" "uuid",
    "device_condition" "public"."device_condition",
    "reason" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."device_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_status_update_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_code" "text" DEFAULT ((('DST-'::"text" || "to_char"("now"(), 'YYYY'::"text")) || '-'::"text") || "upper"("substr"("replace"(("gen_random_uuid"())::"text", '-'::"text", ''::"text"), 1, 8))) NOT NULL,
    "task_status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "task_type" "text" DEFAULT 'Pilot Device Removal'::"text" NOT NULL,
    "source_module" "text" DEFAULT 'Pilots'::"text" NOT NULL,
    "pilot_id" "uuid",
    "device_id" "uuid",
    "serial_number_snapshot" "text",
    "reason" "text" NOT NULL,
    "removal_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "requested_by_user_id" "uuid" NOT NULL,
    "assigned_role" "text" DEFAULT 'Stock / Dispatch'::"text" NOT NULL,
    "resolved_by_user_id" "uuid",
    "resolved_at" timestamp with time zone,
    "resolution_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "device_status_update_tasks_status_check" CHECK (("task_status" = ANY (ARRAY['Pending'::"text", 'In Progress'::"text", 'Resolved'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."device_status_update_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "device_code" "text",
    "serial_number" "text" NOT NULL,
    "product_model" "public"."product_model_strict" NOT NULL,
    "device_status" "public"."device_status" DEFAULT 'In Warehouse'::"public"."device_status" NOT NULL,
    "stock_entry_source" "public"."stock_entry_source" DEFAULT 'Production'::"public"."stock_entry_source" NOT NULL,
    "stock_entered_by_user_id" "uuid" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "remarks" "text",
    "current_holder_type" "public"."holder_type" DEFAULT 'Warehouse'::"public"."holder_type" NOT NULL,
    "current_holder_id" "uuid",
    "current_holder_name_snapshot" "text",
    "current_location_text" "text",
    "current_state" "text",
    "current_district" "text",
    "linked_farmer_lead_id" "uuid",
    "linked_dealer_id" "uuid",
    "linked_institution_id" "uuid",
    "linked_pilot_id" "uuid",
    "linked_dispatch_id" "uuid",
    "linked_installation_id" "uuid",
    "stock_entry_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "reserved_date" "date",
    "dispatch_date" "date",
    "installation_date" "date",
    "return_date" "date",
    "last_movement_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "return_decision" "text",
    "return_reason" "text",
    "return_photo_link" "text",
    "return_approval_status" "text" DEFAULT 'Not Required'::"text" NOT NULL,
    "return_approved_by_user_id" "uuid",
    "return_approved_at" timestamp with time zone,
    "return_approval_comments" "text",
    "manual_adjustment_reason" "text",
    "manual_adjustment_approval_status" "text" DEFAULT 'Not Required'::"text" NOT NULL,
    "manual_adjustment_approved_by_user_id" "uuid",
    "manual_adjustment_approved_at" timestamp with time zone,
    "manual_adjustment_approval_comments" "text",
    "inventory_pool" "public"."device_inventory_pool" DEFAULT 'Fresh Sale'::"public"."device_inventory_pool" NOT NULL,
    CONSTRAINT "devices_manual_adjustment_approval_status_check" CHECK (("manual_adjustment_approval_status" = ANY (ARRAY['Not Required'::"text", 'Pending'::"text", 'Approved'::"text", 'Rejected'::"text"]))),
    CONSTRAINT "devices_return_approval_status_check" CHECK (("return_approval_status" = ANY (ARRAY['Not Required'::"text", 'Pending'::"text", 'Approved'::"text", 'Rejected'::"text"]))),
    CONSTRAINT "devices_return_decision_check" CHECK ((("return_decision" IS NULL) OR ("return_decision" = ANY (ARRAY['Replace'::"text", 'Reject'::"text"]))))
);


ALTER TABLE "public"."devices" OWNER TO "postgres";


COMMENT ON COLUMN "public"."devices"."return_decision" IS 'Return workflow decision requested by stock/customer service: Replace or Reject.';



COMMENT ON COLUMN "public"."devices"."return_approval_status" IS 'Sales Head approval status for return replacement/rejection decisions.';



COMMENT ON COLUMN "public"."devices"."manual_adjustment_approval_status" IS 'Admin approval status for manual stock adjustments.';



COMMENT ON COLUMN "public"."devices"."inventory_pool" IS 'Controls whether a serial-numbered device is available for paid farmer sales or free pilot dispatches.';



CREATE SEQUENCE IF NOT EXISTS "public"."dispatch_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dispatch_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dispatches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dispatch_code" "text" DEFAULT "public"."make_year_code"('DISP'::"text", 'public.dispatch_code_seq'::"text") NOT NULL,
    "dispatch_date" "date",
    "dispatch_status" "public"."dispatch_status" DEFAULT 'Dispatch Requested'::"public"."dispatch_status" NOT NULL,
    "dispatch_type" "public"."dispatch_type" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "approved_by_user_id" "uuid",
    "dispatched_by_user_id" "uuid",
    "destination_type" "public"."destination_type" NOT NULL,
    "destination_farmer_lead_id" "uuid",
    "destination_dealer_id" "uuid",
    "destination_institution_id" "uuid",
    "destination_pilot_id" "uuid",
    "destination_name_snapshot" "text" NOT NULL,
    "destination_contact_snapshot" "text",
    "destination_address" "text",
    "destination_state" "text",
    "destination_district" "text",
    "device_id" "uuid" NOT NULL,
    "serial_number_snapshot" "text" NOT NULL,
    "product_model" "public"."product_model_strict" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "payment_requirement_type" "public"."payment_requirement_type" DEFAULT 'Payment Required'::"public"."payment_requirement_type" NOT NULL,
    "payment_confirmed" boolean DEFAULT false NOT NULL,
    "payment_confirmed_by_user_id" "uuid",
    "payment_confirmed_date" "date",
    "zoho_invoice_reference" "text",
    "zoho_estimate_reference" "text",
    "management_exception_approved" boolean DEFAULT false NOT NULL,
    "exception_approved_by_user_id" "uuid",
    "exception_reason" "text",
    "courier_or_transport_name" "text",
    "dispatch_reference_number" "text",
    "expected_delivery_date" "date",
    "delivered_date" "date",
    "delivery_confirmed" boolean DEFAULT false NOT NULL,
    "delivery_remarks" "text",
    "linked_farmer_lead_id" "uuid",
    "linked_dealer_id" "uuid",
    "linked_institution_id" "uuid",
    "linked_pilot_id" "uuid",
    "linked_installation_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "dealer_dispatch_group_id" "uuid",
    "business_sector" "text" DEFAULT 'Agriculture'::"text" NOT NULL,
    CONSTRAINT "business_sector_allowed" CHECK (("business_sector" = ANY (ARRAY['Agriculture'::"text", 'Poultry'::"text", 'Dairy'::"text"]))),
    CONSTRAINT "dispatch_exception_reason_required" CHECK ((("management_exception_approved" = false) OR (NULLIF(TRIM(BOTH FROM "exception_reason"), ''::"text") IS NOT NULL))),
    CONSTRAINT "dispatch_payment_rule" CHECK ((("dispatch_status" <> ALL (ARRAY['Approved for Dispatch'::"public"."dispatch_status", 'Dispatched'::"public"."dispatch_status", 'Delivered'::"public"."dispatch_status", 'Installation Pending'::"public"."dispatch_status", 'Installed'::"public"."dispatch_status"])) OR ("payment_confirmed" = true) OR ("payment_requirement_type" = ANY (ARRAY['Unpaid Pilot'::"public"."payment_requirement_type", 'Management Exception'::"public"."payment_requirement_type", 'Internal Transfer'::"public"."payment_requirement_type", 'Replacement / No Charge'::"public"."payment_requirement_type"])) OR ("management_exception_approved" = true))),
    CONSTRAINT "dispatches_quantity_check" CHECK (("quantity" = 1))
);


ALTER TABLE "public"."dispatches" OWNER TO "postgres";


COMMENT ON COLUMN "public"."dispatches"."dealer_dispatch_group_id" IS 'Groups serial-numbered rows created together for a multi-device Dealer Dispatch so Accounts can confirm payment once for the order.';



COMMENT ON COLUMN "public"."dispatches"."business_sector" IS 'Commercial sector: Agriculture, Poultry, or Dairy.';



CREATE SEQUENCE IF NOT EXISTS "public"."farmer_lead_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."farmer_lead_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."farmer_lead_followups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "farmer_lead_id" "uuid" NOT NULL,
    "followed_up_by_user_id" "uuid",
    "followup_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "priority" "text",
    "interaction_note" "text",
    "concern_or_blocker" "text",
    "next_action_date" "date",
    "next_followup_date" "date",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "farmer_lead_followups_priority_check" CHECK ((("priority" IS NULL) OR ("priority" = ANY (ARRAY['High'::"text", 'Medium'::"text", 'Low'::"text"]))))
);


ALTER TABLE "public"."farmer_lead_followups" OWNER TO "postgres";


COMMENT ON TABLE "public"."farmer_lead_followups" IS 'Append-only Farmer Lead follow-up snapshots. Current follow-up state remains on public.farmer_leads.';



COMMENT ON COLUMN "public"."farmer_lead_followups"."interaction_note" IS 'Snapshot of the latest interaction note or concern captured during a Farmer Lead follow-up save.';



CREATE TABLE IF NOT EXISTS "public"."farmer_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_code" "text" DEFAULT "public"."make_year_code"('FL'::"text", 'public.farmer_lead_code_seq'::"text") NOT NULL,
    "lead_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "lead_type" "public"."lead_type" DEFAULT 'New Farmer Lead'::"public"."lead_type" NOT NULL,
    "lead_source" "public"."lead_source" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "region_id" "uuid" NOT NULL,
    "rsm_user_id" "uuid" NOT NULL,
    "farmer_name" "text" NOT NULL,
    "mobile_number" "text" NOT NULL,
    "alternate_mobile_number" "text",
    "state" "text" NOT NULL,
    "district" "text" NOT NULL,
    "taluk" "text",
    "village" "text" NOT NULL,
    "full_address" "text",
    "gps_latitude" numeric(10,7),
    "gps_longitude" numeric(10,7),
    "primary_crop" "public"."crop_option" NOT NULL,
    "other_primary_crop" "text",
    "crop_stage" "public"."crop_stage",
    "land_size_acres" numeric(10,2),
    "crop_area_acres" numeric(10,2),
    "irrigation_type" "public"."irrigation_type" NOT NULL,
    "water_source" "public"."water_source",
    "soil_type" "text",
    "current_problem" "text",
    "current_yield_or_observation" "text",
    "product_recommended" "public"."product_model" DEFAULT 'Not Decided'::"public"."product_model" NOT NULL,
    "quantity_potential" integer DEFAULT 1 NOT NULL,
    "expected_purchase_month" "text",
    "decision_maker" "public"."decision_maker",
    "price_discussed" boolean DEFAULT false,
    "demo_required" boolean DEFAULT false,
    "funnel_stage" "public"."funnel_stage" DEFAULT 'Lead Captured'::"public"."funnel_stage" NOT NULL,
    "lead_status" "public"."lead_status" DEFAULT 'Open'::"public"."lead_status" NOT NULL,
    "reason_lost_or_parked" "text",
    "next_action_date" "date" NOT NULL,
    "last_interaction_date" "date",
    "last_interaction_note" "text",
    "followup_priority" "public"."followup_priority" DEFAULT 'Medium'::"public"."followup_priority" NOT NULL,
    "linked_dealer_id" "uuid",
    "linked_institution_id" "uuid",
    "linked_pilot_id" "uuid",
    "referral_person_name" "text",
    "referral_contact_number" "text",
    "sales_completed" boolean DEFAULT false NOT NULL,
    "sales_completed_date" "date",
    "payment_confirmed" boolean DEFAULT false NOT NULL,
    "payment_confirmed_by_user_id" "uuid",
    "payment_confirmed_date" "date",
    "zoho_invoice_reference" "text",
    "dispatch_required" boolean DEFAULT true,
    "linked_dispatch_id" "uuid",
    "linked_installation_id" "uuid",
    "installation_completed" boolean DEFAULT false NOT NULL,
    "followup_required" boolean DEFAULT true NOT NULL,
    "followup_due_date" "date",
    "followup_completed" boolean DEFAULT false NOT NULL,
    "followup_completed_date" "date",
    "followup_owner_user_id" "uuid",
    "lead_photo_folder_link" "text",
    "farmer_document_link" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "device_dispatched" boolean DEFAULT false NOT NULL,
    "business_sector" "text" DEFAULT 'Agriculture'::"text" NOT NULL,
    CONSTRAINT "business_sector_allowed" CHECK (("business_sector" = ANY (ARRAY['Agriculture'::"text", 'Poultry'::"text", 'Dairy'::"text"]))),
    CONSTRAINT "farmer_leads_lost_parked_reason" CHECK ((("lead_status" <> ALL (ARRAY['Lost'::"public"."lead_status", 'Parked'::"public"."lead_status"])) OR (NULLIF(TRIM(BOTH FROM "reason_lost_or_parked"), ''::"text") IS NOT NULL))),
    CONSTRAINT "farmer_leads_other_crop_required" CHECK ((("primary_crop" <> 'Other'::"public"."crop_option") OR (NULLIF(TRIM(BOTH FROM "other_primary_crop"), ''::"text") IS NOT NULL)))
);


ALTER TABLE "public"."farmer_leads" OWNER TO "postgres";


COMMENT ON COLUMN "public"."farmer_leads"."device_dispatched" IS 'True when a linked Farmer Sale Dispatch has been marked Dispatched. This is updated from the Dispatches workflow, not manually from Farmer Leads.';



COMMENT ON COLUMN "public"."farmer_leads"."business_sector" IS 'Commercial sector: Agriculture, Poultry, or Dairy.';



CREATE SEQUENCE IF NOT EXISTS "public"."followup_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."followup_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."followups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "followup_code" "text" DEFAULT "public"."make_year_code"('FU'::"text", 'public.followup_code_seq'::"text") NOT NULL,
    "followup_type" "public"."followup_type" NOT NULL,
    "followup_status" "public"."followup_status" DEFAULT 'Due'::"public"."followup_status" NOT NULL,
    "followup_due_date" "date" NOT NULL,
    "followup_completed_date" "date",
    "created_by_user_id" "uuid" NOT NULL,
    "followup_owner_user_id" "uuid" NOT NULL,
    "farmer_lead_id" "uuid",
    "installation_id" "uuid",
    "device_id" "uuid",
    "dealer_id" "uuid",
    "institution_id" "uuid",
    "pilot_id" "uuid",
    "pilot_visit_id" "uuid",
    "followup_method" "public"."followup_method" NOT NULL,
    "followup_date" "date",
    "gps_latitude" numeric(10,7),
    "gps_longitude" numeric(10,7),
    "photo_folder_link" "text",
    "farmer_feedback" "text",
    "farmer_satisfaction" "public"."farmer_satisfaction",
    "fitment_inspection_status" "public"."fitment_inspection_status",
    "device_working_status" "public"."device_working_status",
    "irrigation_observation" "text",
    "crop_observation" "text",
    "issue_observed" boolean DEFAULT false NOT NULL,
    "issue_details" "text",
    "repeat_purchase_interest" "public"."interest_level",
    "referral_interest" "public"."interest_level",
    "followup_summary" "text" NOT NULL,
    "outcome" "public"."followup_outcome" NOT NULL,
    "next_action_required" boolean DEFAULT false NOT NULL,
    "next_action" "text",
    "next_action_date" "date",
    "escalation_required" boolean DEFAULT false NOT NULL,
    "escalated_to_user_id" "uuid",
    "escalation_reason" "text",
    "visit_report_id" "uuid",
    "report_link" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "farmer_sale_completed_requires_visit_report" CHECK ((("followup_type" <> 'Farmer Sale 15-Day Follow-up'::"public"."followup_type") OR ("followup_status" <> 'Completed'::"public"."followup_status") OR ("visit_report_id" IS NOT NULL))),
    CONSTRAINT "farmer_sale_followup_links_required" CHECK ((("followup_type" <> 'Farmer Sale 15-Day Follow-up'::"public"."followup_type") OR (("farmer_lead_id" IS NOT NULL) AND ("installation_id" IS NOT NULL) AND ("device_id" IS NOT NULL)))),
    CONSTRAINT "followup_issue_details_required" CHECK ((("issue_observed" = false) OR (NULLIF(TRIM(BOTH FROM "issue_details"), ''::"text") IS NOT NULL)))
);


ALTER TABLE "public"."followups" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."installation_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."installation_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."installations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "installation_code" "text" DEFAULT "public"."make_year_code"('INST'::"text", 'public.installation_code_seq'::"text") NOT NULL,
    "installation_date" "date" NOT NULL,
    "installation_type" "public"."installation_type" NOT NULL,
    "installation_status" "public"."installation_status" DEFAULT 'Installed'::"public"."installation_status" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "installed_by_user_id" "uuid" NOT NULL,
    "verified_by_user_id" "uuid",
    "verified_date" "date",
    "farmer_lead_id" "uuid" NOT NULL,
    "device_id" "uuid" NOT NULL,
    "dispatch_id" "uuid",
    "dealer_id" "uuid",
    "institution_id" "uuid",
    "pilot_id" "uuid",
    "rsm_user_id" "uuid" NOT NULL,
    "region_id" "uuid" NOT NULL,
    "farmer_name_snapshot" "text" NOT NULL,
    "farmer_mobile_snapshot" "text" NOT NULL,
    "state" "text" NOT NULL,
    "district" "text" NOT NULL,
    "taluk" "text",
    "village" "text" NOT NULL,
    "installation_address" "text",
    "gps_latitude" numeric(10,7) NOT NULL,
    "gps_longitude" numeric(10,7) NOT NULL,
    "gps_accuracy_meters" numeric(10,2),
    "product_model" "public"."product_model_strict" NOT NULL,
    "serial_number_snapshot" "text" NOT NULL,
    "previous_holder_type" "public"."holder_type",
    "previous_holder_id" "uuid",
    "previous_holder_name_snapshot" "text",
    "installation_method" "public"."installation_method",
    "irrigation_line_type" "public"."irrigation_line_type",
    "pipe_size" "text",
    "fitment_status" "public"."fitment_inspection_status" NOT NULL,
    "farmer_confirmation" "public"."farmer_confirmation" NOT NULL,
    "installation_photo_link" "text" NOT NULL,
    "installation_notes" "text",
    "issue_observed" boolean DEFAULT false NOT NULL,
    "issue_details" "text",
    "followup_required" boolean DEFAULT true NOT NULL,
    "followup_due_date" "date" NOT NULL,
    "followup_completed" boolean DEFAULT false NOT NULL,
    "followup_completed_date" "date",
    "followup_owner_user_id" "uuid" NOT NULL,
    "linked_followup_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "business_sector" "text" DEFAULT 'Agriculture'::"text" NOT NULL,
    CONSTRAINT "business_sector_allowed" CHECK (("business_sector" = ANY (ARRAY['Agriculture'::"text", 'Poultry'::"text", 'Dairy'::"text"]))),
    CONSTRAINT "installation_issue_details_required" CHECK ((("issue_observed" = false) OR (NULLIF(TRIM(BOTH FROM "issue_details"), ''::"text") IS NOT NULL))),
    CONSTRAINT "installation_verified_requires_date" CHECK ((("installation_status" <> 'Verified'::"public"."installation_status") OR ("verified_date" IS NOT NULL)))
);


ALTER TABLE "public"."installations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."installations"."business_sector" IS 'Commercial sector: Agriculture, Poultry, or Dairy.';



CREATE SEQUENCE IF NOT EXISTS "public"."institution_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."institution_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."institution_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_id" "uuid" NOT NULL,
    "contact_name" "text" NOT NULL,
    "designation" "text",
    "department" "public"."department",
    "phone" "text",
    "email" "text",
    "is_primary_contact" boolean DEFAULT false NOT NULL,
    "influence_level" "public"."influence_level",
    "decision_role" "public"."decision_role",
    "relationship_notes" "text",
    "created_by_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."institution_contacts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."institution_meeting_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."institution_meeting_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."institution_meetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_code" "text" DEFAULT "public"."make_year_code"('IM'::"text", 'public.institution_meeting_code_seq'::"text") NOT NULL,
    "institution_id" "uuid" NOT NULL,
    "meeting_date" "date" NOT NULL,
    "meeting_type" "public"."meeting_type" NOT NULL,
    "meeting_mode" "public"."meeting_mode" NOT NULL,
    "meeting_location" "text",
    "primary_internal_owner_user_id" "uuid" NOT NULL,
    "rsm_user_id" "uuid",
    "sales_head_user_id" "uuid",
    "rd_head_user_id" "uuid",
    "agronomist_user_id" "uuid",
    "external_contact_id" "uuid",
    "meeting_summary" "text" NOT NULL,
    "outcome" "public"."meeting_outcome" NOT NULL,
    "next_action" "text",
    "next_action_date" "date",
    "proposal_required" boolean DEFAULT false,
    "pilot_discussed" boolean DEFAULT false,
    "scale_up_discussed" boolean DEFAULT false,
    "notes_link" "text",
    "created_by_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."institution_meetings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."institutions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_code" "text" DEFAULT "public"."make_year_code"('ORG'::"text", 'public.institution_code_seq'::"text") NOT NULL,
    "organization_name" "text" NOT NULL,
    "organization_type" "public"."organization_type" NOT NULL,
    "website" "text",
    "institution_status" "public"."institution_status" DEFAULT 'Identified'::"public"."institution_status" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "main_contact_person" "text" NOT NULL,
    "main_contact_designation" "text",
    "main_contact_number" "text" NOT NULL,
    "main_contact_email" "text",
    "account_owner_user_id" "uuid" NOT NULL,
    "sales_head_user_id" "uuid" NOT NULL,
    "rsm_user_id" "uuid",
    "rd_head_user_id" "uuid",
    "technical_owner_user_id" "uuid",
    "primary_region_id" "uuid",
    "regions_covered" "text"[] DEFAULT '{}'::"text"[],
    "primary_state" "text" NOT NULL,
    "districts_covered" "text",
    "key_operating_areas" "text",
    "farmer_base_count" integer,
    "farmer_relationship_type" "public"."farmer_relationship_type",
    "crop_focus" "public"."crop_option"[] DEFAULT '{}'::"public"."crop_option"[],
    "other_crop_focus" "text",
    "approx_acreage_covered" numeric(12,2),
    "opportunity_type" "public"."opportunity_type" NOT NULL,
    "expected_commercial_model" "public"."expected_commercial_model",
    "priority" "public"."priority_level" DEFAULT 'Medium'::"public"."priority_level" NOT NULL,
    "current_need_or_pain_point" "text",
    "jiva_use_case" "text",
    "pilot_potential_farmers" integer,
    "pilot_potential_acres" numeric(12,2),
    "total_scale_up_potential_devices" integer,
    "total_scale_up_potential_farmers" integer,
    "expected_close_month" "text",
    "first_meeting_date" "date",
    "last_meeting_date" "date",
    "next_action_date" "date" NOT NULL,
    "meeting_count" integer,
    "notes_from_last_interaction" "text",
    "management_involvement_required" "public"."involvement_status",
    "rd_head_involvement_required" "public"."rd_involvement_status",
    "proposal_shared" "public"."yes_no_pending_na" DEFAULT 'No'::"public"."yes_no_pending_na" NOT NULL,
    "proposal_shared_date" "date",
    "proposal_link" "text",
    "presentation_shared" "public"."yes_no_pending_na" DEFAULT 'No'::"public"."yes_no_pending_na" NOT NULL,
    "presentation_shared_date" "date",
    "presentation_link" "text",
    "mou_agreement_status" "public"."agreement_status" DEFAULT 'Not Started'::"public"."agreement_status" NOT NULL,
    "mou_agreement_link" "text",
    "corporate_po_reference" "text",
    "number_of_pilots_planned" integer,
    "number_of_pilots_approved" integer,
    "number_of_pilots_installed" integer,
    "number_of_active_pilots" integer,
    "number_of_pilot_reports_completed" integer,
    "number_of_successful_pilots" integer,
    "overall_pilot_status" "public"."overall_pilot_status" DEFAULT 'No Pilot Yet'::"public"."overall_pilot_status" NOT NULL,
    "overall_pilot_result_summary" "text",
    "scale_up_status" "public"."scale_up_status" DEFAULT 'Not Started'::"public"."scale_up_status" NOT NULL,
    "scale_up_next_step" "text",
    "support_required" "text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "mou_approval_status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "mou_approved_by_user_id" "uuid",
    "mou_approved_at" timestamp with time zone,
    "mou_hr_legal_comments" "text",
    "deleted_by_user_id" "uuid",
    "deletion_reason" "text",
    "restored_at" timestamp with time zone,
    "restored_by_user_id" "uuid",
    "business_sector" "text" DEFAULT 'Agriculture'::"text" NOT NULL,
    CONSTRAINT "business_sector_allowed" CHECK (("business_sector" = ANY (ARRAY['Agriculture'::"text", 'Poultry'::"text", 'Dairy'::"text"]))),
    CONSTRAINT "institutions_mou_approval_status_check" CHECK (("mou_approval_status" = ANY (ARRAY['Pending'::"text", 'Approved'::"text", 'Rejected'::"text"])))
);


ALTER TABLE "public"."institutions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."institutions"."deleted_by_user_id" IS 'Internal user who soft-deleted this institutional partner record.';



COMMENT ON COLUMN "public"."institutions"."deletion_reason" IS 'Business reason captured when this institutional partner was soft-deleted.';



COMMENT ON COLUMN "public"."institutions"."restored_at" IS 'Timestamp when this institutional partner was restored from soft-delete.';



COMMENT ON COLUMN "public"."institutions"."restored_by_user_id" IS 'Internal user who restored this institutional partner record.';



COMMENT ON COLUMN "public"."institutions"."business_sector" IS 'Commercial sector: Agriculture, Poultry, or Dairy.';



CREATE TABLE IF NOT EXISTS "public"."kpi_dashboard_cache" (
    "cache_key" "text" NOT NULL,
    "section_name" "text" NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "computed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "refresh_id" "uuid",
    "source_version" "text" DEFAULT 'kpi-dashboard-v1'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."kpi_dashboard_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."kpi_dashboard_cache" IS 'Sectioned saved KPI Dashboard JSON. Normal KPI page loads read this cache instead of recalculating all KPI summaries.';



COMMENT ON COLUMN "public"."kpi_dashboard_cache"."cache_key" IS 'Stable key derived from dashboard filter values. The default dashboard and each filtered view can be refreshed independently.';



CREATE TABLE IF NOT EXISTS "public"."kpi_dashboard_dirty_flags" (
    "section_name" "text" NOT NULL,
    "is_dirty" boolean DEFAULT false NOT NULL,
    "dirty_reason" "text",
    "last_marked_dirty_at" timestamp with time zone,
    "last_refreshed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."kpi_dashboard_dirty_flags" OWNER TO "postgres";


COMMENT ON TABLE "public"."kpi_dashboard_dirty_flags" IS 'Auditable dirty flags for future incremental KPI refresh work. Phase 1 only marks and clears flags manually through RPCs.';



CREATE TABLE IF NOT EXISTS "public"."kpi_dashboard_refresh_log" (
    "refresh_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "refresh_type" "text" NOT NULL,
    "requested_by" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "status" "text" NOT NULL,
    "error_message" "text",
    "sections_refreshed" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "kpi_dashboard_refresh_log_refresh_type_check" CHECK (("refresh_type" = ANY (ARRAY['full'::"text", 'section'::"text"]))),
    CONSTRAINT "kpi_dashboard_refresh_log_status_check" CHECK (("status" = ANY (ARRAY['Running'::"text", 'Succeeded'::"text", 'Failed'::"text"])))
);


ALTER TABLE "public"."kpi_dashboard_refresh_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."kpi_dashboard_refresh_log" IS 'Refresh audit log for KPI Dashboard cache rebuilds.';



CREATE TABLE IF NOT EXISTS "public"."marketing_request_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "marketing_request_id" "uuid" NOT NULL,
    "update_type" "public"."marketing_request_update_type" NOT NULL,
    "note" "text" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."marketing_request_updates" OWNER TO "postgres";


COMMENT ON TABLE "public"."marketing_request_updates" IS 'Comments, clarification notes, correction requests, link sharing notes, delivery notes, and status history for Marketing Requests.';



CREATE TABLE IF NOT EXISTS "public"."marketing_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "request_type" "public"."marketing_request_type" NOT NULL,
    "social_media_platform" "text",
    "brief" "text" NOT NULL,
    "target_audience" "text",
    "key_message" "text",
    "required_size_or_format" "text",
    "priority" "public"."marketing_request_priority" DEFAULT 'Normal'::"public"."marketing_request_priority" NOT NULL,
    "requested_by_user_id" "uuid" NOT NULL,
    "requested_for_region_id" "uuid",
    "related_dealer_id" "uuid",
    "related_institution_id" "uuid",
    "related_farmer_lead_id" "uuid",
    "related_pilot_id" "uuid",
    "campaign_or_event_name" "text",
    "reference_link" "text",
    "deadline_date" "date" NOT NULL,
    "marketing_status" "public"."marketing_request_status" DEFAULT 'Requested'::"public"."marketing_request_status" NOT NULL,
    "marketing_head_user_id" "uuid",
    "assigned_to_user_id" "uuid",
    "accepted_at" timestamp with time zone,
    "draft_link" "text",
    "final_onedrive_link" "text",
    "delivered_at" timestamp with time zone,
    "internal_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "brief_document_link" "text",
    "deadline_status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "accepted_deadline_date" "date",
    "revised_deadline_date" "date",
    "deadline_revision_note" "text",
    "deadline_decided_by_user_id" "uuid",
    "deadline_decided_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "completed_by_user_id" "uuid",
    CONSTRAINT "marketing_requests_deadline_status_check" CHECK (("deadline_status" = ANY (ARRAY['Pending'::"text", 'Accepted'::"text", 'Revised'::"text"])))
);


ALTER TABLE "public"."marketing_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."marketing_requests" IS 'Marketing request tracker for briefs, assignment, status, comments, and draft/final links. Heavy design files stay outside the app.';



COMMENT ON COLUMN "public"."marketing_requests"."brief_document_link" IS 'Optional OneDrive link to the brief, reference document, or supporting file.';



COMMENT ON COLUMN "public"."marketing_requests"."deadline_status" IS 'Marketing deadline decision: Pending, Accepted, or Revised.';



COMMENT ON COLUMN "public"."marketing_requests"."accepted_deadline_date" IS 'Requested deadline accepted by Marketing Head/Admin/Management.';



COMMENT ON COLUMN "public"."marketing_requests"."revised_deadline_date" IS 'Revised working deadline proposed by Marketing Head/Admin/Management.';



COMMENT ON COLUMN "public"."marketing_requests"."deadline_revision_note" IS 'Optional reason or comment explaining the revised deadline.';



COMMENT ON COLUMN "public"."marketing_requests"."deadline_decided_by_user_id" IS 'User who last accepted or revised the requested deadline.';



COMMENT ON COLUMN "public"."marketing_requests"."deadline_decided_at" IS 'Timestamp when the deadline decision was last made.';



COMMENT ON COLUMN "public"."marketing_requests"."completed_at" IS 'Server-recorded timestamp when Marketing marked the request completed.';



COMMENT ON COLUMN "public"."marketing_requests"."completed_by_user_id" IS 'Internal user who marked the Marketing Request completed.';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_user_id" "uuid" NOT NULL,
    "actor_user_id" "uuid",
    "notification_type" "text" NOT NULL,
    "category" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "record_type" "text",
    "record_id" "uuid",
    "record_code" "text",
    "record_path" "text",
    "due_date" "date",
    "severity" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source_event_key" "text",
    "dedupe_key" "text",
    CONSTRAINT "notifications_record_path_internal" CHECK ((("record_path" IS NULL) OR (("left"("record_path", 1) = '/'::"text") AND ("left"("record_path", 2) <> '//'::"text") AND (POSITION(('://'::"text") IN ("record_path")) = 0))))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Per-user in-app notifications. Users can read/update only their own notifications; app workflows insert targeted assignment/reminder events.';



COMMENT ON COLUMN "public"."notifications"."record_path" IS 'Internal app path only. External URLs are rejected by check constraint.';



CREATE SEQUENCE IF NOT EXISTS "public"."pilot_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pilot_code_seq" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pilot_visit_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pilot_visit_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pilot_visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "visit_code" "text" DEFAULT "public"."make_year_code"('PV'::"text", 'public.pilot_visit_code_seq'::"text") NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "visit_date" "date" NOT NULL,
    "visit_number" integer,
    "visit_type" "public"."visit_type" NOT NULL,
    "visit_status" "public"."visit_status" DEFAULT 'Planned'::"public"."visit_status" NOT NULL,
    "visited_by_user_id" "uuid" NOT NULL,
    "accompanied_by_user_id" "uuid",
    "rd_head_user_id" "uuid",
    "gps_latitude" numeric(10,7),
    "gps_longitude" numeric(10,7),
    "photo_folder_link" "text",
    "raw_data_sheet_link" "text",
    "farmer_feedback" "text",
    "treatment_plot_observation" "text",
    "control_plot_observation" "text",
    "irrigation_observation" "text",
    "soil_moisture_observation" "text",
    "crop_growth_observation" "text",
    "pest_disease_observation" "text",
    "fertilizer_observation" "text",
    "root_observation" "text",
    "chlorophyll_observation" "text",
    "yield_observation" "text",
    "quality_observation" "text",
    "treatment_soil_moisture_reading" numeric(10,2),
    "control_soil_moisture_reading" numeric(10,2),
    "treatment_plant_height_cm" numeric(10,2),
    "control_plant_height_cm" numeric(10,2),
    "treatment_chlorophyll_reading" numeric(10,2),
    "control_chlorophyll_reading" numeric(10,2),
    "treatment_yield_kg" numeric(12,2),
    "control_yield_kg" numeric(12,2),
    "visit_summary" "text" NOT NULL,
    "issue_observed" boolean DEFAULT false NOT NULL,
    "issue_details" "text",
    "action_required" boolean DEFAULT false NOT NULL,
    "next_action" "text",
    "next_visit_date" "date",
    "visit_report_required" boolean DEFAULT true NOT NULL,
    "visit_report_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."pilot_visits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pilots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_code" "text" DEFAULT "public"."make_year_code"('PILOT'::"text", 'public.pilot_code_seq'::"text") NOT NULL,
    "pilot_name" "text" NOT NULL,
    "pilot_type" "public"."pilot_type" NOT NULL,
    "pilot_objective" "text" NOT NULL,
    "pilot_status" "public"."pilot_status" DEFAULT 'Planned'::"public"."pilot_status" NOT NULL,
    "created_by_user_id" "uuid" NOT NULL,
    "pilot_owner_user_id" "uuid" NOT NULL,
    "research_assistant_user_id" "uuid",
    "agronomist_user_id" "uuid",
    "rd_head_user_id" "uuid",
    "rsm_user_id" "uuid",
    "region_id" "uuid",
    "institution_id" "uuid",
    "dealer_id" "uuid",
    "farmer_lead_id" "uuid" NOT NULL,
    "installation_id" "uuid",
    "device_id" "uuid",
    "dispatch_id" "uuid",
    "farmer_name_snapshot" "text" NOT NULL,
    "farmer_mobile_snapshot" "text" NOT NULL,
    "state" "text" NOT NULL,
    "district" "text" NOT NULL,
    "taluk" "text",
    "village" "text" NOT NULL,
    "location_or_cluster_name" "text",
    "gps_latitude" numeric(10,7),
    "gps_longitude" numeric(10,7),
    "crop" "public"."crop_option" NOT NULL,
    "other_crop" "text",
    "crop_stage_at_start" "public"."crop_stage",
    "pilot_area_acres" numeric(10,2) NOT NULL,
    "control_area_acres" numeric(10,2) NOT NULL,
    "irrigation_type" "public"."irrigation_type" NOT NULL,
    "water_source" "public"."water_source",
    "soil_type" "text",
    "baseline_notes" "text",
    "treatment_plot_description" "text" NOT NULL,
    "control_plot_description" "text" NOT NULL,
    "control_available" boolean DEFAULT true NOT NULL,
    "control_farmer_same" boolean,
    "control_crop_same" boolean,
    "control_irrigation_same" boolean,
    "comparison_method" "public"."comparison_method" NOT NULL,
    "product_model" "public"."product_model_strict" NOT NULL,
    "device_serial_number_snapshot" "text",
    "device_installation_date" "date",
    "installation_completed" boolean DEFAULT false NOT NULL,
    "monitoring_start_date" "date",
    "expected_monitoring_end_date" "date",
    "monitoring_frequency" "public"."monitoring_frequency" DEFAULT 'Fortnightly'::"public"."monitoring_frequency" NOT NULL,
    "next_visit_due_date" "date",
    "total_visits_planned" integer,
    "monitoring_plan_link" "text",
    "track_soil_moisture" boolean DEFAULT false NOT NULL,
    "track_crop_growth" boolean DEFAULT false NOT NULL,
    "track_irrigation_frequency" boolean DEFAULT false NOT NULL,
    "track_water_saving" boolean DEFAULT false NOT NULL,
    "track_fertilizer_usage" boolean DEFAULT false NOT NULL,
    "track_pest_disease" boolean DEFAULT false NOT NULL,
    "track_root_growth" boolean DEFAULT false NOT NULL,
    "track_plant_height" boolean DEFAULT false NOT NULL,
    "track_chlorophyll" boolean DEFAULT false NOT NULL,
    "track_yield" boolean DEFAULT false NOT NULL,
    "track_quality_parameters" boolean DEFAULT false NOT NULL,
    "track_farmer_feedback" boolean DEFAULT true NOT NULL,
    "pilot_result_status" "public"."pilot_result_status" DEFAULT 'Not Started'::"public"."pilot_result_status" NOT NULL,
    "result_summary" "text",
    "farmer_feedback_summary" "text",
    "yield_improvement_observed" boolean,
    "water_saving_observed" boolean,
    "crop_health_improvement_observed" boolean,
    "partner_feedback" "text",
    "scale_up_recommended" boolean DEFAULT false NOT NULL,
    "scale_up_potential_devices" integer,
    "scale_up_potential_farmers" integer,
    "scale_up_next_step" "text",
    "pilot_folder_link" "text",
    "baseline_report_link" "text",
    "final_pilot_report_link" "text",
    "photo_folder_link" "text",
    "data_sheet_link" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "device_removal_reason" "text",
    "device_removed_date" "date",
    "device_removed_by_user_id" "uuid",
    "device_removal_device_id" "uuid",
    "device_removal_status" "text" DEFAULT 'Not Removed'::"text" NOT NULL,
    "soil_report_link" "text",
    "water_report_link" "text",
    "deleted_by_user_id" "uuid",
    "deletion_reason" "text",
    "restored_at" timestamp with time zone,
    "restored_by_user_id" "uuid",
    "business_sector" "text" DEFAULT 'Agriculture'::"text" NOT NULL,
    CONSTRAINT "business_sector_allowed" CHECK (("business_sector" = ANY (ARRAY['Agriculture'::"text", 'Poultry'::"text", 'Dairy'::"text"]))),
    CONSTRAINT "pilots_device_removal_status_check" CHECK (("device_removal_status" = ANY (ARRAY['Not Removed'::"text", 'Pending Customer Service Update'::"text", 'Resolved'::"text"]))),
    CONSTRAINT "pilots_other_crop_required" CHECK ((("crop" <> 'Other'::"public"."crop_option") OR (NULLIF(TRIM(BOTH FROM "other_crop"), ''::"text") IS NOT NULL)))
);


ALTER TABLE "public"."pilots" OWNER TO "postgres";


COMMENT ON COLUMN "public"."pilots"."soil_report_link" IS 'Baseline soil test report captured at the start of the pilot trial.';



COMMENT ON COLUMN "public"."pilots"."water_report_link" IS 'Baseline water test report captured at the start of the pilot trial.';



COMMENT ON COLUMN "public"."pilots"."deleted_by_user_id" IS 'Internal user who soft-deleted this pilot record.';



COMMENT ON COLUMN "public"."pilots"."deletion_reason" IS 'Business reason captured when this pilot was soft-deleted.';



COMMENT ON COLUMN "public"."pilots"."restored_at" IS 'Timestamp when this pilot was restored from soft-delete.';



COMMENT ON COLUMN "public"."pilots"."restored_by_user_id" IS 'Internal user who restored this pilot record.';



COMMENT ON COLUMN "public"."pilots"."business_sector" IS 'Commercial sector: Agriculture, Poultry, or Dairy.';



CREATE TABLE IF NOT EXISTS "public"."planned_pilot_visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "visit_number" integer NOT NULL,
    "planned_visit_date" "date" NOT NULL,
    "crop_stage_timing" "text",
    "visit_purpose" "text" NOT NULL,
    "assigned_user_id" "uuid" NOT NULL,
    "visit_type" "text" NOT NULL,
    "parameters_to_collect" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "special_instructions" "text",
    "planned_visit_status" "text" DEFAULT 'Planned'::"text" NOT NULL,
    "linked_pilot_visit_id" "uuid",
    "linked_visit_report_id" "uuid",
    "created_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "planned_pilot_visits_status_check" CHECK (("planned_visit_status" = ANY (ARRAY['Planned'::"text", 'Assigned'::"text", 'Due'::"text", 'In Progress'::"text", 'Completed'::"text", 'Rescheduled'::"text", 'Cancelled'::"text", 'Unable to Complete'::"text"])))
);


ALTER TABLE "public"."planned_pilot_visits" OWNER TO "postgres";


COMMENT ON TABLE "public"."planned_pilot_visits" IS 'Planning layer for pilot visits. Existing pilot_visits remain the actual completed/scheduled visit records.';



COMMENT ON COLUMN "public"."planned_pilot_visits"."parameters_to_collect" IS 'Official visit parameter labels selected by Agronomist/R&D/Admin for the assigned visit.';



CREATE SEQUENCE IF NOT EXISTS "public"."region_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."region_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."regions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "region_name" "text" NOT NULL,
    "state" "text" NOT NULL,
    "rsm_user_id" "uuid",
    "annual_device_target" integer DEFAULT 0 NOT NULL,
    "fy_start_date" "date" NOT NULL,
    "fy_end_date" "date" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."regions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_payment_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_name" "text" NOT NULL,
    "offer_label" "text" NOT NULL,
    "discount_percent" smallint DEFAULT 0 NOT NULL,
    "regular_price_inr" integer NOT NULL,
    "amount_inr" integer NOT NULL,
    "payment_url" "text" NOT NULL,
    "sort_order" smallint DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sales_payment_links_amount_inr_check" CHECK (("amount_inr" > 0)),
    CONSTRAINT "sales_payment_links_discount_percent_check" CHECK ((("discount_percent" >= 0) AND ("discount_percent" <= 100))),
    CONSTRAINT "sales_payment_links_regular_price_inr_check" CHECK (("regular_price_inr" > 0))
);


ALTER TABLE "public"."sales_payment_links" OWNER TO "postgres";


COMMENT ON TABLE "public"."sales_payment_links" IS 'Sales-only Razorpay payment links. Live URLs and pricing are stored in Supabase rather than application source.';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "role" "public"."user_role" NOT NULL,
    "region_id" "uuid",
    "state" "text",
    "reports_to_user_id" "uuid",
    "can_create_leads" boolean DEFAULT false NOT NULL,
    "can_own_pilots" boolean DEFAULT false NOT NULL,
    "can_confirm_payment" boolean DEFAULT false NOT NULL,
    "can_manage_dispatch" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deactivated_at" timestamp with time zone,
    "deactivated_by_user_id" "uuid",
    "replacement_user_id" "uuid",
    "deactivation_reason" "text",
    "secondary_role" "public"."user_role",
    "must_change_password" boolean DEFAULT true NOT NULL,
    "can_download_csv" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."secondary_role" IS 'Optional additional role. Primary users.role remains the main role; secondary_role only adds access.';



COMMENT ON COLUMN "public"."users"."must_change_password" IS 'When true, the user must change their temporary password before using the app.';



COMMENT ON COLUMN "public"."users"."can_download_csv" IS 'Per-user Admin-controlled permission for downloading CSV exports. Defaults false and must be enforced by app server routes.';



CREATE SEQUENCE IF NOT EXISTS "public"."visit_report_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."visit_report_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visit_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "visit_report_code" "text" DEFAULT "public"."make_year_code"('VR'::"text", 'public.visit_report_code_seq'::"text") NOT NULL,
    "report_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "report_type" "public"."report_type" NOT NULL,
    "submitted_by_user_id" "uuid" NOT NULL,
    "reviewed_by_user_id" "uuid",
    "report_status" "public"."report_status" DEFAULT 'Draft'::"public"."report_status" NOT NULL,
    "pilot_id" "uuid",
    "pilot_visit_id" "uuid",
    "institution_id" "uuid",
    "farmer_lead_id" "uuid",
    "installation_id" "uuid",
    "crop" "public"."crop_option",
    "other_crop" "text",
    "report_title" "text" NOT NULL,
    "report_summary" "text" NOT NULL,
    "farmer_feedback" "text",
    "fitment_inspection_status" "public"."fitment_inspection_status",
    "treatment_vs_control_summary" "text",
    "crop_observation_summary" "text",
    "issue_observed" boolean DEFAULT false NOT NULL,
    "issue_details" "text",
    "recommendation" "text",
    "next_action" "text",
    "next_visit_date" "date",
    "report_link" "text" NOT NULL,
    "photo_folder_link" "text",
    "data_sheet_link" "text",
    "reviewed_date" "date",
    "review_comments" "text",
    "approved_for_partner_sharing" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "planned_pilot_visit_id" "uuid",
    "parameter_observations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "visit_reports_other_crop_required" CHECK ((("crop" IS DISTINCT FROM 'Other'::"public"."crop_option") OR (NULLIF(TRIM(BOTH FROM "other_crop"), ''::"text") IS NOT NULL)))
);


ALTER TABLE "public"."visit_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_table" "text" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "business_key" "text" NOT NULL,
    "status" "text" DEFAULT 'Open'::"text" NOT NULL,
    "category" "text" DEFAULT 'sales'::"text" NOT NULL,
    "assignee_user_id" "uuid",
    "rsm_user_id" "uuid",
    "region_id" "uuid",
    "state" "text",
    "due_at" "date",
    "ui_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "work_items_action_type_check" CHECK (("action_type" = ANY (ARRAY['follow_up'::"text", 'dispatch_ready'::"text", 'dealer_payment_confirm'::"text", 'dealer_dispatch_ready'::"text", 'dispatch_action'::"text", 'pilot_dispatch_ready'::"text", 'pilot_installation_confirm'::"text", 'planned_visit_report_needed'::"text", 'visit_report_review'::"text"]))),
    CONSTRAINT "work_items_category_check" CHECK (("category" = ANY (ARRAY['sales'::"text", 'dispatch'::"text", 'pilots'::"text"]))),
    CONSTRAINT "work_items_source_action_category_check" CHECK (((("source_table" = 'farmer_leads'::"text") AND ("category" = 'sales'::"text") AND ("action_type" = ANY (ARRAY['follow_up'::"text", 'dispatch_ready'::"text"]))) OR (("source_table" = 'dispatches'::"text") AND ("category" = 'dispatch'::"text") AND ("action_type" = ANY (ARRAY['dealer_payment_confirm'::"text", 'dealer_dispatch_ready'::"text", 'dispatch_action'::"text"]))) OR (("source_table" = 'pilots'::"text") AND ("category" = 'dispatch'::"text") AND ("action_type" = 'pilot_dispatch_ready'::"text")) OR (("source_table" = 'pilots'::"text") AND ("category" = 'pilots'::"text") AND ("action_type" = 'pilot_installation_confirm'::"text")) OR (("source_table" = 'planned_pilot_visits'::"text") AND ("category" = 'pilots'::"text") AND ("action_type" = 'planned_visit_report_needed'::"text")) OR (("source_table" = 'visit_reports'::"text") AND ("category" = 'pilots'::"text") AND ("action_type" = 'visit_report_review'::"text")))),
    CONSTRAINT "work_items_source_table_check" CHECK (("source_table" = ANY (ARRAY['farmer_leads'::"text", 'dispatches'::"text", 'pilots'::"text", 'planned_pilot_visits'::"text", 'visit_reports'::"text"]))),
    CONSTRAINT "work_items_status_check" CHECK (("status" = 'Open'::"text")),
    CONSTRAINT "work_items_ui_payload_check" CHECK ((("jsonb_typeof"("ui_payload") = 'object'::"text") AND ((("source_table" = 'farmer_leads'::"text") AND ("ui_payload" ? 'farmer_name'::"text") AND ("ui_payload" ? 'lead_code'::"text")) OR (("source_table" = 'dispatches'::"text") AND ("action_type" = ANY (ARRAY['dealer_payment_confirm'::"text", 'dealer_dispatch_ready'::"text"])) AND ("ui_payload" ? 'dispatch_code'::"text") AND ("ui_payload" ? 'destination_name'::"text") AND ("ui_payload" ? 'product_model'::"text")) OR (("source_table" = 'dispatches'::"text") AND ("action_type" = 'dispatch_action'::"text") AND ("ui_payload" ? 'dispatch_code'::"text") AND ("ui_payload" ? 'dispatch_type'::"text") AND ("ui_payload" ? 'destination_name'::"text") AND ("ui_payload" ? 'product_model'::"text") AND ("ui_payload" ? 'dispatch_status'::"text")) OR (("source_table" = 'pilots'::"text") AND ("action_type" = 'pilot_dispatch_ready'::"text") AND ("ui_payload" ? 'pilot_code'::"text") AND ("ui_payload" ? 'pilot_name'::"text") AND ("ui_payload" ? 'farmer_name'::"text") AND ("ui_payload" ? 'pilot_status'::"text")) OR (("source_table" = 'pilots'::"text") AND ("action_type" = 'pilot_installation_confirm'::"text") AND ("ui_payload" ? 'pilot_code'::"text") AND ("ui_payload" ? 'pilot_name'::"text") AND ("ui_payload" ? 'farmer_name'::"text") AND ("ui_payload" ? 'pilot_status'::"text") AND ("ui_payload" ? 'product_model'::"text")) OR (("source_table" = 'planned_pilot_visits'::"text") AND ("action_type" = 'planned_visit_report_needed'::"text") AND ("ui_payload" ? 'pilot_id'::"text") AND ("ui_payload" ? 'pilot_code'::"text") AND ("ui_payload" ? 'pilot_name'::"text") AND ("ui_payload" ? 'visit_number'::"text") AND ("ui_payload" ? 'visit_type'::"text") AND ("ui_payload" ? 'planned_visit_status'::"text")) OR (("source_table" = 'visit_reports'::"text") AND ("action_type" = 'visit_report_review'::"text") AND ("ui_payload" ? 'pilot_id'::"text") AND ("ui_payload" ? 'pilot_name'::"text") AND ("ui_payload" ? 'visit_report_code'::"text") AND ("ui_payload" ? 'report_title'::"text") AND ("ui_payload" ? 'report_status'::"text")))))
);


ALTER TABLE "public"."work_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."work_items" IS 'Shadow-only open inbox for My Work read-model proofs. Operational tables remain the source of truth.';



COMMENT ON COLUMN "public"."work_items"."source_id" IS 'Polymorphic source identifier. It intentionally has no single-table foreign key because work_items may reference farmer_leads, dispatches, or pilots. Integrity is enforced by source_table, stable business_key, unique(source_table, source_id, action_type), projectors, reconciliation, and future source triggers.';



COMMENT ON COLUMN "public"."work_items"."assignee_user_id" IS 'Nullable because current Dispatch My Work includes unassigned operational queue items. Farmer Lead projections continue to populate it.';



COMMENT ON COLUMN "public"."work_items"."rsm_user_id" IS 'Nullable because Dispatch queue actions have no truthful RSM owner. Farmer Lead projections continue to populate it.';



COMMENT ON COLUMN "public"."work_items"."region_id" IS 'Nullable because Dispatch queue actions have no truthful region owner. Farmer Lead projections continue to populate it.';



COMMENT ON COLUMN "public"."work_items"."state" IS 'Nullable because Dispatch destination state can be absent. Farmer Lead and Pilot projections populate it from their source rows.';



COMMENT ON COLUMN "public"."work_items"."ui_payload" IS 'Minimal display payload only. It must be a JSON object and satisfy source/action-specific key checks. It must not contain phone numbers, emails, private notes, authorization fields, or full source rows.';



COMMENT ON CONSTRAINT "work_items_action_type_check" ON "public"."work_items" IS 'Strict supported work-item action types.';



COMMENT ON CONSTRAINT "work_items_category_check" ON "public"."work_items" IS 'Strict supported work-item categories.';



COMMENT ON CONSTRAINT "work_items_source_action_category_check" ON "public"."work_items" IS 'Prevents unsupported source/category/action combinations.';



COMMENT ON CONSTRAINT "work_items_source_table_check" ON "public"."work_items" IS 'Strict supported source tables for the current read-model proofs.';



COMMENT ON CONSTRAINT "work_items_ui_payload_check" ON "public"."work_items" IS 'Requires JSON object payloads with source/action-specific keys needed by current My Work rendering.';



ALTER TABLE ONLY "public"."dealer_institution_links"
    ADD CONSTRAINT "dealer_institution_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dealer_reviews"
    ADD CONSTRAINT "dealer_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "dealers_dealer_code_key" UNIQUE ("dealer_code");



ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "dealers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_movements"
    ADD CONSTRAINT "device_movements_movement_code_key" UNIQUE ("movement_code");



ALTER TABLE ONLY "public"."device_movements"
    ADD CONSTRAINT "device_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_status_update_tasks"
    ADD CONSTRAINT "device_status_update_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_serial_number_key" UNIQUE ("serial_number");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "dispatches_dispatch_code_key" UNIQUE ("dispatch_code");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."farmer_lead_followups"
    ADD CONSTRAINT "farmer_lead_followups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "farmer_leads_lead_code_key" UNIQUE ("lead_code");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "farmer_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "followups_followup_code_key" UNIQUE ("followup_code");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "followups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "installations_installation_code_key" UNIQUE ("installation_code");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "installations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."institution_contacts"
    ADD CONSTRAINT "institution_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."institution_meetings"
    ADD CONSTRAINT "institution_meetings_meeting_code_key" UNIQUE ("meeting_code");



ALTER TABLE ONLY "public"."institution_meetings"
    ADD CONSTRAINT "institution_meetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "institutions_institution_code_key" UNIQUE ("institution_code");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "institutions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_dashboard_cache"
    ADD CONSTRAINT "kpi_dashboard_cache_pkey" PRIMARY KEY ("cache_key", "section_name");



ALTER TABLE ONLY "public"."kpi_dashboard_dirty_flags"
    ADD CONSTRAINT "kpi_dashboard_dirty_flags_pkey" PRIMARY KEY ("section_name");



ALTER TABLE ONLY "public"."kpi_dashboard_refresh_log"
    ADD CONSTRAINT "kpi_dashboard_refresh_log_pkey" PRIMARY KEY ("refresh_id");



ALTER TABLE ONLY "public"."marketing_request_updates"
    ADD CONSTRAINT "marketing_request_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_request_code_key" UNIQUE ("request_code");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_visits"
    ADD CONSTRAINT "pilot_visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_visits"
    ADD CONSTRAINT "pilot_visits_visit_code_key" UNIQUE ("visit_code");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_pilot_code_key" UNIQUE ("pilot_code");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."planned_pilot_visits"
    ADD CONSTRAINT "planned_pilot_visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."regions"
    ADD CONSTRAINT "regions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."regions"
    ADD CONSTRAINT "regions_region_name_key" UNIQUE ("region_name");



ALTER TABLE ONLY "public"."sales_payment_links"
    ADD CONSTRAINT "sales_payment_links_payment_url_key" UNIQUE ("payment_url");



ALTER TABLE ONLY "public"."sales_payment_links"
    ADD CONSTRAINT "sales_payment_links_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."users"
    ADD CONSTRAINT "users_email_jivawater_domain_check" CHECK (("lower"("email") ~~ '%@jivawater.com'::"text")) NOT VALID;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visit_reports"
    ADD CONSTRAINT "visit_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visit_reports"
    ADD CONSTRAINT "visit_reports_visit_report_code_key" UNIQUE ("visit_report_code");



ALTER TABLE ONLY "public"."work_items"
    ADD CONSTRAINT "work_items_business_key_key" UNIQUE ("business_key");



ALTER TABLE ONLY "public"."work_items"
    ADD CONSTRAINT "work_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_items"
    ADD CONSTRAINT "work_items_source_table_source_id_action_type_key" UNIQUE ("source_table", "source_id", "action_type");



CREATE UNIQUE INDEX "dealer_institution_links_active_pair_idx" ON "public"."dealer_institution_links" USING "btree" ("dealer_id", "institution_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "dealers_agreement_approval_status_idx" ON "public"."dealers" USING "btree" ("dealer_agreement_approval_status", "updated_at" DESC);



CREATE INDEX "dealers_deleted_by_user_id_idx" ON "public"."dealers" USING "btree" ("deleted_by_user_id");



CREATE INDEX "dealers_restored_by_user_id_idx" ON "public"."dealers" USING "btree" ("restored_by_user_id");



CREATE INDEX "device_status_update_tasks_status_idx" ON "public"."device_status_update_tasks" USING "btree" ("task_status", "created_at" DESC);



CREATE INDEX "devices_manual_adjustment_approval_status_idx" ON "public"."devices" USING "btree" ("manual_adjustment_approval_status", "updated_at" DESC);



CREATE INDEX "devices_return_approval_status_idx" ON "public"."devices" USING "btree" ("return_approval_status", "updated_at" DESC);



CREATE UNIQUE INDEX "farmer_leads_active_mobile_number_unique_idx" ON "public"."farmer_leads" USING "btree" ("mobile_number") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dealer_institution_links_dealer_active" ON "public"."dealer_institution_links" USING "btree" ("dealer_id", "relationship_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dealer_institution_links_institution_active" ON "public"."dealer_institution_links" USING "btree" ("institution_id", "relationship_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dealer_institution_links_owner_active" ON "public"."dealer_institution_links" USING "btree" ("owner_user_id", "next_action_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dealer_reviews_dealer_created_at" ON "public"."dealer_reviews" USING "btree" ("dealer_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dealer_reviews_dealer_review_date" ON "public"."dealer_reviews" USING "btree" ("dealer_id", "review_date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dealer_reviews_reviewer" ON "public"."dealer_reviews" USING "btree" ("reviewed_by_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dealers_business_sector" ON "public"."dealers" USING "btree" ("business_sector");



CREATE INDEX "idx_dealers_created_at_active" ON "public"."dealers" USING "btree" ("created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dealers_created_by_active" ON "public"."dealers" USING "btree" ("created_by_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dealers_districts_gin" ON "public"."dealers" USING "gin" ("districts");



CREATE INDEX "idx_dealers_owner_active" ON "public"."dealers" USING "btree" ("dealer_owner_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dealers_region_rsm_status_active" ON "public"."dealers" USING "btree" ("region_id", "rsm_user_id", "dealer_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dealers_rsm_region" ON "public"."dealers" USING "btree" ("rsm_user_id", "region_id");



CREATE INDEX "idx_dealers_state_district_active" ON "public"."dealers" USING "btree" ("state", "district") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dealers_status_active" ON "public"."dealers" USING "btree" ("dealer_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_device_movements_created_at" ON "public"."device_movements" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_device_movements_device_date" ON "public"."device_movements" USING "btree" ("device_id", "movement_date");



CREATE INDEX "idx_device_movements_farmer_lead" ON "public"."device_movements" USING "btree" ("farmer_lead_id");



CREATE INDEX "idx_device_movements_installation" ON "public"."device_movements" USING "btree" ("installation_id");



CREATE INDEX "idx_device_movements_pilot" ON "public"."device_movements" USING "btree" ("pilot_id");



CREATE INDEX "idx_devices_active_created_id_desc" ON "public"."devices" USING "btree" ("created_at" DESC, "id" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_devices_holder" ON "public"."devices" USING "btree" ("current_holder_type", "current_holder_id");



CREATE INDEX "idx_devices_holder_status_active" ON "public"."devices" USING "btree" ("current_holder_type", "device_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_devices_inventory_pool_available" ON "public"."devices" USING "btree" ("inventory_pool", "device_status", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_devices_linked_dispatch_active" ON "public"."devices" USING "btree" ("linked_dispatch_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_devices_linked_farmer_lead_active" ON "public"."devices" USING "btree" ("linked_farmer_lead_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_devices_linked_installation_active" ON "public"."devices" USING "btree" ("linked_installation_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_devices_linked_pilot_active" ON "public"."devices" USING "btree" ("linked_pilot_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_devices_product_status_active" ON "public"."devices" USING "btree" ("product_model", "device_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_devices_state_district_active" ON "public"."devices" USING "btree" ("current_state", "current_district") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_devices_status" ON "public"."devices" USING "btree" ("device_status");



CREATE INDEX "idx_devices_status_created_active" ON "public"."devices" USING "btree" ("device_status", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dispatches_business_sector" ON "public"."dispatches" USING "btree" ("business_sector");



CREATE INDEX "idx_dispatches_dealer_dispatch_group" ON "public"."dispatches" USING "btree" ("dealer_dispatch_group_id") WHERE ("dealer_dispatch_group_id" IS NOT NULL);



CREATE INDEX "idx_dispatches_destination_farmer_lead_active" ON "public"."dispatches" USING "btree" ("destination_farmer_lead_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dispatches_destination_state_district_active" ON "public"."dispatches" USING "btree" ("destination_state", "destination_district") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dispatches_device" ON "public"."dispatches" USING "btree" ("device_id");



CREATE INDEX "idx_dispatches_dispatch_date_active" ON "public"."dispatches" USING "btree" ("dispatch_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dispatches_linked_farmer_lead_active" ON "public"."dispatches" USING "btree" ("linked_farmer_lead_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dispatches_linked_installation_active" ON "public"."dispatches" USING "btree" ("linked_installation_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dispatches_linked_pilot_active" ON "public"."dispatches" USING "btree" ("linked_pilot_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dispatches_payment_status_active" ON "public"."dispatches" USING "btree" ("payment_confirmed", "dispatch_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dispatches_product_date_active" ON "public"."dispatches" USING "btree" ("product_model", "dispatch_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dispatches_status" ON "public"."dispatches" USING "btree" ("dispatch_status");



CREATE INDEX "idx_dispatches_status_created_active" ON "public"."dispatches" USING "btree" ("dispatch_status", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_lead_followups_lead_created_at" ON "public"."farmer_lead_followups" USING "btree" ("farmer_lead_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_lead_followups_lead_followup_date" ON "public"."farmer_lead_followups" USING "btree" ("farmer_lead_id", "followup_date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_lead_followups_user" ON "public"."farmer_lead_followups" USING "btree" ("followed_up_by_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_business_sector" ON "public"."farmer_leads" USING "btree" ("business_sector");



CREATE INDEX "idx_farmer_leads_created_at_active" ON "public"."farmer_leads" USING "btree" ("created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_created_at_id" ON "public"."farmer_leads" USING "btree" ("created_at", "id");



CREATE INDEX "idx_farmer_leads_created_by_active" ON "public"."farmer_leads" USING "btree" ("created_by_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_crop_product_active" ON "public"."farmer_leads" USING "btree" ("primary_crop", "product_recommended") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_followup_due_active" ON "public"."farmer_leads" USING "btree" ("followup_due_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_followup_owner_active" ON "public"."farmer_leads" USING "btree" ("followup_owner_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_lead_date_active" ON "public"."farmer_leads" USING "btree" ("lead_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_linked_dealer_active" ON "public"."farmer_leads" USING "btree" ("linked_dealer_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_linked_pilot_active" ON "public"."farmer_leads" USING "btree" ("linked_pilot_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_next_action" ON "public"."farmer_leads" USING "btree" ("next_action_date");



CREATE INDEX "idx_farmer_leads_open_followup_due_active" ON "public"."farmer_leads" USING "btree" ("followup_due_date") WHERE (("deleted_at" IS NULL) AND ("lead_status" = 'Open'::"public"."lead_status"));



CREATE INDEX "idx_farmer_leads_open_next_action_active" ON "public"."farmer_leads" USING "btree" ("next_action_date") WHERE (("deleted_at" IS NULL) AND ("lead_status" = 'Open'::"public"."lead_status"));



CREATE INDEX "idx_farmer_leads_owner" ON "public"."farmer_leads" USING "btree" ("owner_user_id");



CREATE INDEX "idx_farmer_leads_paid_not_dispatched" ON "public"."farmer_leads" USING "btree" ("payment_confirmed", "device_dispatched", "lead_status", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_payment_active" ON "public"."farmer_leads" USING "btree" ("payment_confirmed") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_region" ON "public"."farmer_leads" USING "btree" ("region_id");



CREATE INDEX "idx_farmer_leads_region_rsm_lead_date_active" ON "public"."farmer_leads" USING "btree" ("region_id", "rsm_user_id", "lead_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_rsm" ON "public"."farmer_leads" USING "btree" ("rsm_user_id");



CREATE INDEX "idx_farmer_leads_state_district_active" ON "public"."farmer_leads" USING "btree" ("state", "district") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_farmer_leads_status_stage" ON "public"."farmer_leads" USING "btree" ("lead_status", "funnel_stage");



CREATE INDEX "idx_followups_due_status" ON "public"."followups" USING "btree" ("followup_due_date", "followup_status");



CREATE INDEX "idx_followups_farmer_lead_active" ON "public"."followups" USING "btree" ("farmer_lead_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_followups_installation_active" ON "public"."followups" USING "btree" ("installation_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_followups_owner_status_due_active" ON "public"."followups" USING "btree" ("followup_owner_user_id", "followup_status", "followup_due_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_followups_pilot_active" ON "public"."followups" USING "btree" ("pilot_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_followups_status_due_active" ON "public"."followups" USING "btree" ("followup_status", "followup_due_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_followups_visit_report_active" ON "public"."followups" USING "btree" ("visit_report_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_installations_business_sector" ON "public"."installations" USING "btree" ("business_sector");



CREATE INDEX "idx_installations_date" ON "public"."installations" USING "btree" ("installation_date");



CREATE INDEX "idx_installations_device_active" ON "public"."installations" USING "btree" ("device_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_installations_farmer_lead_active" ON "public"."installations" USING "btree" ("farmer_lead_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_installations_followup_owner_active" ON "public"."installations" USING "btree" ("followup_owner_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_installations_installation_date_active" ON "public"."installations" USING "btree" ("installation_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_installations_pilot_active" ON "public"."installations" USING "btree" ("pilot_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_installations_product_date_active" ON "public"."installations" USING "btree" ("product_model", "installation_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_installations_region_rsm_date_active" ON "public"."installations" USING "btree" ("region_id", "rsm_user_id", "installation_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_installations_rsm_region" ON "public"."installations" USING "btree" ("rsm_user_id", "region_id");



CREATE INDEX "idx_installations_state_district_active" ON "public"."installations" USING "btree" ("state", "district") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_installations_status_created_active" ON "public"."installations" USING "btree" ("installation_status", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_institution_meetings_institution_date" ON "public"."institution_meetings" USING "btree" ("institution_id", "meeting_date");



CREATE INDEX "idx_institution_meetings_meeting_date" ON "public"."institution_meetings" USING "btree" ("meeting_date");



CREATE INDEX "idx_institution_meetings_owner_date" ON "public"."institution_meetings" USING "btree" ("primary_internal_owner_user_id", "meeting_date");



CREATE INDEX "idx_institution_meetings_rd_head_date" ON "public"."institution_meetings" USING "btree" ("rd_head_user_id", "meeting_date");



CREATE INDEX "idx_institutions_account_owner" ON "public"."institutions" USING "btree" ("account_owner_user_id");



CREATE INDEX "idx_institutions_business_sector" ON "public"."institutions" USING "btree" ("business_sector");



CREATE INDEX "idx_institutions_created_at_active" ON "public"."institutions" USING "btree" ("created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_institutions_org_type_active" ON "public"."institutions" USING "btree" ("organization_type") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_institutions_primary_state_active" ON "public"."institutions" USING "btree" ("primary_state") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_institutions_rd_head_active" ON "public"."institutions" USING "btree" ("rd_head_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_institutions_rsm_active" ON "public"."institutions" USING "btree" ("rsm_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_institutions_sales_head_active" ON "public"."institutions" USING "btree" ("sales_head_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_institutions_scale_status_active" ON "public"."institutions" USING "btree" ("scale_up_status", "institution_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_institutions_status_active" ON "public"."institutions" USING "btree" ("institution_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_institutions_technical_owner_active" ON "public"."institutions" USING "btree" ("technical_owner_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_kpi_dashboard_cache_computed_at" ON "public"."kpi_dashboard_cache" USING "btree" ("computed_at" DESC);



CREATE INDEX "idx_kpi_dashboard_dirty_flags_dirty" ON "public"."kpi_dashboard_dirty_flags" USING "btree" ("is_dirty", "last_marked_dirty_at" DESC);



CREATE INDEX "idx_kpi_dashboard_refresh_log_started" ON "public"."kpi_dashboard_refresh_log" USING "btree" ("started_at" DESC);



CREATE INDEX "idx_pilot_visits_accompanied_by_date_active" ON "public"."pilot_visits" USING "btree" ("accompanied_by_user_id", "visit_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pilot_visits_pilot_date" ON "public"."pilot_visits" USING "btree" ("pilot_id", "visit_date");



CREATE INDEX "idx_pilot_visits_report_active" ON "public"."pilot_visits" USING "btree" ("visit_report_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pilot_visits_status_date_active" ON "public"."pilot_visits" USING "btree" ("visit_status", "visit_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pilot_visits_visit_date_active" ON "public"."pilot_visits" USING "btree" ("visit_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pilot_visits_visited_by_date_active" ON "public"."pilot_visits" USING "btree" ("visited_by_user_id", "visit_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pilots_agronomist_active" ON "public"."pilots" USING "btree" ("agronomist_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pilots_business_sector" ON "public"."pilots" USING "btree" ("business_sector");



CREATE INDEX "idx_pilots_created_status_active" ON "public"."pilots" USING "btree" ("created_at", "pilot_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pilots_crop_product_status_active" ON "public"."pilots" USING "btree" ("crop", "product_model", "pilot_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pilots_farmer_lead_active" ON "public"."pilots" USING "btree" ("farmer_lead_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pilots_owner" ON "public"."pilots" USING "btree" ("pilot_owner_user_id");



CREATE INDEX "idx_pilots_region_state_active" ON "public"."pilots" USING "btree" ("region_id", "state") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pilots_research_assistant_active" ON "public"."pilots" USING "btree" ("research_assistant_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pilots_rsm_active" ON "public"."pilots" USING "btree" ("rsm_user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pilots_status" ON "public"."pilots" USING "btree" ("pilot_status");



CREATE INDEX "idx_pilots_status_created_active" ON "public"."pilots" USING "btree" ("pilot_status", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_planned_pilot_visits_assignee_active_date" ON "public"."planned_pilot_visits" USING "btree" ("assigned_user_id", "planned_visit_date") WHERE (("deleted_at" IS NULL) AND ("linked_visit_report_id" IS NULL));



CREATE INDEX "idx_regions_active_name" ON "public"."regions" USING "btree" ("is_active", "region_name");



CREATE INDEX "idx_regions_state_active" ON "public"."regions" USING "btree" ("state", "is_active");



CREATE INDEX "idx_users_active_name" ON "public"."users" USING "btree" ("is_active", "full_name");



CREATE INDEX "idx_users_active_role" ON "public"."users" USING "btree" ("is_active", "role");



CREATE INDEX "idx_users_active_secondary_role" ON "public"."users" USING "btree" ("is_active", "secondary_role");



CREATE INDEX "idx_users_email_lower" ON "public"."users" USING "btree" ("lower"("email"));



CREATE INDEX "idx_users_region_id" ON "public"."users" USING "btree" ("region_id");



CREATE INDEX "idx_users_reports_to_active" ON "public"."users" USING "btree" ("reports_to_user_id", "is_active");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_visit_reports_farmer_lead_active" ON "public"."visit_reports" USING "btree" ("farmer_lead_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_visit_reports_installation_active" ON "public"."visit_reports" USING "btree" ("installation_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_visit_reports_pilot_date_active" ON "public"."visit_reports" USING "btree" ("pilot_id", "report_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_visit_reports_pilot_visit_active" ON "public"."visit_reports" USING "btree" ("pilot_visit_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_visit_reports_report_date_active" ON "public"."visit_reports" USING "btree" ("report_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_visit_reports_reviewer_status_active" ON "public"."visit_reports" USING "btree" ("reviewed_by_user_id", "report_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_visit_reports_status_date_active" ON "public"."visit_reports" USING "btree" ("report_status", "report_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_visit_reports_submitter_date" ON "public"."visit_reports" USING "btree" ("submitted_by_user_id", "report_date");



CREATE INDEX "idx_visit_reports_type_status_active" ON "public"."visit_reports" USING "btree" ("report_type", "report_status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_work_items_open_assignee_due" ON "public"."work_items" USING "btree" ("assignee_user_id", "due_at", "created_at" DESC) WHERE ("status" = 'Open'::"text");



CREATE INDEX "idx_work_items_open_dispatch_action_due" ON "public"."work_items" USING "btree" ("action_type", "due_at", "created_at" DESC) WHERE (("status" = 'Open'::"text") AND ("category" = 'dispatch'::"text"));



COMMENT ON INDEX "public"."idx_work_items_open_dispatch_action_due" IS 'Supports future selected Dispatch My Work queries filtered by status/category/action_type and ordered by due date.';



CREATE INDEX "idx_work_items_open_dispatch_ready_due" ON "public"."work_items" USING "btree" ("due_at", "created_at" DESC) WHERE (("status" = 'Open'::"text") AND ("action_type" = 'dispatch_ready'::"text"));



CREATE INDEX "idx_work_items_open_pilots_action_due" ON "public"."work_items" USING "btree" ("action_type", "due_at", "created_at" DESC) WHERE (("status" = 'Open'::"text") AND ("category" = 'pilots'::"text"));



COMMENT ON INDEX "public"."idx_work_items_open_pilots_action_due" IS 'Supports selected Pilots & Visits My Work queries filtered by status/category/action_type and ordered by due date.';



CREATE INDEX "idx_work_items_open_region_state_due" ON "public"."work_items" USING "btree" ("region_id", "state", "due_at", "created_at" DESC) WHERE ("status" = 'Open'::"text");



CREATE INDEX "idx_work_items_open_rsm_due" ON "public"."work_items" USING "btree" ("rsm_user_id", "due_at", "created_at" DESC) WHERE ("status" = 'Open'::"text");



CREATE INDEX "institutions_deleted_by_user_id_idx" ON "public"."institutions" USING "btree" ("deleted_by_user_id");



CREATE INDEX "institutions_mou_approval_status_idx" ON "public"."institutions" USING "btree" ("mou_approval_status", "updated_at" DESC);



CREATE INDEX "institutions_restored_by_user_id_idx" ON "public"."institutions" USING "btree" ("restored_by_user_id");



CREATE INDEX "marketing_request_updates_created_by_idx" ON "public"."marketing_request_updates" USING "btree" ("created_by_user_id");



CREATE INDEX "marketing_request_updates_request_idx" ON "public"."marketing_request_updates" USING "btree" ("marketing_request_id");



CREATE INDEX "marketing_requests_assigned_to_idx" ON "public"."marketing_requests" USING "btree" ("assigned_to_user_id");



CREATE INDEX "marketing_requests_completed_at_idx" ON "public"."marketing_requests" USING "btree" ("completed_at");



CREATE INDEX "marketing_requests_deadline_idx" ON "public"."marketing_requests" USING "btree" ("deadline_date");



CREATE INDEX "marketing_requests_deadline_status_idx" ON "public"."marketing_requests" USING "btree" ("deadline_status");



CREATE INDEX "marketing_requests_deleted_at_idx" ON "public"."marketing_requests" USING "btree" ("deleted_at");



CREATE INDEX "marketing_requests_region_idx" ON "public"."marketing_requests" USING "btree" ("requested_for_region_id");



CREATE INDEX "marketing_requests_requested_by_idx" ON "public"."marketing_requests" USING "btree" ("requested_by_user_id");



CREATE INDEX "marketing_requests_status_idx" ON "public"."marketing_requests" USING "btree" ("marketing_status");



CREATE UNIQUE INDEX "notifications_dedupe_key_unique_idx" ON "public"."notifications" USING "btree" ("dedupe_key") WHERE ("dedupe_key" IS NOT NULL);



CREATE INDEX "notifications_recipient_due_date_idx" ON "public"."notifications" USING "btree" ("recipient_user_id", "due_date");



CREATE INDEX "notifications_recipient_unread_created_idx" ON "public"."notifications" USING "btree" ("recipient_user_id", "is_read", "created_at" DESC);



CREATE INDEX "pilots_deleted_by_user_id_idx" ON "public"."pilots" USING "btree" ("deleted_by_user_id");



CREATE INDEX "pilots_restored_by_user_id_idx" ON "public"."pilots" USING "btree" ("restored_by_user_id");



CREATE INDEX "planned_pilot_visits_assigned_user_id_idx" ON "public"."planned_pilot_visits" USING "btree" ("assigned_user_id");



CREATE INDEX "planned_pilot_visits_date_status_idx" ON "public"."planned_pilot_visits" USING "btree" ("planned_visit_date", "planned_visit_status");



CREATE INDEX "planned_pilot_visits_linked_pilot_visit_id_idx" ON "public"."planned_pilot_visits" USING "btree" ("linked_pilot_visit_id");



CREATE INDEX "planned_pilot_visits_linked_visit_report_id_idx" ON "public"."planned_pilot_visits" USING "btree" ("linked_visit_report_id");



CREATE INDEX "planned_pilot_visits_pilot_id_idx" ON "public"."planned_pilot_visits" USING "btree" ("pilot_id");



CREATE INDEX "sales_payment_links_product_idx" ON "public"."sales_payment_links" USING "btree" ("product_name", "sort_order");



CREATE INDEX "visit_reports_planned_pilot_visit_id_idx" ON "public"."visit_reports" USING "btree" ("planned_pilot_visit_id");



CREATE OR REPLACE TRIGGER "dealer_institution_links_touch_updated_at" BEFORE UPDATE ON "public"."dealer_institution_links" FOR EACH ROW EXECUTE FUNCTION "public"."touch_dealer_institution_links_updated_at"();



CREATE OR REPLACE TRIGGER "dealer_reviews_touch_updated_at" BEFORE UPDATE ON "public"."dealer_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."touch_dealer_reviews_updated_at"();



CREATE OR REPLACE TRIGGER "farmer_lead_followups_touch_updated_at" BEFORE UPDATE ON "public"."farmer_lead_followups" FOR EACH ROW EXECUTE FUNCTION "public"."touch_farmer_lead_followups_updated_at"();



CREATE OR REPLACE TRIGGER "trg_dealers_set_updated_at" BEFORE UPDATE ON "public"."dealers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_device_movements_set_updated_at" BEFORE UPDATE ON "public"."device_movements" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_devices_set_updated_at" BEFORE UPDATE ON "public"."devices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_dispatches_set_updated_at" BEFORE UPDATE ON "public"."dispatches" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_dispatches_sync_dispatch_work_items_delete" AFTER DELETE ON "public"."dispatches" FOR EACH ROW EXECUTE FUNCTION "public"."sync_dispatch_work_items"();



CREATE OR REPLACE TRIGGER "trg_dispatches_sync_dispatch_work_items_insert" AFTER INSERT ON "public"."dispatches" FOR EACH ROW EXECUTE FUNCTION "public"."sync_dispatch_work_items"();



CREATE OR REPLACE TRIGGER "trg_dispatches_sync_dispatch_work_items_update" AFTER UPDATE OF "dispatch_code", "dispatch_date", "dispatch_status", "dispatch_type", "destination_name_snapshot", "destination_pilot_id", "destination_state", "expected_delivery_date", "linked_pilot_id", "payment_confirmed", "payment_confirmed_date", "payment_requirement_type", "product_model", "deleted_at" ON "public"."dispatches" FOR EACH ROW WHEN ((("old"."dispatch_code" IS DISTINCT FROM "new"."dispatch_code") OR ("old"."dispatch_date" IS DISTINCT FROM "new"."dispatch_date") OR ("old"."dispatch_status" IS DISTINCT FROM "new"."dispatch_status") OR ("old"."dispatch_type" IS DISTINCT FROM "new"."dispatch_type") OR ("old"."destination_name_snapshot" IS DISTINCT FROM "new"."destination_name_snapshot") OR ("old"."destination_pilot_id" IS DISTINCT FROM "new"."destination_pilot_id") OR ("old"."destination_state" IS DISTINCT FROM "new"."destination_state") OR ("old"."expected_delivery_date" IS DISTINCT FROM "new"."expected_delivery_date") OR ("old"."linked_pilot_id" IS DISTINCT FROM "new"."linked_pilot_id") OR ("old"."payment_confirmed" IS DISTINCT FROM "new"."payment_confirmed") OR ("old"."payment_confirmed_date" IS DISTINCT FROM "new"."payment_confirmed_date") OR ("old"."payment_requirement_type" IS DISTINCT FROM "new"."payment_requirement_type") OR ("old"."product_model" IS DISTINCT FROM "new"."product_model") OR ("old"."deleted_at" IS DISTINCT FROM "new"."deleted_at"))) EXECUTE FUNCTION "public"."sync_dispatch_work_items"();



CREATE OR REPLACE TRIGGER "trg_dispatches_sync_farmer_lead_work_items_delete" AFTER DELETE ON "public"."dispatches" FOR EACH ROW EXECUTE FUNCTION "public"."sync_dispatch_farmer_lead_work_items"();



CREATE OR REPLACE TRIGGER "trg_dispatches_sync_farmer_lead_work_items_insert" AFTER INSERT ON "public"."dispatches" FOR EACH ROW EXECUTE FUNCTION "public"."sync_dispatch_farmer_lead_work_items"();



CREATE OR REPLACE TRIGGER "trg_dispatches_sync_farmer_lead_work_items_update" AFTER UPDATE OF "linked_farmer_lead_id", "destination_farmer_lead_id", "dispatch_status", "deleted_at" ON "public"."dispatches" FOR EACH ROW WHEN ((("old"."linked_farmer_lead_id" IS DISTINCT FROM "new"."linked_farmer_lead_id") OR ("old"."destination_farmer_lead_id" IS DISTINCT FROM "new"."destination_farmer_lead_id") OR ("old"."dispatch_status" IS DISTINCT FROM "new"."dispatch_status") OR ("old"."deleted_at" IS DISTINCT FROM "new"."deleted_at"))) EXECUTE FUNCTION "public"."sync_dispatch_farmer_lead_work_items"();



CREATE OR REPLACE TRIGGER "trg_farmer_leads_set_updated_at" BEFORE UPDATE ON "public"."farmer_leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_farmer_leads_sync_work_items_delete" AFTER DELETE ON "public"."farmer_leads" FOR EACH ROW EXECUTE FUNCTION "public"."sync_farmer_lead_work_items"();



CREATE OR REPLACE TRIGGER "trg_farmer_leads_sync_work_items_insert" AFTER INSERT ON "public"."farmer_leads" FOR EACH ROW EXECUTE FUNCTION "public"."sync_farmer_lead_work_items"();



CREATE OR REPLACE TRIGGER "trg_farmer_leads_sync_work_items_update" AFTER UPDATE OF "next_action_date", "lead_status", "funnel_stage", "payment_confirmed", "payment_confirmed_date", "device_dispatched", "owner_user_id", "rsm_user_id", "region_id", "state", "farmer_name", "lead_code", "deleted_at" ON "public"."farmer_leads" FOR EACH ROW WHEN ((("old"."next_action_date" IS DISTINCT FROM "new"."next_action_date") OR ("old"."lead_status" IS DISTINCT FROM "new"."lead_status") OR ("old"."funnel_stage" IS DISTINCT FROM "new"."funnel_stage") OR ("old"."payment_confirmed" IS DISTINCT FROM "new"."payment_confirmed") OR ("old"."payment_confirmed_date" IS DISTINCT FROM "new"."payment_confirmed_date") OR ("old"."device_dispatched" IS DISTINCT FROM "new"."device_dispatched") OR ("old"."owner_user_id" IS DISTINCT FROM "new"."owner_user_id") OR ("old"."rsm_user_id" IS DISTINCT FROM "new"."rsm_user_id") OR ("old"."region_id" IS DISTINCT FROM "new"."region_id") OR ("old"."state" IS DISTINCT FROM "new"."state") OR ("old"."farmer_name" IS DISTINCT FROM "new"."farmer_name") OR ("old"."lead_code" IS DISTINCT FROM "new"."lead_code") OR ("old"."deleted_at" IS DISTINCT FROM "new"."deleted_at"))) EXECUTE FUNCTION "public"."sync_farmer_lead_work_items"();



CREATE OR REPLACE TRIGGER "trg_followups_set_updated_at" BEFORE UPDATE ON "public"."followups" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_installations_set_updated_at" BEFORE UPDATE ON "public"."installations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_institution_contacts_set_updated_at" BEFORE UPDATE ON "public"."institution_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_institution_meetings_set_updated_at" BEFORE UPDATE ON "public"."institution_meetings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_institutions_set_updated_at" BEFORE UPDATE ON "public"."institutions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_marketing_requests_set_updated_at" BEFORE UPDATE ON "public"."marketing_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_pilot_visits_set_updated_at" BEFORE UPDATE ON "public"."pilot_visits" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_pilots_set_updated_at" BEFORE UPDATE ON "public"."pilots" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_pilots_sync_dispatch_work_items_delete" AFTER DELETE ON "public"."pilots" FOR EACH ROW EXECUTE FUNCTION "public"."sync_pilot_dispatch_work_items"();



CREATE OR REPLACE TRIGGER "trg_pilots_sync_dispatch_work_items_insert" AFTER INSERT ON "public"."pilots" FOR EACH ROW EXECUTE FUNCTION "public"."sync_pilot_dispatch_work_items"();



CREATE OR REPLACE TRIGGER "trg_pilots_sync_dispatch_work_items_update" AFTER UPDATE OF "deleted_at", "farmer_name_snapshot", "installation_completed", "pilot_code", "pilot_name", "pilot_owner_user_id", "pilot_status", "region_id", "rsm_user_id", "state" ON "public"."pilots" FOR EACH ROW WHEN ((("old"."deleted_at" IS DISTINCT FROM "new"."deleted_at") OR ("old"."farmer_name_snapshot" IS DISTINCT FROM "new"."farmer_name_snapshot") OR ("old"."installation_completed" IS DISTINCT FROM "new"."installation_completed") OR ("old"."pilot_code" IS DISTINCT FROM "new"."pilot_code") OR ("old"."pilot_name" IS DISTINCT FROM "new"."pilot_name") OR ("old"."pilot_owner_user_id" IS DISTINCT FROM "new"."pilot_owner_user_id") OR ("old"."pilot_status" IS DISTINCT FROM "new"."pilot_status") OR ("old"."region_id" IS DISTINCT FROM "new"."region_id") OR ("old"."rsm_user_id" IS DISTINCT FROM "new"."rsm_user_id") OR ("old"."state" IS DISTINCT FROM "new"."state"))) EXECUTE FUNCTION "public"."sync_pilot_dispatch_work_items"();



CREATE OR REPLACE TRIGGER "trg_pilots_sync_pilot_monitoring_work_items_delete" AFTER DELETE ON "public"."pilots" FOR EACH ROW EXECUTE FUNCTION "public"."sync_pilot_monitoring_pilot_work_items"();



CREATE OR REPLACE TRIGGER "trg_pilots_sync_pilot_monitoring_work_items_insert" AFTER INSERT ON "public"."pilots" FOR EACH ROW EXECUTE FUNCTION "public"."sync_pilot_monitoring_pilot_work_items"();



CREATE OR REPLACE TRIGGER "trg_pilots_sync_pilot_monitoring_work_items_update" AFTER UPDATE OF "agronomist_user_id", "deleted_at", "farmer_name_snapshot", "installation_completed", "next_visit_due_date", "pilot_code", "pilot_name", "pilot_owner_user_id", "pilot_status", "product_model", "region_id", "research_assistant_user_id", "rsm_user_id", "state" ON "public"."pilots" FOR EACH ROW WHEN ((("old"."agronomist_user_id" IS DISTINCT FROM "new"."agronomist_user_id") OR ("old"."deleted_at" IS DISTINCT FROM "new"."deleted_at") OR ("old"."farmer_name_snapshot" IS DISTINCT FROM "new"."farmer_name_snapshot") OR ("old"."installation_completed" IS DISTINCT FROM "new"."installation_completed") OR ("old"."next_visit_due_date" IS DISTINCT FROM "new"."next_visit_due_date") OR ("old"."pilot_code" IS DISTINCT FROM "new"."pilot_code") OR ("old"."pilot_name" IS DISTINCT FROM "new"."pilot_name") OR ("old"."pilot_owner_user_id" IS DISTINCT FROM "new"."pilot_owner_user_id") OR ("old"."pilot_status" IS DISTINCT FROM "new"."pilot_status") OR ("old"."product_model" IS DISTINCT FROM "new"."product_model") OR ("old"."region_id" IS DISTINCT FROM "new"."region_id") OR ("old"."research_assistant_user_id" IS DISTINCT FROM "new"."research_assistant_user_id") OR ("old"."rsm_user_id" IS DISTINCT FROM "new"."rsm_user_id") OR ("old"."state" IS DISTINCT FROM "new"."state"))) EXECUTE FUNCTION "public"."sync_pilot_monitoring_pilot_work_items"();



CREATE OR REPLACE TRIGGER "trg_planned_pilot_visits_set_updated_at" BEFORE UPDATE ON "public"."planned_pilot_visits" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_planned_pilot_visits_sync_work_items_delete" AFTER DELETE ON "public"."planned_pilot_visits" FOR EACH ROW EXECUTE FUNCTION "public"."sync_planned_pilot_visit_work_items"();



CREATE OR REPLACE TRIGGER "trg_planned_pilot_visits_sync_work_items_insert" AFTER INSERT ON "public"."planned_pilot_visits" FOR EACH ROW EXECUTE FUNCTION "public"."sync_planned_pilot_visit_work_items"();



CREATE OR REPLACE TRIGGER "trg_planned_pilot_visits_sync_work_items_update" AFTER UPDATE OF "assigned_user_id", "crop_stage_timing", "deleted_at", "linked_visit_report_id", "pilot_id", "planned_visit_date", "planned_visit_status", "visit_number", "visit_type" ON "public"."planned_pilot_visits" FOR EACH ROW WHEN ((("old"."assigned_user_id" IS DISTINCT FROM "new"."assigned_user_id") OR ("old"."crop_stage_timing" IS DISTINCT FROM "new"."crop_stage_timing") OR ("old"."deleted_at" IS DISTINCT FROM "new"."deleted_at") OR ("old"."linked_visit_report_id" IS DISTINCT FROM "new"."linked_visit_report_id") OR ("old"."pilot_id" IS DISTINCT FROM "new"."pilot_id") OR ("old"."planned_visit_date" IS DISTINCT FROM "new"."planned_visit_date") OR ("old"."planned_visit_status" IS DISTINCT FROM "new"."planned_visit_status") OR ("old"."visit_number" IS DISTINCT FROM "new"."visit_number") OR ("old"."visit_type" IS DISTINCT FROM "new"."visit_type"))) EXECUTE FUNCTION "public"."sync_planned_pilot_visit_work_items"();



CREATE OR REPLACE TRIGGER "trg_regions_set_updated_at" BEFORE UPDATE ON "public"."regions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_users_set_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_visit_reports_set_updated_at" BEFORE UPDATE ON "public"."visit_reports" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_visit_reports_sync_pilot_work_items_delete" AFTER DELETE ON "public"."visit_reports" FOR EACH ROW EXECUTE FUNCTION "public"."sync_visit_report_review_work_items"();



CREATE OR REPLACE TRIGGER "trg_visit_reports_sync_pilot_work_items_insert" AFTER INSERT ON "public"."visit_reports" FOR EACH ROW EXECUTE FUNCTION "public"."sync_visit_report_review_work_items"();



CREATE OR REPLACE TRIGGER "trg_visit_reports_sync_pilot_work_items_update" AFTER UPDATE OF "deleted_at", "pilot_id", "planned_pilot_visit_id", "report_date", "report_status", "report_title", "reviewed_by_user_id", "submitted_by_user_id", "visit_report_code" ON "public"."visit_reports" FOR EACH ROW WHEN ((("old"."deleted_at" IS DISTINCT FROM "new"."deleted_at") OR ("old"."pilot_id" IS DISTINCT FROM "new"."pilot_id") OR ("old"."planned_pilot_visit_id" IS DISTINCT FROM "new"."planned_pilot_visit_id") OR ("old"."report_date" IS DISTINCT FROM "new"."report_date") OR ("old"."report_status" IS DISTINCT FROM "new"."report_status") OR ("old"."report_title" IS DISTINCT FROM "new"."report_title") OR ("old"."reviewed_by_user_id" IS DISTINCT FROM "new"."reviewed_by_user_id") OR ("old"."submitted_by_user_id" IS DISTINCT FROM "new"."submitted_by_user_id") OR ("old"."visit_report_code" IS DISTINCT FROM "new"."visit_report_code"))) EXECUTE FUNCTION "public"."sync_visit_report_review_work_items"();



CREATE OR REPLACE TRIGGER "trg_work_items_set_updated_at" BEFORE UPDATE ON "public"."work_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."dealer_institution_links"
    ADD CONSTRAINT "dealer_institution_links_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dealer_institution_links"
    ADD CONSTRAINT "dealer_institution_links_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id");



ALTER TABLE ONLY "public"."dealer_institution_links"
    ADD CONSTRAINT "dealer_institution_links_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."dealer_institution_links"
    ADD CONSTRAINT "dealer_institution_links_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dealer_institution_links"
    ADD CONSTRAINT "dealer_institution_links_rsm_user_id_fkey" FOREIGN KEY ("rsm_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dealer_reviews"
    ADD CONSTRAINT "dealer_reviews_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dealer_reviews"
    ADD CONSTRAINT "dealer_reviews_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "dealers_dealer_agreement_approved_by_user_id_fkey" FOREIGN KEY ("dealer_agreement_approved_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "dealers_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "dealers_restored_by_user_id_fkey" FOREIGN KEY ("restored_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."device_status_update_tasks"
    ADD CONSTRAINT "device_status_update_tasks_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id");



ALTER TABLE ONLY "public"."device_status_update_tasks"
    ADD CONSTRAINT "device_status_update_tasks_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."device_status_update_tasks"
    ADD CONSTRAINT "device_status_update_tasks_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."device_status_update_tasks"
    ADD CONSTRAINT "device_status_update_tasks_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_manual_adjustment_approved_by_user_id_fkey" FOREIGN KEY ("manual_adjustment_approved_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_return_approved_by_user_id_fkey" FOREIGN KEY ("return_approved_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."farmer_lead_followups"
    ADD CONSTRAINT "farmer_lead_followups_farmer_lead_id_fkey" FOREIGN KEY ("farmer_lead_id") REFERENCES "public"."farmer_leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."farmer_lead_followups"
    ADD CONSTRAINT "farmer_lead_followups_followed_up_by_user_id_fkey" FOREIGN KEY ("followed_up_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "fk_dealers_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "fk_dealers_owner" FOREIGN KEY ("dealer_owner_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "fk_dealers_region" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id");



ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "fk_dealers_rsm" FOREIGN KEY ("rsm_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."device_movements"
    ADD CONSTRAINT "fk_device_movements_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."device_movements"
    ADD CONSTRAINT "fk_device_movements_dealer" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id");



ALTER TABLE ONLY "public"."device_movements"
    ADD CONSTRAINT "fk_device_movements_device" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id");



ALTER TABLE ONLY "public"."device_movements"
    ADD CONSTRAINT "fk_device_movements_dispatch" FOREIGN KEY ("dispatch_id") REFERENCES "public"."dispatches"("id");



ALTER TABLE ONLY "public"."device_movements"
    ADD CONSTRAINT "fk_device_movements_farmer_lead" FOREIGN KEY ("farmer_lead_id") REFERENCES "public"."farmer_leads"("id");



ALTER TABLE ONLY "public"."device_movements"
    ADD CONSTRAINT "fk_device_movements_installation" FOREIGN KEY ("installation_id") REFERENCES "public"."installations"("id");



ALTER TABLE ONLY "public"."device_movements"
    ADD CONSTRAINT "fk_device_movements_institution" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."device_movements"
    ADD CONSTRAINT "fk_device_movements_pilot" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "fk_devices_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "fk_devices_dealer" FOREIGN KEY ("linked_dealer_id") REFERENCES "public"."dealers"("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "fk_devices_dispatch" FOREIGN KEY ("linked_dispatch_id") REFERENCES "public"."dispatches"("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "fk_devices_farmer_lead" FOREIGN KEY ("linked_farmer_lead_id") REFERENCES "public"."farmer_leads"("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "fk_devices_installation" FOREIGN KEY ("linked_installation_id") REFERENCES "public"."installations"("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "fk_devices_institution" FOREIGN KEY ("linked_institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "fk_devices_pilot" FOREIGN KEY ("linked_pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "fk_devices_stock_entered_by" FOREIGN KEY ("stock_entered_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_approved_by" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_dealer" FOREIGN KEY ("linked_dealer_id") REFERENCES "public"."dealers"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_dest_dealer" FOREIGN KEY ("destination_dealer_id") REFERENCES "public"."dealers"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_dest_farmer" FOREIGN KEY ("destination_farmer_lead_id") REFERENCES "public"."farmer_leads"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_dest_institution" FOREIGN KEY ("destination_institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_dest_pilot" FOREIGN KEY ("destination_pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_device" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_dispatched_by" FOREIGN KEY ("dispatched_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_exception_by" FOREIGN KEY ("exception_approved_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_farmer" FOREIGN KEY ("linked_farmer_lead_id") REFERENCES "public"."farmer_leads"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_installation" FOREIGN KEY ("linked_installation_id") REFERENCES "public"."installations"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_institution" FOREIGN KEY ("linked_institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_payment_by" FOREIGN KEY ("payment_confirmed_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "fk_dispatches_pilot" FOREIGN KEY ("linked_pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "fk_farmer_leads_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "fk_farmer_leads_dealer" FOREIGN KEY ("linked_dealer_id") REFERENCES "public"."dealers"("id");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "fk_farmer_leads_dispatch" FOREIGN KEY ("linked_dispatch_id") REFERENCES "public"."dispatches"("id");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "fk_farmer_leads_followup_owner" FOREIGN KEY ("followup_owner_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "fk_farmer_leads_installation" FOREIGN KEY ("linked_installation_id") REFERENCES "public"."installations"("id");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "fk_farmer_leads_institution" FOREIGN KEY ("linked_institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "fk_farmer_leads_owner" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "fk_farmer_leads_payment_by" FOREIGN KEY ("payment_confirmed_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "fk_farmer_leads_pilot" FOREIGN KEY ("linked_pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "fk_farmer_leads_region" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id");



ALTER TABLE ONLY "public"."farmer_leads"
    ADD CONSTRAINT "fk_farmer_leads_rsm" FOREIGN KEY ("rsm_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "fk_followups_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "fk_followups_dealer" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "fk_followups_device" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "fk_followups_escalated_to" FOREIGN KEY ("escalated_to_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "fk_followups_farmer_lead" FOREIGN KEY ("farmer_lead_id") REFERENCES "public"."farmer_leads"("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "fk_followups_installation" FOREIGN KEY ("installation_id") REFERENCES "public"."installations"("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "fk_followups_institution" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "fk_followups_owner" FOREIGN KEY ("followup_owner_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "fk_followups_pilot" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "fk_followups_pilot_visit" FOREIGN KEY ("pilot_visit_id") REFERENCES "public"."pilot_visits"("id");



ALTER TABLE ONLY "public"."followups"
    ADD CONSTRAINT "fk_followups_visit_report" FOREIGN KEY ("visit_report_id") REFERENCES "public"."visit_reports"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_dealer" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_device" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_dispatch" FOREIGN KEY ("dispatch_id") REFERENCES "public"."dispatches"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_farmer_lead" FOREIGN KEY ("farmer_lead_id") REFERENCES "public"."farmer_leads"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_followup_owner" FOREIGN KEY ("followup_owner_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_installed_by" FOREIGN KEY ("installed_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_institution" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_linked_followup" FOREIGN KEY ("linked_followup_id") REFERENCES "public"."followups"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_pilot" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_region" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_rsm" FOREIGN KEY ("rsm_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."installations"
    ADD CONSTRAINT "fk_installations_verified_by" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institution_contacts"
    ADD CONSTRAINT "fk_institution_contacts_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institution_contacts"
    ADD CONSTRAINT "fk_institution_contacts_institution" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."institution_meetings"
    ADD CONSTRAINT "fk_institution_meetings_agronomist" FOREIGN KEY ("agronomist_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institution_meetings"
    ADD CONSTRAINT "fk_institution_meetings_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institution_meetings"
    ADD CONSTRAINT "fk_institution_meetings_external_contact" FOREIGN KEY ("external_contact_id") REFERENCES "public"."institution_contacts"("id");



ALTER TABLE ONLY "public"."institution_meetings"
    ADD CONSTRAINT "fk_institution_meetings_institution" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."institution_meetings"
    ADD CONSTRAINT "fk_institution_meetings_primary_owner" FOREIGN KEY ("primary_internal_owner_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institution_meetings"
    ADD CONSTRAINT "fk_institution_meetings_rd_head" FOREIGN KEY ("rd_head_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institution_meetings"
    ADD CONSTRAINT "fk_institution_meetings_rsm" FOREIGN KEY ("rsm_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institution_meetings"
    ADD CONSTRAINT "fk_institution_meetings_sales_head" FOREIGN KEY ("sales_head_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "fk_institutions_account_owner" FOREIGN KEY ("account_owner_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "fk_institutions_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "fk_institutions_primary_region" FOREIGN KEY ("primary_region_id") REFERENCES "public"."regions"("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "fk_institutions_rd_head" FOREIGN KEY ("rd_head_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "fk_institutions_rsm" FOREIGN KEY ("rsm_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "fk_institutions_sales_head" FOREIGN KEY ("sales_head_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "fk_institutions_technical_owner" FOREIGN KEY ("technical_owner_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pilot_visits"
    ADD CONSTRAINT "fk_pilot_visits_accompanied_by" FOREIGN KEY ("accompanied_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pilot_visits"
    ADD CONSTRAINT "fk_pilot_visits_pilot" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."pilot_visits"
    ADD CONSTRAINT "fk_pilot_visits_rd_head" FOREIGN KEY ("rd_head_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pilot_visits"
    ADD CONSTRAINT "fk_pilot_visits_visit_report" FOREIGN KEY ("visit_report_id") REFERENCES "public"."visit_reports"("id");



ALTER TABLE ONLY "public"."pilot_visits"
    ADD CONSTRAINT "fk_pilot_visits_visited_by" FOREIGN KEY ("visited_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_agronomist" FOREIGN KEY ("agronomist_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_dealer" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_device" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_dispatch" FOREIGN KEY ("dispatch_id") REFERENCES "public"."dispatches"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_farmer_lead" FOREIGN KEY ("farmer_lead_id") REFERENCES "public"."farmer_leads"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_installation" FOREIGN KEY ("installation_id") REFERENCES "public"."installations"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_institution" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_owner" FOREIGN KEY ("pilot_owner_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_rd_head" FOREIGN KEY ("rd_head_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_region" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_research_assistant" FOREIGN KEY ("research_assistant_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "fk_pilots_rsm" FOREIGN KEY ("rsm_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."regions"
    ADD CONSTRAINT "fk_regions_rsm" FOREIGN KEY ("rsm_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "fk_users_region" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "fk_users_reports_to" FOREIGN KEY ("reports_to_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."visit_reports"
    ADD CONSTRAINT "fk_visit_reports_farmer_lead" FOREIGN KEY ("farmer_lead_id") REFERENCES "public"."farmer_leads"("id");



ALTER TABLE ONLY "public"."visit_reports"
    ADD CONSTRAINT "fk_visit_reports_installation" FOREIGN KEY ("installation_id") REFERENCES "public"."installations"("id");



ALTER TABLE ONLY "public"."visit_reports"
    ADD CONSTRAINT "fk_visit_reports_institution" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."visit_reports"
    ADD CONSTRAINT "fk_visit_reports_pilot" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."visit_reports"
    ADD CONSTRAINT "fk_visit_reports_pilot_visit" FOREIGN KEY ("pilot_visit_id") REFERENCES "public"."pilot_visits"("id");



ALTER TABLE ONLY "public"."visit_reports"
    ADD CONSTRAINT "fk_visit_reports_reviewed_by" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."visit_reports"
    ADD CONSTRAINT "fk_visit_reports_submitted_by" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "institutions_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "institutions_mou_approved_by_user_id_fkey" FOREIGN KEY ("mou_approved_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "institutions_restored_by_user_id_fkey" FOREIGN KEY ("restored_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."kpi_dashboard_refresh_log"
    ADD CONSTRAINT "kpi_dashboard_refresh_log_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."marketing_request_updates"
    ADD CONSTRAINT "marketing_request_updates_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."marketing_request_updates"
    ADD CONSTRAINT "marketing_request_updates_marketing_request_id_fkey" FOREIGN KEY ("marketing_request_id") REFERENCES "public"."marketing_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_completed_by_user_id_fkey" FOREIGN KEY ("completed_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_deadline_decided_by_user_id_fkey" FOREIGN KEY ("deadline_decided_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_marketing_head_user_id_fkey" FOREIGN KEY ("marketing_head_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_related_dealer_id_fkey" FOREIGN KEY ("related_dealer_id") REFERENCES "public"."dealers"("id");



ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_related_farmer_lead_id_fkey" FOREIGN KEY ("related_farmer_lead_id") REFERENCES "public"."farmer_leads"("id");



ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_related_institution_id_fkey" FOREIGN KEY ("related_institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_related_pilot_id_fkey" FOREIGN KEY ("related_pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."marketing_requests"
    ADD CONSTRAINT "marketing_requests_requested_for_region_id_fkey" FOREIGN KEY ("requested_for_region_id") REFERENCES "public"."regions"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_device_removal_device_id_fkey" FOREIGN KEY ("device_removal_device_id") REFERENCES "public"."devices"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_device_removed_by_user_id_fkey" FOREIGN KEY ("device_removed_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_restored_by_user_id_fkey" FOREIGN KEY ("restored_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."planned_pilot_visits"
    ADD CONSTRAINT "planned_pilot_visits_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."planned_pilot_visits"
    ADD CONSTRAINT "planned_pilot_visits_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."planned_pilot_visits"
    ADD CONSTRAINT "planned_pilot_visits_linked_pilot_visit_id_fkey" FOREIGN KEY ("linked_pilot_visit_id") REFERENCES "public"."pilot_visits"("id");



ALTER TABLE ONLY "public"."planned_pilot_visits"
    ADD CONSTRAINT "planned_pilot_visits_linked_visit_report_id_fkey" FOREIGN KEY ("linked_visit_report_id") REFERENCES "public"."visit_reports"("id");



ALTER TABLE ONLY "public"."planned_pilot_visits"
    ADD CONSTRAINT "planned_pilot_visits_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_deactivated_by_user_id_fkey" FOREIGN KEY ("deactivated_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_replacement_user_id_fkey" FOREIGN KEY ("replacement_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."visit_reports"
    ADD CONSTRAINT "visit_reports_planned_pilot_visit_id_fkey" FOREIGN KEY ("planned_pilot_visit_id") REFERENCES "public"."planned_pilot_visits"("id");



ALTER TABLE ONLY "public"."work_items"
    ADD CONSTRAINT "work_items_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."work_items"
    ADD CONSTRAINT "work_items_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id");



ALTER TABLE ONLY "public"."work_items"
    ADD CONSTRAINT "work_items_rsm_user_id_fkey" FOREIGN KEY ("rsm_user_id") REFERENCES "public"."users"("id");



ALTER TABLE "public"."dealer_institution_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dealer_institution_links_insert_scope" ON "public"."dealer_institution_links" FOR INSERT TO "authenticated" WITH CHECK ((("deleted_at" IS NULL) AND ("created_by_user_id" = "public"."get_current_user_id"()) AND ("public"."is_admin"() OR "public"."is_sales_head"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."dealers" "d"
  WHERE (("d"."id" = "dealer_institution_links"."dealer_id") AND ("d"."deleted_at" IS NULL) AND (("d"."rsm_user_id" = "public"."get_current_user_id"()) OR ("d"."region_id" = "public"."current_region_id"()) OR ("d"."state" = "public"."current_state"()))))))))));



COMMENT ON POLICY "dealer_institution_links_insert_scope" ON "public"."dealer_institution_links" IS 'Admin, Sales Head, and scoped RSM can create dealer-institution opportunity links. Viewer has no write policy.';



CREATE POLICY "dealer_institution_links_select_scope" ON "public"."dealer_institution_links" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND ("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR "public"."is_agronomist"() OR "public"."is_viewer"() OR ("owner_user_id" = "public"."get_current_user_id"()) OR ("rsm_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."dealers" "d"
  WHERE (("d"."id" = "dealer_institution_links"."dealer_id") AND ("d"."deleted_at" IS NULL) AND (("d"."rsm_user_id" = "public"."get_current_user_id"()) OR ("d"."dealer_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("d"."region_id" = "public"."current_region_id"()) OR ("d"."state" = "public"."current_state"()))))))) OR (EXISTS ( SELECT 1
   FROM "public"."institutions" "i"
  WHERE (("i"."id" = "dealer_institution_links"."institution_id") AND ("i"."deleted_at" IS NULL) AND (("i"."account_owner_user_id" = "public"."get_current_user_id"()) OR ("i"."sales_head_user_id" = "public"."get_current_user_id"()) OR ("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."rd_head_user_id" = "public"."get_current_user_id"()) OR ("i"."technical_owner_user_id" = "public"."get_current_user_id"()))))))));



COMMENT ON POLICY "dealer_institution_links_select_scope" ON "public"."dealer_institution_links" IS 'Read scope follows leadership, viewer read-only, direct owner/RSM, scoped dealer, or institution ownership access.';



CREATE POLICY "dealer_institution_links_update_scope" ON "public"."dealer_institution_links" FOR UPDATE TO "authenticated" USING ((("deleted_at" IS NULL) AND ("public"."is_admin"() OR "public"."is_sales_head"() OR ("owner_user_id" = "public"."get_current_user_id"()) OR ("rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (EXISTS ( SELECT 1
   FROM "public"."dealers" "d"
  WHERE (("d"."id" = "dealer_institution_links"."dealer_id") AND ("d"."deleted_at" IS NULL) AND (("d"."rsm_user_id" = "public"."get_current_user_id"()) OR ("d"."region_id" = "public"."current_region_id"()) OR ("d"."state" = "public"."current_state"()))))))))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR ("owner_user_id" = "public"."get_current_user_id"()) OR ("rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (EXISTS ( SELECT 1
   FROM "public"."dealers" "d"
  WHERE (("d"."id" = "dealer_institution_links"."dealer_id") AND ("d"."deleted_at" IS NULL) AND (("d"."rsm_user_id" = "public"."get_current_user_id"()) OR ("d"."region_id" = "public"."current_region_id"()) OR ("d"."state" = "public"."current_state"()))))))));



COMMENT ON POLICY "dealer_institution_links_update_scope" ON "public"."dealer_institution_links" IS 'Admin, Sales Head, owner, assigned RSM, and scoped RSM can update or soft-delete links. No DELETE policy is created.';



ALTER TABLE "public"."dealer_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dealer_reviews_insert_scope" ON "public"."dealer_reviews" FOR INSERT TO "authenticated" WITH CHECK ((("deleted_at" IS NULL) AND ("reviewed_by_user_id" = "public"."get_current_user_id"()) AND ("public"."is_admin"() OR "public"."is_sales_head"() OR ("public"."is_rsm"() AND (EXISTS ( SELECT 1
   FROM "public"."dealers" "d"
  WHERE (("d"."id" = "dealer_reviews"."dealer_id") AND ("d"."deleted_at" IS NULL) AND (("d"."rsm_user_id" = "public"."get_current_user_id"()) OR ("d"."region_id" = "public"."current_region_id"()) OR ("d"."state" = "public"."current_state"())))))))));



COMMENT ON POLICY "dealer_reviews_insert_scope" ON "public"."dealer_reviews" IS 'Admin, Sales Head, and scoped RSM can append Dealer review snapshots. Past reviews are read-only in Phase 1.';



CREATE POLICY "dealer_reviews_select_scope" ON "public"."dealer_reviews" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."dealers" "d"
  WHERE (("d"."id" = "dealer_reviews"."dealer_id") AND ("d"."deleted_at" IS NULL))))));



COMMENT ON POLICY "dealer_reviews_select_scope" ON "public"."dealer_reviews" IS 'Past Dealer reviews are readable when the user can read the linked Dealer under existing Dealer RLS.';



ALTER TABLE "public"."dealers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dealers_insert_internal_scope" ON "public"."dealers" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"())))));



COMMENT ON POLICY "dealers_insert_internal_scope" ON "public"."dealers" IS 'Admin, Sales Head, and regional RSM can create dealers. Salesperson is read-only for dealers in this first RLS pass.';



CREATE POLICY "dealers_select_agronomist_secondary_ra_leads" ON "public"."dealers" FOR SELECT TO "authenticated" USING (("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."linked_dealer_id" = "dealers"."id") AND ("fl"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("fl"."created_by_user_id"))))));



CREATE POLICY "dealers_select_hr_legal" ON "public"."dealers" FOR SELECT TO "authenticated" USING ("public"."is_hr_legal"());



CREATE POLICY "dealers_select_internal_scope" ON "public"."dealers" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND ("region_id" = "public"."current_region_id"())) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM ("public"."farmer_leads" "fl"
     JOIN "public"."users" "u" ON (("u"."id" = "fl"."created_by_user_id")))
  WHERE (("fl"."linked_dealer_id" = "dealers"."id") AND ("fl"."deleted_at" IS NULL) AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))))));



COMMENT ON POLICY "dealers_select_internal_scope" ON "public"."dealers" IS 'Safe Phase 1 dealer read scope: leadership/R&D, regional RSM, assigned-region Salesperson, and Agronomist dealers linked to Research Assistant team-created leads.';



CREATE POLICY "dealers_select_stock_dispatch_destination_lookup" ON "public"."dealers" FOR SELECT TO "authenticated" USING (("public"."is_stock_dispatch"() AND ("deleted_at" IS NULL)));



COMMENT ON POLICY "dealers_select_stock_dispatch_destination_lookup" ON "public"."dealers" IS 'Allows Stock / Dispatch users to read active Dealer destination rows for Dealer Dispatch creation/editing. Dealer writes remain blocked by existing policies.';



CREATE POLICY "dealers_update_hr_legal" ON "public"."dealers" FOR UPDATE TO "authenticated" USING ("public"."is_hr_legal"()) WITH CHECK ("public"."is_hr_legal"());



CREATE POLICY "dealers_update_internal_scope" ON "public"."dealers" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"())))));



COMMENT ON POLICY "dealers_update_internal_scope" ON "public"."dealers" IS 'Admin, Sales Head, and regional RSM can update dealers. Detailed field restrictions remain in the app for now.';



ALTER TABLE "public"."device_movements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_movements_insert_phase2_scope" ON "public"."device_movements" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND ((EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "device_movements"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."installations" "i"
  WHERE (("i"."id" = "device_movements"."installation_id") AND ("i"."deleted_at" IS NULL) AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"())))))))));



COMMENT ON POLICY "device_movements_insert_phase2_scope" ON "public"."device_movements" IS 'Phase 2 draft movement creation for dispatch/installation side effects by operational roles.';



CREATE POLICY "device_movements_insert_pilot_completion_return_scope" ON "public"."device_movements" FOR INSERT TO "authenticated" WITH CHECK ((("public"."is_admin"() OR "public"."is_management"() OR "public"."is_rd_head"() OR "public"."is_agronomist"() OR "public"."is_research_assistant"()) AND (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "device_movements"."pilot_id") AND ("p"."deleted_at" IS NULL) AND ("public"."is_admin"() OR "public"."is_management"() OR "public"."is_rd_head"() OR "public"."is_agronomist"() OR ("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"())))))));



COMMENT ON POLICY "device_movements_insert_pilot_completion_return_scope" ON "public"."device_movements" IS 'Allows authorized pilot completion roles to record a Returned movement for the completed pilot device.';



CREATE POLICY "device_movements_select_agronomist_secondary_ra" ON "public"."device_movements" FOR SELECT TO "authenticated" USING (("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "device_movements"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("fl"."created_by_user_id"))))));



CREATE POLICY "device_movements_select_phase2_scope" ON "public"."device_movements" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR ("created_by_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "device_movements"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND (("fl"."owner_user_id" = "public"."get_current_user_id"()) OR ("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))))) OR (EXISTS ( SELECT 1
   FROM "public"."installations" "i"
  WHERE (("i"."id" = "device_movements"."installation_id") AND ("i"."deleted_at" IS NULL) AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"()))))))) OR (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "device_movements"."pilot_id") AND ("p"."deleted_at" IS NULL) AND (("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"()) OR ("p"."agronomist_user_id" = "public"."get_current_user_id"()) OR ("p"."rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "p"."research_assistant_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))))))))));



COMMENT ON POLICY "device_movements_select_phase2_scope" ON "public"."device_movements" IS 'Phase 2 draft device movement read scope for operational users plus linked farmer, installation, and pilot access.';



CREATE POLICY "device_movements_update_phase2_scope" ON "public"."device_movements" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_stock_dispatch"())) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_stock_dispatch"()));



COMMENT ON POLICY "device_movements_update_phase2_scope" ON "public"."device_movements" IS 'Phase 2 draft movement update is limited to Admin, Sales Head, and Stock / Dispatch. Historical performed-by fields should remain app-protected.';



ALTER TABLE "public"."device_status_update_tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_status_update_tasks_insert_field_team" ON "public"."device_status_update_tasks" FOR INSERT TO "authenticated" WITH CHECK ((("requested_by_user_id" = "public"."get_current_user_id"()) AND ("public"."is_admin"() OR "public"."is_rd_head"() OR "public"."is_agronomist"() OR "public"."is_research_assistant"())));



CREATE POLICY "device_status_update_tasks_insert_management_pilot_completion" ON "public"."device_status_update_tasks" FOR INSERT TO "authenticated" WITH CHECK ((("requested_by_user_id" = "public"."get_current_user_id"()) AND "public"."is_management"()));



COMMENT ON POLICY "device_status_update_tasks_insert_management_pilot_completion" ON "public"."device_status_update_tasks" IS 'Allows Management to create the Stock/Dispatch verification task generated during pilot completion.';



CREATE POLICY "device_status_update_tasks_select_scope" ON "public"."device_status_update_tasks" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR "public"."is_agronomist"() OR "public"."is_research_assistant"() OR "public"."is_stock_dispatch"() OR "public"."is_viewer"() OR ("requested_by_user_id" = "public"."get_current_user_id"())));



CREATE POLICY "device_status_update_tasks_update_stock" ON "public"."device_status_update_tasks" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_stock_dispatch"())) WITH CHECK (("public"."is_admin"() OR "public"."is_stock_dispatch"()));



ALTER TABLE "public"."devices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "devices_insert_stock_accounts" ON "public"."devices" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"()));



COMMENT ON POLICY "devices_insert_stock_accounts" ON "public"."devices" IS 'Admin, Accounts, and Stock / Dispatch can create device stock records.';



CREATE POLICY "devices_select_agronomist_all" ON "public"."devices" FOR SELECT TO "authenticated" USING ("public"."is_agronomist"());



COMMENT ON POLICY "devices_select_agronomist_all" ON "public"."devices" IS 'Allows Agronomist users to read all devices. Device write access remains limited to Admin, Accounts, and Stock / Dispatch app/RLS rules.';



CREATE POLICY "devices_select_agronomist_secondary_ra_links" ON "public"."devices" FOR SELECT TO "authenticated" USING (("public"."is_agronomist"() AND ((EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "devices"."linked_farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("fl"."created_by_user_id")))) OR (EXISTS ( SELECT 1
   FROM ("public"."installations" "i"
     JOIN "public"."farmer_leads" "fl" ON (("fl"."id" = "i"."farmer_lead_id")))
  WHERE ((("i"."id" = "devices"."linked_installation_id") OR ("i"."device_id" = "devices"."id")) AND ("i"."deleted_at" IS NULL) AND ("fl"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("fl"."created_by_user_id")))))));



CREATE POLICY "devices_select_internal_scope" ON "public"."devices" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND ((EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "devices"."linked_farmer_lead_id") AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."dealers" "d"
  WHERE (("d"."id" = "devices"."linked_dealer_id") AND (("d"."rsm_user_id" = "public"."get_current_user_id"()) OR ("d"."region_id" = "public"."current_region_id"()) OR ("d"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."installations" "i"
  WHERE (("i"."device_id" = "devices"."id") AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."dispatches" "dp"
  WHERE (("dp"."device_id" = "devices"."id") AND ("dp"."destination_state" = "public"."current_state"())))) OR (EXISTS ( SELECT 1
   FROM "public"."dispatches" "dp"
  WHERE (("dp"."id" = "devices"."linked_dispatch_id") AND ("dp"."destination_state" = "public"."current_state"())))) OR (("device_status" = ANY (ARRAY['In Warehouse'::"public"."device_status", 'Reserved'::"public"."device_status"])) AND ("current_holder_type" = 'Warehouse'::"public"."holder_type") AND ("linked_installation_id" IS NULL) AND (("current_state" = "public"."current_state"()) OR ("current_state" IS NULL))))) OR ("public"."is_agronomist"() AND ((EXISTS ( SELECT 1
   FROM ("public"."farmer_leads" "fl"
     JOIN "public"."users" "u" ON (("u"."id" = "fl"."created_by_user_id")))
  WHERE (("fl"."id" = "devices"."linked_farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))) OR (EXISTS ( SELECT 1
   FROM (("public"."installations" "i"
     JOIN "public"."farmer_leads" "fl" ON (("fl"."id" = "i"."farmer_lead_id")))
     JOIN "public"."users" "u" ON (("u"."id" = "fl"."created_by_user_id")))
  WHERE ((("i"."id" = "devices"."linked_installation_id") OR ("i"."device_id" = "devices"."id")) AND ("i"."deleted_at" IS NULL) AND ("fl"."deleted_at" IS NULL) AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE))))))));



COMMENT ON POLICY "devices_select_internal_scope" ON "public"."devices" IS 'Phase 1 device read scope. Adds RSM read access to unlinked warehouse/reserved devices in the RSM current state so regional installation workflows can select clean stock.';



CREATE POLICY "devices_update_pilot_completion_return_scope" ON "public"."devices" FOR UPDATE TO "authenticated" USING ((("public"."is_admin"() OR "public"."is_management"() OR "public"."is_rd_head"() OR "public"."is_agronomist"() OR "public"."is_research_assistant"()) AND (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "devices"."linked_pilot_id") AND ("p"."deleted_at" IS NULL) AND ("public"."is_admin"() OR "public"."is_management"() OR "public"."is_rd_head"() OR "public"."is_agronomist"() OR ("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"()))))))) WITH CHECK (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_rd_head"() OR "public"."is_agronomist"() OR "public"."is_research_assistant"()));



COMMENT ON POLICY "devices_update_pilot_completion_return_scope" ON "public"."devices" IS 'Allows authorized pilot completion roles to return a linked pilot device to warehouse. App server actions restrict the exact fields and completion transition.';



CREATE POLICY "devices_update_stock_accounts" ON "public"."devices" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR "public"."is_rsm"())) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND ((EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "devices"."linked_farmer_lead_id") AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."dealers" "d"
  WHERE (("d"."id" = "devices"."linked_dealer_id") AND (("d"."rsm_user_id" = "public"."get_current_user_id"()) OR ("d"."region_id" = "public"."current_region_id"()) OR ("d"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."installations" "i"
  WHERE (("i"."device_id" = "devices"."id") AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."dispatches" "dp"
  WHERE (("dp"."device_id" = "devices"."id") AND ("dp"."destination_state" = "public"."current_state"())))) OR (EXISTS ( SELECT 1
   FROM "public"."dispatches" "dp"
  WHERE (("dp"."id" = "devices"."linked_dispatch_id") AND ("dp"."destination_state" = "public"."current_state"()))))))));



COMMENT ON POLICY "devices_update_stock_accounts" ON "public"."devices" IS 'Admin, Sales Head, Accounts, Stock / Dispatch, and RSM can target device updates. RSM rows must remain region-linked after update, which keeps installation side effects from being blocked while detailed field restrictions remain in the app.';



ALTER TABLE "public"."dispatches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dispatches_insert_accounts_stock" ON "public"."dispatches" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"()));



COMMENT ON POLICY "dispatches_insert_accounts_stock" ON "public"."dispatches" IS 'Admin, Accounts, and Stock / Dispatch can create dispatch rows.';



CREATE POLICY "dispatches_select_agronomist_secondary_ra_links" ON "public"."dispatches" FOR SELECT TO "authenticated" USING (("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = ANY (ARRAY["dispatches"."linked_farmer_lead_id", "dispatches"."destination_farmer_lead_id"])) AND ("fl"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("fl"."created_by_user_id"))))));



CREATE POLICY "dispatches_select_internal_scope" ON "public"."dispatches" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_rd_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR "public"."is_sales_head"() OR ("public"."is_rsm"() AND (("destination_state" = "public"."current_state"()) OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = ANY (ARRAY["dispatches"."linked_farmer_lead_id", "dispatches"."destination_farmer_lead_id"])) AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."dealers" "d"
  WHERE (("d"."id" = ANY (ARRAY["dispatches"."linked_dealer_id", "dispatches"."destination_dealer_id"])) AND (("d"."rsm_user_id" = "public"."get_current_user_id"()) OR ("d"."region_id" = "public"."current_region_id"()) OR ("d"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."installations" "i"
  WHERE (("i"."id" = "dispatches"."linked_installation_id") AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"()))))))) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM ("public"."farmer_leads" "fl"
     JOIN "public"."users" "u" ON (("u"."id" = "fl"."created_by_user_id")))
  WHERE (("fl"."id" = ANY (ARRAY["dispatches"."linked_farmer_lead_id", "dispatches"."destination_farmer_lead_id"])) AND ("fl"."deleted_at" IS NULL) AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))))));



COMMENT ON POLICY "dispatches_select_internal_scope" ON "public"."dispatches" IS 'Safe Phase 1 dispatch read scope adds R&D Head read and Agronomist read through Research Assistant team-created linked/destination farmer leads.';



CREATE POLICY "dispatches_update_accounts_stock" ON "public"."dispatches" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"())) WITH CHECK (("public"."is_admin"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"()));



COMMENT ON POLICY "dispatches_update_accounts_stock" ON "public"."dispatches" IS 'Accounts and Stock / Dispatch can update dispatch rows. Payment/logistics field restrictions remain in the app for now.';



ALTER TABLE "public"."farmer_lead_followups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "farmer_lead_followups_insert_scope" ON "public"."farmer_lead_followups" FOR INSERT TO "authenticated" WITH CHECK ((("deleted_at" IS NULL) AND ("followed_up_by_user_id" = "public"."get_current_user_id"()) AND ("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "farmer_lead_followups"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"())))))) OR ("public"."is_salesperson"() AND (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "farmer_lead_followups"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND ("fl"."owner_user_id" = "public"."get_current_user_id"()))))) OR ("public"."is_research_assistant"() AND (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "farmer_lead_followups"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND ("fl"."created_by_user_id" = "public"."get_current_user_id"()))))))));



COMMENT ON POLICY "farmer_lead_followups_insert_scope" ON "public"."farmer_lead_followups" IS 'Users who can manage the linked Farmer Lead can append follow-up snapshots. Past follow-ups are read-only in Phase 1.';



CREATE POLICY "farmer_lead_followups_select_scope" ON "public"."farmer_lead_followups" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "farmer_lead_followups"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL))))));



COMMENT ON POLICY "farmer_lead_followups_select_scope" ON "public"."farmer_lead_followups" IS 'Past Farmer Lead follow-ups are readable when the user can read the linked Farmer Lead under existing Farmer Lead RLS.';



ALTER TABLE "public"."farmer_leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "farmer_leads_insert_internal_scope" ON "public"."farmer_leads" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR ("public"."is_stock_dispatch"() AND ("created_by_user_id" = "public"."get_current_user_id"()) AND (("owner_user_id" IS NULL) OR ("owner_user_id" <> "public"."get_current_user_id"()))) OR ("public"."is_rsm"() AND ("created_by_user_id" = "public"."get_current_user_id"()) AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND ("created_by_user_id" = "public"."get_current_user_id"()) AND ("owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_research_assistant"() AND ("created_by_user_id" = "public"."get_current_user_id"()) AND (("owner_user_id" IS NULL) OR ("owner_user_id" <> "public"."get_current_user_id"())))));



COMMENT ON POLICY "farmer_leads_insert_internal_scope" ON "public"."farmer_leads" IS 'Safe Phase 1 lead insert allows Customer Service Team to create leads assigned to another owner, while preserving existing Admin/Sales Head/RSM/Salesperson/Research Assistant rules.';



CREATE POLICY "farmer_leads_select_agronomist_all" ON "public"."farmer_leads" FOR SELECT TO "authenticated" USING ("public"."is_agronomist"());



COMMENT ON POLICY "farmer_leads_select_agronomist_all" ON "public"."farmer_leads" IS 'Allows Agronomist users to read all farmer leads. Agronomist write rules remain unchanged.';



CREATE POLICY "farmer_leads_select_agronomist_secondary_ra" ON "public"."farmer_leads" FOR SELECT TO "authenticated" USING (("public"."is_agronomist"() AND "public"."research_assistant_reports_to_current_user"("created_by_user_id")));



CREATE POLICY "farmer_leads_select_internal_scope" ON "public"."farmer_leads" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND ("owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_research_assistant"() AND ("created_by_user_id" = "public"."get_current_user_id"())) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "farmer_leads"."created_by_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))))));



COMMENT ON POLICY "farmer_leads_select_internal_scope" ON "public"."farmer_leads" IS 'Safe Phase 1 lead read scope: broad leadership/ops/R&D read, regional RSM read, owner/creator read, and Agronomist read for Research Assistant team-created leads.';



CREATE POLICY "farmer_leads_select_research_assistant_pilot_geography" ON "public"."farmer_leads" FOR SELECT TO "authenticated" USING ((("public"."get_current_user_role"() = 'Research Assistant'::"text") AND ("deleted_at" IS NULL) AND (COALESCE(("lead_status")::"text", ''::"text") <> ALL (ARRAY['Lost'::"text", 'Dropped'::"text", 'Parked'::"text"])) AND (COALESCE(("funnel_stage")::"text", ''::"text") <> ALL (ARRAY['Lost'::"text", 'Dropped'::"text", 'Parked'::"text"])) AND (("region_id" = "public"."current_region_id"()) OR ("lower"(COALESCE("state", ''::"text")) = "lower"(COALESCE("public"."current_state"(), ''::"text"))))));



COMMENT ON POLICY "farmer_leads_select_research_assistant_pilot_geography" ON "public"."farmer_leads" IS 'Allows Research Assistants to read non-deleted, non-lost Farmer Leads in their assigned state/region for Pilot creation. App/server logic still excludes leads already linked to another active pilot.';



CREATE POLICY "farmer_leads_update_internal_scope" ON "public"."farmer_leads" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND ("owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_research_assistant"() AND ("created_by_user_id" = "public"."get_current_user_id"())))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND ("owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_research_assistant"() AND ("created_by_user_id" = "public"."get_current_user_id"()))));



COMMENT ON POLICY "farmer_leads_update_internal_scope" ON "public"."farmer_leads" IS 'Lead update is role-scoped. Accounts and Stock / Dispatch are allowed broadly so app-level payment/install side effects can update the allowed fields.';



CREATE POLICY "farmer_leads_update_pilot_completion_followup_scope" ON "public"."farmer_leads" FOR UPDATE TO "authenticated" USING ("public"."can_current_user_update_farmer_lead_for_pilot_completion"("id")) WITH CHECK ("public"."can_current_user_update_farmer_lead_for_pilot_completion"("id"));



COMMENT ON POLICY "farmer_leads_update_pilot_completion_followup_scope" ON "public"."farmer_leads" IS 'Allows authorized pilot workflow roles to update the linked farmer lead without recursively querying pilots from inside farmer_leads RLS.';



CREATE POLICY "farmer_leads_update_pilot_creator_sync" ON "public"."farmer_leads" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "farmer_leads"."linked_pilot_id") AND ("p"."farmer_lead_id" = "farmer_leads"."id") AND ("p"."created_by_user_id" = "public"."get_current_user_id"()) AND ("p"."deleted_at" IS NULL))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "farmer_leads"."linked_pilot_id") AND ("p"."farmer_lead_id" = "farmer_leads"."id") AND ("p"."created_by_user_id" = "public"."get_current_user_id"()) AND ("p"."deleted_at" IS NULL)))));



COMMENT ON POLICY "farmer_leads_update_pilot_creator_sync" ON "public"."farmer_leads" IS 'Allows a pilot creator to synchronize only the Farmer Lead attached to that newly created pilot.';



ALTER TABLE "public"."followups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "followups_insert_internal_scope" ON "public"."followups" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (("followup_owner_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."installations" "i"
  WHERE (("i"."id" = "followups"."installation_id") AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"()))))))) OR (("public"."is_salesperson"() OR "public"."is_research_assistant"()) AND ("followup_owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_agronomist"() AND (("followup_owner_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "followups"."followup_owner_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE))))))));



COMMENT ON POLICY "followups_insert_internal_scope" ON "public"."followups" IS 'Follow-up insert supports app-created follow-ups, including installation-created 15-day follow-ups.';



CREATE POLICY "followups_select_agronomist_all" ON "public"."followups" FOR SELECT TO "authenticated" USING ("public"."is_agronomist"());



COMMENT ON POLICY "followups_select_agronomist_all" ON "public"."followups" IS 'Allows Agronomist users to read all post-installation follow-ups. Follow-up write rules remain unchanged.';



CREATE POLICY "followups_select_agronomist_secondary_ra_links" ON "public"."followups" FOR SELECT TO "authenticated" USING (("public"."is_agronomist"() AND ("public"."research_assistant_reports_to_current_user"("followup_owner_user_id") OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("fl"."created_by_user_id")))))));



CREATE POLICY "followups_select_internal_scope" ON "public"."followups" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("public"."is_rsm"() AND ((EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."installations" "i"
  WHERE (("i"."id" = "followups"."installation_id") AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"()))))))) OR ("public"."is_salesperson"() AND (("followup_owner_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND ("fl"."owner_user_id" = "public"."get_current_user_id"())))))) OR ("public"."is_research_assistant"() AND ("followup_owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_agronomist"() AND (("followup_owner_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "followups"."followup_owner_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))) OR (EXISTS ( SELECT 1
   FROM ("public"."farmer_leads" "fl"
     JOIN "public"."users" "u" ON (("u"."id" = "fl"."created_by_user_id")))
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE))))))));



COMMENT ON POLICY "followups_select_internal_scope" ON "public"."followups" IS 'Safe Phase 1 follow-up read scope adds R&D Head read, Salesperson owned-lead followups, and Agronomist direct/team/team-lead followups.';



CREATE POLICY "followups_update_agronomist_secondary_ra_links" ON "public"."followups" FOR UPDATE TO "authenticated" USING (("public"."is_agronomist"() AND ("public"."research_assistant_reports_to_current_user"("followup_owner_user_id") OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("fl"."created_by_user_id"))))))) WITH CHECK (("public"."is_agronomist"() AND ("public"."research_assistant_reports_to_current_user"("followup_owner_user_id") OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("fl"."created_by_user_id")))))));



CREATE POLICY "followups_update_internal_scope" ON "public"."followups" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR ("public"."is_rsm"() AND ((EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."installations" "i"
  WHERE (("i"."id" = "followups"."installation_id") AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"()))))))) OR ("public"."is_salesperson"() AND (("followup_owner_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND ("fl"."owner_user_id" = "public"."get_current_user_id"())))))) OR ("public"."is_research_assistant"() AND ("followup_owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_agronomist"() AND (("followup_owner_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "followups"."followup_owner_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))) OR (EXISTS ( SELECT 1
   FROM ("public"."farmer_leads" "fl"
     JOIN "public"."users" "u" ON (("u"."id" = "fl"."created_by_user_id")))
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))))))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR ("public"."is_rsm"() AND ((EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."installations" "i"
  WHERE (("i"."id" = "followups"."installation_id") AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"()))))))) OR ("public"."is_salesperson"() AND (("followup_owner_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND ("fl"."owner_user_id" = "public"."get_current_user_id"())))))) OR ("public"."is_research_assistant"() AND ("followup_owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_agronomist"() AND (("followup_owner_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "followups"."followup_owner_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))) OR (EXISTS ( SELECT 1
   FROM ("public"."farmer_leads" "fl"
     JOIN "public"."users" "u" ON (("u"."id" = "fl"."created_by_user_id")))
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE))))))));



COMMENT ON POLICY "followups_update_internal_scope" ON "public"."followups" IS 'Safe Phase 1 follow-up update scope allows Admin/Sales Head, regional RSM, assigned Research Assistant, Salesperson owned-lead followups, and Agronomist direct/team/team-lead followups.';



ALTER TABLE "public"."installations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "installations_insert_internal_scope" ON "public"."installations" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"())))));



COMMENT ON POLICY "installations_insert_internal_scope" ON "public"."installations" IS 'Installations can be created by Admin, Sales Head, Stock / Dispatch, or regional RSM. Salesperson creation is deferred because installation side effects update devices.';



CREATE POLICY "installations_select_agronomist_all" ON "public"."installations" FOR SELECT TO "authenticated" USING ("public"."is_agronomist"());



COMMENT ON POLICY "installations_select_agronomist_all" ON "public"."installations" IS 'Allows Agronomist users to read all installations. Installation write rules remain unchanged.';



CREATE POLICY "installations_select_agronomist_secondary_ra_links" ON "public"."installations" FOR SELECT TO "authenticated" USING (("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "installations"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("fl"."created_by_user_id"))))));



CREATE POLICY "installations_select_internal_scope" ON "public"."installations" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "installations"."farmer_lead_id") AND ("fl"."owner_user_id" = "public"."get_current_user_id"()))))) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM ("public"."farmer_leads" "fl"
     JOIN "public"."users" "u" ON (("u"."id" = "fl"."created_by_user_id")))
  WHERE (("fl"."id" = "installations"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))))));



COMMENT ON POLICY "installations_select_internal_scope" ON "public"."installations" IS 'Safe Phase 1 installation read scope adds R&D Head read and Agronomist read through Research Assistant team-created farmer leads.';



CREATE POLICY "installations_update_internal_scope" ON "public"."installations" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"())))));



COMMENT ON POLICY "installations_update_internal_scope" ON "public"."installations" IS 'Installation update is limited to Admin, Sales Head, Stock / Dispatch, and regional RSM for v1 because installed-status side effects update devices.';



ALTER TABLE "public"."institution_contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "institution_contacts_insert_phase2_scope" ON "public"."institution_contacts" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR (("created_by_user_id" = "public"."get_current_user_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."institutions" "i"
  WHERE (("i"."id" = "institution_contacts"."institution_id") AND ("i"."deleted_at" IS NULL) AND (("i"."account_owner_user_id" = "public"."get_current_user_id"()) OR ("i"."sales_head_user_id" = "public"."get_current_user_id"()) OR ("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."rd_head_user_id" = "public"."get_current_user_id"()) OR ("i"."technical_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("i"."primary_region_id" = "public"."current_region_id"()) OR ("i"."primary_state" = "public"."current_state"()))))))))));



COMMENT ON POLICY "institution_contacts_insert_phase2_scope" ON "public"."institution_contacts" IS 'Phase 2 draft contact creation follows institution access.';



CREATE POLICY "institution_contacts_select_phase2_scope" ON "public"."institution_contacts" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("created_by_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."institutions" "i"
  WHERE (("i"."id" = "institution_contacts"."institution_id") AND ("i"."deleted_at" IS NULL) AND (("i"."account_owner_user_id" = "public"."get_current_user_id"()) OR ("i"."sales_head_user_id" = "public"."get_current_user_id"()) OR ("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."rd_head_user_id" = "public"."get_current_user_id"()) OR ("i"."technical_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("i"."primary_region_id" = "public"."current_region_id"()) OR ("i"."primary_state" = "public"."current_state"())))))))));



COMMENT ON POLICY "institution_contacts_select_phase2_scope" ON "public"."institution_contacts" IS 'Phase 2 draft contact read scope follows institution access.';



CREATE POLICY "institution_contacts_update_phase2_scope" ON "public"."institution_contacts" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR (EXISTS ( SELECT 1
   FROM "public"."institutions" "i"
  WHERE (("i"."id" = "institution_contacts"."institution_id") AND ("i"."deleted_at" IS NULL) AND (("i"."account_owner_user_id" = "public"."get_current_user_id"()) OR ("i"."sales_head_user_id" = "public"."get_current_user_id"()) OR ("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."rd_head_user_id" = "public"."get_current_user_id"()) OR ("i"."technical_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("i"."primary_region_id" = "public"."current_region_id"()) OR ("i"."primary_state" = "public"."current_state"()))))))))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR (EXISTS ( SELECT 1
   FROM "public"."institutions" "i"
  WHERE (("i"."id" = "institution_contacts"."institution_id") AND ("i"."deleted_at" IS NULL) AND (("i"."account_owner_user_id" = "public"."get_current_user_id"()) OR ("i"."sales_head_user_id" = "public"."get_current_user_id"()) OR ("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."rd_head_user_id" = "public"."get_current_user_id"()) OR ("i"."technical_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("i"."primary_region_id" = "public"."current_region_id"()) OR ("i"."primary_state" = "public"."current_state"())))))))));



COMMENT ON POLICY "institution_contacts_update_phase2_scope" ON "public"."institution_contacts" IS 'Phase 2 draft contact update follows institution access.';



ALTER TABLE "public"."institution_meetings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "institution_meetings_insert_phase2_scope" ON "public"."institution_meetings" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR (("created_by_user_id" = "public"."get_current_user_id"()) AND (("primary_internal_owner_user_id" = "public"."get_current_user_id"()) OR ("rsm_user_id" = "public"."get_current_user_id"()) OR ("sales_head_user_id" = "public"."get_current_user_id"()) OR ("rd_head_user_id" = "public"."get_current_user_id"()) OR ("agronomist_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."institutions" "i"
  WHERE (("i"."id" = "institution_meetings"."institution_id") AND ("i"."deleted_at" IS NULL) AND (("i"."account_owner_user_id" = "public"."get_current_user_id"()) OR ("i"."sales_head_user_id" = "public"."get_current_user_id"()) OR ("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."rd_head_user_id" = "public"."get_current_user_id"()) OR ("i"."technical_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("i"."primary_region_id" = "public"."current_region_id"()) OR ("i"."primary_state" = "public"."current_state"())))))))))));



COMMENT ON POLICY "institution_meetings_insert_phase2_scope" ON "public"."institution_meetings" IS 'Phase 2 draft meeting creation follows assigned meeting ownership or institution access.';



CREATE POLICY "institution_meetings_select_phase2_scope" ON "public"."institution_meetings" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("created_by_user_id" = "public"."get_current_user_id"()) OR ("primary_internal_owner_user_id" = "public"."get_current_user_id"()) OR ("rsm_user_id" = "public"."get_current_user_id"()) OR ("sales_head_user_id" = "public"."get_current_user_id"()) OR ("rd_head_user_id" = "public"."get_current_user_id"()) OR ("agronomist_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."institutions" "i"
  WHERE (("i"."id" = "institution_meetings"."institution_id") AND ("i"."deleted_at" IS NULL) AND (("i"."account_owner_user_id" = "public"."get_current_user_id"()) OR ("i"."sales_head_user_id" = "public"."get_current_user_id"()) OR ("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."rd_head_user_id" = "public"."get_current_user_id"()) OR ("i"."technical_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("i"."primary_region_id" = "public"."current_region_id"()) OR ("i"."primary_state" = "public"."current_state"())))))))));



COMMENT ON POLICY "institution_meetings_select_phase2_scope" ON "public"."institution_meetings" IS 'Phase 2 draft meeting read scope for assigned internal owners and users with institution access.';



CREATE POLICY "institution_meetings_update_phase2_scope" ON "public"."institution_meetings" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("primary_internal_owner_user_id" = "public"."get_current_user_id"()) OR ("rsm_user_id" = "public"."get_current_user_id"()) OR ("sales_head_user_id" = "public"."get_current_user_id"()) OR ("agronomist_user_id" = "public"."get_current_user_id"()))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("primary_internal_owner_user_id" = "public"."get_current_user_id"()) OR ("rsm_user_id" = "public"."get_current_user_id"()) OR ("sales_head_user_id" = "public"."get_current_user_id"()) OR ("agronomist_user_id" = "public"."get_current_user_id"())));



COMMENT ON POLICY "institution_meetings_update_phase2_scope" ON "public"."institution_meetings" IS 'Phase 2 draft meeting update scope for leadership and assigned internal owners.';



ALTER TABLE "public"."institutions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "institutions_insert_phase2_scope" ON "public"."institutions" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("public"."is_agronomist"() AND ("created_by_user_id" = "public"."get_current_user_id"()) AND (("technical_owner_user_id" = "public"."get_current_user_id"()) OR ("account_owner_user_id" = "public"."get_current_user_id"()) OR ("sales_head_user_id" = "public"."get_current_user_id"()))) OR ("public"."is_rsm"() AND ("created_by_user_id" = "public"."get_current_user_id"()) AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("primary_region_id" = "public"."current_region_id"()) OR ("primary_state" = "public"."current_state"())))));



COMMENT ON POLICY "institutions_insert_phase2_scope" ON "public"."institutions" IS 'Institution creation for Admin, Sales Head, R&D Head, Agronomist-owned records, and regional RSM.';



CREATE POLICY "institutions_select_agronomist_all" ON "public"."institutions" FOR SELECT TO "authenticated" USING ("public"."is_agronomist"());



COMMENT ON POLICY "institutions_select_agronomist_all" ON "public"."institutions" IS 'Allows Agronomists to read institution options for pilot workflows without granting write access.';



CREATE POLICY "institutions_select_hr_legal" ON "public"."institutions" FOR SELECT TO "authenticated" USING ("public"."is_hr_legal"());



CREATE POLICY "institutions_select_phase2_scope" ON "public"."institutions" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("account_owner_user_id" = "public"."get_current_user_id"()) OR ("sales_head_user_id" = "public"."get_current_user_id"()) OR ("rsm_user_id" = "public"."get_current_user_id"()) OR ("rd_head_user_id" = "public"."get_current_user_id"()) OR ("technical_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("primary_region_id" = "public"."current_region_id"()) OR ("primary_state" = "public"."current_state"())))));



COMMENT ON POLICY "institutions_select_phase2_scope" ON "public"."institutions" IS 'Phase 2 draft institution read scope for leadership, assigned owners, RSM regional/state scope, and R&D visibility.';



CREATE POLICY "institutions_update_hr_legal" ON "public"."institutions" FOR UPDATE TO "authenticated" USING ("public"."is_hr_legal"()) WITH CHECK ("public"."is_hr_legal"());



CREATE POLICY "institutions_update_phase2_scope" ON "public"."institutions" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("account_owner_user_id" = "public"."get_current_user_id"()) OR ("sales_head_user_id" = "public"."get_current_user_id"()) OR ("technical_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("primary_region_id" = "public"."current_region_id"()) OR ("primary_state" = "public"."current_state"()))))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("account_owner_user_id" = "public"."get_current_user_id"()) OR ("sales_head_user_id" = "public"."get_current_user_id"()) OR ("technical_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("primary_region_id" = "public"."current_region_id"()) OR ("primary_state" = "public"."current_state"())))));



COMMENT ON POLICY "institutions_update_phase2_scope" ON "public"."institutions" IS 'Phase 2 draft institution update scope. Detailed field restrictions remain in the app.';



ALTER TABLE "public"."kpi_dashboard_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "kpi_dashboard_cache_insert_leadership" ON "public"."kpi_dashboard_cache" FOR INSERT WITH CHECK (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"()));



CREATE POLICY "kpi_dashboard_cache_select_active" ON "public"."kpi_dashboard_cache" FOR SELECT USING (("public"."get_current_user_id"() IS NOT NULL));



CREATE POLICY "kpi_dashboard_cache_update_leadership" ON "public"."kpi_dashboard_cache" FOR UPDATE USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"())) WITH CHECK (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"()));



ALTER TABLE "public"."kpi_dashboard_dirty_flags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "kpi_dashboard_dirty_flags_insert_leadership" ON "public"."kpi_dashboard_dirty_flags" FOR INSERT WITH CHECK (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"()));



CREATE POLICY "kpi_dashboard_dirty_flags_select_active" ON "public"."kpi_dashboard_dirty_flags" FOR SELECT USING (("public"."get_current_user_id"() IS NOT NULL));



CREATE POLICY "kpi_dashboard_dirty_flags_update_leadership" ON "public"."kpi_dashboard_dirty_flags" FOR UPDATE USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"())) WITH CHECK (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"()));



ALTER TABLE "public"."kpi_dashboard_refresh_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "kpi_dashboard_refresh_log_insert_leadership" ON "public"."kpi_dashboard_refresh_log" FOR INSERT WITH CHECK (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"()));



CREATE POLICY "kpi_dashboard_refresh_log_select_active" ON "public"."kpi_dashboard_refresh_log" FOR SELECT USING (("public"."get_current_user_id"() IS NOT NULL));



CREATE POLICY "kpi_dashboard_refresh_log_update_leadership" ON "public"."kpi_dashboard_refresh_log" FOR UPDATE USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"())) WITH CHECK (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"()));



ALTER TABLE "public"."marketing_request_updates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "marketing_request_updates_insert_scope" ON "public"."marketing_request_updates" FOR INSERT TO "authenticated" WITH CHECK ((("created_by_user_id" = "public"."get_current_user_id"()) AND (NOT "public"."is_viewer"()) AND (EXISTS ( SELECT 1
   FROM "public"."marketing_requests" "mr"
  WHERE (("mr"."id" = "marketing_request_updates"."marketing_request_id") AND ("mr"."deleted_at" IS NULL) AND ("public"."is_admin"() OR "public"."is_management"() OR "public"."is_marketing_head"() OR ("mr"."requested_by_user_id" = "public"."get_current_user_id"()) OR ("mr"."assigned_to_user_id" = "public"."get_current_user_id"()) OR ("mr"."marketing_head_user_id" = "public"."get_current_user_id"())))))));



CREATE POLICY "marketing_request_updates_select_scope" ON "public"."marketing_request_updates" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."marketing_requests" "mr"
  WHERE (("mr"."id" = "marketing_request_updates"."marketing_request_id") AND ("mr"."deleted_at" IS NULL) AND ("public"."is_admin"() OR "public"."is_management"() OR "public"."is_marketing_head"() OR ("mr"."requested_by_user_id" = "public"."get_current_user_id"()) OR ("mr"."assigned_to_user_id" = "public"."get_current_user_id"()) OR ("mr"."marketing_head_user_id" = "public"."get_current_user_id"()))))));



ALTER TABLE "public"."marketing_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "marketing_requests_insert_scope" ON "public"."marketing_requests" FOR INSERT TO "authenticated" WITH CHECK ((("deleted_at" IS NULL) AND ("requested_by_user_id" = "public"."get_current_user_id"()) AND ("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rsm"() OR "public"."is_salesperson"() OR "public"."is_agronomist"() OR "public"."is_research_assistant"() OR "public"."is_rd_head"() OR "public"."is_marketing_head"() OR "public"."is_designer"())));



CREATE POLICY "marketing_requests_select_scope" ON "public"."marketing_requests" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND ("public"."is_admin"() OR "public"."is_management"() OR "public"."is_marketing_head"() OR ("requested_by_user_id" = "public"."get_current_user_id"()) OR ("assigned_to_user_id" = "public"."get_current_user_id"()) OR ("marketing_head_user_id" = "public"."get_current_user_id"()))));



CREATE POLICY "marketing_requests_update_scope" ON "public"."marketing_requests" FOR UPDATE TO "authenticated" USING ((("deleted_at" IS NULL) AND ("public"."is_admin"() OR "public"."is_management"() OR "public"."is_marketing_head"() OR ("assigned_to_user_id" = "public"."get_current_user_id"()) OR (("requested_by_user_id" = "public"."get_current_user_id"()) AND ("marketing_status" = ANY (ARRAY['Requested'::"public"."marketing_request_status", 'Needs Clarification'::"public"."marketing_request_status"])))))) WITH CHECK ((("deleted_at" IS NULL) AND ("public"."is_admin"() OR "public"."is_management"() OR "public"."is_marketing_head"() OR ("assigned_to_user_id" = "public"."get_current_user_id"()) OR (("requested_by_user_id" = "public"."get_current_user_id"()) AND ("marketing_status" = ANY (ARRAY['Requested'::"public"."marketing_request_status", 'Needs Clarification'::"public"."marketing_request_status"]))))));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_insert_authenticated_actor" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK ((("actor_user_id" IS NULL) OR ("actor_user_id" = "public"."get_current_user_id"())));



CREATE POLICY "notifications_select_own" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("recipient_user_id" = "public"."get_current_user_id"()));



CREATE POLICY "notifications_update_own_read_state" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("recipient_user_id" = "public"."get_current_user_id"())) WITH CHECK (("recipient_user_id" = "public"."get_current_user_id"()));



ALTER TABLE "public"."pilot_visits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pilot_visits_insert_phase2_scope" ON "public"."pilot_visits" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("visited_by_user_id" = "public"."get_current_user_id"()) OR ("accompanied_by_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "pilot_visits"."pilot_id") AND ("p"."deleted_at" IS NULL) AND (("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"()) OR ("p"."agronomist_user_id" = "public"."get_current_user_id"()) OR ("p"."rsm_user_id" = "public"."get_current_user_id"())))))));



COMMENT ON POLICY "pilot_visits_insert_phase2_scope" ON "public"."pilot_visits" IS 'Phase 2 draft pilot visit creation for leadership/R&D, assigned visit owners, and accessible pilot owners.';



CREATE POLICY "pilot_visits_select_agronomist_all" ON "public"."pilot_visits" FOR SELECT TO "authenticated" USING ("public"."is_agronomist"());



COMMENT ON POLICY "pilot_visits_select_agronomist_all" ON "public"."pilot_visits" IS 'Allows Agronomist users to read all pilot visits. Visit write rules remain unchanged.';



CREATE POLICY "pilot_visits_select_agronomist_secondary_ra" ON "public"."pilot_visits" FOR SELECT TO "authenticated" USING (("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "pilot_visits"."pilot_id") AND ("p"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("p"."research_assistant_user_id"))))));



CREATE POLICY "pilot_visits_select_phase2_scope" ON "public"."pilot_visits" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("visited_by_user_id" = "public"."get_current_user_id"()) OR ("accompanied_by_user_id" = "public"."get_current_user_id"()) OR ("rd_head_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "pilot_visits"."pilot_id") AND ("p"."deleted_at" IS NULL) AND (("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"()) OR ("p"."agronomist_user_id" = "public"."get_current_user_id"()) OR ("p"."rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("p"."region_id" = "public"."current_region_id"()) OR ("p"."state" = "public"."current_state"()))) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "p"."research_assistant_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))))))))));



COMMENT ON POLICY "pilot_visits_select_phase2_scope" ON "public"."pilot_visits" IS 'Phase 2 draft pilot visit read scope follows assigned visit owners or accessible pilots.';



CREATE POLICY "pilot_visits_update_agronomist_secondary_ra" ON "public"."pilot_visits" FOR UPDATE TO "authenticated" USING (("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "pilot_visits"."pilot_id") AND ("p"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("p"."research_assistant_user_id")))))) WITH CHECK (("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "pilot_visits"."pilot_id") AND ("p"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("p"."research_assistant_user_id"))))));



CREATE POLICY "pilot_visits_update_phase2_scope" ON "public"."pilot_visits" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("visited_by_user_id" = "public"."get_current_user_id"()) OR ("accompanied_by_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "pilot_visits"."pilot_id") AND ("p"."deleted_at" IS NULL) AND (("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"()) OR ("p"."agronomist_user_id" = "public"."get_current_user_id"()) OR ("p"."rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("p"."region_id" = "public"."current_region_id"()) OR ("p"."state" = "public"."current_state"()))) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "p"."research_assistant_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE))))))))))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("visited_by_user_id" = "public"."get_current_user_id"()) OR ("accompanied_by_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "pilot_visits"."pilot_id") AND ("p"."deleted_at" IS NULL) AND (("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"()) OR ("p"."agronomist_user_id" = "public"."get_current_user_id"()) OR ("p"."rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("p"."region_id" = "public"."current_region_id"()) OR ("p"."state" = "public"."current_state"()))) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "p"."research_assistant_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))))))))));



COMMENT ON POLICY "pilot_visits_update_phase2_scope" ON "public"."pilot_visits" IS 'Phase 2 draft pilot visit update scope for leadership/R&D, assigned visit users, and users with access to the linked pilot.';



ALTER TABLE "public"."pilots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pilots_insert_phase2_scope" ON "public"."pilots" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR (("created_by_user_id" = "public"."get_current_user_id"()) AND (("pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("research_assistant_user_id" = "public"."get_current_user_id"()) OR ("agronomist_user_id" = "public"."get_current_user_id"()) OR ("rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"())))))));



COMMENT ON POLICY "pilots_insert_phase2_scope" ON "public"."pilots" IS 'Phase 2 draft pilot creation for leadership/R&D and assigned field owners.';



CREATE POLICY "pilots_select_agronomist_all" ON "public"."pilots" FOR SELECT TO "authenticated" USING ("public"."is_agronomist"());



COMMENT ON POLICY "pilots_select_agronomist_all" ON "public"."pilots" IS 'Allows Agronomist users to read all pilots. Pilot write rules remain unchanged.';



CREATE POLICY "pilots_select_agronomist_secondary_ra" ON "public"."pilots" FOR SELECT TO "authenticated" USING (("public"."is_agronomist"() AND "public"."research_assistant_reports_to_current_user"("research_assistant_user_id")));



CREATE POLICY "pilots_select_phase2_scope" ON "public"."pilots" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("research_assistant_user_id" = "public"."get_current_user_id"()) OR ("agronomist_user_id" = "public"."get_current_user_id"()) OR ("rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()) OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "pilots"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))))) OR ("public"."is_salesperson"() AND (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "pilots"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND ("fl"."owner_user_id" = "public"."get_current_user_id"()))))) OR ("public"."is_research_assistant"() AND ("research_assistant_user_id" = "public"."get_current_user_id"())) OR ("public"."is_agronomist"() AND (("agronomist_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "pilots"."research_assistant_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE))))))));



COMMENT ON POLICY "pilots_select_phase2_scope" ON "public"."pilots" IS 'Phase 2 draft pilot read scope for leadership/R&D, assigned owners, RSM regional/state/lead scope, Salesperson owned-lead scope, and Agronomist managed/team pilots.';



CREATE POLICY "pilots_select_stock_dispatch_attached_dispatch_lookup" ON "public"."pilots" FOR SELECT TO "authenticated" USING (("public"."is_stock_dispatch"() AND ("deleted_at" IS NULL) AND (COALESCE(("pilot_status")::"text", ''::"text") <> ALL (ARRAY['Cancelled'::"text", 'Closed - Successful'::"text", 'Closed - Failed'::"text", 'Closed - Inconclusive'::"text"])) AND (EXISTS ( SELECT 1
   FROM "public"."dispatches" "d"
  WHERE (("d"."deleted_at" IS NULL) AND (("d"."dispatch_status")::"text" <> 'Cancelled'::"text") AND (("d"."linked_pilot_id" = "pilots"."id") OR ("d"."destination_pilot_id" = "pilots"."id")))))));



COMMENT ON POLICY "pilots_select_stock_dispatch_attached_dispatch_lookup" ON "public"."pilots" IS 'Allows Stock / Dispatch users to read active Pilots already attached to active Dispatch records they manage, so Dispatch edit forms can keep the linked Pilot selected without granting general Pilots module access.';



CREATE POLICY "pilots_select_stock_dispatch_dispatch_lookup" ON "public"."pilots" FOR SELECT TO "authenticated" USING (("public"."is_stock_dispatch"() AND ("deleted_at" IS NULL) AND (COALESCE(("pilot_status")::"text", ''::"text") <> ALL (ARRAY['Cancelled'::"text", 'Closed - Successful'::"text", 'Closed - Failed'::"text", 'Closed - Inconclusive'::"text"])) AND (NOT (EXISTS ( SELECT 1
   FROM "public"."dispatches" "d"
  WHERE (("d"."deleted_at" IS NULL) AND (("d"."dispatch_status")::"text" <> 'Cancelled'::"text") AND (("d"."linked_pilot_id" = "pilots"."id") OR ("d"."destination_pilot_id" = "pilots"."id"))))))));



COMMENT ON POLICY "pilots_select_stock_dispatch_dispatch_lookup" ON "public"."pilots" IS 'Allows Stock / Dispatch users to read active, not-yet-dispatched Pilot destination rows for Free Pilot dispatch creation only. App permissions still keep the Pilots module hidden and Pilot writes blocked.';



CREATE POLICY "pilots_update_agronomist_secondary_ra" ON "public"."pilots" FOR UPDATE TO "authenticated" USING (("public"."is_agronomist"() AND "public"."research_assistant_reports_to_current_user"("research_assistant_user_id"))) WITH CHECK (("public"."is_agronomist"() AND "public"."research_assistant_reports_to_current_user"("research_assistant_user_id")));



CREATE POLICY "pilots_update_management_completion_scope" ON "public"."pilots" FOR UPDATE TO "authenticated" USING ("public"."is_management"()) WITH CHECK ("public"."is_management"());



COMMENT ON POLICY "pilots_update_management_completion_scope" ON "public"."pilots" IS 'Allows Management to update pilots for completion review workflow. Detailed completion permissions remain enforced in app server actions.';



CREATE POLICY "pilots_update_phase2_scope" ON "public"."pilots" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("research_assistant_user_id" = "public"."get_current_user_id"()) OR ("agronomist_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("research_assistant_user_id" = "public"."get_current_user_id"()) OR ("agronomist_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"())))));



COMMENT ON POLICY "pilots_update_phase2_scope" ON "public"."pilots" IS 'Phase 2 draft pilot update scope. R&D Head approval and detailed status changes remain app-controlled.';



ALTER TABLE "public"."planned_pilot_visits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "planned_pilot_visits_delete_scope" ON "public"."planned_pilot_visits" FOR DELETE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_rd_head"() OR "public"."is_agronomist"()));



COMMENT ON POLICY "planned_pilot_visits_delete_scope" ON "public"."planned_pilot_visits" IS 'Agronomist, R&D Head, and Admin can delete pilot visit plans.';



CREATE POLICY "planned_pilot_visits_insert_scope" ON "public"."planned_pilot_visits" FOR INSERT WITH CHECK (("public"."is_admin"() OR "public"."is_rd_head"() OR "public"."is_agronomist"()));



COMMENT ON POLICY "planned_pilot_visits_insert_scope" ON "public"."planned_pilot_visits" IS 'Agronomist, R&D Head, and Admin can create pilot visit plans.';



CREATE POLICY "planned_pilot_visits_select_scope" ON "public"."planned_pilot_visits" FOR SELECT USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR "public"."is_agronomist"() OR "public"."is_viewer"() OR ("assigned_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "planned_pilot_visits"."pilot_id") AND (("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"()) OR ("p"."created_by_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("p"."rsm_user_id" = "public"."get_current_user_id"()) OR ("p"."region_id" = "public"."current_region_id"()) OR ("p"."state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND (EXISTS ( SELECT 1
           FROM "public"."farmer_leads" "fl"
          WHERE (("fl"."id" = "p"."farmer_lead_id") AND ("fl"."owner_user_id" = "public"."get_current_user_id"())))))))))));



COMMENT ON POLICY "planned_pilot_visits_select_scope" ON "public"."planned_pilot_visits" IS 'Read access follows pilot visibility. Assigned users can see their planned visits.';



CREATE POLICY "planned_pilot_visits_update_scope" ON "public"."planned_pilot_visits" FOR UPDATE USING (("public"."is_admin"() OR "public"."is_rd_head"() OR "public"."is_agronomist"() OR ("assigned_user_id" = "public"."get_current_user_id"()))) WITH CHECK (("public"."is_admin"() OR "public"."is_rd_head"() OR "public"."is_agronomist"() OR ("assigned_user_id" = "public"."get_current_user_id"())));



COMMENT ON POLICY "planned_pilot_visits_update_scope" ON "public"."planned_pilot_visits" IS 'Plan owners can edit full plans in the app. Assigned users can update their own visit progress/report link.';



ALTER TABLE "public"."regions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "regions_admin_insert" ON "public"."regions" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



COMMENT ON POLICY "regions_admin_insert" ON "public"."regions" IS 'Only Admin can create regions.';



CREATE POLICY "regions_admin_sales_head_update" ON "public"."regions" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"())) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"()));



COMMENT ON POLICY "regions_admin_sales_head_update" ON "public"."regions" IS 'Admin and Sales Head can update region records and targets. Detailed target-field restrictions remain in the app for now.';



CREATE POLICY "regions_select_internal_scope" ON "public"."regions" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR (("public"."get_current_user_id"() IS NOT NULL) AND ("is_active" IS TRUE))));



COMMENT ON POLICY "regions_select_internal_scope" ON "public"."regions" IS 'Admin and Sales Head can read all regions, including inactive. Active internal users can read active regions for assignments and filters.';



ALTER TABLE "public"."sales_payment_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sales_payment_links_sales_select" ON "public"."sales_payment_links" FOR SELECT TO "authenticated" USING (("public"."is_sales_head"() OR "public"."is_rsm"() OR "public"."is_salesperson"()));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_admin_insert" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



COMMENT ON POLICY "users_admin_insert" ON "public"."users" IS 'Only Admin can create internal users.';



CREATE POLICY "users_admin_update" ON "public"."users" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



COMMENT ON POLICY "users_admin_update" ON "public"."users" IS 'Only Admin can update internal users, including deactivate/reactivate metadata.';



CREATE POLICY "users_select_internal_scope" ON "public"."users" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (("public"."get_current_user_id"() IS NOT NULL) AND ("is_active" IS TRUE))));



COMMENT ON POLICY "users_select_internal_scope" ON "public"."users" IS 'Admin can read all users, including inactive. Active internal users can read all active users for dropdowns, hierarchy, display names, and assignments.';



CREATE POLICY "viewer_select_dealers_read_only" ON "public"."dealers" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_dealers_read_only" ON "public"."dealers" IS 'Allows Viewer users read-only access to dealers.';



CREATE POLICY "viewer_select_device_movements_read_only" ON "public"."device_movements" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_device_movements_read_only" ON "public"."device_movements" IS 'Allows Viewer users read-only access to device movement history.';



CREATE POLICY "viewer_select_devices_read_only" ON "public"."devices" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_devices_read_only" ON "public"."devices" IS 'Allows Viewer users read-only access to devices.';



CREATE POLICY "viewer_select_dispatches_read_only" ON "public"."dispatches" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_dispatches_read_only" ON "public"."dispatches" IS 'Allows Viewer users read-only access to dispatches.';



CREATE POLICY "viewer_select_farmer_leads_read_only" ON "public"."farmer_leads" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_farmer_leads_read_only" ON "public"."farmer_leads" IS 'Allows Viewer users read-only access to farmer leads.';



CREATE POLICY "viewer_select_followups_read_only" ON "public"."followups" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_followups_read_only" ON "public"."followups" IS 'Allows Viewer users read-only access to post installation follow-ups.';



CREATE POLICY "viewer_select_installations_read_only" ON "public"."installations" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_installations_read_only" ON "public"."installations" IS 'Allows Viewer users read-only access to installations.';



CREATE POLICY "viewer_select_institution_contacts_read_only" ON "public"."institution_contacts" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_institution_contacts_read_only" ON "public"."institution_contacts" IS 'Allows Viewer users read-only access to institution contacts.';



CREATE POLICY "viewer_select_institution_meetings_read_only" ON "public"."institution_meetings" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_institution_meetings_read_only" ON "public"."institution_meetings" IS 'Allows Viewer users read-only access to institution meetings.';



CREATE POLICY "viewer_select_institutions_read_only" ON "public"."institutions" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_institutions_read_only" ON "public"."institutions" IS 'Allows Viewer users read-only access to institutional partners.';



CREATE POLICY "viewer_select_pilot_visits_read_only" ON "public"."pilot_visits" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_pilot_visits_read_only" ON "public"."pilot_visits" IS 'Allows Viewer users read-only access to pilot visits.';



CREATE POLICY "viewer_select_pilots_read_only" ON "public"."pilots" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_pilots_read_only" ON "public"."pilots" IS 'Allows Viewer users read-only access to pilots.';



CREATE POLICY "viewer_select_visit_reports_read_only" ON "public"."visit_reports" FOR SELECT TO "authenticated" USING ("public"."is_viewer"());



COMMENT ON POLICY "viewer_select_visit_reports_read_only" ON "public"."visit_reports" IS 'Allows Viewer users read-only access to visit reports.';



ALTER TABLE "public"."visit_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "visit_reports_insert_phase2_scope" ON "public"."visit_reports" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_rd_head"() OR (("submitted_by_user_id" = "public"."get_current_user_id"()) AND ("public"."is_agronomist"() OR "public"."is_research_assistant"()) AND ((EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "visit_reports"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND (("fl"."created_by_user_id" = "public"."get_current_user_id"()) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "fl"."created_by_user_id") AND ("u"."is_active" IS TRUE) AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ((("u"."role")::"text" = 'Research Assistant'::"text") OR (("u"."secondary_role")::"text" = 'Research Assistant'::"text")))))))))) OR (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "visit_reports"."pilot_id") AND ("p"."deleted_at" IS NULL) AND (("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"()) OR ("p"."agronomist_user_id" = "public"."get_current_user_id"()) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "p"."research_assistant_user_id") AND ("u"."is_active" IS TRUE) AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ((("u"."role")::"text" = 'Research Assistant'::"text") OR (("u"."secondary_role")::"text" = 'Research Assistant'::"text")))))))))) OR (EXISTS ( SELECT 1
   FROM ("public"."installations" "i"
     LEFT JOIN "public"."farmer_leads" "fl" ON (("fl"."id" = "i"."farmer_lead_id")))
  WHERE (("i"."id" = "visit_reports"."installation_id") AND ("i"."deleted_at" IS NULL) AND (("fl"."created_by_user_id" = "public"."get_current_user_id"()) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "fl"."created_by_user_id") AND ("u"."is_active" IS TRUE) AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ((("u"."role")::"text" = 'Research Assistant'::"text") OR (("u"."secondary_role")::"text" = 'Research Assistant'::"text")))))))))) OR ((("report_type")::"text" = 'Farmer Sale 15-Day Follow-up'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."followups" "f"
  WHERE (("f"."farmer_lead_id" = "visit_reports"."farmer_lead_id") AND ("f"."installation_id" = "visit_reports"."installation_id") AND (("f"."followup_status")::"text" = ANY (ARRAY['Due'::"text", 'Rescheduled'::"text", 'Escalated'::"text", 'Completed'::"text"])) AND (("f"."followup_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "f"."followup_owner_user_id") AND ("u"."is_active" IS TRUE) AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ((("u"."role")::"text" = 'Research Assistant'::"text") OR (("u"."secondary_role")::"text" = 'Research Assistant'::"text")))))))))))))));



COMMENT ON POLICY "visit_reports_insert_phase2_scope" ON "public"."visit_reports" IS 'Phase 2 draft report creation allows allowed field/R&D users to submit post-installation follow-up or pilot reports within their scope.';



CREATE POLICY "visit_reports_select_agronomist_all" ON "public"."visit_reports" FOR SELECT TO "authenticated" USING ("public"."is_agronomist"());



COMMENT ON POLICY "visit_reports_select_agronomist_all" ON "public"."visit_reports" IS 'Allows Agronomist users to read all visit reports in permitted pilot/follow-up workflows. Report write/approval rules remain unchanged.';



CREATE POLICY "visit_reports_select_agronomist_secondary_ra" ON "public"."visit_reports" FOR SELECT TO "authenticated" USING (("public"."is_agronomist"() AND ((EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "visit_reports"."pilot_id") AND ("p"."deleted_at" IS NULL) AND "public"."research_assistant_reports_to_current_user"("p"."research_assistant_user_id")))) OR (EXISTS ( SELECT 1
   FROM "public"."followups" "f"
  WHERE (("f"."farmer_lead_id" = "visit_reports"."farmer_lead_id") AND ("f"."installation_id" = "visit_reports"."installation_id") AND "public"."research_assistant_reports_to_current_user"("f"."followup_owner_user_id")))))));



CREATE POLICY "visit_reports_select_phase2_scope" ON "public"."visit_reports" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("submitted_by_user_id" = "public"."get_current_user_id"()) OR ("reviewed_by_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "visit_reports"."pilot_id") AND ("p"."deleted_at" IS NULL) AND (("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"()) OR ("p"."agronomist_user_id" = "public"."get_current_user_id"()) OR ("p"."rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("p"."region_id" = "public"."current_region_id"()) OR ("p"."state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND (EXISTS ( SELECT 1
           FROM "public"."farmer_leads" "fl"
          WHERE (("fl"."id" = "p"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND ("fl"."owner_user_id" = "public"."get_current_user_id"()))))) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "p"."research_assistant_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE))))))))) OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "visit_reports"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND (("fl"."owner_user_id" = "public"."get_current_user_id"()) OR ("fl"."created_by_user_id" = "public"."get_current_user_id"()) OR ("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))))) OR (EXISTS ( SELECT 1
   FROM ("public"."installations" "i"
     LEFT JOIN "public"."farmer_leads" "fl" ON (("fl"."id" = "i"."farmer_lead_id")))
  WHERE (("i"."id" = "visit_reports"."installation_id") AND ("i"."deleted_at" IS NULL) AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."owner_user_id" = "public"."get_current_user_id"()) OR ("fl"."created_by_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"()))))))) OR (EXISTS ( SELECT 1
   FROM "public"."followups" "f"
  WHERE (("f"."farmer_lead_id" = "visit_reports"."farmer_lead_id") AND ("f"."installation_id" = "visit_reports"."installation_id") AND (("f"."followup_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "f"."followup_owner_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE))))) OR ("public"."is_rsm"() AND ((EXISTS ( SELECT 1
           FROM "public"."farmer_leads" "fl"
          WHERE (("fl"."id" = "f"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
           FROM "public"."installations" "i"
          WHERE (("i"."id" = "f"."installation_id") AND ("i"."deleted_at" IS NULL) AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"()))))))))))) OR (EXISTS ( SELECT 1
   FROM "public"."institutions" "i"
  WHERE (("i"."id" = "visit_reports"."institution_id") AND ("i"."deleted_at" IS NULL) AND (("i"."account_owner_user_id" = "public"."get_current_user_id"()) OR ("i"."sales_head_user_id" = "public"."get_current_user_id"()) OR ("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."rd_head_user_id" = "public"."get_current_user_id"()) OR ("i"."technical_owner_user_id" = "public"."get_current_user_id"())))))));



COMMENT ON POLICY "visit_reports_select_phase2_scope" ON "public"."visit_reports" IS 'Phase 2 draft report read scope for leadership/R&D, report submitter/reviewer, linked pilot, linked farmer lead, linked follow-up, and linked institution access.';



CREATE POLICY "visit_reports_update_phase2_scope" ON "public"."visit_reports" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_rd_head"() OR (("submitted_by_user_id" = "public"."get_current_user_id"()) AND ("public"."is_agronomist"() OR "public"."is_research_assistant"())))) WITH CHECK (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_rd_head"() OR (("submitted_by_user_id" = "public"."get_current_user_id"()) AND ("public"."is_agronomist"() OR "public"."is_research_assistant"()))));



COMMENT ON POLICY "visit_reports_update_phase2_scope" ON "public"."visit_reports" IS 'Phase 2 draft report update allows R&D Head final report approval and submitter draft updates. Detailed status/approval restrictions remain in the app.';



ALTER TABLE "public"."work_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "work_items_select_read_model_shadow" ON "public"."work_items" FOR SELECT TO "authenticated" USING ("public"."can_read_work_item"("category", "action_type", "source_table", "source_id", "assignee_user_id", "rsm_user_id", "region_id", "state"));



COMMENT ON POLICY "work_items_select_read_model_shadow" ON "public"."work_items" IS 'Authorizes visible work item rows through a security-definer helper to keep My Work queries fast.';



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."backfill_dispatch_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."backfill_dispatch_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."backfill_farmer_lead_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_batch_size" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."backfill_farmer_lead_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_batch_size" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."backfill_pilot_dispatch_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."backfill_pilot_dispatch_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."backfill_pilot_installation_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."backfill_pilot_installation_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."backfill_planned_pilot_visit_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."backfill_planned_pilot_visit_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."backfill_visit_report_review_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."backfill_visit_report_review_work_items_batch"("p_after_created_at" timestamp with time zone, "p_after_id" "uuid", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_current_user_update_farmer_lead_for_pilot_completion"("target_farmer_lead_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_current_user_update_farmer_lead_for_pilot_completion"("target_farmer_lead_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_current_user_update_farmer_lead_for_pilot_completion"("target_farmer_lead_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_current_user_update_farmer_lead_for_pilot_completion"("target_farmer_lead_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_read_work_item"("item_category" "text", "item_action_type" "text", "item_source_table" "text", "item_source_id" "uuid", "item_assignee_user_id" "uuid", "item_rsm_user_id" "uuid", "item_region_id" "uuid", "item_state" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_read_work_item"("item_category" "text", "item_action_type" "text", "item_source_table" "text", "item_source_id" "uuid", "item_assignee_user_id" "uuid", "item_rsm_user_id" "uuid", "item_region_id" "uuid", "item_state" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_read_work_item"("item_category" "text", "item_action_type" "text", "item_source_table" "text", "item_source_id" "uuid", "item_assignee_user_id" "uuid", "item_rsm_user_id" "uuid", "item_region_id" "uuid", "item_state" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_region_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_region_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_region_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_state"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_state"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_state"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_has_role"("role_to_check" "public"."user_role") TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_has_role"("role_to_check" "public"."user_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_has_role"("role_to_check" "public"."user_role") TO "service_role";



REVOKE ALL ON FUNCTION "public"."current_work_item_user_context"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_work_item_user_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_work_item_user_context"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."dispatch_work_item_candidates"("p_dispatch_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."dispatch_work_item_candidates"("p_dispatch_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."farmer_lead_work_item_candidates"("p_lead_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."farmer_lead_work_item_candidates"("p_lead_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cached_kpi_dashboard_summary"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_cached_kpi_dashboard_summary"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cached_kpi_dashboard_summary"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_home_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_home_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_home_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_home_counts"("p_include_farmer_leads" boolean, "p_include_dispatches" boolean, "p_include_installations" boolean, "p_include_devices" boolean, "p_include_followups" boolean, "p_include_pilots" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_home_counts"("p_include_farmer_leads" boolean, "p_include_dispatches" boolean, "p_include_installations" boolean, "p_include_devices" boolean, "p_include_followups" boolean, "p_include_pilots" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_home_counts"("p_include_farmer_leads" boolean, "p_include_dispatches" boolean, "p_include_installations" boolean, "p_include_devices" boolean, "p_include_followups" boolean, "p_include_pilots" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_dispatch_work_item_shadow_drift"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_dispatch_work_item_shadow_drift"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dispatch_work_item_shadow_drift"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_farmer_lead_work_item_shadow_drift"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_farmer_lead_work_item_shadow_drift"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_farmer_lead_work_item_shadow_drift"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_farmer_leads_page_kpis"("p_q" "text", "p_lead_status" "text", "p_funnel_stage" "text", "p_state" "text", "p_district" "text", "p_owner_user_id" "uuid", "p_rsm_user_id" "uuid", "p_lead_source" "text", "p_primary_crop" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_farmer_leads_page_kpis"("p_q" "text", "p_lead_status" "text", "p_funnel_stage" "text", "p_state" "text", "p_district" "text", "p_owner_user_id" "uuid", "p_rsm_user_id" "uuid", "p_lead_source" "text", "p_primary_crop" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_farmer_leads_page_kpis"("p_q" "text", "p_lead_status" "text", "p_funnel_stage" "text", "p_state" "text", "p_district" "text", "p_owner_user_id" "uuid", "p_rsm_user_id" "uuid", "p_lead_source" "text", "p_primary_crop" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_installations_page_kpis"("p_q" "text", "p_installation_status" "text", "p_installation_type" "text", "p_product_model" "text", "p_state" "text", "p_district" "text", "p_rsm_user_id" "uuid", "p_region_id" "uuid", "p_dealer_id" "uuid", "p_institution_id" "uuid", "p_pilot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_installations_page_kpis"("p_q" "text", "p_installation_status" "text", "p_installation_type" "text", "p_product_model" "text", "p_state" "text", "p_district" "text", "p_rsm_user_id" "uuid", "p_region_id" "uuid", "p_dealer_id" "uuid", "p_institution_id" "uuid", "p_pilot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_installations_page_kpis"("p_q" "text", "p_installation_status" "text", "p_installation_type" "text", "p_product_model" "text", "p_state" "text", "p_district" "text", "p_rsm_user_id" "uuid", "p_region_id" "uuid", "p_dealer_id" "uuid", "p_institution_id" "uuid", "p_pilot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_institutions_page_kpis"("p_q" "text", "p_organization_type" "text", "p_institution_status" "text", "p_primary_state" "text", "p_priority" "text", "p_account_owner_user_id" "uuid", "p_rsm_user_id" "uuid", "p_rd_head_user_id" "uuid", "p_scale_up_status" "text", "p_opportunity_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_institutions_page_kpis"("p_q" "text", "p_organization_type" "text", "p_institution_status" "text", "p_primary_state" "text", "p_priority" "text", "p_account_owner_user_id" "uuid", "p_rsm_user_id" "uuid", "p_rd_head_user_id" "uuid", "p_scale_up_status" "text", "p_opportunity_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_institutions_page_kpis"("p_q" "text", "p_organization_type" "text", "p_institution_status" "text", "p_primary_state" "text", "p_priority" "text", "p_account_owner_user_id" "uuid", "p_rsm_user_id" "uuid", "p_rd_head_user_id" "uuid", "p_scale_up_status" "text", "p_opportunity_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_kpi_dashboard_summary"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_kpi_dashboard_summary"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_kpi_dashboard_summary"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_visits_summary_counts"("p_assigned_user_id" "uuid", "p_today" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_visits_summary_counts"("p_assigned_user_id" "uuid", "p_today" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_visits_summary_counts"("p_assigned_user_id" "uuid", "p_today" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_work_oversight_summary_counts"("p_today" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_work_oversight_summary_counts"("p_today" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_work_oversight_summary_counts"("p_today" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_pilot_monitoring_work_item_shadow_drift"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_pilot_monitoring_work_item_shadow_drift"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pilot_monitoring_work_item_shadow_drift"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pilots_page_kpis"("p_q" "text", "p_pilot_type" "text", "p_pilot_status" "text", "p_pilot_result_status" "text", "p_crop" "text", "p_state" "text", "p_district" "text", "p_pilot_owner_user_id" "uuid", "p_research_assistant_user_id" "uuid", "p_agronomist_user_id" "uuid", "p_rd_head_user_id" "uuid", "p_institution_id" "uuid", "p_dealer_id" "uuid", "p_scale_up_recommended" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_pilots_page_kpis"("p_q" "text", "p_pilot_type" "text", "p_pilot_status" "text", "p_pilot_result_status" "text", "p_crop" "text", "p_state" "text", "p_district" "text", "p_pilot_owner_user_id" "uuid", "p_research_assistant_user_id" "uuid", "p_agronomist_user_id" "uuid", "p_rd_head_user_id" "uuid", "p_institution_id" "uuid", "p_dealer_id" "uuid", "p_scale_up_recommended" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pilots_page_kpis"("p_q" "text", "p_pilot_type" "text", "p_pilot_status" "text", "p_pilot_result_status" "text", "p_crop" "text", "p_state" "text", "p_district" "text", "p_pilot_owner_user_id" "uuid", "p_research_assistant_user_id" "uuid", "p_agronomist_user_id" "uuid", "p_rd_head_user_id" "uuid", "p_institution_id" "uuid", "p_dealer_id" "uuid", "p_scale_up_recommended" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_visible_pilot_work_item_count"("p_today" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_visible_pilot_work_item_count"("p_today" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_visible_pilot_work_item_count"("p_today" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_visible_planned_visit_counts"("p_today" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_visible_planned_visit_counts"("p_today" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_visible_planned_visit_counts"("p_today" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_accounts"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_accounts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_accounts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_agronomist"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_agronomist"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_agronomist"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_designer"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_designer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_designer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_hr_legal"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_hr_legal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_hr_legal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_management"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_management"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_management"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_marketing_head"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_marketing_head"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_marketing_head"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_rd_head"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_rd_head"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_rd_head"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_research_assistant"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_research_assistant"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_research_assistant"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_rsm"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_rsm"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_rsm"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_sales_head"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_sales_head"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_sales_head"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_salesperson"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_salesperson"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_salesperson"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_stock_dispatch"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_stock_dispatch"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_stock_dispatch"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_viewer"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_viewer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_viewer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."kpi_dashboard_cache_key"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."kpi_dashboard_cache_key"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."kpi_dashboard_cache_key"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."make_year_code"("prefix" "text", "seq_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."make_year_code"("prefix" "text", "seq_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."make_year_code"("prefix" "text", "seq_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_current_user_password_changed"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_current_user_password_changed"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_current_user_password_changed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_current_user_password_changed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_kpi_dashboard_sections_dirty"("section_names" "text"[], "reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_kpi_dashboard_sections_dirty"("section_names" "text"[], "reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_kpi_dashboard_sections_dirty"("section_names" "text"[], "reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."pilot_dispatch_work_item_candidates"("p_pilot_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."pilot_dispatch_work_item_candidates"("p_pilot_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."pilot_installation_work_item_candidates"("p_pilot_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."pilot_installation_work_item_candidates"("p_pilot_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."planned_pilot_visit_work_item_candidates"("p_planned_visit_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."planned_pilot_visit_work_item_candidates"("p_planned_visit_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."project_dispatch_work_items"("p_dispatch_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."project_dispatch_work_items"("p_dispatch_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."project_farmer_lead_work_items"("p_lead_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."project_farmer_lead_work_items"("p_lead_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."project_pilot_dispatch_work_items"("p_pilot_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."project_pilot_dispatch_work_items"("p_pilot_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."project_pilot_installation_work_items"("p_pilot_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."project_pilot_installation_work_items"("p_pilot_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."project_planned_pilot_visit_work_items"("p_planned_visit_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."project_planned_pilot_visit_work_items"("p_planned_visit_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."project_visit_report_review_work_items"("p_visit_report_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."project_visit_report_review_work_items"("p_visit_report_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_kpi_dashboard_cache_full"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_kpi_dashboard_cache_full"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_kpi_dashboard_cache_full"("p_start_date" "date", "p_end_date" "date", "p_state" "text", "p_region_id" "uuid", "p_rsm_user_id" "uuid", "p_product_model" "text", "p_crop" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reports_to_current_user"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reports_to_current_user"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reports_to_current_user"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."research_assistant_reports_to_current_user"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."research_assistant_reports_to_current_user"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."research_assistant_reports_to_current_user"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_dispatch_farmer_lead_work_items"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_dispatch_farmer_lead_work_items"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_dispatch_work_items"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_dispatch_work_items"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_farmer_lead_work_items"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_farmer_lead_work_items"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_pilot_dispatch_work_items"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_pilot_dispatch_work_items"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_pilot_monitoring_pilot_work_items"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_pilot_monitoring_pilot_work_items"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_planned_pilot_visit_work_items"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_planned_pilot_visit_work_items"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_visit_report_review_work_items"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_visit_report_review_work_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_dealer_institution_links_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_dealer_institution_links_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_dealer_institution_links_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_dealer_reviews_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_dealer_reviews_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_dealer_reviews_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_farmer_lead_followups_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_farmer_lead_followups_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_farmer_lead_followups_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_role"("user_id" "uuid", "role_to_check" "public"."user_role") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_role"("user_id" "uuid", "role_to_check" "public"."user_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_role"("user_id" "uuid", "role_to_check" "public"."user_role") TO "service_role";



REVOKE ALL ON FUNCTION "public"."visit_report_review_work_item_candidates"("p_visit_report_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."visit_report_review_work_item_candidates"("p_visit_report_id" "uuid") TO "service_role";



GRANT ALL ON SEQUENCE "public"."dealer_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dealer_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dealer_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dealer_institution_links" TO "anon";
GRANT ALL ON TABLE "public"."dealer_institution_links" TO "authenticated";
GRANT ALL ON TABLE "public"."dealer_institution_links" TO "service_role";



GRANT ALL ON TABLE "public"."dealer_reviews" TO "anon";
GRANT ALL ON TABLE "public"."dealer_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."dealer_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."dealers" TO "anon";
GRANT ALL ON TABLE "public"."dealers" TO "authenticated";
GRANT ALL ON TABLE "public"."dealers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."device_movement_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."device_movement_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."device_movement_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."device_movements" TO "anon";
GRANT ALL ON TABLE "public"."device_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."device_movements" TO "service_role";



GRANT ALL ON TABLE "public"."device_status_update_tasks" TO "anon";
GRANT ALL ON TABLE "public"."device_status_update_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."device_status_update_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."devices" TO "anon";
GRANT ALL ON TABLE "public"."devices" TO "authenticated";
GRANT ALL ON TABLE "public"."devices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."dispatch_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dispatch_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dispatch_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dispatches" TO "anon";
GRANT ALL ON TABLE "public"."dispatches" TO "authenticated";
GRANT ALL ON TABLE "public"."dispatches" TO "service_role";



GRANT ALL ON SEQUENCE "public"."farmer_lead_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."farmer_lead_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."farmer_lead_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."farmer_lead_followups" TO "anon";
GRANT ALL ON TABLE "public"."farmer_lead_followups" TO "authenticated";
GRANT ALL ON TABLE "public"."farmer_lead_followups" TO "service_role";



GRANT ALL ON TABLE "public"."farmer_leads" TO "anon";
GRANT ALL ON TABLE "public"."farmer_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."farmer_leads" TO "service_role";



GRANT ALL ON SEQUENCE "public"."followup_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."followup_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."followup_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."followups" TO "anon";
GRANT ALL ON TABLE "public"."followups" TO "authenticated";
GRANT ALL ON TABLE "public"."followups" TO "service_role";



GRANT ALL ON SEQUENCE "public"."installation_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."installation_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."installation_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."installations" TO "anon";
GRANT ALL ON TABLE "public"."installations" TO "authenticated";
GRANT ALL ON TABLE "public"."installations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."institution_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."institution_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."institution_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."institution_contacts" TO "anon";
GRANT ALL ON TABLE "public"."institution_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."institution_contacts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."institution_meeting_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."institution_meeting_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."institution_meeting_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."institution_meetings" TO "anon";
GRANT ALL ON TABLE "public"."institution_meetings" TO "authenticated";
GRANT ALL ON TABLE "public"."institution_meetings" TO "service_role";



GRANT ALL ON TABLE "public"."institutions" TO "anon";
GRANT ALL ON TABLE "public"."institutions" TO "authenticated";
GRANT ALL ON TABLE "public"."institutions" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_dashboard_cache" TO "anon";
GRANT ALL ON TABLE "public"."kpi_dashboard_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_dashboard_cache" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_dashboard_dirty_flags" TO "anon";
GRANT ALL ON TABLE "public"."kpi_dashboard_dirty_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_dashboard_dirty_flags" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_dashboard_refresh_log" TO "anon";
GRANT ALL ON TABLE "public"."kpi_dashboard_refresh_log" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_dashboard_refresh_log" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_request_updates" TO "anon";
GRANT ALL ON TABLE "public"."marketing_request_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_request_updates" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_requests" TO "anon";
GRANT ALL ON TABLE "public"."marketing_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_requests" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pilot_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pilot_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pilot_code_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pilot_visit_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pilot_visit_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pilot_visit_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_visits" TO "anon";
GRANT ALL ON TABLE "public"."pilot_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_visits" TO "service_role";



GRANT ALL ON TABLE "public"."pilots" TO "anon";
GRANT ALL ON TABLE "public"."pilots" TO "authenticated";
GRANT ALL ON TABLE "public"."pilots" TO "service_role";



GRANT ALL ON TABLE "public"."planned_pilot_visits" TO "anon";
GRANT ALL ON TABLE "public"."planned_pilot_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."planned_pilot_visits" TO "service_role";



GRANT ALL ON SEQUENCE "public"."region_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."region_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."region_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."regions" TO "anon";
GRANT ALL ON TABLE "public"."regions" TO "authenticated";
GRANT ALL ON TABLE "public"."regions" TO "service_role";



GRANT ALL ON TABLE "public"."sales_payment_links" TO "service_role";
GRANT SELECT ON TABLE "public"."sales_payment_links" TO "authenticated";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."visit_report_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."visit_report_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."visit_report_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."visit_reports" TO "anon";
GRANT ALL ON TABLE "public"."visit_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."visit_reports" TO "service_role";



GRANT ALL ON TABLE "public"."work_items" TO "service_role";
GRANT SELECT ON TABLE "public"."work_items" TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



-- Preserve the explicit restricted ACLs after replaying production defaults.
REVOKE ALL ON TABLE "public"."sales_payment_links" FROM "anon", "authenticated";
GRANT SELECT ON TABLE "public"."sales_payment_links" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_payment_links" TO "service_role";

REVOKE ALL ON TABLE "public"."work_items" FROM "anon", "authenticated";
GRANT SELECT ON TABLE "public"."work_items" TO "authenticated";
GRANT ALL ON TABLE "public"."work_items" TO "service_role";
