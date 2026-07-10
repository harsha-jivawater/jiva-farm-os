"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Save } from "lucide-react";
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
  initialDispatchRoute?: string;
  initialFarmerLeadId?: string;
  initialPilotId?: string;
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

function routeForDispatch(dispatch?: Dispatch) {
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
  initialDispatchRoute,
  initialFarmerLeadId,
  initialPilotId,
  canUseManualException = false,
  mode,
  pilots = [],
  pilotsLoadError
}: DispatchFormProps) {
  const initialLead = farmerLeads.find(
    (lead) =>
      lead.id ===
      (initialFarmerLeadId ??
        dispatch?.destination_farmer_lead_id ??
        dispatch?.linked_farmer_lead_id)
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
  const [selectedDealerDeviceIds, setSelectedDealerDeviceIds] = useState<
    string[]
  >([]);
  const [dealerDeviceSearch, setDealerDeviceSearch] = useState("");
  const [dealerProductModelFilter, setDealerProductModelFilter] = useState("");
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
  const [destinationName, setDestinationName] = useState(
    initialLead?.farmer_name ??
      initialPilot?.pilot_name ??
      initialDealer?.firm_name ??
      initialDealer?.dealer_name ??
      dispatch?.destination_name_snapshot ??
      ""
  );
  const [destinationContact, setDestinationContact] = useState(
    initialLead?.mobile_number ??
      initialPilot?.farmer_mobile_snapshot ??
      initialDealer?.contact_number ??
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
    initialLead?.payment_confirmed ?? dispatch?.payment_confirmed ?? false
  );
  const [stateValue, setStateValue] = useState(
    initialLead?.state ??
      initialPilot?.state ??
      initialDealer?.state ??
      dispatch?.destination_state ??
      ""
  );
  const [districtValue, setDistrictValue] = useState(
    initialLead?.district ??
      initialPilot?.district ??
      initialDealer?.district ??
      dispatch?.destination_district ??
      ""
  );
  const isFarmerSaleRoute = dispatchRoute === "Paid Farmer Sale";
  const isPilotRoute = dispatchRoute === "Free Pilot";
  const isDealerRoute = dispatchRoute === "Dealer Dispatch";
  const isManualRoute = dispatchRoute === "Admin Manual Exception";
  const submitDisabled = isPilotRoute && Boolean(pilotsLoadError);
  const effectiveDispatchType = isFarmerSaleRoute
    ? "Farmer Sale Dispatch"
    : isPilotRoute
      ? "Pilot Dispatch"
      : isDealerRoute
        ? "Dealer Stock Dispatch"
        : dispatchType;
  const effectiveDestinationType = isFarmerSaleRoute
    ? "Farmer"
    : isPilotRoute
      ? "Pilot"
      : isDealerRoute
        ? "Dealer"
        : destinationType;
  const filteredDevices = devices.filter((device) => {
    if (isFarmerSaleRoute || isDealerRoute) {
      return device.inventory_pool === "Fresh Sale";
    }

    if (isPilotRoute) {
      return device.inventory_pool === "Pilot Stock";
    }

    return true;
  });
  const dealerDispatchDevices = devices.filter(
    (device) =>
      device.inventory_pool === "Fresh Sale" &&
      ["In Warehouse", "Reserved"].includes(device.device_status) &&
      device.current_holder_type === "Warehouse"
  );
  const visibleDealerDispatchDevices = dealerDispatchDevices.filter((device) => {
    const matchesSearch =
      !dealerDeviceSearch.trim() ||
      deviceSearchText(device).includes(dealerDeviceSearch.trim().toLowerCase());
    const matchesProductModel =
      !dealerProductModelFilter ||
      device.product_model === dealerProductModelFilter;

    return matchesSearch && matchesProductModel;
  });
  const selectedDealerDeviceSet = new Set(selectedDealerDeviceIds);
  const firstSelectedDealerDevice = dealerDispatchDevices.find(
    (device) => device.id === selectedDealerDeviceIds[0]
  );
  const visibleDealerDeviceIds = visibleDealerDispatchDevices.map(
    (device) => device.id
  );
  const allVisibleDealerDevicesSelected =
    visibleDealerDeviceIds.length > 0 &&
    visibleDealerDeviceIds.every((id) => selectedDealerDeviceSet.has(id));

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
    setSelectedDealerDeviceIds([]);
    setDealerDeviceSearch("");
    setDealerProductModelFilter("");

    if (nextRoute === "Paid Farmer Sale") {
      setDispatchType("Farmer Sale Dispatch");
      setDestinationType("Farmer");
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
          {isDealerRoute && mode === "create"
            ? "Devices for dispatch"
            : "Device for dispatch"}
        </h2>
        {isDealerRoute && mode === "create" ? (
          <div className="mt-4 space-y-4">
            {selectedDealerDeviceIds.map((deviceId) => (
              <input key={deviceId} name="device_ids" type="hidden" value={deviceId} />
            ))}
            <input
              name="device_id"
              type="hidden"
              value={firstSelectedDealerDevice?.id ?? ""}
            />
            <input
              name="serial_number_snapshot"
              type="hidden"
              value={firstSelectedDealerDevice?.serial_number ?? ""}
            />
            <input
              name="product_model"
              type="hidden"
              value={firstSelectedDealerDevice?.product_model ?? ""}
            />

            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Search
                </span>
                <input
                  className={inputClassName()}
                  onChange={(event) => setDealerDeviceSearch(event.target.value)}
                  placeholder="Search by serial number or product model"
                  type="search"
                  value={dealerDeviceSearch}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Product model
                </span>
                <select
                  className={inputClassName()}
                  onChange={(event) =>
                    setDealerProductModelFilter(event.target.value)
                  }
                  value={dealerProductModelFilter}
                >
                  <option value="">All models</option>
                  {Array.from(
                    new Set(dealerDispatchDevices.map((device) => device.product_model))
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
                {selectedDealerDeviceIds.length} devices selected
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={visibleDealerDeviceIds.length === 0}
                  onClick={() => {
                    setSelectedDealerDeviceIds((current) => {
                      const merged = new Set(current);
                      for (const id of visibleDealerDeviceIds) {
                        merged.add(id);
                      }
                      return Array.from(merged);
                    });
                  }}
                  type="button"
                >
                  {allVisibleDealerDevicesSelected
                    ? "All visible selected"
                    : "Select all visible"}
                </button>
                <button
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedDealerDeviceIds.length === 0}
                  onClick={() => setSelectedDealerDeviceIds([])}
                  type="button"
                >
                  Clear selection
                </button>
              </div>
            </div>

            {dealerDispatchDevices.length === 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
                No eligible Fresh Sale devices are available. Check device pool
                and warehouse status.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-md border border-slate-200">
                {visibleDealerDispatchDevices.length ? (
                  <div className="divide-y divide-slate-200">
                    {visibleDealerDispatchDevices.map((device) => (
                      <label
                        className="flex cursor-pointer gap-3 bg-white px-3 py-3 text-sm hover:bg-slate-50"
                        key={device.id}
                      >
                        <input
                          checked={selectedDealerDeviceSet.has(device.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          onChange={(event) => {
                            setSelectedDealerDeviceIds((current) =>
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
                  No eligible devices found for this route. Check device pool and
                  warehouse status.
                </p>
              ) : null}
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
              disabled={isFarmerSaleRoute || isPilotRoute || isDealerRoute}
              name="payment_confirmed"
              onChange={(event) => setPaymentConfirmed(event.target.checked)}
              type="checkbox"
            />
            Payment confirmed
          </label>
          {isFarmerSaleRoute ? (
            <input name="payment_confirmed" type="hidden" value="on" />
          ) : null}

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
