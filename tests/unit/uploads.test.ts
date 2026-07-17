import { describe, expect, it, vi } from "vitest";
import {
  applyUploadedFilesToPayload,
  resolveFileUrls,
  sanitizeUploadFileName,
  validateUploadFile
} from "@/lib/uploads/server";

function file(name: string, bytes: number[], type: string) {
  return new File([new Uint8Array(bytes)], name, { type });
}

function storageClient({ failUploadAt = 0 } = {}) {
  let uploadCount = 0;
  const upload = vi.fn(async () => {
    uploadCount += 1;
    return {
      error:
        uploadCount === failUploadAt
          ? { message: "Simulated storage failure" }
          : null
    };
  });
  const remove = vi.fn(async (paths: string[]) => {
    void paths;
    return { error: null };
  });

  return {
    client: {
      storage: {
        from: vi.fn(() => ({ remove, upload }))
      }
    },
    remove,
    upload
  };
}

describe("upload validation", () => {
  it("accepts a PDF whose contents and extension agree", async () => {
    const pdf = file("report.pdf", [0x25, 0x50, 0x44, 0x46, 0x2d], "application/pdf");

    await expect(validateUploadFile(pdf, "document")).resolves.toBeNull();
  });

  it("rejects a renamed executable masquerading as a PDF", async () => {
    const fakePdf = file("report.pdf", [0x4d, 0x5a, 0x90, 0x00], "application/pdf");

    await expect(validateUploadFile(fakePdf, "document")).resolves.toMatch(
      /contents do not match/i
    );
  });

  it("accepts a valid spreadsheet signature sent as a generic MIME type", async () => {
    const spreadsheet = file(
      "measurements.xlsx",
      [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00],
      "application/octet-stream"
    );

    await expect(validateUploadFile(spreadsheet, "sheet")).resolves.toBeNull();
  });

  it("normalizes potentially unsafe file names", () => {
    expect(sanitizeUploadFileName(" ../../Soil Report (FINAL).PDF")).toBe(
      "soil-report-final.pdf"
    );
  });
});

describe("upload batches", () => {
  it("validates every selected file before the first upload", async () => {
    const formData = new FormData();
    formData.set(
      "report_link_file",
      file("report.pdf", [0x25, 0x50, 0x44, 0x46, 0x2d], "application/pdf")
    );
    formData.set(
      "photo_link_file",
      file("photo.png", [0x4d, 0x5a, 0x00], "image/png")
    );
    const storage = storageClient();

    await expect(
      applyUploadedFilesToPayload({
        fields: [
          { fieldName: "report_link", kind: "document" },
          { fieldName: "photo_link", kind: "image" }
        ],
        folder: "tests",
        formData,
        payload: { report_link: null, photo_link: null },
        recordId: crypto.randomUUID(),
        supabase: storage.client as never
      })
    ).rejects.toThrow(/contents do not match/i);
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it("removes earlier files when a later upload fails", async () => {
    const formData = new FormData();
    formData.set(
      "first_link_file",
      file("first.pdf", [0x25, 0x50, 0x44, 0x46, 0x2d], "application/pdf")
    );
    formData.set(
      "second_link_file",
      file("second.pdf", [0x25, 0x50, 0x44, 0x46, 0x2d], "application/pdf")
    );
    const storage = storageClient({ failUploadAt: 2 });

    await expect(
      applyUploadedFilesToPayload({
        fields: [
          { fieldName: "first_link", kind: "document" },
          { fieldName: "second_link", kind: "document" }
        ],
        folder: "tests",
        formData,
        payload: { first_link: null, second_link: null },
        recordId: "record-id",
        supabase: storage.client as never
      })
    ).rejects.toThrow("Simulated storage failure");
    expect(storage.remove).toHaveBeenCalledOnce();
    expect(storage.remove.mock.calls[0]?.[0]).toHaveLength(1);
    expect(storage.remove.mock.calls[0]?.[0]?.[0]).toMatch(
      /^tests\/record-id\/first_link\//
    );
  });
});

describe("signed upload links", () => {
  it("signs unique private paths in one request and preserves external links", async () => {
    const createSignedUrls = vi.fn(async (paths: string[]) => ({
      data: paths.map((path) => ({
        error: null,
        path,
        signedUrl: `https://signed.test/${path}`
      })),
      error: null
    }));
    const supabase = {
      storage: {
        from: vi.fn(() => ({ createSignedUrls }))
      }
    };

    const values = await resolveFileUrls(supabase as never, [
      "https://files.example.test/legacy.pdf",
      "storage://app-uploads/pilots/record/report/file.pdf",
      "storage://app-uploads/pilots/record/report/file.pdf",
      "../private/file.pdf",
      null
    ]);

    expect(createSignedUrls).toHaveBeenCalledOnce();
    expect(createSignedUrls.mock.calls[0]?.[0]).toEqual([
      "pilots/record/report/file.pdf"
    ]);
    expect(values).toEqual([
      "https://files.example.test/legacy.pdf",
      "https://signed.test/pilots/record/report/file.pdf",
      "https://signed.test/pilots/record/report/file.pdf",
      null,
      null
    ]);
  });
});
