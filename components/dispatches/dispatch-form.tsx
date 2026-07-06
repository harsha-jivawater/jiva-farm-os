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
  dispatchStatusOptions,
  dispatchTypeOptions,
  paymentRequirementOptions
} from "@/lib/dispatches/options";
import type {
  Dispatch,
  DispatchDeviceOption,
  DispatchFarmerLeadOption
} from "@/lib/dispatches/types";

type DispatchFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  dispatch?: Dispatch;
  devices: DispatchDeviceOption[];
  error?: string | null;
  farmerLeads?: DispatchFarmerLeadOption[];
  mode: "create" | "edit";
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
  return `${device.serial_number}${code} · ${device.product_model} · ${device.device_status}`;
}

function leadLabel(lead: DispatchFarmerLeadOption) {
  return `${lead.lead_code} · ${lead.farmer_name} · ${lead.village}, ${lead.district}`;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={pending}
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
  dispatch,
  devices,
  error,
  farmerLeads = [],
  mode
}: DispatchFormProps) {
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
  const [serialNumber, setSerialNumber] = useState(
    dispatch?.serial_number_snapshot ?? initialDevice?.serial_number ?? ""
  );
  const [productModel, setProductModel] = useState(
    dispatch?.product_model ?? initialDevice?.product_model ?? ""
  );
  const [dispatchType, setDispatchType] = useState(
    dispatch?.dispatch_type ?? ""
  );
  const [destinationType, setDestinationType] = useState(
    dispatch?.destination_type ?? ""
  );
  const [selectedLeadId, setSelectedLeadId] = useState(
    dispatch?.destination_farmer_lead_id ?? dispatch?.linked_farmer_lead_id ?? ""
  );
  const [destinationName, setDestinationName] = useState(
    dispatch?.destination_name_snapshot ?? ""
  );
  const [destinationContact, setDestinationContact] = useState(
    dispatch?.destination_contact_snapshot ?? ""
  );
  const [destinationAddress, setDestinationAddress] = useState(
    dispatch?.destination_address ?? ""
  );
  const [paymentConfirmed, setPaymentConfirmed] = useState(
    dispatch?.payment_confirmed ?? false
  );
  const [stateValue, setStateValue] = useState(
    dispatch?.destination_state ?? ""
  );
  const [districtValue, setDistrictValue] = useState(
    dispatch?.destination_district ?? ""
  );
  const isFarmerSaleDispatch = dispatchType === "Farmer Sale Dispatch";

  function applyLead(leadId: string) {
    setSelectedLeadId(leadId);
    const lead = farmerLeads.find((option) => option.id === leadId);

    if (!lead) {
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
        <div className="mt-4 grid gap-4 md:grid-cols-2">
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
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Device for dispatch
        </h2>
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
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {deviceLabel(device)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="serial_number_snapshot"
            >
              Serial number snapshot
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
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Destination
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {isFarmerSaleDispatch ? (
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
          </div>

          <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={paymentConfirmed}
              disabled={isFarmerSaleDispatch}
              name="payment_confirmed"
              onChange={(event) => setPaymentConfirmed(event.target.checked)}
              type="checkbox"
            />
            Payment confirmed
          </label>
          {isFarmerSaleDispatch ? (
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
          label={mode === "create" ? "Create dispatch" : "Save dispatch"}
        />
      </div>
    </form>
  );
}
