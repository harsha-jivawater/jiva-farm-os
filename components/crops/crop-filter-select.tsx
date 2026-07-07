"use client";

import { useEffect, useState } from "react";
import { CropSelect } from "@/components/crops/crop-select";

type CropFilterSelectProps = {
  defaultValue?: string;
  label?: string;
  name?: string;
};

export function CropFilterSelect({
  defaultValue = "",
  label = "Crop",
  name = "crop"
}: CropFilterSelectProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <div>
      <CropSelect
        label={label}
        name={name}
        onChange={setValue}
        showMissingSelectionMessage={false}
        showOptionsOnEmptySearch={false}
        showSelectedContext={false}
        value={value}
      />
      {value ? (
        <button
          className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          onClick={() => setValue("")}
          type="button"
        >
          Clear crop filter
        </button>
      ) : null}
    </div>
  );
}
