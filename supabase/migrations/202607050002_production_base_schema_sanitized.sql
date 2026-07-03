


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;


CREATE SCHEMA IF NOT EXISTS "public";




COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."agreement_status" AS ENUM (
    'Not Started',
    'Draft Shared',
    'Under Review',
    'Signed',
    'Not Required',
    'Dropped'
);




CREATE TYPE "public"."comparison_method" AS ENUM (
    'Same Farmer - Adjacent Plot',
    'Same Farmer - Different Plot',
    'Nearby Farmer - Similar Crop',
    'Historical Baseline',
    'Before / After Only',
    'No Control Available',
    'Other'
);




CREATE TYPE "public"."credit_terms" AS ENUM (
    '100% Advance',
    'Approved Exception',
    'Not Applicable'
);




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
    'Unknown'
);




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




CREATE TYPE "public"."dealer_status" AS ENUM (
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




CREATE TYPE "public"."decision_maker" AS ENUM (
    'Farmer',
    'Family Member',
    'Farm Manager',
    'Dealer',
    'Institution',
    'Other',
    'Unknown'
);




CREATE TYPE "public"."decision_role" AS ENUM (
    'Decision Maker',
    'Influencer',
    'Technical Evaluator',
    'Finance Approver',
    'Field Coordinator',
    'Gatekeeper',
    'Unknown'
);




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




CREATE TYPE "public"."destination_type" AS ENUM (
    'Farmer',
    'Dealer',
    'Institution',
    'Pilot',
    'Internal Transfer',
    'Replacement',
    'Other'
);




CREATE TYPE "public"."device_condition" AS ENUM (
    'Good',
    'Needs Inspection',
    'Damaged',
    'Lost',
    'Unknown'
);




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




CREATE TYPE "public"."device_working_status" AS ENUM (
    'Working',
    'Issue Reported',
    'Needs Inspection',
    'Not Checked',
    'Not Applicable'
);




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




CREATE TYPE "public"."dispatch_type" AS ENUM (
    'Farmer Sale Dispatch',
    'Dealer Stock Dispatch',
    'Pilot Dispatch',
    'Institution Dispatch',
    'Replacement Dispatch',
    'Internal Transfer',
    'Other'
);




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




CREATE TYPE "public"."farmer_confirmation" AS ENUM (
    'Yes',
    'No',
    'Pending',
    'Not Applicable'
);




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




CREATE TYPE "public"."farmer_satisfaction" AS ENUM (
    'Very Satisfied',
    'Satisfied',
    'Neutral',
    'Unsatisfied',
    'Very Unsatisfied',
    'Not Available'
);




CREATE TYPE "public"."fitment_inspection_status" AS ENUM (
    'Good',
    'Needs Correction',
    'Issue Found',
    'Not Checked',
    'Not Applicable'
);




CREATE TYPE "public"."followup_method" AS ENUM (
    'Phone Call',
    'WhatsApp',
    'Field Visit',
    'Dealer Visit',
    'Institution Meeting',
    'Other'
);




CREATE TYPE "public"."followup_outcome" AS ENUM (
    'Positive',
    'Neutral',
    'Issue Found',
    'No Response',
    'Follow-up Required',
    'Escalated',
    'Closed'
);




CREATE TYPE "public"."followup_priority" AS ENUM (
    'High',
    'Medium',
    'Low'
);




CREATE TYPE "public"."followup_status" AS ENUM (
    'Due',
    'Completed',
    'Missed',
    'Rescheduled',
    'Cancelled',
    'Escalated'
);




CREATE TYPE "public"."followup_type" AS ENUM (
    'Farmer Sale 15-Day Follow-up',
    'Dealer Follow-up',
    'Institution Follow-up',
    'Pilot Follow-up',
    'Issue Follow-up',
    'Other'
);




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
    'Parked'
);




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




CREATE TYPE "public"."influence_level" AS ENUM (
    'High',
    'Medium',
    'Low',
    'Unknown'
);




CREATE TYPE "public"."installation_method" AS ENUM (
    'New Installation',
    'Replacement',
    'Reinstallation',
    'Fitment Correction',
    'Other'
);




CREATE TYPE "public"."installation_status" AS ENUM (
    'Planned',
    'Installed',
    'Verified',
    'Follow-up Pending',
    'Issue Reported',
    'Closed',
    'Cancelled'
);




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




CREATE TYPE "public"."interest_level" AS ENUM (
    'Yes',
    'Maybe',
    'No',
    'Not Discussed'
);




CREATE TYPE "public"."involvement_status" AS ENUM (
    'Yes',
    'No',
    'Maybe',
    'Already Involved'
);




CREATE TYPE "public"."irrigation_line_type" AS ENUM (
    'Mainline',
    'Sub-main',
    'Drip Line',
    'Sprinkler Line',
    'Flood Irrigation Line',
    'Other',
    'Unknown'
);




CREATE TYPE "public"."irrigation_type" AS ENUM (
    'Drip',
    'Flood',
    'Sprinkler',
    'Rainfed',
    'Mixed',
    'Unknown'
);




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
    'Other'
);




CREATE TYPE "public"."lead_status" AS ENUM (
    'Open',
    'Won',
    'Lost',
    'Parked'
);




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




CREATE TYPE "public"."meeting_mode" AS ENUM (
    'Online',
    'In-person',
    'Phone Call',
    'Field Visit',
    'Other'
);




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




CREATE TYPE "public"."monitoring_frequency" AS ENUM (
    'Weekly',
    'Fortnightly',
    'Monthly',
    'Crop Stage Based',
    'Before / After Irrigation',
    'Harvest Only',
    'Custom'
);




CREATE TYPE "public"."movement_status" AS ENUM (
    'Pending',
    'Completed',
    'Cancelled'
);




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




CREATE TYPE "public"."payment_requirement_type" AS ENUM (
    'Payment Required',
    'Paid Pilot',
    'Unpaid Pilot',
    'Management Exception',
    'Internal Transfer',
    'Replacement / No Charge'
);




CREATE TYPE "public"."pilot_result_status" AS ENUM (
    'Not Started',
    'Ongoing',
    'Awaiting R&D Review',
    'Successful',
    'Inconclusive',
    'Failed',
    'Not Yet Evaluated'
);




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




CREATE TYPE "public"."pilot_type" AS ENUM (
    'Institution Pilot',
    'Dealer Pilot',
    'Internal Research Pilot',
    'Farmer Validation Pilot',
    'R&D Trial',
    'Other'
);




CREATE TYPE "public"."priority_level" AS ENUM (
    'High',
    'Medium',
    'Low',
    'Parked'
);




CREATE TYPE "public"."product_model" AS ENUM (
    'Vipasa',
    'Jahnavi',
    'Dihanga',
    'Not Decided'
);




CREATE TYPE "public"."product_model_strict" AS ENUM (
    'Vipasa',
    'Jahnavi',
    'Dihanga'
);




CREATE TYPE "public"."rd_involvement_status" AS ENUM (
    'Yes',
    'No',
    'Already Involved',
    'Not Required'
);




CREATE TYPE "public"."report_status" AS ENUM (
    'Draft',
    'Submitted',
    'Reviewed',
    'Revision Required',
    'Approved',
    'Archived'
);




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




CREATE TYPE "public"."stock_entry_source" AS ENUM (
    'Production',
    'Return',
    'Replacement Stock',
    'Manual Adjustment',
    'Other'
);




CREATE TYPE "public"."training_status" AS ENUM (
    'Not Trained',
    'Training Scheduled',
    'Training Completed',
    'Refresher Needed'
);




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
    'Viewer'
);




CREATE TYPE "public"."visit_status" AS ENUM (
    'Planned',
    'Completed',
    'Missed',
    'Rescheduled',
    'Cancelled'
);




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




CREATE TYPE "public"."yes_no_pending_na" AS ENUM (
    'Yes',
    'No',
    'Pending',
    'Not Applicable'
);




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




COMMENT ON FUNCTION "public"."current_state"() IS 'Returns the active internal user assigned state.';



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




COMMENT ON FUNCTION "public"."get_current_user_role"() IS 'Returns the active internal role for the logged-in Supabase Auth email.';



CREATE OR REPLACE FUNCTION "public"."is_accounts"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.get_current_user_role() = 'Accounts'
$$;




CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.get_current_user_role() = 'Admin'
$$;




CREATE OR REPLACE FUNCTION "public"."is_agronomist"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.get_current_user_role() = 'Agronomist'
$$;




CREATE OR REPLACE FUNCTION "public"."is_management"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.get_current_user_role() = 'Management'
$$;




CREATE OR REPLACE FUNCTION "public"."is_rd_head"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.get_current_user_role() = 'R&D Head'
$$;




CREATE OR REPLACE FUNCTION "public"."is_research_assistant"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.get_current_user_role() = 'Research Assistant'
$$;




CREATE OR REPLACE FUNCTION "public"."is_rsm"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.get_current_user_role() = 'RSM'
$$;




CREATE OR REPLACE FUNCTION "public"."is_sales_head"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.get_current_user_role() = 'Sales Head'
$$;




CREATE OR REPLACE FUNCTION "public"."is_salesperson"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.get_current_user_role() = 'Salesperson'
$$;




CREATE OR REPLACE FUNCTION "public"."is_stock_dispatch"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.get_current_user_role() = 'Stock / Dispatch'
$$;




CREATE OR REPLACE FUNCTION "public"."is_viewer"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select public.get_current_user_role() = 'Viewer'
$$;




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




COMMENT ON FUNCTION "public"."reports_to_current_user"("user_id" "uuid") IS 'Returns true when the given active internal user reports to the current user.';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;




CREATE SEQUENCE IF NOT EXISTS "public"."dealer_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."dealers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dealer_code" "text" DEFAULT "public"."make_year_code"('DL'::"text", 'public.dealer_code_seq'::"text") NOT NULL,
    "dealer_name" "text" NOT NULL,
    "firm_name" "text",
    "contact_number" "text" NOT NULL,
    "alternate_contact_number" "text",
    "email" "text",
    "dealer_type" "public"."dealer_type" NOT NULL,
    "dealer_status" "public"."dealer_status" DEFAULT 'Potential Dealer'::"public"."dealer_status" NOT NULL,
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
    CONSTRAINT "dealer_active_requires_signed_agreement" CHECK ((("dealer_status" <> 'Active Dealer'::"public"."dealer_status") OR ("dealer_agreement_status" = 'Signed'::"public"."agreement_status") OR ("agreement_exception_approved" = true)))
);




CREATE SEQUENCE IF NOT EXISTS "public"."device_movement_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




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
    "deleted_at" timestamp with time zone
);




CREATE SEQUENCE IF NOT EXISTS "public"."dispatch_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




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
    CONSTRAINT "dispatch_exception_reason_required" CHECK ((("management_exception_approved" = false) OR (NULLIF(TRIM(BOTH FROM "exception_reason"), ''::"text") IS NOT NULL))),
    CONSTRAINT "dispatch_payment_rule" CHECK ((("dispatch_status" <> ALL (ARRAY['Approved for Dispatch'::"public"."dispatch_status", 'Dispatched'::"public"."dispatch_status", 'Delivered'::"public"."dispatch_status", 'Installation Pending'::"public"."dispatch_status", 'Installed'::"public"."dispatch_status"])) OR ("payment_confirmed" = true) OR ("payment_requirement_type" = ANY (ARRAY['Unpaid Pilot'::"public"."payment_requirement_type", 'Management Exception'::"public"."payment_requirement_type", 'Internal Transfer'::"public"."payment_requirement_type", 'Replacement / No Charge'::"public"."payment_requirement_type"])) OR ("management_exception_approved" = true))),
    CONSTRAINT "dispatches_quantity_check" CHECK (("quantity" = 1))
);




CREATE SEQUENCE IF NOT EXISTS "public"."farmer_lead_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




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
    CONSTRAINT "farmer_leads_lost_parked_reason" CHECK ((("lead_status" <> ALL (ARRAY['Lost'::"public"."lead_status", 'Parked'::"public"."lead_status"])) OR (NULLIF(TRIM(BOTH FROM "reason_lost_or_parked"), ''::"text") IS NOT NULL))),
    CONSTRAINT "farmer_leads_other_crop_required" CHECK ((("primary_crop" <> 'Other'::"public"."crop_option") OR (NULLIF(TRIM(BOTH FROM "other_primary_crop"), ''::"text") IS NOT NULL)))
);




CREATE SEQUENCE IF NOT EXISTS "public"."followup_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




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




CREATE SEQUENCE IF NOT EXISTS "public"."installation_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




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
    CONSTRAINT "installation_issue_details_required" CHECK ((("issue_observed" = false) OR (NULLIF(TRIM(BOTH FROM "issue_details"), ''::"text") IS NOT NULL))),
    CONSTRAINT "installation_verified_requires_date" CHECK ((("installation_status" <> 'Verified'::"public"."installation_status") OR ("verified_date" IS NOT NULL)))
);




CREATE SEQUENCE IF NOT EXISTS "public"."institution_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




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




CREATE SEQUENCE IF NOT EXISTS "public"."institution_meeting_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




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
    "deleted_at" timestamp with time zone
);




CREATE SEQUENCE IF NOT EXISTS "public"."pilot_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




CREATE SEQUENCE IF NOT EXISTS "public"."pilot_visit_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




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
    CONSTRAINT "pilots_other_crop_required" CHECK ((("crop" <> 'Other'::"public"."crop_option") OR (NULLIF(TRIM(BOTH FROM "other_crop"), ''::"text") IS NOT NULL)))
);




CREATE SEQUENCE IF NOT EXISTS "public"."region_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




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
    "deactivation_reason" "text"
);




CREATE SEQUENCE IF NOT EXISTS "public"."visit_report_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




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
    CONSTRAINT "visit_reports_other_crop_required" CHECK ((("crop" IS DISTINCT FROM 'Other'::"public"."crop_option") OR (NULLIF(TRIM(BOTH FROM "other_crop"), ''::"text") IS NOT NULL)))
);




ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "dealers_dealer_code_key" UNIQUE ("dealer_code");



ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "dealers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_movements"
    ADD CONSTRAINT "device_movements_movement_code_key" UNIQUE ("movement_code");



ALTER TABLE ONLY "public"."device_movements"
    ADD CONSTRAINT "device_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_serial_number_key" UNIQUE ("serial_number");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "dispatches_dispatch_code_key" UNIQUE ("dispatch_code");



ALTER TABLE ONLY "public"."dispatches"
    ADD CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."pilot_visits"
    ADD CONSTRAINT "pilot_visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_visits"
    ADD CONSTRAINT "pilot_visits_visit_code_key" UNIQUE ("visit_code");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_pilot_code_key" UNIQUE ("pilot_code");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."regions"
    ADD CONSTRAINT "regions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."regions"
    ADD CONSTRAINT "regions_region_name_key" UNIQUE ("region_name");



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



CREATE INDEX "idx_dealers_rsm_region" ON "public"."dealers" USING "btree" ("rsm_user_id", "region_id");



CREATE INDEX "idx_device_movements_device_date" ON "public"."device_movements" USING "btree" ("device_id", "movement_date");



CREATE INDEX "idx_devices_holder" ON "public"."devices" USING "btree" ("current_holder_type", "current_holder_id");



CREATE INDEX "idx_devices_status" ON "public"."devices" USING "btree" ("device_status");



CREATE INDEX "idx_dispatches_device" ON "public"."dispatches" USING "btree" ("device_id");



CREATE INDEX "idx_dispatches_status" ON "public"."dispatches" USING "btree" ("dispatch_status");



CREATE INDEX "idx_farmer_leads_next_action" ON "public"."farmer_leads" USING "btree" ("next_action_date");



CREATE INDEX "idx_farmer_leads_owner" ON "public"."farmer_leads" USING "btree" ("owner_user_id");



CREATE INDEX "idx_farmer_leads_region" ON "public"."farmer_leads" USING "btree" ("region_id");



CREATE INDEX "idx_farmer_leads_rsm" ON "public"."farmer_leads" USING "btree" ("rsm_user_id");



CREATE INDEX "idx_farmer_leads_status_stage" ON "public"."farmer_leads" USING "btree" ("lead_status", "funnel_stage");



CREATE INDEX "idx_followups_due_status" ON "public"."followups" USING "btree" ("followup_due_date", "followup_status");



CREATE INDEX "idx_installations_date" ON "public"."installations" USING "btree" ("installation_date");



CREATE INDEX "idx_installations_rsm_region" ON "public"."installations" USING "btree" ("rsm_user_id", "region_id");



CREATE INDEX "idx_institution_meetings_institution_date" ON "public"."institution_meetings" USING "btree" ("institution_id", "meeting_date");



CREATE INDEX "idx_institutions_account_owner" ON "public"."institutions" USING "btree" ("account_owner_user_id");



CREATE INDEX "idx_pilot_visits_pilot_date" ON "public"."pilot_visits" USING "btree" ("pilot_id", "visit_date");



CREATE INDEX "idx_pilots_owner" ON "public"."pilots" USING "btree" ("pilot_owner_user_id");



CREATE INDEX "idx_pilots_status" ON "public"."pilots" USING "btree" ("pilot_status");



CREATE INDEX "idx_users_region_id" ON "public"."users" USING "btree" ("region_id");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_visit_reports_submitter_date" ON "public"."visit_reports" USING "btree" ("submitted_by_user_id", "report_date");



CREATE OR REPLACE TRIGGER "trg_dealers_set_updated_at" BEFORE UPDATE ON "public"."dealers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_device_movements_set_updated_at" BEFORE UPDATE ON "public"."device_movements" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_devices_set_updated_at" BEFORE UPDATE ON "public"."devices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_dispatches_set_updated_at" BEFORE UPDATE ON "public"."dispatches" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_farmer_leads_set_updated_at" BEFORE UPDATE ON "public"."farmer_leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_followups_set_updated_at" BEFORE UPDATE ON "public"."followups" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_installations_set_updated_at" BEFORE UPDATE ON "public"."installations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_institution_contacts_set_updated_at" BEFORE UPDATE ON "public"."institution_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_institution_meetings_set_updated_at" BEFORE UPDATE ON "public"."institution_meetings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_institutions_set_updated_at" BEFORE UPDATE ON "public"."institutions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_pilot_visits_set_updated_at" BEFORE UPDATE ON "public"."pilot_visits" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_pilots_set_updated_at" BEFORE UPDATE ON "public"."pilots" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_regions_set_updated_at" BEFORE UPDATE ON "public"."regions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_users_set_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_visit_reports_set_updated_at" BEFORE UPDATE ON "public"."visit_reports" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



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



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_deactivated_by_user_id_fkey" FOREIGN KEY ("deactivated_by_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_replacement_user_id_fkey" FOREIGN KEY ("replacement_user_id") REFERENCES "public"."users"("id");



ALTER TABLE "public"."dealers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dealers_insert_internal_scope" ON "public"."dealers" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"())))));



COMMENT ON POLICY "dealers_insert_internal_scope" ON "public"."dealers" IS 'Admin, Sales Head, and regional RSM can create dealers. Salesperson is read-only for dealers in this first RLS pass.';



CREATE POLICY "dealers_select_internal_scope" ON "public"."dealers" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND ("region_id" = "public"."current_region_id"())) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM ("public"."farmer_leads" "fl"
     JOIN "public"."users" "u" ON (("u"."id" = "fl"."created_by_user_id")))
  WHERE (("fl"."linked_dealer_id" = "dealers"."id") AND ("fl"."deleted_at" IS NULL) AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))))));



COMMENT ON POLICY "dealers_select_internal_scope" ON "public"."dealers" IS 'Safe Phase 1 dealer read scope: leadership/R&D, regional RSM, assigned-region Salesperson, and Agronomist dealers linked to Research Assistant team-created leads.';



CREATE POLICY "dealers_update_internal_scope" ON "public"."dealers" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"())))));



COMMENT ON POLICY "dealers_update_internal_scope" ON "public"."dealers" IS 'Admin, Sales Head, and regional RSM can update dealers. Detailed field restrictions remain in the app for now.';



ALTER TABLE "public"."device_movements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_movements_insert_phase2_scope" ON "public"."device_movements" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND ((EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "device_movements"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."installations" "i"
  WHERE (("i"."id" = "device_movements"."installation_id") AND ("i"."deleted_at" IS NULL) AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"())))))))));



COMMENT ON POLICY "device_movements_insert_phase2_scope" ON "public"."device_movements" IS 'Phase 2 draft movement creation for dispatch/installation side effects by operational roles.';



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



ALTER TABLE "public"."devices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "devices_insert_stock_accounts" ON "public"."devices" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"()));



COMMENT ON POLICY "devices_insert_stock_accounts" ON "public"."devices" IS 'Admin, Accounts, and Stock / Dispatch can create device stock records.';



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



ALTER TABLE "public"."farmer_leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "farmer_leads_insert_internal_scope" ON "public"."farmer_leads" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR ("public"."is_stock_dispatch"() AND ("created_by_user_id" = "public"."get_current_user_id"()) AND (("owner_user_id" IS NULL) OR ("owner_user_id" <> "public"."get_current_user_id"()))) OR ("public"."is_rsm"() AND ("created_by_user_id" = "public"."get_current_user_id"()) AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND ("created_by_user_id" = "public"."get_current_user_id"()) AND ("owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_research_assistant"() AND ("created_by_user_id" = "public"."get_current_user_id"()) AND (("owner_user_id" IS NULL) OR ("owner_user_id" <> "public"."get_current_user_id"())))));



COMMENT ON POLICY "farmer_leads_insert_internal_scope" ON "public"."farmer_leads" IS 'Safe Phase 1 lead insert allows Customer Service Team to create leads assigned to another owner, while preserving existing Admin/Sales Head/RSM/Salesperson/Research Assistant rules.';



CREATE POLICY "farmer_leads_select_internal_scope" ON "public"."farmer_leads" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND ("owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_research_assistant"() AND ("created_by_user_id" = "public"."get_current_user_id"())) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "farmer_leads"."created_by_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))))));



COMMENT ON POLICY "farmer_leads_select_internal_scope" ON "public"."farmer_leads" IS 'Safe Phase 1 lead read scope: broad leadership/ops/R&D read, regional RSM read, owner/creator read, and Agronomist read for Research Assistant team-created leads.';



CREATE POLICY "farmer_leads_update_internal_scope" ON "public"."farmer_leads" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND ("owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_research_assistant"() AND ("created_by_user_id" = "public"."get_current_user_id"())))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_accounts"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))) OR ("public"."is_salesperson"() AND ("owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_research_assistant"() AND ("created_by_user_id" = "public"."get_current_user_id"()))));



COMMENT ON POLICY "farmer_leads_update_internal_scope" ON "public"."farmer_leads" IS 'Lead update is role-scoped. Accounts and Stock / Dispatch are allowed broadly so app-level payment/install side effects can update the allowed fields.';



ALTER TABLE "public"."followups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "followups_insert_internal_scope" ON "public"."followups" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_stock_dispatch"() OR ("public"."is_rsm"() AND (("followup_owner_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "followups"."farmer_lead_id") AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."installations" "i"
  WHERE (("i"."id" = "followups"."installation_id") AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"()))))))) OR (("public"."is_salesperson"() OR "public"."is_research_assistant"()) AND ("followup_owner_user_id" = "public"."get_current_user_id"())) OR ("public"."is_agronomist"() AND (("followup_owner_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "followups"."followup_owner_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE))))))));



COMMENT ON POLICY "followups_insert_internal_scope" ON "public"."followups" IS 'Follow-up insert supports app-created follow-ups, including installation-created 15-day follow-ups.';



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


CREATE POLICY "institutions_insert_phase2_scope" ON "public"."institutions" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("public"."is_rsm"() AND ("created_by_user_id" = "public"."get_current_user_id"()) AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("primary_region_id" = "public"."current_region_id"()) OR ("primary_state" = "public"."current_state"())))));



COMMENT ON POLICY "institutions_insert_phase2_scope" ON "public"."institutions" IS 'Phase 2 draft institution creation for Admin, Sales Head, R&D Head, and regional RSM.';



CREATE POLICY "institutions_select_phase2_scope" ON "public"."institutions" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("account_owner_user_id" = "public"."get_current_user_id"()) OR ("sales_head_user_id" = "public"."get_current_user_id"()) OR ("rsm_user_id" = "public"."get_current_user_id"()) OR ("rd_head_user_id" = "public"."get_current_user_id"()) OR ("technical_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("primary_region_id" = "public"."current_region_id"()) OR ("primary_state" = "public"."current_state"())))));



COMMENT ON POLICY "institutions_select_phase2_scope" ON "public"."institutions" IS 'Phase 2 draft institution read scope for leadership, assigned owners, RSM regional/state scope, and R&D visibility.';



CREATE POLICY "institutions_update_phase2_scope" ON "public"."institutions" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("account_owner_user_id" = "public"."get_current_user_id"()) OR ("sales_head_user_id" = "public"."get_current_user_id"()) OR ("technical_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("primary_region_id" = "public"."current_region_id"()) OR ("primary_state" = "public"."current_state"()))))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("account_owner_user_id" = "public"."get_current_user_id"()) OR ("sales_head_user_id" = "public"."get_current_user_id"()) OR ("technical_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("primary_region_id" = "public"."current_region_id"()) OR ("primary_state" = "public"."current_state"())))));



COMMENT ON POLICY "institutions_update_phase2_scope" ON "public"."institutions" IS 'Phase 2 draft institution update scope. Detailed field restrictions remain in the app.';



ALTER TABLE "public"."pilot_visits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pilot_visits_insert_phase2_scope" ON "public"."pilot_visits" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("visited_by_user_id" = "public"."get_current_user_id"()) OR ("accompanied_by_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "pilot_visits"."pilot_id") AND ("p"."deleted_at" IS NULL) AND (("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"()) OR ("p"."agronomist_user_id" = "public"."get_current_user_id"()) OR ("p"."rsm_user_id" = "public"."get_current_user_id"())))))));



COMMENT ON POLICY "pilot_visits_insert_phase2_scope" ON "public"."pilot_visits" IS 'Phase 2 draft pilot visit creation for leadership/R&D, assigned visit owners, and accessible pilot owners.';



CREATE POLICY "pilot_visits_select_phase2_scope" ON "public"."pilot_visits" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("visited_by_user_id" = "public"."get_current_user_id"()) OR ("accompanied_by_user_id" = "public"."get_current_user_id"()) OR ("rd_head_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "pilot_visits"."pilot_id") AND ("p"."deleted_at" IS NULL) AND (("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"()) OR ("p"."agronomist_user_id" = "public"."get_current_user_id"()) OR ("p"."rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("p"."region_id" = "public"."current_region_id"()) OR ("p"."state" = "public"."current_state"()))) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "p"."research_assistant_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE)))))))))));



COMMENT ON POLICY "pilot_visits_select_phase2_scope" ON "public"."pilot_visits" IS 'Phase 2 draft pilot visit read scope follows assigned visit owners or accessible pilots.';



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



CREATE POLICY "pilots_select_phase2_scope" ON "public"."pilots" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_management"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("research_assistant_user_id" = "public"."get_current_user_id"()) OR ("agronomist_user_id" = "public"."get_current_user_id"()) OR ("rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()) OR (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "pilots"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND (("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))))) OR ("public"."is_salesperson"() AND (EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "pilots"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND ("fl"."owner_user_id" = "public"."get_current_user_id"()))))) OR ("public"."is_research_assistant"() AND ("research_assistant_user_id" = "public"."get_current_user_id"())) OR ("public"."is_agronomist"() AND (("agronomist_user_id" = "public"."get_current_user_id"()) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "pilots"."research_assistant_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE))))))));



COMMENT ON POLICY "pilots_select_phase2_scope" ON "public"."pilots" IS 'Phase 2 draft pilot read scope for leadership/R&D, assigned owners, RSM regional/state/lead scope, Salesperson owned-lead scope, and Agronomist managed/team pilots.';



CREATE POLICY "pilots_update_phase2_scope" ON "public"."pilots" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("research_assistant_user_id" = "public"."get_current_user_id"()) OR ("agronomist_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"()))))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("research_assistant_user_id" = "public"."get_current_user_id"()) OR ("agronomist_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("rsm_user_id" = "public"."get_current_user_id"()) OR ("region_id" = "public"."current_region_id"()) OR ("state" = "public"."current_state"())))));



COMMENT ON POLICY "pilots_update_phase2_scope" ON "public"."pilots" IS 'Phase 2 draft pilot update scope. R&D Head approval and detailed status changes remain app-controlled.';



ALTER TABLE "public"."regions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "regions_admin_insert" ON "public"."regions" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



COMMENT ON POLICY "regions_admin_insert" ON "public"."regions" IS 'Only Admin can create regions.';



CREATE POLICY "regions_admin_sales_head_update" ON "public"."regions" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"())) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"()));



COMMENT ON POLICY "regions_admin_sales_head_update" ON "public"."regions" IS 'Admin and Sales Head can update region records and targets. Detailed target-field restrictions remain in the app for now.';



CREATE POLICY "regions_select_internal_scope" ON "public"."regions" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR (("public"."get_current_user_id"() IS NOT NULL) AND ("is_active" IS TRUE))));



COMMENT ON POLICY "regions_select_internal_scope" ON "public"."regions" IS 'Admin and Sales Head can read all regions, including inactive. Active internal users can read active regions for assignments and filters.';



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_admin_insert" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



COMMENT ON POLICY "users_admin_insert" ON "public"."users" IS 'Only Admin can create internal users.';



CREATE POLICY "users_admin_update" ON "public"."users" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



COMMENT ON POLICY "users_admin_update" ON "public"."users" IS 'Only Admin can update internal users, including deactivate/reactivate metadata.';



CREATE POLICY "users_select_internal_scope" ON "public"."users" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (("public"."get_current_user_id"() IS NOT NULL) AND ("is_active" IS TRUE))));



COMMENT ON POLICY "users_select_internal_scope" ON "public"."users" IS 'Admin can read all users, including inactive. Active internal users can read all active users for dropdowns, hierarchy, display names, and assignments.';



ALTER TABLE "public"."visit_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "visit_reports_insert_phase2_scope" ON "public"."visit_reports" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR (("submitted_by_user_id" = "public"."get_current_user_id"()) AND ("public"."is_rsm"() OR "public"."is_salesperson"() OR "public"."is_research_assistant"() OR "public"."is_agronomist"()) AND ((EXISTS ( SELECT 1
   FROM "public"."farmer_leads" "fl"
  WHERE (("fl"."id" = "visit_reports"."farmer_lead_id") AND ("fl"."deleted_at" IS NULL) AND (("fl"."owner_user_id" = "public"."get_current_user_id"()) OR ("fl"."created_by_user_id" = "public"."get_current_user_id"()) OR ("fl"."rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("fl"."region_id" = "public"."current_region_id"()) OR ("fl"."state" = "public"."current_state"()))))))) OR (EXISTS ( SELECT 1
   FROM "public"."pilots" "p"
  WHERE (("p"."id" = "visit_reports"."pilot_id") AND ("p"."deleted_at" IS NULL) AND (("p"."pilot_owner_user_id" = "public"."get_current_user_id"()) OR ("p"."research_assistant_user_id" = "public"."get_current_user_id"()) OR ("p"."agronomist_user_id" = "public"."get_current_user_id"()) OR ("p"."rsm_user_id" = "public"."get_current_user_id"()) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "p"."research_assistant_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE))))))))) OR (EXISTS ( SELECT 1
   FROM ("public"."installations" "i"
     LEFT JOIN "public"."farmer_leads" "fl" ON (("fl"."id" = "i"."farmer_lead_id")))
  WHERE (("i"."id" = "visit_reports"."installation_id") AND ("i"."deleted_at" IS NULL) AND (("i"."rsm_user_id" = "public"."get_current_user_id"()) OR ("fl"."owner_user_id" = "public"."get_current_user_id"()) OR ("fl"."created_by_user_id" = "public"."get_current_user_id"()) OR ("public"."is_rsm"() AND (("i"."region_id" = "public"."current_region_id"()) OR ("i"."state" = "public"."current_state"()))))))) OR (("report_type" = 'Farmer Sale 15-Day Follow-up'::"public"."report_type") AND (EXISTS ( SELECT 1
   FROM "public"."followups" "f"
  WHERE (("f"."farmer_lead_id" = "visit_reports"."farmer_lead_id") AND ("f"."installation_id" = "visit_reports"."installation_id") AND ("f"."followup_status" = ANY (ARRAY['Due'::"public"."followup_status", 'Rescheduled'::"public"."followup_status", 'Escalated'::"public"."followup_status", 'Completed'::"public"."followup_status"])) AND (("f"."followup_owner_user_id" = "public"."get_current_user_id"()) OR ("public"."is_agronomist"() AND (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."id" = "f"."followup_owner_user_id") AND ("u"."role" = 'Research Assistant'::"public"."user_role") AND ("u"."reports_to_user_id" = "public"."get_current_user_id"()) AND ("u"."is_active" IS TRUE))))))))))))));



COMMENT ON POLICY "visit_reports_insert_phase2_scope" ON "public"."visit_reports" IS 'Phase 2 draft report creation allows allowed field/R&D users to submit post-installation follow-up or pilot reports within their scope.';



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



CREATE POLICY "visit_reports_update_phase2_scope" ON "public"."visit_reports" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("submitted_by_user_id" = "public"."get_current_user_id"()))) WITH CHECK (("public"."is_admin"() OR "public"."is_sales_head"() OR "public"."is_rd_head"() OR ("submitted_by_user_id" = "public"."get_current_user_id"())));



COMMENT ON POLICY "visit_reports_update_phase2_scope" ON "public"."visit_reports" IS 'Phase 2 draft report update allows R&D Head final report approval and submitter draft updates. Detailed status/approval restrictions remain in the app.';
































































































































































