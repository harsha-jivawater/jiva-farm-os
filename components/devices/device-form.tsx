"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Save } from "lucide-react";
import { StateDistrictSelect } from "@/src/components/location/StateDistrictSelect";
import { FileUploadField } from "@/components/uploads/file-upload-field";
import {
  approvalStatusOptions,
  defaultDeviceStatus,
  defaultHolderType,
  defaultInventoryPool,
  defaultStockEntrySource,
  deviceStatusOptions,
  holderTypeOptions,
  inventoryPoolOptions,
  productModelOptions,
  returnDecisionOptions,
  stockEntrySourceOptions
} from "@/lib/devices/options";
import type { Device } from "@/lib/devices/types";

type DeviceFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  device?: Device;
  error?: string | null;
  existingDevices?: Device[];
  canApproveManualAdjustment?: boolean;
  canApproveReturn?: boolean;
  canSetInventoryPool?: boolean;
  mode: "create" | "edit";
  readOnlyDetails?: boolean;
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
  existingDevices = [],
  canApproveManualAdjustment = false,
  canApproveReturn = false,
  canSetInventoryPool = false,
  mode,
  readOnlyDetails = false
}: DeviceFormProps) {
  const [loadedDevice, setLoadedDevice] = useState<Device | undefined>(device);
  const currentDevice = loadedDevice ?? device;
  const [serialNumber, setSerialNumber] = useState(
    currentDevice?.serial_number ?? ""
  );
  const [deviceCode, setDeviceCode] = useState(currentDevice?.device_code ?? "");
  const [productModel, setProductModel] = useState(
    currentDevice?.product_model ?? ""
  );
  const [stockEntryDate, setStockEntryDate] = useState(
    dateValue(currentDevice?.stock_entry_date) || todayDate()
  );
  const [deviceStatus, setDeviceStatus] = useState(
    currentDevice?.device_status ?? defaultDeviceStatus
  );
  const [inventoryPool, setInventoryPool] = useState(
    currentDevice?.inventory_pool ?? defaultInventoryPool
  );
  const [stockEntrySource, setStockEntrySource] = useState(
    currentDevice?.stock_entry_source ?? defaultStockEntrySource
  );
  const [holderType, setHolderType] = useState(
    currentDevice?.current_holder_type ?? defaultHolderType
  );
  const [holderName, setHolderName] = useState(
    currentDevice?.current_holder_name_snapshot ?? ""
  );
  const [locationText, setLocationText] = useState(
    currentDevice?.current_location_text ?? ""
  );
  const [remarks, setRemarks] = useState(currentDevice?.remarks ?? "");
  const [stateValue, setStateValue] = useState(currentDevice?.current_state ?? "");
  const [districtValue, setDistrictValue] = useState(
    currentDevice?.current_district ?? ""
  );
  const isExistingSerial = mode === "create" && Boolean(loadedDevice?.id);
  const showReturnWorkflow = stockEntrySource === "Return";
  const showManualWorkflow = stockEntrySource === "Manual Adjustment";

  function loadExistingDevice(nextSerialNumber: string) {
    setSerialNumber(nextSerialNumber);

    if (mode !== "create") {
      return;
    }

    const normalizedSerial = nextSerialNumber.trim().toLowerCase();
    const existing = existingDevices.find(
      (candidate) => candidate.serial_number.trim().toLowerCase() === normalizedSerial
    );

    if (!existing) {
      setLoadedDevice(undefined);
      return;
    }

    setLoadedDevice(existing);
    setDeviceCode(existing.device_code ?? "");
    setProductModel(existing.product_model ?? "");
    setStockEntryDate(dateValue(existing.stock_entry_date) || todayDate());
    setDeviceStatus(existing.device_status ?? defaultDeviceStatus);
    setInventoryPool(existing.inventory_pool ?? defaultInventoryPool);
    setStockEntrySource(existing.stock_entry_source ?? defaultStockEntrySource);
    setHolderType(existing.current_holder_type ?? defaultHolderType);
    setHolderName(existing.current_holder_name_snapshot ?? "");
    setLocationText(existing.current_location_text ?? "");
    setStateValue(existing.current_state ?? "");
    setDistrictValue(existing.current_district ?? "");
    setRemarks(existing.remarks ?? "");
  }

  return (
    <form action={action} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      {isExistingSerial ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          This device already exists. Existing device details have been loaded,
          so saving will update this record instead of creating a duplicate.
        </div>
      ) : null}

      {currentDevice?.id ? (
        <input name="existing_device_id" type="hidden" value={currentDevice.id} />
      ) : null}

      {readOnlyDetails ? (
        <>
          <input name="serial_number" type="hidden" value={serialNumber} />
          <input name="device_code" type="hidden" value={deviceCode} />
          <input name="product_model" type="hidden" value={productModel} />
          <input name="stock_entry_date" type="hidden" value={stockEntryDate} />
          <input name="device_status" type="hidden" value={deviceStatus} />
          <input name="inventory_pool" type="hidden" value={inventoryPool} />
          <input name="stock_entry_source" type="hidden" value={stockEntrySource} />
          <input name="current_holder_type" type="hidden" value={holderType} />
          <input
            name="current_holder_name_snapshot"
            type="hidden"
            value={holderName}
          />
          <input name="current_state" type="hidden" value={stateValue} />
          <input name="current_district" type="hidden" value={districtValue} />
          <input name="current_location_text" type="hidden" value={locationText} />
          <input name="remarks" type="hidden" value={remarks} />
          <input
            name="return_decision"
            type="hidden"
            value={currentDevice?.return_decision ?? ""}
          />
          <input
            name="return_reason"
            type="hidden"
            value={currentDevice?.return_reason ?? ""}
          />
          <input
            name="return_photo_link"
            type="hidden"
            value={currentDevice?.return_photo_link ?? ""}
          />
          <input
            name="manual_adjustment_reason"
            type="hidden"
            value={currentDevice?.manual_adjustment_reason ?? ""}
          />
        </>
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
              disabled={readOnlyDetails}
              id="serial_number"
              name="serial_number"
              onChange={(event) => loadExistingDevice(event.target.value)}
              placeholder="Unique serial number"
              required
              type="text"
              value={serialNumber}
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
              disabled={readOnlyDetails}
              id="device_code"
              name="device_code"
              onChange={(event) => setDeviceCode(event.target.value)}
              placeholder="Optional internal code"
              type="text"
              value={deviceCode}
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
              disabled={readOnlyDetails}
              id="product_model"
              name="product_model"
              onChange={(event) => setProductModel(event.target.value)}
              required
              value={productModel}
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
              disabled={readOnlyDetails}
              id="stock_entry_date"
              name="stock_entry_date"
              onChange={(event) => setStockEntryDate(event.target.value)}
              required
              type="date"
              value={stockEntryDate}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Stock and holder
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {!readOnlyDetails && canSetInventoryPool ? (
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700"
                htmlFor="inventory_pool"
              >
                Device pool
              </label>
              <select
                className={inputClassName()}
                id="inventory_pool"
                name="inventory_pool"
                onChange={(event) => setInventoryPool(event.target.value)}
                required
                value={inventoryPool}
              >
                {inventoryPoolOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Fresh Sale devices are used for paid farmer dispatches. Pilot
                devices are used for free pilot dispatches.
              </p>
            </div>
          ) : (
            <input name="inventory_pool" type="hidden" value={inventoryPool} />
          )}

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="device_status"
            >
              Device status
            </label>
            <select
              className={inputClassName()}
              disabled={readOnlyDetails}
              id="device_status"
              name="device_status"
              onChange={(event) => setDeviceStatus(event.target.value)}
              required
              value={deviceStatus}
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
              disabled={readOnlyDetails}
              id="stock_entry_source"
              name="stock_entry_source"
              onChange={(event) => setStockEntrySource(event.target.value)}
              required
              value={stockEntrySource}
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
              disabled={readOnlyDetails}
              id="current_holder_type"
              name="current_holder_type"
              onChange={(event) => setHolderType(event.target.value)}
              required
              value={holderType}
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
              disabled={readOnlyDetails}
              id="current_holder_name_snapshot"
              name="current_holder_name_snapshot"
              onChange={(event) => setHolderName(event.target.value)}
              placeholder="Warehouse, dealer, farmer, pilot"
              type="text"
              value={holderName}
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
            disabled={readOnlyDetails}
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
              disabled={readOnlyDetails}
              id="current_location_text"
              name="current_location_text"
              onChange={(event) => setLocationText(event.target.value)}
              placeholder="Warehouse shelf, dealer location, farmer site"
              type="text"
              value={locationText}
            />
          </div>
        </div>
      </div>

      {showReturnWorkflow ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-slate-950">
            Return decision
          </h2>
          {currentDevice ? (
            <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
              <p>Current status: {currentDevice.device_status}</p>
              <p>Serial number: {currentDevice.serial_number}</p>
              <p>Current holder: {currentDevice.current_holder_name_snapshot ?? "Not set"}</p>
              <p>Linked dispatch: {currentDevice.linked_dispatch_id ?? "Not set"}</p>
              <p>Linked installation: {currentDevice.linked_installation_id ?? "Not set"}</p>
              <p>Linked pilot: {currentDevice.linked_pilot_id ?? "Not set"}</p>
            </div>
          ) : null}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="return_decision">
                Replace or reject
              </label>
              <select
                className={inputClassName()}
                defaultValue={currentDevice?.return_decision ?? ""}
                disabled={readOnlyDetails}
                id="return_decision"
                name="return_decision"
                required
              >
                <option value="">Select decision</option>
                {returnDecisionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <FileUploadField
              currentValue={currentDevice?.return_photo_link}
              disabled={readOnlyDetails}
              kind="evidence"
              label="Return evidence photo or document"
              name="return_photo_link"
              required
            />
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="return_reason">
                Return reason
              </label>
              <textarea
                className={textAreaClassName()}
                defaultValue={currentDevice?.return_reason ?? ""}
                disabled={readOnlyDetails}
                id="return_reason"
                name="return_reason"
                required
              />
            </div>
          </div>
        </div>
      ) : null}

      {showManualWorkflow ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-slate-950">
            Manual adjustment
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Manual stock adjustments stay pending until Admin approval.
          </p>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Adjustment reason
            </span>
            <textarea
              className={textAreaClassName()}
              defaultValue={currentDevice?.manual_adjustment_reason ?? ""}
              disabled={readOnlyDetails}
              name="manual_adjustment_reason"
              required
            />
          </label>
        </div>
      ) : null}

      {(canApproveReturn || canApproveManualAdjustment) && currentDevice ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-slate-950">
            Approval review
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {canApproveReturn ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="return_approval_status">
                  Return approval status
                </label>
                <select
                  className={inputClassName()}
                  defaultValue={currentDevice.return_approval_status ?? "Not Required"}
                  id="return_approval_status"
                  name="return_approval_status"
                >
                  {approvalStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {canApproveManualAdjustment ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="manual_adjustment_approval_status">
                  Manual adjustment approval status
                </label>
                <select
                  className={inputClassName()}
                  defaultValue={
                    currentDevice.manual_adjustment_approval_status ??
                    "Not Required"
                  }
                  id="manual_adjustment_approval_status"
                  name="manual_adjustment_approval_status"
                >
                  {approvalStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {canApproveReturn ? (
              <label className="md:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Return approval comments
                </span>
                <textarea
                  className={textAreaClassName()}
                  defaultValue={currentDevice.return_approval_comments ?? ""}
                  name="return_approval_comments"
                />
              </label>
            ) : null}
            {canApproveManualAdjustment ? (
              <label className="md:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Manual adjustment approval comments
                </span>
                <textarea
                  className={textAreaClassName()}
                  defaultValue={
                    currentDevice.manual_adjustment_approval_comments ?? ""
                  }
                  name="manual_adjustment_approval_comments"
                />
              </label>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="remarks"
        >
          Remarks
        </label>
        <textarea
          className={textAreaClassName()}
          id="remarks"
          name="remarks"
          onChange={(event) => setRemarks(event.target.value)}
          placeholder="Stock notes, inspection notes, or context"
          readOnly={readOnlyDetails}
          value={remarks}
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
