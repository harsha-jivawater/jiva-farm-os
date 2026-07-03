"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Save } from "lucide-react";
import { StateDistrictSelect } from "@/src/components/location/StateDistrictSelect";
import {
  defaultDeviceStatus,
  defaultHolderType,
  defaultStockEntrySource,
  deviceStatusOptions,
  holderTypeOptions,
  productModelOptions,
  stockEntrySourceOptions
} from "@/lib/devices/options";
import type { Device } from "@/lib/devices/types";

type DeviceFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  device?: Device;
  error?: string | null;
  mode: "create" | "edit";
};

function inputClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function textAreaClassName() {
  return "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function dateValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
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

export function DeviceForm({
  action,
  cancelHref,
  device,
  error,
  mode
}: DeviceFormProps) {
  const [stateValue, setStateValue] = useState(device?.current_state ?? "");
  const [districtValue, setDistrictValue] = useState(
    device?.current_district ?? ""
  );

  return (
    <form action={action} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Device details
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="serial_number"
            >
              Serial number
            </label>
            <input
              className={inputClassName()}
              defaultValue={device?.serial_number ?? ""}
              id="serial_number"
              name="serial_number"
              placeholder="Unique serial number"
              required
              type="text"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="device_code"
            >
              Device code
            </label>
            <input
              className={inputClassName()}
              defaultValue={device?.device_code ?? ""}
              id="device_code"
              name="device_code"
              placeholder="Optional internal code"
              type="text"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="product_model"
            >
              Product model
            </label>
            <select
              className={inputClassName()}
              defaultValue={device?.product_model ?? ""}
              id="product_model"
              name="product_model"
              required
            >
              <option value="">Select product model</option>
              {productModelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="stock_entry_date"
            >
              Stock entry date
            </label>
            <input
              className={inputClassName()}
              defaultValue={dateValue(device?.stock_entry_date) || todayDate()}
              id="stock_entry_date"
              name="stock_entry_date"
              required
              type="date"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Stock and holder
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="device_status"
            >
              Device status
            </label>
            <select
              className={inputClassName()}
              defaultValue={device?.device_status ?? defaultDeviceStatus}
              id="device_status"
              name="device_status"
              required
            >
              {deviceStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="stock_entry_source"
            >
              Stock entry source
            </label>
            <select
              className={inputClassName()}
              defaultValue={
                device?.stock_entry_source ?? defaultStockEntrySource
              }
              id="stock_entry_source"
              name="stock_entry_source"
              required
            >
              {stockEntrySourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="current_holder_type"
            >
              Current holder type
            </label>
            <select
              className={inputClassName()}
              defaultValue={device?.current_holder_type ?? defaultHolderType}
              id="current_holder_type"
              name="current_holder_type"
              required
            >
              {holderTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="current_holder_name_snapshot"
            >
              Current holder name
            </label>
            <input
              className={inputClassName()}
              defaultValue={device?.current_holder_name_snapshot ?? ""}
              id="current_holder_name_snapshot"
              name="current_holder_name_snapshot"
              placeholder="Warehouse, dealer, farmer, pilot"
              type="text"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Current location
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <StateDistrictSelect
            districtName="current_district"
            districtValue={districtValue}
            onDistrictChange={setDistrictValue}
            onStateChange={setStateValue}
            stateName="current_state"
            stateValue={stateValue}
          />

          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="current_location_text"
            >
              Location note
            </label>
            <input
              className={inputClassName()}
              defaultValue={device?.current_location_text ?? ""}
              id="current_location_text"
              name="current_location_text"
              placeholder="Warehouse shelf, dealer location, farmer site"
              type="text"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="remarks"
        >
          Remarks
        </label>
        <textarea
          className={textAreaClassName()}
          defaultValue={device?.remarks ?? ""}
          id="remarks"
          name="remarks"
          placeholder="Stock notes, inspection notes, or context"
        />
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
          label={mode === "create" ? "Create device" : "Save device"}
        />
      </div>
    </form>
  );
}
