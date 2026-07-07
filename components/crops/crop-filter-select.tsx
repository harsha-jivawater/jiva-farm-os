"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  function updateFilterValue(nextValue: string) {
    setValue(nextValue);

    const params = new URLSearchParams(searchParams.toString());
    if (nextValue) {
      params.set(name, nextValue);
    } else {
      params.delete(name);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false
    });
  }

  return (
    <div>
      <CropSelect
        label={label}
        name={name}
        onChange={updateFilterValue}
        showMissingSelectionMessage={false}
        showOptionsOnEmptySearch={false}
        showSelectedContext={false}
        showSelectedInInput
        showSelectedSummary={false}
        value={value}
      />
    </div>
  );
}
