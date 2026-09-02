"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Save, Search } from "lucide-react";
import { StateDistrictSelect } from "@/src/components/location/StateDistrictSelect";
import {
  defaultDispatchStatus,
  defaultPaymentRequirementType,
  destinationTypeOptions,
  dispatchRouteOptions,
  dispatchStatusOptions,
  dispatchTypeOptions,
  paymentRequirementOptions
} from "@/lib/dispatches/options";
import {
  inventoryPoolOptions,
  labelFor as labelForDeviceOption
} from "@/lib/devices/options";
import type {
  Dispatch,
  DispatchDealerOption,
  DispatchDeviceOption,
  DispatchFarmerLeadOption,
  DispatchInstitutionOption,
  DispatchInstitutionSaleLineOption,
  DispatchPilotOption
} from "@/lib/dispatches/types";

type DispatchFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  dealers?: DispatchDealerOption[];
  dispatch?: Dispatch;
  devices: DispatchDeviceOption[];
  error?: string | null;
  farmerLeads?: DispatchFarmerLeadOption[];
  institutionFarmerLeads?: DispatchFarmerLeadOption[];
  institutionOptions?: DispatchInstitutionOption[];
  institutionSaleLines?: DispatchInstitutionSaleLineOption[];
  initialDispatchRoute?: string;
  initialFarmerLeadId?: string;
  initialInstitutionId?: string;
  initialInstitutionSaleOrderLineId?: string;
  initialPilotId?: string;
  canConfirmPayment?: boolean;
  canUseManualException?: boolean;
  mode: "create" | "edit";
  pilots?: DispatchPilotOption[];
  pilotsLoadError?: string | null;
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
}

function textAreaClassName() {
  return "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function dateValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function deviceLabel(device: DispatchDeviceOption) {
  const code = device.device_code ? ` · ${device.device_code}` : "";
  const pool = labelForDeviceOption(device.inventory_pool, inventoryPoolOptions);
  return `${device.serial_number}${code} · ${device.product_model} · ${pool} · ${device.device_status}`;
}

function deviceSearchText(device: DispatchDeviceOption) {
  return [
    device.serial_number,
    device.device_code,
    device.product_model,
    device.device_status,
    device.current_holder_name_snapshot,
    device.current_location_text,
    device.inventory_pool
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function leadLabel(lead: DispatchFarmerLeadOption) {
  return `${lead.lead_code} · ${lead.farmer_name} · ${lead.village}, ${lead.district}`;
}

function pilotLabel(pilot: DispatchPilotOption) {
  return `${pilot.pilot_code} · ${pilot.pilot_name} · ${pilot.farmer_name_snapshot}, ${pilot.district}`;
}

function dealerLabel(dealer: DispatchDealerOption) {
  const primaryName = dealer.firm_name || dealer.dealer_name;
  return `${dealer.dealer_code} · ${primaryName} · ${dealer.district}, ${dealer.state}`;
}

function institutionSaleLineLabel(line: DispatchInstitutionSaleLineOption) {
  return `${line.order_code} · ${line.organization_name} pays · ${line.farmer_name}, ${line.district}`;
}

function institutionSalePayerLabel(
  institution: DispatchInstitutionOption,
  institutionSaleLines: DispatchInstitutionSaleLineOption[]
) {
  const allocationCount = institutionSaleLines.filter(
    (line) => line.institution_id === institution.id
  ).length;
  const code = institution.institution_code
    ? ` · ${institution.institution_code}`
    : "";

  return `${institution.organization_name}${code} (${allocationCount} ready allocation${
    allocationCount === 1 ? "" : "s"
  })`;
}

function isWarehouseDispatchDevice(device: DispatchDeviceOption) {
  return (
    ["In Warehouse", "Reserved"].includes(device.device_status) &&
    device.current_holder_type === "Warehouse"
  );
}

function routeForDispatch(dispatch?: Dispatch) {
  if (dispatch?.dispatch_type === "Institution Dispatch") {
    return "Institution Funded Farmer Sale";
  }

  if (dispatch?.dispatch_type === "Farmer Sale Dispatch") {
    return "Paid Farmer Sale";
  }

  if (dispatch?.dispatch_type === "Pilot Dispatch") {
    return "Free Pilot";
  }

  if (
    dispatch?.dispatch_type === "Dealer Stock Dispatch" ||
    dispatch?.destination_dealer_id ||
    dispatch?.linked_dealer_id
  ) {
    return "Dealer Dispatch";
  }

  return "Admin Manual Exception";
}

function SubmitButton({
  disabled = false,
  label
}: {
  disabled?: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={pending || disabled}
      type="submit"
    >
      <Save className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving..." : label}
    </button>
  );
}

export function DispatchForm({
  action,
  cancelHref,
  dealers = [],
  dispatch,
  devices,
  error,
  farmerLeads = [],
  institutionFarmerLeads = [],
  institutionOptions = [],
  institutionSaleLines = [],
  initialDispatchRoute,
  initialFarmerLeadId,
  initialInstitutionId,
  initialInstitutionSaleOrderLineId,
  initialPilotId,
  canConfirmPayment = false,
  canUseManualException = false,
  mode,
  pilots = [],
  pilotsLoadError
}: DispatchFormProps) {
  const initialInstitutionSaleLine = institutionSaleLines.find(
    (line) =>
      line.id ===
      (initialInstitutionSaleOrderLineId ??
        dispatch?.institution_sale_order_line_id)
  );
  const allFarmerLeadOptions = [...farmerLeads, ...institutionFarmerLeads];
  const initialLead = allFarmerLeadOptions.find(
    (lead) =>
      lead.id ===
      (initialInstitutionSaleLine?.farmer_lead_id ??
        initialFarmerLeadId ??
        dispatch?.destination_farmer_lead_id ??
        dispatch?.linked_farmer_lead_id)
  );
  const initialInstitution = institutionOptions.find(
    (institution) =>
      institution.id ===
      (initialInstitutionSaleLine?.institution_id ??
        initialInstitutionId ??
        dispatch?.destination_institution_id ??
        dispatch?.linked_institution_id)
  );
  const initialPilot = pilots.find(
    (pilot) =>
      pilot.id ===
      (initialPilotId ?? dispatch?.destination_pilot_id ?? dispatch?.linked_pilot_id)
  );
  const initialDealer = dealers.find(
    (dealer) =>
      dealer.id === (dispatch?.destination_dealer_id ?? dispatch?.linked_dealer_id)
  );
  const initialDevice = useMemo(
    () =>
      devices.find((device) => device.id === dispatch?.device_id) ??
      devices.find(
        (device) => device.serial_number === dispatch?.serial_number_snapshot
      ),
    [devices, dispatch?.device_id, dispatch?.serial_number_snapshot]
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState(
    dispatch?.device_id ?? initialDevice?.id ?? ""
  );
  const [selectedBatchDeviceIds, setSelectedBatchDeviceIds] = useState<string[]>(
    []
  );
  const [deviceSearch, setDeviceSearch] = useState("");
  const [batchDeviceSearch, setBatchDeviceSearch] = useState("");
  const [batchProductModelFilter, setBatchProductModelFilter] = useState("");
  const [serialNumber, setSerialNumber] = useState(
    dispatch?.serial_number_snapshot ?? initialDevice?.serial_number ?? ""
  );
  const [productModel, setProductModel] = useState(
    dispatch?.product_model ?? initialDevice?.product_model ?? ""
  );
  const [dispatchType, setDispatchType] = useState(
    dispatch?.dispatch_type ?? ""
  );
  const [dispatchRoute, setDispatchRoute] = useState(
    initialDispatchRoute ??
      (initialPilotId
      ? "Free Pilot"
      : initialInstitutionSaleLine
        ? "Institution Funded Farmer Sale"
      : initialFarmerLeadId
        ? "Paid Farmer Sale"
        : mode === "edit"
          ? routeForDispatch(dispatch)
          : "Paid Farmer Sale")
  );
  const [destinationType, setDestinationType] = useState(
    initialLead
      ? "Farmer"
      : initialPilot
        ? "Pilot"
        : initialDealer
          ? "Dealer"
          : initialInstitution
            ? "Institution"
            : dispatch?.destination_type ?? ""
  );
  const [selectedLeadId, setSelectedLeadId] = useState(
    initialFarmerLeadId ??
      dispatch?.destination_farmer_lead_id ??
      dispatch?.linked_farmer_lead_id ??
      ""
  );
  const [selectedPilotId, setSelectedPilotId] = useState(
    initialPilotId ??
      dispatch?.destination_pilot_id ??
      dispatch?.linked_pilot_id ??
      ""
  );
  const [selectedDealerId, setSelectedDealerId] = useState(
    dispatch?.destination_dealer_id ?? dispatch?.linked_dealer_id ?? ""
  );
  const [selectedInstitutionSaleLineId, setSelectedInstitutionSaleLineId] =
    useState(
      initialInstitutionSaleOrderLineId ??
        dispatch?.institution_sale_order_line_id ??
        initialInstitutionSaleLine?.id ??
        ""
    );
  const [selectedInstitutionId, setSelectedInstitutionId] = useState(
    initialInstitutionSaleLine?.institution_id ??
      initialInstitutionId ??
      dispatch?.destination_institution_id ??
      dispatch?.linked_institution_id ??
      ""
  );
  const [destinationName, setDestinationName] = useState(
    initialLead?.farmer_name ??
      initialPilot?.pilot_name ??
      initialDealer?.firm_name ??
      initialDealer?.dealer_name ??
      initialInstitution?.organization_name ??
      dispatch?.destination_name_snapshot ??
      ""
  );
  const [destinationContact, setDestinationContact] = useState(
      initialLead?.mobile_number ??
      initialPilot?.farmer_mobile_snapshot ??
      initialDealer?.contact_number ??
      initialInstitution?.main_contact_number ??
      dispatch?.destination_contact_snapshot ??
      ""
  );
  const [destinationAddress, setDestinationAddress] = useState(
      initialLead?.village ??
      initialPilot?.village ??
      initialDealer?.dealer_address ??
      dispatch?.destination_address ??
      ""
  );
  const [paymentConfirmed, setPaymentConfirmed] = useState(
    Boolean(initialInstitutionSaleLine) ||
      initialLead?.payment_confirmed ||
      dispatch?.payment_confirmed ||
      false
  );
  const [stateValue, setStateValue] = useState(
      initialLead?.state ??
      initialPilot?.state ??
      initialDealer?.state ??
      initialInstitution?.primary_state ??
      dispatch?.destination_state ??
      ""
  );
  const [districtValue, setDistrictValue] = useState(
    initialLead?.district ??
      initialPilot?.district ??
      initialDealer?.district ??
      initialInstitution?.districts_covered ??
      dispatch?.destination_district ??
      ""
  );
  const isFarmerSaleRoute = dispatchRoute === "Paid Farmer Sale";
  const isInstitutionSaleRoute =
    dispatchRoute === "Institution Funded Farmer Sale";
  const isPilotRoute = dispatchRoute === "Free Pilot";
  const isDealerRoute = dispatchRoute === "Dealer Dispatch";
  const isManualRoute = dispatchRoute === "Admin Manual Exception";
  const isBatchDeviceRoute =
    mode === "create" && (isDealerRoute || isInstitutionSaleRoute);
  const paymentConfirmationLocked =
    isFarmerSaleRoute ||
    (isInstitutionSaleRoute && Boolean(selectedInstitutionSaleLineId)) ||
    isPilotRoute ||
    !canConfirmPayment;
  const submitDisabled = isPilotRoute && Boolean(pilotsLoadError);
  const effectiveDispatchType = isFarmerSaleRoute
    ? "Farmer Sale Dispatch"
    : isInstitutionSaleRoute
      ? "Institution Dispatch"
    : isPilotRoute
      ? "Pilot Dispatch"
      : isDealerRoute
        ? "Dealer Stock Dispatch"
        : dispatchType;
  const effectiveDestinationType = isFarmerSaleRoute
    ? "Farmer"
    : isInstitutionSaleRoute
      ? selectedLeadId || selectedInstitutionSaleLineId
        ? "Farmer"
        : "Institution"
    : isPilotRoute
      ? "Pilot"
      : isDealerRoute
        ? "Dealer"
        : destinationType;
  const routeEligibleDevices = devices.filter((device) => {
    const isCurrentDispatchDevice =
      mode === "edit" &&
      Boolean(dispatch?.device_id) &&
      device.id === dispatch?.device_id;

    if (isCurrentDispatchDevice) {
      return true;
    }

    if (isFarmerSaleRoute || isInstitutionSaleRoute || isDealerRoute) {
      return (
        device.inventory_pool === "Fresh Sale" &&
        isWarehouseDispatchDevice(device)
      );
    }

    if (isPilotRoute) {
      return (
        device.inventory_pool === "Pilot Stock" &&
        isWarehouseDispatchDevice(device)
      );
    }

    return isWarehouseDispatchDevice(device);
  });
  const normalizedDeviceSearch = deviceSearch.trim().toLowerCase();
  const filteredDevices = routeEligibleDevices.filter((device) => {
    if (selectedDeviceId && device.id === selectedDeviceId) {
      return true;
    }

    if (!normalizedDeviceSearch) {
      return true;
    }

    return deviceSearchText(device).includes(normalizedDeviceSearch);
  });
  const matchingDeviceCount = normalizedDeviceSearch
    ? routeEligibleDevices.filter((device) =>
        deviceSearchText(device).includes(normalizedDeviceSearch)
      ).length
    : routeEligibleDevices.length;
  const batchDispatchDevices = routeEligibleDevices;
  const visibleBatchDispatchDevices = batchDispatchDevices.filter((device) => {
    const matchesSearch =
      !batchDeviceSearch.trim() ||
      deviceSearchText(device).includes(batchDeviceSearch.trim().toLowerCase());
    const matchesProductModel =
      !batchProductModelFilter ||
      device.product_model === batchProductModelFilter;

    return matchesSearch && matchesProductModel;
  });
  const selectedBatchDeviceSet = new Set(selectedBatchDeviceIds);
  const firstSelectedBatchDevice = batchDispatchDevices.find(
    (device) => device.id === selectedBatchDeviceIds[0]
  );
  const selectedInstitutionSaleLine = institutionSaleLines.find(
    (line) => line.id === selectedInstitutionSaleLineId
  );
  const selectedInstitutionFarmerLead = institutionFarmerLeads.find(
    (lead) => lead.id === selectedLeadId
  );
  const selectedInstitution = institutionOptions.find(
    (institution) => institution.id === selectedInstitutionId
  );
  const institutionSalePayers = useMemo(() => {
    const payers = new Map<string, DispatchInstitutionOption>();

    for (const institution of institutionOptions) {
      payers.set(institution.id, institution);
    }

    for (const line of institutionSaleLines) {
      if (!payers.has(line.institution_id)) {
        payers.set(line.institution_id, {
          id: line.institution_id,
          business_sector: null,
          institution_code: "",
          organization_name: line.organization_name,
          main_contact_number: null,
          primary_state: null,
          districts_covered: null
        });
      }
    }

    return Array.from(payers.values()).sort((first, second) =>
      first.organization_name.localeCompare(second.organization_name)
    );
  }, [institutionOptions, institutionSaleLines]);
  const filteredInstitutionSaleLines = selectedInstitutionId
    ? institutionSaleLines.filter(
        (line) =>
          line.institution_id === selectedInstitutionId &&
          (!selectedLeadId || line.farmer_lead_id === selectedLeadId)
      )
    : institutionSaleLines.filter(
        (line) => !selectedLeadId || line.farmer_lead_id === selectedLeadId
      );
  const visibleBatchDeviceIds = visibleBatchDispatchDevices.map(
    (device) => device.id
  );
  const allVisibleBatchDevicesSelected =
    visibleBatchDeviceIds.length > 0 &&
    visibleBatchDeviceIds.every((id) => selectedBatchDeviceSet.has(id));

  function applyInstitutionDestination(institutionId: string) {
    const institution = institutionOptions.find(
      (option) => option.id === institutionId
    );

    if (!institution) {
      setDestinationName("");
      setDestinationContact("");
      setStateValue("");
      setDistrictValue("");
      setDestinationAddress("");
      return;
    }

    setDestinationType("Institution");
    setDestinationName(institution.organization_name);
    setDestinationContact(institution.main_contact_number ?? "");
    setStateValue(institution.primary_state ?? "");
    setDistrictValue(institution.districts_covered ?? "");
    setDestinationAddress("");
  }

  function applyLead(leadId: string) {
    setSelectedLeadId(leadId);
    const lead = farmerLeads.find((option) => option.id === leadId);

    if (!lead) {
      setDestinationName("");
      setDestinationContact("");
      setStateValue("");
      setDistrictValue("");
      setDestinationAddress("");
      setPaymentConfirmed(false);
      return;
    }

    setDestinationType("Farmer");
    setDestinationName(lead.farmer_name);
    setDestinationContact(lead.mobile_number);
    setStateValue(lead.state);
    setDistrictValue(lead.district);
    setDestinationAddress(lead.village);
    setPaymentConfirmed(lead.payment_confirmed);
  }

  function applyInstitutionSaleLine(lineId: string) {
    setSelectedInstitutionSaleLineId(lineId);
    const line = institutionSaleLines.find((option) => option.id === lineId);

    if (!line) {
      setSelectedLeadId("");
      setPaymentConfirmed(false);
      if (selectedInstitutionId) {
        applyInstitutionDestination(selectedInstitutionId);
        return;
      }

      setDestinationName("");
      setDestinationContact("");
      setStateValue("");
      setDistrictValue("");
      setDestinationAddress("");
      return;
    }

    setDestinationType("Farmer");
    setSelectedInstitutionId(line.institution_id);
    setSelectedLeadId(line.farmer_lead_id);
    setDestinationName(line.farmer_name);
    setDestinationContact(line.mobile_number);
    setStateValue(line.state);
    setDistrictValue(line.district);
    setDestinationAddress(line.village);
    setPaymentConfirmed(true);
  }

  function applyInstitutionPayer(institutionId: string) {
    setSelectedInstitutionId(institutionId);

    if (!institutionId) {
      setSelectedInstitutionSaleLineId("");
      setPaymentConfirmed(false);
      if (!selectedLeadId) {
        setDestinationName("");
        setDestinationContact("");
        setStateValue("");
        setDistrictValue("");
        setDestinationAddress("");
      }
      return;
    }

    const selectedLine = institutionSaleLines.find(
      (line) => line.id === selectedInstitutionSaleLineId
    );
    const matchingLines = institutionSaleLines.filter(
      (line) =>
        line.institution_id === institutionId &&
        (!selectedLeadId || line.farmer_lead_id === selectedLeadId)
    );

    if (selectedLeadId && matchingLines.length === 1) {
      applyInstitutionSaleLine(matchingLines[0].id);
      return;
    }

    if (!selectedLeadId) {
      setSelectedInstitutionSaleLineId("");
      setPaymentConfirmed(false);
      applyInstitutionDestination(institutionId);
      return;
    }

    if (!selectedLine || selectedLine.institution_id === institutionId) {
      return;
    }

    setSelectedInstitutionSaleLineId("");
    setPaymentConfirmed(false);
  }

  function applyInstitutionFarmerLead(leadId: string) {
    setSelectedLeadId(leadId);

    if (!leadId) {
      setSelectedInstitutionSaleLineId("");
      setPaymentConfirmed(false);
      if (selectedInstitutionId) {
        applyInstitutionDestination(selectedInstitutionId);
        return;
      }

      setDestinationName("");
      setDestinationContact("");
      setStateValue("");
      setDistrictValue("");
      setDestinationAddress("");
      return;
    }

    const matchingLines = institutionSaleLines.filter(
      (line) =>
        line.farmer_lead_id === leadId &&
        (!selectedInstitutionId || line.institution_id === selectedInstitutionId)
    );

    if (leadId && matchingLines.length === 1) {
      applyInstitutionSaleLine(matchingLines[0].id);
      return;
    }

    setSelectedInstitutionSaleLineId("");

    const lead = institutionFarmerLeads.find((option) => option.id === leadId);

    if (!lead) {
      setDestinationName("");
      setDestinationContact("");
      setStateValue("");
      setDistrictValue("");
      setDestinationAddress("");
      setPaymentConfirmed(false);
      return;
    }

    setDestinationType("Farmer");
    setDestinationName(lead.farmer_name);
    setDestinationContact(lead.mobile_number);
    setStateValue(lead.state);
    setDistrictValue(lead.district);
    setDestinationAddress(lead.village);
    setPaymentConfirmed(false);
  }

  function applyPilot(pilotId: string) {
    setSelectedPilotId(pilotId);
    const pilot = pilots.find((option) => option.id === pilotId);

    if (!pilot) {
      setDestinationName("");
      setDestinationContact("");
      setStateValue("");
      setDistrictValue("");
      setDestinationAddress("");
      setPaymentConfirmed(false);
      return;
    }

    setDestinationType("Pilot");
    setDestinationName(pilot.pilot_name);
    setDestinationContact(pilot.farmer_mobile_snapshot);
    setStateValue(pilot.state);
    setDistrictValue(pilot.district);
    setDestinationAddress(pilot.village);
    setPaymentConfirmed(false);
  }

  function applyDealer(dealerId: string) {
    setSelectedDealerId(dealerId);
    const dealer = dealers.find((option) => option.id === dealerId);

    if (!dealer) {
      setDestinationName("");
      setDestinationContact("");
      setStateValue("");
      setDistrictValue("");
      setDestinationAddress("");
      setPaymentConfirmed(false);
      return;
    }

    setDestinationType("Dealer");
    setDestinationName(dealer.firm_name || dealer.dealer_name);
    setDestinationContact(dealer.contact_number);
    setStateValue(dealer.state);
    setDistrictValue(dealer.district);
    setDestinationAddress(dealer.dealer_address ?? "");
    setPaymentConfirmed(false);
  }

  function changeRoute(nextRoute: string) {
    setDispatchRoute(nextRoute);
    setSelectedDeviceId("");
    setSerialNumber("");
    setProductModel("");
    setSelectedLeadId("");
    setSelectedPilotId("");
    setSelectedDealerId("");
    setSelectedInstitutionSaleLineId("");
    setSelectedInstitutionId("");
    setDeviceSearch("");
    setSelectedBatchDeviceIds([]);
    setBatchDeviceSearch("");
    setBatchProductModelFilter("");

    if (nextRoute === "Paid Farmer Sale") {
      setDispatchType("Farmer Sale Dispatch");
      setDestinationType("Farmer");
      setPaymentConfirmed(false);
      return;
    }

    if (nextRoute === "Institution Funded Farmer Sale") {
      setDispatchType("Institution Dispatch");
      setDestinationType("Institution");
      setPaymentConfirmed(false);
      return;
    }

    if (nextRoute === "Free Pilot") {
      setDispatchType("Pilot Dispatch");
      setDestinationType("Pilot");
      setPaymentConfirmed(false);
      return;
    }

    if (nextRoute === "Dealer Dispatch") {
      setDispatchType("Dealer Stock Dispatch");
      setDestinationType("Dealer");
      setPaymentConfirmed(false);
      return;
    }

    setDispatchType("");
    setDestinationType("");
    setPaymentConfirmed(false);
  }

  return (
    <form action={action} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Dispatch details
        </h2>
        <input name="dispatch_route" type="hidden" value={dispatchRoute} />
        {!isManualRoute ? (
          <>
            <input name="dispatch_type" type="hidden" value={effectiveDispatchType} />
            <input
              name="destination_type"
              type="hidden"
              value={effectiveDestinationType}
            />
          </>
        ) : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="dispatch_route"
            >
              Dispatch route
            </label>
            <select
              className={inputClassName()}
              disabled={mode === "edit"}
              id="dispatch_route"
              onChange={(event) => changeRoute(event.target.value)}
              required
              value={dispatchRoute}
            >
              {dispatchRouteOptions
                .filter(
                  (option) =>
                    option.value !== "Admin Manual Exception" ||
                    canUseManualException ||
                    isManualRoute
                )
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {isFarmerSaleRoute
                ? "Paid farmer dispatches use fresh sale devices only."
                : isInstitutionSaleRoute
                  ? "Institution-funded farmer sales use Fresh Sale devices, with the institution as payer. Farmer assignment can be added now or during installation."
                : isPilotRoute
                  ? "Free pilots use pilot-dedicated devices only."
                  : isDealerRoute
                    ? "Dealer Dispatch is a sale to the dealer. Accounts must confirm payment before dispatch."
                    : "Manual dispatch is an Admin exception for unusual stock movement."}
            </p>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="dispatch_code"
            >
              Dispatch code
            </label>
            <input
              className={inputClassName()}
              defaultValue={dispatch?.dispatch_code ?? ""}
              id="dispatch_code"
              name="dispatch_code"
              placeholder="Auto-generated if blank"
              type="text"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="dispatch_date"
            >
              Dispatch date
            </label>
            <input
              className={inputClassName()}
              defaultValue={dateValue(dispatch?.dispatch_date)}
              id="dispatch_date"
              name="dispatch_date"
              type="date"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="dispatch_status"
            >
              Dispatch status
            </label>
            <select
              className={inputClassName()}
              defaultValue={dispatch?.dispatch_status ?? defaultDispatchStatus}
              id="dispatch_status"
              name="dispatch_status"
              required
            >
              {dispatchStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {isManualRoute ? (
            <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="dispatch_type"
            >
              Dispatch type
            </label>
            <select
              className={inputClassName()}
              id="dispatch_type"
              name="dispatch_type"
              onChange={(event) => {
                const nextDispatchType = event.target.value;
                setDispatchType(nextDispatchType);

                if (nextDispatchType !== "Farmer Sale Dispatch") {
                  setSelectedLeadId("");
                }
              }}
              required
              value={dispatchType}
            >
              <option value="">Select dispatch type</option>
              {dispatchTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          {isBatchDeviceRoute
            ? "Devices for dispatch"
            : "Device for dispatch"}
        </h2>
        {isBatchDeviceRoute ? (
          <div className="mt-4 space-y-4">
            {selectedBatchDeviceIds.map((deviceId) => (
              <input key={deviceId} name="device_ids" type="hidden" value={deviceId} />
            ))}
            <input
              name="device_id"
              type="hidden"
              value={firstSelectedBatchDevice?.id ?? ""}
            />
            <input
              name="serial_number_snapshot"
              type="hidden"
              value={firstSelectedBatchDevice?.serial_number ?? ""}
            />
            <input
              name="product_model"
              type="hidden"
              value={firstSelectedBatchDevice?.product_model ?? ""}
            />

            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Search
                </span>
                <input
                  className={inputClassName()}
                  onChange={(event) => setBatchDeviceSearch(event.target.value)}
                  placeholder="Search by serial number or product model"
                  type="search"
                  value={batchDeviceSearch}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Product model
                </span>
                <select
                  className={inputClassName()}
                  onChange={(event) =>
                    setBatchProductModelFilter(event.target.value)
                  }
                  value={batchProductModelFilter}
                >
                  <option value="">All models</option>
                  {Array.from(
                    new Set(batchDispatchDevices.map((device) => device.product_model))
                  ).map((productModelOption) => (
                    <option key={productModelOption} value={productModelOption}>
                      {productModelOption}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-700">
                {selectedBatchDeviceIds.length} devices selected
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={visibleBatchDeviceIds.length === 0}
                  onClick={() => {
                    setSelectedBatchDeviceIds((current) => {
                      const merged = new Set(current);
                      for (const id of visibleBatchDeviceIds) {
                        merged.add(id);
                      }
                      return Array.from(merged);
                    });
                  }}
                  type="button"
                >
                  {allVisibleBatchDevicesSelected
                    ? "All visible selected"
                    : "Select all visible"}
                </button>
                <button
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedBatchDeviceIds.length === 0}
                  onClick={() => setSelectedBatchDeviceIds([])}
                  type="button"
                >
                  Clear selection
                </button>
              </div>
            </div>

            {batchDispatchDevices.length === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
                No eligible Fresh Sale devices are available. Check device pool
                and warehouse status.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-md border border-slate-200">
                {visibleBatchDispatchDevices.length ? (
                  <div className="divide-y divide-slate-200">
                    {visibleBatchDispatchDevices.map((device) => (
                      <label
                        className="flex cursor-pointer gap-3 bg-white px-3 py-3 text-sm hover:bg-slate-50"
                        key={device.id}
                      >
                        <input
                          checked={selectedBatchDeviceSet.has(device.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          onChange={(event) => {
                            setSelectedBatchDeviceIds((current) =>
                              event.target.checked
                                ? [...current, device.id]
                                : current.filter((id) => id !== device.id)
                            );
                          }}
                          type="checkbox"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-slate-950">
                            {device.serial_number}
                            {device.device_code ? ` · ${device.device_code}` : ""}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            {device.product_model} · {device.device_status} ·{" "}
                            {labelForDeviceOption(
                              device.inventory_pool,
                              inventoryPoolOptions
                            )}{" "}
                            · {device.current_location_text || "Warehouse"}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="bg-white px-3 py-4 text-sm text-slate-500">
                    No devices match the current search/filter.
                  </p>
                )}
              </div>
            )}
            <p className="text-xs leading-5 text-slate-500">
              The app creates one dispatch row per selected serial-numbered
              device so each device remains traceable.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Search devices
                </span>
                <span className="relative block">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className={`${inputClassName()} pl-9`}
                    onChange={(event) => setDeviceSearch(event.target.value)}
                    placeholder="Search serial, model, code, pool, or location"
                    type="search"
                    value={deviceSearch}
                  />
                </span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700"
                htmlFor="device_id"
              >
                Device
              </label>
              <select
                className={inputClassName()}
                id="device_id"
                name="device_id"
                onChange={(event) => {
                  const device = devices.find(
                    (option) => option.id === event.target.value
                  );
                  setSelectedDeviceId(event.target.value);
                  setSerialNumber(device?.serial_number ?? "");
                  setProductModel(device?.product_model ?? "");
                }}
                required
                value={selectedDeviceId}
              >
                <option value="">Select serial-numbered device</option>
                {filteredDevices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {deviceLabel(device)}
                  </option>
                ))}
              </select>
              {filteredDevices.length === 0 ? (
                <p className="mt-1 text-xs leading-5 text-amber-700">
                  {routeEligibleDevices.length === 0
                    ? "No eligible devices found for this route. Check device pool and warehouse status."
                    : "No devices match the current search."}
                </p>
              ) : (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Showing {matchingDeviceCount} of {routeEligibleDevices.length}{" "}
                  eligible devices for this route.
                </p>
              )}
            </div>

            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700"
                htmlFor="serial_number_snapshot"
              >
                Serial number
              </label>
              <input
                className={inputClassName()}
                id="serial_number_snapshot"
                name="serial_number_snapshot"
                readOnly
                required
                type="text"
                value={serialNumber}
              />
            </div>

            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700"
                htmlFor="product_model"
              >
                Product model
              </label>
              <input
                className={inputClassName()}
                id="product_model"
                name="product_model"
                readOnly
                required
                type="text"
                value={productModel}
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Destination
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {isFarmerSaleRoute ? (
            <div className="md:col-span-2">
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700"
                htmlFor="destination_farmer_lead_id"
              >
                Paid farmer lead ready for dispatch
              </label>
              <select
                className={inputClassName()}
                id="destination_farmer_lead_id"
                name="destination_farmer_lead_id"
                onChange={(event) => applyLead(event.target.value)}
                required
                value={selectedLeadId}
              >
                <option value="">Select paid, not-yet-dispatched lead</option>
                {farmerLeads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {leadLabel(lead)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Farmer Sale Dispatches can be created only for paid farmer
                leads that have not yet been dispatched.
              </p>
            </div>
          ) : isInstitutionSaleRoute ? (
            <>
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                  htmlFor="destination_institution_filter_id"
                >
                  Institution payer
                </label>
                <select
                  className={inputClassName()}
                  id="destination_institution_filter_id"
                  onChange={(event) => applyInstitutionPayer(event.target.value)}
                  required
                  value={selectedInstitutionId}
                >
                  <option value="">Select institution payer</option>
                  {institutionSalePayers.map((institution) => (
                    <option key={institution.id} value={institution.id}>
                      {institutionSalePayerLabel(institution, institutionSaleLines)}
                    </option>
                  ))}
                </select>
                {institutionSalePayers.length === 0 ? (
                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    No active institution payers are visible to your role.
                  </p>
                ) : (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choose the paying institution. Farmer selection can be added
                    now if known, or later during installation.
                  </p>
                )}
              </div>

              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                  htmlFor="institution_farmer_lead_filter_id"
                >
                  Farmer lead optional
                </label>
                <select
                  className={inputClassName()}
                  id="institution_farmer_lead_filter_id"
                  onChange={(event) =>
                    applyInstitutionFarmerLead(event.target.value)
                  }
                  value={selectedLeadId}
                >
                  <option value="">Assign farmer later</option>
                  {institutionFarmerLeads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {leadLabel(lead)}
                    </option>
                  ))}
                </select>
                {institutionFarmerLeads.length === 0 ? (
                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    No farmer leads are currently in the Pilot Agreed funnel
                    stage.
                  </p>
                ) : (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choose a Pilot Agreed farmer only when the recipient is
                    already known.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                  htmlFor="institution_sale_order_line_id"
                >
                  Institution-paid farmer allocation
                </label>
                <select
                  className={inputClassName()}
                  disabled={!selectedInstitutionId}
                  id="institution_sale_order_line_id"
                  name="institution_sale_order_line_id"
                  onChange={(event) =>
                    applyInstitutionSaleLine(event.target.value)
                  }
                  value={selectedInstitutionSaleLineId}
                >
                  <option value="">
                    {selectedInstitutionId
                      ? "Select paid allocation if available"
                      : "Select institution first"}
                  </option>
                  {filteredInstitutionSaleLines.map((line) => (
                    <option key={line.id} value={line.id}>
                      {institutionSaleLineLabel(line)}
                    </option>
                  ))}
                </select>
                {selectedInstitutionId &&
                filteredInstitutionSaleLines.length === 0 ? (
                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    No confirmed institution-paid allocations are ready for this
                    selection. You can still create an institution-only dispatch
                    request and attach the farmer later.
                  </p>
                ) : (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Use this when a paid institution order already identifies
                    the farmer allocation.
                  </p>
                )}
              </div>

              <input
                name="institution_sale_order_id"
                type="hidden"
                value={selectedInstitutionSaleLine?.order_id ?? ""}
              />
              <input
                name="destination_institution_id"
                type="hidden"
                value={
                  selectedInstitutionSaleLine?.institution_id ??
                  selectedInstitutionId
                }
              />
              <input
                name="destination_farmer_lead_id"
                type="hidden"
                value={
                  selectedInstitutionSaleLine?.farmer_lead_id ?? selectedLeadId
                }
              />
            </>
          ) : (
            <input name="destination_farmer_lead_id" type="hidden" value="" />
          )}

          {isPilotRoute ? (
            <div className="md:col-span-2">
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700"
                htmlFor="destination_pilot_id"
              >
                Pilot ready for dispatch
              </label>
              <select
                className={inputClassName()}
                disabled={Boolean(pilotsLoadError)}
                id="destination_pilot_id"
                name="destination_pilot_id"
                onChange={(event) => applyPilot(event.target.value)}
                required
                value={selectedPilotId}
              >
                <option value="">Select active pilot</option>
                {pilots.map((pilot) => (
                  <option key={pilot.id} value={pilot.id}>
                    {pilotLabel(pilot)}
                  </option>
                ))}
              </select>
              {pilotsLoadError ? (
                <p className="mt-1 text-xs leading-5 text-red-700">
                  {pilotsLoadError}
                </p>
              ) : pilots.length === 0 ? (
                <p className="mt-1 text-xs leading-5 text-amber-700">
                  No pilots are currently eligible for dispatch.
                </p>
              ) : (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Pilot Dispatches do not require payment and use
                  pilot-dedicated devices only.
                </p>
              )}
            </div>
          ) : (
            <input name="destination_pilot_id" type="hidden" value="" />
          )}

          {isDealerRoute ? (
            <div className="md:col-span-2">
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700"
                htmlFor="destination_dealer_id"
              >
                Dealer for stock placement
              </label>
              <select
                className={inputClassName()}
                id="destination_dealer_id"
                name="destination_dealer_id"
                onChange={(event) => applyDealer(event.target.value)}
                required
                value={selectedDealerId}
              >
                <option value="">Select dealer</option>
                {dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealerLabel(dealer)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Use this when sending Jiva stock to a dealer. This records dealer
                stock sold to the dealer, not a farmer sale.
              </p>
            </div>
          ) : (
            <input name="destination_dealer_id" type="hidden" value="" />
          )}

          {!isInstitutionSaleRoute ? (
            <>
              <input name="destination_institution_id" type="hidden" value="" />
              <input name="institution_sale_order_id" type="hidden" value="" />
              <input name="institution_sale_order_line_id" type="hidden" value="" />
            </>
          ) : null}

          {!isManualRoute ? (
            <>
              <input
                name="destination_name_snapshot"
                type="hidden"
                value={destinationName}
              />
              <input
                name="destination_contact_snapshot"
                type="hidden"
                value={destinationContact}
              />
              <input
                name="destination_state"
                type="hidden"
                value={stateValue}
              />
              <input
                name="destination_district"
                type="hidden"
                value={districtValue}
              />
              <input
                name="destination_address"
                type="hidden"
                value={destinationAddress}
              />
              <div className="md:col-span-2 rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Destination preview
                </p>
                <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Name</dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {destinationName || "Select a source record"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Contact</dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {destinationContact || "Not set"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Location</dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {[destinationAddress, districtValue, stateValue]
                        .filter(Boolean)
                        .join(", ") || "Not set"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Route</dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {dispatchRoute}
                    </dd>
                  </div>
                  {isInstitutionSaleRoute ? (
                    <div>
                      <dt className="text-slate-500">Payer</dt>
                      <dd className="mt-1 font-semibold text-slate-950">
                        {selectedInstitutionSaleLine?.organization_name ??
                          selectedInstitution?.organization_name ??
                          "Not set"}
                      </dd>
                    </div>
                  ) : null}
                  {isInstitutionSaleRoute ? (
                    <div>
                      <dt className="text-slate-500">Farmer lead</dt>
                      <dd className="mt-1 font-semibold text-slate-950">
                        {selectedInstitutionSaleLine
                          ? `${selectedInstitutionSaleLine.lead_code} · ${selectedInstitutionSaleLine.farmer_name}`
                          : selectedInstitutionFarmerLead
                            ? `${selectedInstitutionFarmerLead.lead_code} · ${selectedInstitutionFarmerLead.farmer_name}`
                            : "Not set"}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </>
          ) : (
            <>
              <input name="destination_pilot_id" type="hidden" value="" />
              <input name="destination_dealer_id" type="hidden" value="" />
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                  htmlFor="destination_type"
                >
                  Destination type
                </label>
                <select
                  className={inputClassName()}
                  id="destination_type"
                  name="destination_type"
                  onChange={(event) => setDestinationType(event.target.value)}
                  required
                  value={destinationType}
                >
                  <option value="">Select destination type</option>
                  {destinationTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                  htmlFor="destination_name_snapshot"
                >
                  Destination name
                </label>
                <input
                  className={inputClassName()}
                  id="destination_name_snapshot"
                  name="destination_name_snapshot"
                  onChange={(event) => setDestinationName(event.target.value)}
                  required
                  type="text"
                  value={destinationName}
                />
              </div>

              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                  htmlFor="destination_contact_snapshot"
                >
                  Destination contact
                </label>
                <input
                  className={inputClassName()}
                  id="destination_contact_snapshot"
                  name="destination_contact_snapshot"
                  onChange={(event) => setDestinationContact(event.target.value)}
                  type="text"
                  value={destinationContact}
                />
              </div>

              <StateDistrictSelect
                districtName="destination_district"
                districtValue={districtValue}
                onDistrictChange={setDistrictValue}
                onStateChange={setStateValue}
                stateName="destination_state"
                stateValue={stateValue}
              />

              <div className="md:col-span-2">
                <label
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                  htmlFor="destination_address"
                >
                  Destination address
                </label>
                <textarea
                  className={textAreaClassName()}
                  id="destination_address"
                  name="destination_address"
                  onChange={(event) => setDestinationAddress(event.target.value)}
                  value={destinationAddress}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Payment and dispatch tracking
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="payment_requirement_type"
            >
              Payment requirement
            </label>
            {isManualRoute ? (
              <select
                className={inputClassName()}
                defaultValue={
                  dispatch?.payment_requirement_type ??
                  defaultPaymentRequirementType
                }
                id="payment_requirement_type"
                name="payment_requirement_type"
                required
              >
                {paymentRequirementOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  name="payment_requirement_type"
                  type="hidden"
                  value={
                    isPilotRoute
                      ? "Unpaid Pilot"
                      : isDealerRoute
                        ? "Payment Required"
                        : "Payment Required"
                  }
                />
                <input
                  className={inputClassName()}
                  readOnly
                  type="text"
                  value={
                    isPilotRoute
                      ? "Unpaid Pilot"
                      : isDealerRoute
                        ? "Payment Required"
                        : "Payment Required"
                  }
                />
              </>
            )}
          </div>

          <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={paymentConfirmed}
              disabled={paymentConfirmationLocked}
              name="payment_confirmed"
              onChange={(event) => setPaymentConfirmed(event.target.checked)}
              type="checkbox"
            />
            Payment received
          </label>
          {paymentConfirmationLocked && paymentConfirmed ? (
            <input name="payment_confirmed" type="hidden" value="on" />
          ) : null}

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="payment_confirmed_date"
            >
              Payment received date
            </label>
            <input
              className={inputClassName()}
              defaultValue={dateValue(dispatch?.payment_confirmed_date)}
              disabled={paymentConfirmationLocked}
              id="payment_confirmed_date"
              name="payment_confirmed_date"
              type="date"
            />
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Confirming payment without a date uses today&apos;s date.
            </p>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="zoho_invoice_reference"
            >
              Zoho invoice reference
            </label>
            <input
              className={inputClassName()}
              defaultValue={dispatch?.zoho_invoice_reference ?? ""}
              id="zoho_invoice_reference"
              name="zoho_invoice_reference"
              type="text"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="zoho_estimate_reference"
            >
              Zoho estimate reference
            </label>
            <input
              className={inputClassName()}
              defaultValue={dispatch?.zoho_estimate_reference ?? ""}
              id="zoho_estimate_reference"
              name="zoho_estimate_reference"
              type="text"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="courier_or_transport_name"
            >
              Courier or transport
            </label>
            <input
              className={inputClassName()}
              defaultValue={dispatch?.courier_or_transport_name ?? ""}
              id="courier_or_transport_name"
              name="courier_or_transport_name"
              type="text"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="dispatch_reference_number"
            >
              Dispatch reference number
            </label>
            <input
              className={inputClassName()}
              defaultValue={dispatch?.dispatch_reference_number ?? ""}
              id="dispatch_reference_number"
              name="dispatch_reference_number"
              type="text"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="expected_delivery_date"
            >
              Expected delivery date
            </label>
            <input
              className={inputClassName()}
              defaultValue={dateValue(dispatch?.expected_delivery_date)}
              id="expected_delivery_date"
              name="expected_delivery_date"
              type="date"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="delivered_date"
            >
              Delivered date
            </label>
            <input
              className={inputClassName()}
              defaultValue={dateValue(dispatch?.delivered_date)}
              id="delivered_date"
              name="delivered_date"
              type="date"
            />
          </div>

          <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              defaultChecked={dispatch?.delivery_confirmed ?? false}
              name="delivery_confirmed"
              type="checkbox"
            />
            Delivery confirmed
          </label>

          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="delivery_remarks"
            >
              Delivery remarks
            </label>
            <textarea
              className={textAreaClassName()}
              defaultValue={dispatch?.delivery_remarks ?? ""}
              id="delivery_remarks"
              name="delivery_remarks"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          href={cancelHref}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Cancel
        </Link>
        <SubmitButton
          disabled={submitDisabled}
          label={mode === "create" ? "Create dispatch" : "Save dispatch"}
        />
      </div>
    </form>
  );
}
