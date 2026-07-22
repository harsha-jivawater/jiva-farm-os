"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, LinkIcon, Save, UploadCloud } from "lucide-react";
import { CropMultiSelect } from "@/components/crops/crop-multi-select";
import {
  marketingAssetAudienceOptions,
  marketingAssetDeliveryOptions,
  marketingAssetLanguageOptions,
  marketingAssetSectorOptions,
  marketingAssetTypeOptions
} from "@/lib/marketing-assets/options";
import type {
  MarketingAsset,
  MarketingAssetVersion
} from "@/lib/marketing-assets/types";
import { createClient } from "@/lib/supabase/client";
import { uploadRules } from "@/lib/uploads/config";

type MarketingAssetFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  asset?: MarketingAsset | null;
  cancelHref: string;
  error?: string | null;
  mode?: "create" | "publish" | "resubmit" | "metadata";
  sourceMarketingRequestId?: string | null;
  sourceMarketingRequestLabel?: string | null;
  version?: MarketingAssetVersion | null;
};

type Option = { label: string; value: string };
type ContentSource = "file" | "link";

const inputClassName =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

function SubmitButton({
  mode,
  uploading
}: {
  mode: "create" | "publish" | "resubmit" | "metadata";
  uploading: boolean;
}) {
  const { pending } = useFormStatus();
  const disabled = uploading || pending;
  const label =
    mode === "metadata"
      ? "Save details"
      : mode === "resubmit"
        ? "Submit changes"
        : mode === "publish"
          ? "Publish material"
          : "Submit for review";

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={disabled}
      type="submit"
    >
      <Save className="h-4 w-4" aria-hidden="true" />
      {uploading
        ? "Uploading..."
        : pending
          ? "Submitting..."
          : label}
    </button>
  );
}

function SelectField({
  label,
  name,
  options,
  value,
  onChange,
  placeholder = "Select",
  required = true
}: {
  label: string;
  name: string;
  onChange?: (value: string) => void;
  options: ReadonlyArray<Option>;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      <select
        className={inputClassName}
        id={name}
        name={name}
        onChange={(event) => onChange?.(event.target.value)}
        required={required}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function MarketingAssetForm({
  action,
  asset,
  cancelHref,
  error,
  mode = "create",
  sourceMarketingRequestId,
  sourceMarketingRequestLabel,
  version
}: MarketingAssetFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bypassUploadRef = useRef(false);
  const [audience, setAudience] = useState(asset?.audience ?? "");
  const [sector, setSector] = useState(asset?.sector ?? "");
  const [crops, setCrops] = useState<string[]>(
    asset?.crops?.length ? asset.crops : asset?.crop ? [asset.crop] : []
  );
  const [language, setLanguage] = useState(asset?.language ?? "");
  const [assetType, setAssetType] = useState(asset?.asset_type ?? "");
  const [contentSource, setContentSource] = useState<ContentSource>(
    version?.external_url ? "link" : "file"
  );
  const [deliveryFormat, setDeliveryFormat] = useState(
    asset?.delivery_format ?? "Digital"
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const rule = uploadRules["marketing-asset"];
  const isVideo = assetType === "Video";
  const hasExistingFile = Boolean(version?.storage_path);
  const hasExistingLink = Boolean(version?.external_url);
  const metadataOnly = mode === "metadata";

  async function prepareDirectUpload(event: React.FormEvent<HTMLFormElement>) {
    if (metadataOnly || bypassUploadRef.current || isVideo || contentSource === "link") {
      return;
    }

    const file = fileRef.current?.files?.[0] ?? null;
    if (!file) {
      if (hasExistingFile) return;
      event.preventDefault();
      setUploadError("Choose the asset file before submitting.");
      return;
    }

    event.preventDefault();
    setUploadError(null);
    setIsUploading(true);

    try {
      const assetId = asset?.id ?? crypto.randomUUID();
      const versionId = crypto.randomUUID();
      const response = await fetch("/api/marketing-assets/upload-url", {
        body: JSON.stringify({
          assetId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          versionId
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const payload = (await response.json()) as {
        contentType?: string;
        error?: string;
        path?: string;
        token?: string;
      };

      if (!response.ok || !payload.path || !payload.token) {
        throw new Error(payload.error ?? "The secure upload could not be started.");
      }

      const supabase = createClient();
      const uploadContentType =
        payload.contentType || file.type || "application/octet-stream";
      const uploadBody =
        file.type === uploadContentType
          ? file
          : new File([file], file.name, {
              lastModified: file.lastModified,
              type: uploadContentType
            });
      const { error: storageError } = await supabase.storage
        .from("marketing-assets")
        .uploadToSignedUrl(payload.path, payload.token, uploadBody, {
          contentType: uploadContentType,
          upsert: false
        });

      if (storageError) throw storageError;

      const form = formRef.current;
      if (!form) throw new Error("The form is no longer available.");

      const hiddenValues: Record<string, string> = {
        asset_id: assetId,
        version_id: versionId,
        uploaded_storage_path: payload.path,
        uploaded_original_file_name: file.name,
        uploaded_mime_type: uploadContentType,
        uploaded_file_size_bytes: String(file.size)
      };

      Object.entries(hiddenValues).forEach(([name, value]) => {
        const input = form.elements.namedItem(name) as HTMLInputElement | null;
        if (input) input.value = value;
      });

      if (fileRef.current) fileRef.current.disabled = true;
      bypassUploadRef.current = true;
      form.requestSubmit();
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : "The asset could not be uploaded."
      );
      setIsUploading(false);
    }
  }

  return (
    <form
      action={action}
      className="space-y-6"
      onSubmit={prepareDirectUpload}
      ref={formRef}
    >
      <input name="asset_id" type="hidden" />
      <input name="version_id" type="hidden" />
      <input name="uploaded_storage_path" type="hidden" />
      <input name="uploaded_original_file_name" type="hidden" />
      <input name="uploaded_mime_type" type="hidden" />
      <input name="uploaded_file_size_bytes" type="hidden" />
      <input name="content_source" type="hidden" value={isVideo ? "link" : contentSource} />
      <input
        name="source_marketing_request_id"
        type="hidden"
        value={asset?.source_marketing_request_id ?? sourceMarketingRequestId ?? ""}
      />

      {error || uploadError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {uploadError ?? error}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">Library classification</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField
            label="Audience"
            name="audience"
            onChange={setAudience}
            options={marketingAssetAudienceOptions}
            placeholder="Select audience"
            value={audience}
          />
          <SelectField
            label="Sector"
            name="sector"
            onChange={(value) => {
              setSector(value);
              if (value !== "Agriculture") setCrops([]);
            }}
            options={marketingAssetSectorOptions}
            placeholder="Select sector"
            value={sector}
          />
        </div>
        {sector === "Agriculture" ? (
          <div className="mt-4">
            <CropMultiSelect
              label="Key crops"
              name="crops"
              onChange={setCrops}
              values={crops}
            />
          </div>
        ) : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {sector === "Agriculture" ? (
            <p className="self-end pb-2 text-sm text-slate-500">
              Leave crops unselected when the material applies to all crops.
            </p>
          ) : null}
          <SelectField
            label="Language"
            name="language"
            onChange={setLanguage}
            options={marketingAssetLanguageOptions}
            placeholder="Select language"
            value={language}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-950">Asset details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="title">
              Title
            </label>
            <input
              className={inputClassName}
              defaultValue={asset?.title ?? ""}
              id="title"
              maxLength={160}
              minLength={3}
              name="title"
              required
            />
          </div>
          <SelectField
            label="Asset type"
            name="asset_type"
            onChange={(value) => {
              setAssetType(value);
              if (value === "Video") setContentSource("link");
              setUploadError(null);
            }}
            options={marketingAssetTypeOptions}
            placeholder="Select asset type"
            value={assetType}
          />
          <SelectField
            label="Delivery format"
            name="delivery_format"
            onChange={setDeliveryFormat}
            options={marketingAssetDeliveryOptions}
            value={deliveryFormat}
          />
          {!metadataOnly ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="change_note">
                Version note
              </label>
              <input
                className={inputClassName}
                defaultValue={version?.change_note ?? ""}
                id="change_note"
                name="change_note"
                placeholder="What is new in this version?"
              />
            </div>
          ) : null}
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="description">
              Description
            </label>
            <textarea
              className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              defaultValue={asset?.description ?? ""}
              id="description"
              name="description"
            />
          </div>
        </div>
        {sourceMarketingRequestLabel ? (
          <p className="mt-4 text-sm text-slate-500">
            Source Marketing Request: {sourceMarketingRequestLabel}
          </p>
        ) : null}
      </section>

      {!metadataOnly ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-slate-950">Content</h2>
          {isVideo ? (
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="youtube_url">
                YouTube link
              </label>
              <input
                className={inputClassName}
                defaultValue={version?.youtube_url ?? ""}
                id="youtube_url"
                name="youtube_url"
                placeholder="https://www.youtube.com/watch?v=..."
                required
                type="url"
              />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
                <button
                  className={`inline-flex min-h-9 items-center gap-2 rounded px-3 text-sm font-semibold transition ${
                    contentSource === "file"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                  onClick={() => {
                    setContentSource("file");
                    setUploadError(null);
                  }}
                  type="button"
                >
                  <UploadCloud className="h-4 w-4" aria-hidden="true" />
                  Upload file
                </button>
                <button
                  className={`inline-flex min-h-9 items-center gap-2 rounded px-3 text-sm font-semibold transition ${
                    contentSource === "link"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                  onClick={() => {
                    setContentSource("link");
                    setUploadError(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  type="button"
                >
                  <LinkIcon className="h-4 w-4" aria-hidden="true" />
                  Insert link
                </button>
              </div>

              {contentSource === "link" ? (
                <div>
                  {hasExistingLink ? (
                    <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Current link is saved. Update it only when replacing the linked material.
                    </p>
                  ) : null}
                  <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="external_url">
                    Material link
                  </label>
                  <input
                    className={inputClassName}
                    defaultValue={version?.external_url ?? ""}
                    id="external_url"
                    name="external_url"
                    placeholder="https://..."
                    required
                    type="url"
                  />
                </div>
              ) : (
                <div>
                  {hasExistingFile ? (
                    <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Current file: {version?.original_file_name}. Choose a new file only when replacing it.
                    </p>
                  ) : null}
                  <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center hover:bg-slate-100">
                    <UploadCloud className="h-7 w-7 text-slate-400" aria-hidden="true" />
                    <span className="mt-2 text-sm font-semibold text-slate-800">
                      {hasExistingFile ? "Choose replacement file" : "Choose asset file"}
                    </span>
                    <span className="mt-1 max-w-xl text-xs text-slate-500">{rule.description}</span>
                    <input
                      accept={rule.accept}
                      className="sr-only"
                      onChange={() => setUploadError(null)}
                      ref={fileRef}
                      type="file"
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </section>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          href={cancelHref}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Cancel
        </Link>
        <SubmitButton mode={mode} uploading={isUploading} />
      </div>
    </form>
  );
}
