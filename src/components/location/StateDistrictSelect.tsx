"use client";

import { useId } from "react";
import {
  DISTRICTS_BY_STATE,
  INDIAN_STATES_AND_UTS
} from "@/src/lib/india-locations";

type StateDistrictSelectProps = {
  stateValue: string;
  districtValue: string;
  onStateChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  stateName?: string;
  districtName?: string;
  stateLabel?: string;
  districtLabel?: string;
  required?: boolean;
};

function selectClassName() {
  return "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
}

export function StateDistrictSelect({
  stateValue,
  districtValue,
  onStateChange,
  onDistrictChange,
  stateName = "state",
  districtName = "district",
  stateLabel = "State",
  districtLabel = "District",
  required = false
}: StateDistrictSelectProps) {
  const stateId = useId();
  const districtId = useId();
  const districts =
    stateValue in DISTRICTS_BY_STATE
      ? DISTRICTS_BY_STATE[stateValue as keyof typeof DISTRICTS_BY_STATE]
      : [];
  const districtOptions =
    districtValue && !districts.includes(districtValue)
      ? [districtValue, ...districts]
      : districts;

  return (
    <>
      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor={stateId}
        >
          {stateLabel}
        </label>
        <select
          className={selectClassName()}
          id={stateId}
          name={stateName}
          onChange={(event) => {
            onStateChange(event.target.value);
            onDistrictChange("");
          }}
          required={required}
          value={stateValue}
        >
          <option value="">Select state or UT</option>
          {INDIAN_STATES_AND_UTS.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor={districtId}
        >
          {districtLabel}
        </label>
        <select
          className={selectClassName()}
          disabled={!stateValue}
          id={districtId}
          name={districtName}
          onChange={(event) => onDistrictChange(event.target.value)}
          required={required && Boolean(stateValue)}
          value={districtValue}
        >
          <option value="">
            {stateValue ? "Select district" : "Select state first"}
          </option>
          {districtOptions.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
